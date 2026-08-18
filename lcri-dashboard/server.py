"""
server.py — Flask REST API backend for the LCRI Dashboard.
Replaces Streamlit as the application server to support concurrent users.
"""
import os
import json
import tempfile
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

import config
from src.data_sources import (
    init_ee, get_available_shapefiles, load_shapefile,
    fetch_district_geometry, fetch_districts_by_country,
    fetch_protected_areas, get_provenance_data
)
from src.zonal_stats import compute_zonal_stats
from src.carbon import process_zonal_stats_for_carbon
from src.change_detection import calculate_trend, calculate_yoy_difference
from src.lcri import generate_mock_parcels, calculate_lcri
from src.simulator import run_simulator, GROWTH_RATES, PROJECTION_YEARS
from src.registry import get_registry_projects
from src.ledger import submit_community_site
from src.saved_areas import load_saved_areas, save_area, delete_area
from src.parcel_analysis import analyse_parcel
from src.report_generator import generate_markdown_report, generate_pdf_report

from src.file_upload import parse_upload
from src.ml_predictor import predict_growth, extract_ml_features_for_polygon

def check_extrapolated_zone(geom=None, country=None):
    if country and country.lower() != "rwanda":
        return True
    if geom:
        try:
            from shapely.geometry import shape
            bounds = shape(geom).bounds
            if bounds[1] < -25 or bounds[3] > 25:
                return True
        except Exception:
            pass
    return False

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── Initialise Earth Engine on startup ──────────────────────────────────────
try:
    init_ee()
    print("[LCRI Server] Earth Engine initialised.")
except Exception as e:
    print(f"[LCRI Server] Warning: Earth Engine init failed: {e}")


# ────────────────────────────────────────────────────────────────────────────
# /api/config  — static constants for the frontend
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/config", methods=["GET"])
def get_config():
    return jsonify({
        "countries": config.AFRICA_COUNTRIES,
        "districts": config.RWANDA_DISTRICTS,
        "defaultWeights": config.DEFAULT_WEIGHTS,
        "defaultUsdPerTco2e": config.DEFAULT_USD_PER_TCO2E,
        "growthRates": list(GROWTH_RATES.keys()),
        "projectionYears": PROJECTION_YEARS,
    })


# ────────────────────────────────────────────────────────────────────────────
# /api/districts/<country>  — dynamic list of level-2 admin divisions
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/districts/<country>", methods=["GET"])
def get_districts(country):
    districts = fetch_districts_by_country(country)
    # Include an option for the entire country
    return jsonify([f"All {country}"] + districts)


# ────────────────────────────────────────────────────────────────────────────
# /api/shapefiles  — list of available vector layers
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/shapefiles", methods=["GET"])
def list_shapefiles():
    return jsonify(get_available_shapefiles())


# ────────────────────────────────────────────────────────────────────────────
# /api/district-boundary/<name>  — GeoJSON geometry for a district
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/district-boundary/<path:name>", methods=["GET"])
def district_boundary(name):
    if name == "None":
        return jsonify(None)
    country = request.args.get("country", "Rwanda")
    geom = fetch_district_geometry(country, name)
    if geom is None:
        return jsonify({"error": "Could not fetch district boundary"}), 404
    return jsonify(geom)


# ────────────────────────────────────────────────────────────────────────────
# /api/gee-tile-url  — Earth Engine tile URL for AGB layer
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/gee-tile-url", methods=["GET"])
def gee_tile_url():
    try:
        import ee as _ee
        agb_img = _ee.ImageCollection('NASA/ORNL/biomass_carbon_density/v1').first().select('agb')
        vis = {'min': 0, 'max': 200, 'palette': ['ffffff', 'a8dda8', '1a7a1a', '003300']}
        map_id = agb_img.getMapId(vis)
        return jsonify({"url": map_id['tile_fetcher'].url_format})
    except Exception as e:
        return jsonify({"error": str(e)}), 503


# ────────────────────────────────────────────────────────────────────────────
# /api/protected-areas  — protected areas GeoJSON
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/protected-areas", methods=["GET"])
def protected_areas():
    pa = fetch_protected_areas()
    if pa.empty:
        return jsonify({"type": "FeatureCollection", "features": []})
    pa_simple = pa.copy()
    pa_simple['geometry'] = pa_simple['geometry'].simplify(0.05, preserve_topology=True)
    return jsonify(json.loads(pa_simple.to_json()))


# ────────────────────────────────────────────────────────────────────────────
# /api/shapefile/<name>  — vector layer GeoJSON
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/shapefile/<path:name>", methods=["GET"])
def get_shapefile(name):
    gdf = load_shapefile(name)
    if gdf.empty:
        return jsonify({"type": "FeatureCollection", "features": []})
    gdf_simple = gdf.copy()
    gdf_simple['geometry'] = gdf_simple['geometry'].simplify(0.001, preserve_topology=True)
    return jsonify(json.loads(gdf_simple.to_json()))


# ────────────────────────────────────────────────────────────────────────────
# /api/kpis  POST — compute carbon KPIs for a given GeoJSON polygon
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/kpis", methods=["POST"])
def compute_kpis():
    data = request.get_json()
    aoi = data.get("geometry")
    if not aoi:
        return jsonify({"error": "geometry is required"}), 400

    geom_type = aoi.get("type", "Unknown")
    if geom_type in ("LineString", "MultiLineString"):
        return jsonify({"type": "linestring", "message": "Line feature — area KPIs not applicable."})

    stats = compute_zonal_stats(aoi)
    if not stats:
        return jsonify({"error": "Could not compute zonal statistics"}), 500

    carbon_stats = process_zonal_stats_for_carbon(stats)
    trend = calculate_trend(stats)
    yoy = calculate_yoy_difference(stats)
    return jsonify({"carbonStats": carbon_stats, "trend": trend, "yoy": yoy})


# ────────────────────────────────────────────────────────────────────────────
# /api/ml-predict  POST — predict 10-year carbon growth via Random Forest
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/ml-predict", methods=["POST"])
def ml_predict():
    data = request.get_json()
    aoi = data.get("geometry")
    if not aoi:
        return jsonify({"error": "geometry is required"}), 400
        
    try:
        # Extract features
        features = extract_ml_features_for_polygon(aoi)
        
        # Predict
        prediction_data = predict_growth(features)

        return jsonify({
            "status": "success",
            "predicted_10yr_growth": float(prediction_data["agb_prediction"]),
            "confidence_score": float(prediction_data["confidence_score"])
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ────────────────────────────────────────────────────────────────────────────
# /api/monitoring-images  POST — generate true color and NDVI urls
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/monitoring-images", methods=["POST"])
def monitoring_images():
    try:
        aoi = request.json.get('geometry')
        target_date = request.json.get('target_date')
        if not aoi:
            return jsonify({'error': 'Missing geometry'}), 400
        from src.image_vision import generate_monitoring_images
        
        urls = generate_monitoring_images(aoi, target_date_str=target_date)
        return jsonify(urls)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ────────────────────────────────────────────────────────────────────────────
# /api/custom-areas  — CRUD for user-saved map areas
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/custom-areas", methods=["GET"])
def list_custom_areas():
    return jsonify(load_saved_areas())


@app.route("/api/custom-areas", methods=["POST"])
def create_custom_area():
    data = request.get_json()
    name = data.get("name")
    geom = data.get("geometry")
    notes = data.get("notes", "")
    if not name or not geom:
        return jsonify({"error": "name and geometry required"}), 400

    stats_raw = compute_zonal_stats(geom) if geom.get("type") in ("Polygon", "MultiPolygon") else None
    carbon_stats = process_zonal_stats_for_carbon(stats_raw) if stats_raw else None
    trend = calculate_trend(stats_raw) if stats_raw else 0.0
    record = save_area(name, geom, notes=notes, stats=carbon_stats, trend=trend)
    return jsonify(record), 201


@app.route("/api/custom-areas/<path:name>", methods=["DELETE"])
def remove_custom_area(name):
    delete_area(name)
    return jsonify({"success": True})


# ────────────────────────────────────────────────────────────────────────────
# /api/lcri-ranking  POST — score parcels by district and custom weights
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/lcri-ranking", methods=["POST"])
def lcri_ranking():
    data = request.get_json()
    district = data.get("district", "All Rwanda")
    weights = data.get("weights", config.DEFAULT_WEIGHTS)
    count = data.get("count", 150)

    parcels = generate_mock_parcels(district, count=count)
    ranked = calculate_lcri(parcels, weights=weights)
    return jsonify(ranked.to_dict(orient="records"))


# ────────────────────────────────────────────────────────────────────────────
# /api/simulator  POST — run reforestation investment simulator
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/simulator", methods=["POST"])
def simulator():
    data = request.get_json()
    district = data.get("district", "All Rwanda")
    ha_target = data.get("hectareTarget")
    budget = data.get("budgetUsd")
    cost_per_ha = data.get("costPerHa", 500.0)
    usd_per_t = data.get("usdPerTco2e", config.DEFAULT_USD_PER_TCO2E)
    site_type = data.get("siteType", "natural_regrowth")
    weights = data.get("weights", config.DEFAULT_WEIGHTS)

    country = data.get("country", "Rwanda")
    
    result = run_simulator(
        district=district, hectare_target=ha_target, budget_usd=budget,
        cost_per_ha_usd=cost_per_ha, usd_per_tco2e=usd_per_t,
        site_type=site_type, weights=weights
    )
    return jsonify({
        "is_extrapolated_zone": check_extrapolated_zone(country=country),
        "summary": result["summary"],
        "shortlist": result["shortlist"][
            ["parcel_id", "land_cover_class", "area_ha", "current_agb_mg_ha", "cost_per_ha_usd", "est_cost_usd", "lcri_score"]
        ].to_dict(orient="records"),
        "trajectories": {
            pid: {str(y): v for y, v in yrs.items()}
            for pid, yrs in result["trajectories"].items()
        },
        "bauTrajectories": {
            pid: {str(y): v for y, v in yrs.items()}
            for pid, yrs in result["bau_trajectories"].items()
        },
    })


# ────────────────────────────────────────────────────────────────────────────
# /api/registry/projects  — verified carbon projects
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/registry/projects", methods=["GET"])
def registry_projects():
    return jsonify(get_registry_projects())


# ────────────────────────────────────────────────────────────────────────────
# /api/ledger/submit  POST — submit community ground-truthing site
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/ledger/submit", methods=["POST"])
def api_ledger_submit():
    data = request.get_json()
    geom = data.get("geometry")
    submitter = data.get("submitter_group", "Unknown Group")
    sector = data.get("sector", "Unknown Sector")
    notes = data.get("notes", "")
    submission_date = data.get("submission_date")
    gps_verified = data.get("gpsVerified", False)
    timestamp_verified = data.get("timestampVerified", False)

    if not geom:
        return jsonify({"error": "geometry is required"}), 400

    # Pass the verification flags to the ledger module
    res = submit_community_site(
        geom, submitter, sector, 
        notes=notes, 
        submission_date=submission_date,
        gps_verified=gps_verified,
        timestamp_verified=timestamp_verified
    )
    if res.get("success"):
        return jsonify(res), 200
    return jsonify(res), 400


# ────────────────────────────────────────────────────────────────────────────
# /api/parcel/analyse  POST — live per-parcel carbon analysis (ESA CCI v7.0)
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/parcel/analyse", methods=["POST"])
def parcel_analyse():
    data = request.get_json()
    geometry = data.get("geometry")
    interval = data.get("interval", "1y")
    if not geometry:
        return jsonify({"error": "geometry is required"}), 400
    try:
        result = analyse_parcel(geometry, interval=interval)
        result["is_extrapolated_zone"] = check_extrapolated_zone(geom=geometry)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ────────────────────────────────────────────────────────────────────────────
# /api/registry/report  POST — PDF carbon credit report for a submission
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/registry/report", methods=["POST"])
def registry_report():
    """Generate a one-page PDF carbon credit report for a submitted parcel."""
    data = request.get_json()
    geometry  = data.get("geometry")
    interval  = data.get("interval", "1y")
    group     = data.get("submitterGroup", "Project")
    sector    = data.get("sector", "Registry")
    if not geometry:
        return jsonify({"error": "geometry is required"}), 400
    try:
        analysis = analyse_parcel(geometry, interval=interval)
        # Build a minimal saved_record dict for the report generator
        saved_record = {
            "name": f"{group} — {sector}",
            "notes": f"Interval: {analysis.get('interval_label','')}, "
                     f"Area: {analysis.get('area_ha',0):.2f} ha",
            "carbon_score": analysis.get("carbon_score"),
            "score_label": analysis.get("score_info", {}).get("label"),
            "trend_label": analysis.get("trend_label"),
            "trend_pct":   analysis.get("trend_pct"),
            "latest_agb":  analysis.get("latest_agb_mg_ha"),
            "latest_co2e": analysis.get("latest_co2e_mg"),
            "market_mid":  analysis.get("market_value", {}).get("mid"),
            "projected_10yr_mid": analysis.get("projected_10yr", {}).get("mid"),
        }
        stats_dict = {
            "agb_series":  analysis.get("agb_series"),
            "co2e_series": analysis.get("co2e_series"),
            "note":        analysis.get("note"),
        }
        md = generate_markdown_report(saved_record, stats_dict, analysis.get("trend_pct", 0))
        name = f"{group}_{sector}".replace(" ", "_")
        os.makedirs("data/cache", exist_ok=True)
        pdf_path = f"data/cache/{name}_parcel_report.pdf"
        generate_pdf_report(md, pdf_path)
        return send_file(pdf_path, mimetype="application/pdf",
                         as_attachment=True, download_name=f"{name}_CarbonReport.pdf")
    except Exception as e:
        return jsonify({"error": str(e)}), 500





# ────────────────────────────────────────────────────────────────────────────
# /api/provenance
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/provenance", methods=["GET"])
def provenance():
    df = get_provenance_data()
    return jsonify(df.to_dict(orient="records"))


# ────────────────────────────────────────────────────────────────────────────
# /api/upload-area  POST — parse uploaded Shapefile ZIP, KML, or GeoJSON
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/upload-area", methods=["POST"])
def upload_area():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    try:
        data = file.read()
        res = parse_upload(file.filename, data)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ────────────────────────────────────────────────────────────────────────────
# /api/true-color-tile  GET — Sentinel-2 true color image tile URL from GEE
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/true-color-tile", methods=["GET"])
def true_color_tile():
    try:
        import ee as _ee
        import datetime
        now = datetime.datetime.utcnow()
        # Look back 3 months to ensure a relatively cloud-free Sentinel-2 composite
        start_date = (now - datetime.timedelta(days=90)).strftime('%Y-%m-%d')
        end_date = now.strftime('%Y-%m-%d')
        
        # Rwanda centroid bounding box or filter by country
        # Sentinel-2 Harmonized level-2A
        s2 = (_ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
              .filterDate(start_date, end_date)
              .filter(_ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
              .select(['B4', 'B3', 'B2'])) # R, G, B
              
        # Composite median
        img = s2.median()
        
        # Visualization params (visual reflectance scaled 0-3000)
        vis = {
            'min': 0.0,
            'max': 3000.0,
            'bands': ['B4', 'B3', 'B2']
        }
        
        map_id = img.getMapId(vis)
        return jsonify({"url": map_id['tile_fetcher'].url_format})
    except Exception as e:
        return jsonify({"error": str(e)}), 503





# ────────────────────────────────────────────────────────────────────────────
# Helper: Get Gicumbi Sectors GeoDataFrame
# ────────────────────────────────────────────────────────────────────────────
def _get_gicumbi_sectors_gdf():
    from src.data_sources import VECTOR_DIR
    import os
    import geopandas as gpd
    
    path = os.path.join(VECTOR_DIR, "sector.shp")
    if not os.path.exists(path):
        raise FileNotFoundError("sector.shp not found")
        
    gdf = gpd.read_file(path)
    
    target_sectors = [
        "Bwisige", "Byumba", "Cyumba", "Kaniga", "Manyagiro", 
        "Mukarange", "Rubaya", "Rushaki", "Shangasha"
    ]
    
    col_name = None
    target_sectors_lower = [s.lower() for s in target_sectors]
    
    for col in gdf.columns:
        if gdf[col].dtype == 'object':
            sample = gdf[col].dropna().astype(str).str.lower().tolist()
            if any(s in sample for s in target_sectors_lower):
                col_name = col
                break
                
    if not col_name:
        raise ValueError("Could not find sector name column")
        
    gdf_filtered = gdf[gdf[col_name].str.lower().isin(target_sectors_lower)].copy()
    gdf_filtered['sector_name'] = gdf_filtered[col_name].apply(lambda x: x.title())
    
    if gdf_filtered.crs and gdf_filtered.crs.to_string() != "EPSG:4326":
        gdf_filtered = gdf_filtered.to_crs("EPSG:4326")
        
    return gdf_filtered


# ────────────────────────────────────────────────────────────────────────────
# /api/gicumbi/change-layer  GET — Gicumbi Time-lapse and Hansen layers
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/gicumbi/change-layer", methods=["GET"])
def gicumbi_change_layer():
    try:
        import ee as _ee
        import datetime
        import json
        
        # Get sector boundary and convert to ee.Geometry
        gdf = _get_gicumbi_sectors_gdf()
        geom = gdf.geometry.unary_union.simplify(0.001)
        import shapely.geometry
        geom_json = shapely.geometry.mapping(geom)
        clip_geom = _ee.Geometry(geom_json)
        
        # 2019 baseline (Project start)
        s2_2019 = (_ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate('2019-01-01', '2019-12-31')
                  .filter(_ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                  .median()
                  .clip(clip_geom))
                  
        # Present day
        now = datetime.datetime.utcnow()
        start_date = (now - datetime.timedelta(days=365)).strftime('%Y-%m-%d')
        end_date = now.strftime('%Y-%m-%d')
        s2_present = (_ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate(start_date, end_date)
                  .filter(_ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                  .median()
                  .clip(clip_geom))

        def get_ndvi(img):
            return img.normalizedDifference(['B8', 'B4']).rename('NDVI')
            
        ndvi_2019 = get_ndvi(s2_2019)
        ndvi_present = get_ndvi(s2_present)
        
        # Hansen Global Forest Change
        hansen = _ee.Image('UMD/hansen/global_forest_change_2023_v1_11').clip(clip_geom)
        loss = hansen.select('loss').updateMask(hansen.select('loss').gt(0))
        
        vis_ndvi = {'min': 0, 'max': 0.8, 'palette': ['ffffff', 'ce7e45', 'df923d', 'f1b555', 'fcd163', '99b718', '74a901', '66a000', '529400', '3e8601', '207401', '056201', '004c00', '023b01', '012e01', '011d01', '011301']}
        vis_loss = {'min': 1, 'max': 1, 'palette': ['FF0000']}
        
        return jsonify({
            "ndvi_2019": ndvi_2019.getMapId(vis_ndvi)['tile_fetcher'].url_format,
            "ndvi_present": ndvi_present.getMapId(vis_ndvi)['tile_fetcher'].url_format,
            "hansen_loss": loss.getMapId(vis_loss)['tile_fetcher'].url_format
        })
    except Exception as e:
        print(f"GEE Error in Gicumbi layers: {e}")
        return jsonify({
            "ndvi_2019": "",
            "ndvi_present": "",
            "hansen_loss": ""
        })

# ────────────────────────────────────────────────────────────────────────────
# /api/gicumbi/stats  GET — Gicumbi verification stats
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/gicumbi/stats", methods=["GET"])
def gicumbi_stats():
    # Overall project totals
    total_claim = 4801
    total_observed = 4650
    total_tco2e = 162750
    
    stats_data = {
        "overall": {
            "official_claim_ha": total_claim,
            "satellite_observed_ha": total_observed,
            "estimated_tco2e": total_tco2e,
            "national_ndc_tco2e": 102000000,
            "message": "Green Gicumbi shows local agroforestry action can be independently verified from space — a model for scaling Rwanda's carbon credit pipeline."
        },
        "sectors": []
    }
    
    try:
        gdf = _get_gicumbi_sectors_gdf()
        
        # Project area to measure EPSG:3857 for area calc
        gdf_proj = gdf.to_crs("EPSG:3857")
        gdf['area_sqm'] = gdf_proj.geometry.area
        total_area = gdf['area_sqm'].sum()
        
        sectors_list = []
        for _, row in gdf.iterrows():
            ratio = row['area_sqm'] / total_area
            sectors_list.append({
                "name": row['sector_name'],
                "official_claim_ha": int(total_claim * ratio),
                "satellite_observed_ha": int(total_observed * ratio),
                "estimated_tco2e": int(total_tco2e * ratio)
            })
            
        # Sort alphabetically
        sectors_list.sort(key=lambda x: x['name'])
        stats_data["sectors"] = sectors_list
        
    except Exception as e:
        print(f"Error calculating sector stats: {e}")
        # Fallback if shapefile fails
        stats_data["sectors"] = []
        
    return jsonify(stats_data)


# ────────────────────────────────────────────────────────────────────────────
# /api/gicumbi/project-boundary  GET — Gicumbi Project Sectors
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/gicumbi/project-boundary", methods=["GET"])
def gicumbi_project_boundary():
    try:
        gdf_filtered = _get_gicumbi_sectors_gdf()
        import json
        return jsonify(json.loads(gdf_filtered.to_json()))
    except Exception as e:
        print(f"Error in project boundary: {e}")
        return jsonify({"error": str(e)}), 500


# ────────────────────────────────────────────────────────────────────────────
# /api/report/pdf  POST — Generate & download PDF report
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/report/pdf", methods=["POST"])
def report_pdf():
    try:
        data = request.json or {}
        saved_record = data.get("savedRecord", {})
        stats = data.get("stats", {})
        trend = data.get("trend", 0.0)
        
        md_text = generate_markdown_report(saved_record, stats, trend)
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            pdf_path = tmp.name
            
        generate_pdf_report(md_text, pdf_path)
        
        filename = f"{saved_record.get('name', 'Carbon_Audit')}_Report.pdf"
        return send_file(pdf_path, as_attachment=True, download_name=filename, mimetype="application/pdf")
    except Exception as e:
        print(f"[LCRI Server] PDF Generation Error: {e}")
        return jsonify({"error": str(e)}), 500


# ────────────────────────────────────────────────────────────────────────────
# /api/report/preview  POST — Generate Markdown report preview
# ────────────────────────────────────────────────────────────────────────────
@app.route("/api/report/preview", methods=["POST"])
def report_preview():
    try:
        data = request.json or {}
        saved_record = data.get("savedRecord", {})
        stats = data.get("stats", {})
        trend = data.get("trend", 0.0)
        
        md_text = generate_markdown_report(saved_record, stats, trend)
        return jsonify({"markdown": md_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Open the front‑end UI automatically in the default browser.
    def open_browser():
        import time, webbrowser
        # Wait a moment for the Flask server to start listening.
        time.sleep(1)
        # webbrowser.open_new("http://localhost:5173") # Disabled for production
    import threading
    import os
    # threading.Thread(target=open_browser, daemon=True).start()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
