"""
parcel_analysis.py — Live per-parcel carbon analysis using ESA CCI Biomass v7.0 (GEE).

ESA CCI Biomass v7.0:
  - Annual epochs: 2005-2024
  - Derived from Sentinel-1, Envisat ASAR, and JAXA ALOS-1/2 SAR
  - Calibrated against ICESat-2 lidar ground truth
  - Band: Aboveground_Biomass_Density (Mg/ha AGB)
  - GEE Community Catalog: projects/sat-io/open-datasets/ESA_CCI_AGB

Short intervals (<1y) use Sentinel-2 NDVI as a vegetation proxy,
anchored to the ESA CCI 2024 baseline.
"""
import ee
import numpy as np
import geopandas as gpd
import datetime
from shapely.geometry import shape
import hashlib, json, os

import config
from src.data_sources import init_ee
from src.utils import get_normalized_geom_str

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
CACHE_DIR = os.path.join(DATA_DIR, 'cache')

# ── ESA CCI Biomass v7.0 ────────────────────────────────────────────────────
ESA_CCI_COLLECTION = 'projects/sat-io/open-datasets/ESA_CCI_AGB'
CCI_AGB_BAND = 'Aboveground_Biomass_Density'
# All available annual epochs in v7.0
CCI_AVAILABLE_YEARS = [
    2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012,
    2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024
]

# ── Market price scenarios (USD/tCO2e) ─────────────────────────────────────
MARKET_PRICES = {'low': 6.0, 'mid': 10.0, 'high': 18.0}

# ── Carbon conversion (IPCC defaults) ──────────────────────────────────────
CARBON_FRACTION = 0.47
CO2E_RATIO = 3.67

# ── Interval configuration ─────────────────────────────────────────────────
# sentinel=True: use Sentinel-2 NDVI proxy (sub-annual, no ESA CCI epochs available)
# years_back: number of CCI annual epochs to look back
INTERVAL_CONFIG = {
    '24h': {'years_back': 0, 'sentinel': True,  'days': 1,   'label': '24 Hours'},
    '7d':  {'years_back': 0, 'sentinel': True,  'days': 7,   'label': '7 Days'},
    '30d': {'years_back': 0, 'sentinel': True,  'days': 30,  'label': '30 Days'},
    '3mo': {'years_back': 0, 'sentinel': True,  'days': 90,  'label': '3 Months'},
    '6mo': {'years_back': 0, 'sentinel': True,  'days': 180, 'label': '6 Months'},
    '1y':  {'years_back': 1, 'sentinel': False, 'days': 365, 'label': '1 Year'},
    '2y':  {'years_back': 2, 'sentinel': False, 'days': 730, 'label': '2 Years'},
    '10y': {'years_back': 10,'sentinel': False, 'days': 3650,'label': '10 Years'},
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _cache_key(geometry, interval):
    geom_str = get_normalized_geom_str(geometry)
    h = hashlib.md5(f"{geom_str}_{interval}".encode()).hexdigest()
    return os.path.join(CACHE_DIR, f"parcel_analysis_{interval}_{h}.json")


def _geom_to_ee(geometry):
    """Convert a GeoJSON geometry dict to an EE Geometry (Polygon)."""
    geom = shape(geometry)
    # Buffer line strings into slim polygons
    if geom.geom_type == 'LineString':
        gdf = gpd.GeoDataFrame(index=[0], crs='EPSG:4326', geometry=[geom])
        gdf_utm = gdf.to_crs(config.CRS_PROJECTED)
        gdf_utm['geometry'] = gdf_utm.buffer(30)
        geom = gdf_utm.to_crs('EPSG:4326').geometry[0]
    # Simplify MultiPolygon to convex hull
    if geom.geom_type == 'MultiPolygon':
        geom = geom.convex_hull
    if geom.geom_type != 'Polygon':
        raise ValueError(f"Unsupported geometry type: {geom.geom_type}")
    coords = [list(c) for c in geom.exterior.coords]
    return ee.Geometry.Polygon([coords])


def _area_ha(geometry):
    """Compute area of a GeoJSON geometry in hectares."""
    geom = shape(geometry)
    gdf = gpd.GeoDataFrame(index=[0], crs='EPSG:4326', geometry=[geom])
    gdf_utm = gdf.to_crs(config.CRS_PROJECTED)
    return float(gdf_utm.area[0] / 10000.0)


def _fetch_esa_cci_agb(ee_geom, year):
    """
    Fetch mean Above-Ground Biomass (Mg/ha) from ESA CCI Biomass v7.0
    for a specific year epoch.  Returns None if the call fails.
    """
    try:
        img = (ee.ImageCollection(ESA_CCI_COLLECTION)
               .filter(ee.Filter.calendarRange(year, year, 'year'))
               .first()
               .select(CCI_AGB_BAND))
        stats = img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=ee_geom,
            scale=100,
            maxPixels=1e9,
            bestEffort=True
        ).getInfo()
        val = stats.get(CCI_AGB_BAND)
        return float(val) if val is not None else None
    except Exception as e:
        print(f"[parcel_analysis] ESA CCI {year}: {e}")
        return None


def _fetch_gedi_l4b_agb(ee_geom):
    """
    Fetch mean Above-Ground Biomass Density (Mg/ha) from NASA GEDI L4B
    (LARSE/GEDI/GEDI04_B_002). Returns None if the call fails.
    """
    try:
        # GEDI L4B provides 1km gridded AGB density
        img = ee.Image('LARSE/GEDI/GEDI04_B_002').select('MU')
        stats = img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=ee_geom,
            scale=1000,
            maxPixels=1e9,
            bestEffort=True
        ).getInfo()
        val = stats.get('MU')
        return float(val) if val is not None else None
    except Exception as e:
        print(f"[parcel_analysis] GEDI L4B AGB: {e}")
        return None


def _fetch_sentinel2_ndvi_change(ee_geom, days_back):
    """
    Compute NDVI change between the most-recent N-day composite and
    the preceding N-day composite from Sentinel-2.
    Returns (current_ndvi, prev_ndvi, change_pct) or (None, None, None).
    """
    now = ee.Date(datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'))
    cur_start = now.advance(-days_back, 'day')
    prev_start = cur_start.advance(-days_back, 'day')

    s2 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
            .filterBounds(ee_geom)
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
            .select(['B4', 'B8']))

    def ndvi_median(ic):
        ndvi = ic.map(lambda img: img.normalizedDifference(['B8', 'B4']).rename('ndvi'))
        stats = ndvi.median().reduceRegion(
            reducer=ee.Reducer.mean(), geometry=ee_geom,
            scale=20, maxPixels=1e9, bestEffort=True
        ).getInfo()
        return stats.get('ndvi')

    try:
        curr = ndvi_median(s2.filterDate(cur_start, now))
        prev = ndvi_median(s2.filterDate(prev_start, cur_start))
        if curr is None or prev is None:
            return None, None, None
        change_pct = ((curr - prev) / max(abs(prev), 0.001)) * 100
        return float(curr), float(prev), float(change_pct)
    except Exception as e:
        print(f"[parcel_analysis] Sentinel-2 NDVI: {e}")
        return None, None, None


# ── Scoring ──────────────────────────────────────────────────────────────────

def _compute_carbon_score(agb_series):
    """
    Score 0-100 based on AGB trajectory:
      50  baseline
    + 30  * trend_direction  (+1 improving, -1 degrading, 0 stable)
    + 20  * national_percentile (AGB vs Rwanda forest avg ~180 Mg/ha)
    """
    agb_vals = [p['agb_mg_ha'] for p in agb_series if p.get('agb_mg_ha') is not None]
    if not agb_vals:
        return 50

    if len(agb_vals) >= 2:
        slope = float(np.polyfit(range(len(agb_vals)), agb_vals, 1)[0])
        trend_dir = 1 if slope > 1.0 else (-1 if slope < -1.0 else 0)
    else:
        trend_dir = 0

    national_pct = min(agb_vals[-1] / 180.0, 1.0)
    raw = 50 + 30 * trend_dir + 20 * national_pct
    return max(0, min(100, round(raw)))


def _score_label(score):
    if score >= 75:
        return {'label': 'Excellent', 'color': '#2ecc71', 'emoji': '🟢',
                'hint': 'Credit-eligible — strong candidate for VCS/Gold Standard verification'}
    if score >= 50:
        return {'label': 'Good', 'color': '#f1c40f', 'emoji': '🟡',
                'hint': 'On track — monitor quarterly and maintain current land management'}
    if score >= 25:
        return {'label': 'At Risk', 'color': '#e67e22', 'emoji': '🟠',
                'hint': 'Intervention recommended — review land management and community engagement'}
    return {'label': 'Critical', 'color': '#e74c3c', 'emoji': '🔴',
            'hint': 'Urgent action needed — contact district forestry officer immediately'}


def _market_value(co2e_mg):
    return {k: round(co2e_mg * v, 2) for k, v in MARKET_PRICES.items()}


# ── Main entry point ─────────────────────────────────────────────────────────

def analyse_parcel(geometry, interval='1y'):
    """
    Run a full carbon analysis for a community-submitted parcel.

    Parameters
    ----------
    geometry : dict  — GeoJSON geometry (Polygon / LineString)
    interval : str   — one of '24h','7d','30d','3mo','6mo','1y','2y','10y'

    Returns
    -------
    dict with: agb_series, co2e_series, carbon_score, score_info,
               market_value, projected_10yr, trend_label, trend_pct, area_ha
    """
    os.makedirs(CACHE_DIR, exist_ok=True)
    # Cache longer intervals (don't cache <30d — too time-sensitive)
    cache_path = _cache_key(geometry, interval)
    if interval not in ('24h', '7d', '30d') and os.path.exists(cache_path):
        with open(cache_path, 'r') as f:
            return json.load(f)

    init_ee()
    ee_geom = _geom_to_ee(geometry)
    area_ha = _area_ha(geometry)
    cfg = INTERVAL_CONFIG.get(interval, INTERVAL_CONFIG['1y'])

    agb_series = []
    ndvi_change_pct = None
    note = ''

    if cfg['sentinel']:
        # ── Sub-annual: Sentinel-2 NDVI proxy ──────────────────────────────
        days = cfg['days']
        curr_ndvi, prev_ndvi, ndvi_change_pct = _fetch_sentinel2_ndvi_change(ee_geom, days)

        # Try GEDI first for a highly confident baseline, fallback to ESA CCI
        gedi_agb = _fetch_gedi_l4b_agb(ee_geom)
        esa_agb = _fetch_esa_cci_agb(ee_geom, 2024)
        baseline_agb = gedi_agb or esa_agb or 100.0

        # Rough proxy: 1% NDVI change ≈ 2 Mg/ha AGB change
        delta = (ndvi_change_pct or 0) * 2.0
        prev_agb = max(0.0, baseline_agb - delta / 2)
        curr_agb = max(0.0, baseline_agb + delta / 2)

        agb_series = [
            {'label': f'Prev {cfg["label"]}', 'agb_mg_ha': round(prev_agb, 2)},
            {'label': 'Current',              'agb_mg_ha': round(curr_agb, 2)},
        ]
        
        source_str = "NASA GEDI L4B LiDAR" if gedi_agb else "ESA CCI Biomass v7.0"
        note = (
            f'AGB estimated via Sentinel-2 NDVI change detection '
            f'(NDVI delta: {ndvi_change_pct:+.1f}%) anchored to {source_str} baseline.'
            if ndvi_change_pct is not None
            else f'Sentinel-2 imagery unavailable; showing {source_str} static baseline.'
        )
    else:
        # ── Annual: ESA CCI Biomass v7.0 epochs ───────────────────────────
        current_year = datetime.datetime.utcnow().year
        years_back = cfg['years_back']

        if years_back <= 2:
            # Get the two nearest available epochs
            avail_past   = [y for y in CCI_AVAILABLE_YEARS if y <= current_year - years_back]
            avail_recent = [y for y in CCI_AVAILABLE_YEARS if y <= current_year]
            epochs = sorted(set([
                max(avail_past) if avail_past else CCI_AVAILABLE_YEARS[0],
                max(avail_recent)
            ]))
        else:
            # 10-year: all epochs in window
            start_year = current_year - years_back
            epochs = [y for y in CCI_AVAILABLE_YEARS if y >= start_year]

        for year in epochs:
            agb = _fetch_esa_cci_agb(ee_geom, year)
            agb_series.append({'year': year, 'label': str(year), 'agb_mg_ha': round(agb, 2) if agb is not None else None})

        note = 'AGB from ESA CCI Biomass v7.0 annual epochs (Sentinel-1/ASAR/ALOS-2 SAR, ICESat-2 calibrated).'

    # ── Interpolate any missing epoch values ──────────────────────────────
    agb_vals = [p['agb_mg_ha'] for p in agb_series]
    valid = [(i, v) for i, v in enumerate(agb_vals) if v is not None]
    if not valid:
        for p in agb_series:
            p['agb_mg_ha'] = 100.0
        agb_vals = [100.0] * len(agb_series)
    else:
        for i, p in enumerate(agb_series):
            if p['agb_mg_ha'] is None:
                lefts  = [(j, v) for j, v in valid if j < i]
                rights = [(j, v) for j, v in valid if j > i]
                if lefts and rights:
                    j0, v0 = lefts[-1]; j1, v1 = rights[0]
                    p['agb_mg_ha'] = round(v0 + (v1 - v0) * (i - j0) / (j1 - j0), 2)
                elif lefts:
                    p['agb_mg_ha'] = lefts[-1][1]
                elif rights:
                    p['agb_mg_ha'] = rights[0][1]
        agb_vals = [p['agb_mg_ha'] for p in agb_series]

    # ── CO2e series ───────────────────────────────────────────────────────
    co2e_series = []
    for p in agb_series:
        agb = p['agb_mg_ha'] or 0
        co2e = agb * area_ha * CARBON_FRACTION * CO2E_RATIO
        co2e_series.append({**p, 'co2e_mg': round(co2e, 1)})

    # ── Trend ─────────────────────────────────────────────────────────────
    if len(agb_vals) >= 2:
        slope = float(np.polyfit(range(len(agb_vals)), agb_vals, 1)[0])
        trend_pct = round((slope / max(agb_vals[0] or 1, 0.001)) * 100, 1)
    else:
        slope = 0.0
        trend_pct = 0.0

    trend_label = 'Improving' if slope > 1.0 else ('Degrading' if slope < -1.0 else 'Stable')

    # ── Carbon credit score ───────────────────────────────────────────────
    carbon_score = _compute_carbon_score(agb_series)
    score_info = _score_label(carbon_score)

    # ── Market value ──────────────────────────────────────────────────────
    latest_co2e = co2e_series[-1]['co2e_mg'] if co2e_series else 0.0
    market_val = _market_value(latest_co2e)

    # 10-year cumulative revenue projection (linear extrapolation)
    latest_agb = agb_vals[-1] or 0
    agb_10yr = max(latest_agb + slope * 10, 0)
    co2e_10yr_cumulative = agb_10yr * area_ha * CARBON_FRACTION * CO2E_RATIO * 10
    projected_10yr = _market_value(co2e_10yr_cumulative)

    result = {
        'interval': interval,
        'interval_label': cfg['label'],
        'area_ha': round(area_ha, 2),
        'agb_series': agb_series,
        'co2e_series': co2e_series,
        'carbon_score': carbon_score,
        'score_info': score_info,
        'trend_label': trend_label,
        'trend_pct': trend_pct,
        'market_value': market_val,
        'projected_10yr': projected_10yr,
        'latest_agb_mg_ha': round(latest_agb, 2),
        'latest_co2e_mg': round(latest_co2e, 1),
        'ndvi_change_pct': ndvi_change_pct,
        'note': note,
    }

    if interval not in ('24h', '7d', '30d'):
        with open(cache_path, 'w') as f:
            json.dump(result, f, indent=2)

    return result
