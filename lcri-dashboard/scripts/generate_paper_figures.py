import os
import sys
import ee
import joblib
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.colors import ListedColormap
import traceback
import rasterio
from rasterio.mask import mask
from shapely.geometry import shape
import scipy.ndimage as ndimage
import geemap

# Initialize GEE
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
try:
    from src.data_sources import init_ee
    init_ee()
except Exception as e:
    print(f"Failed to initialize Earth Engine using src.data_sources: {e}")
    ee.Initialize(project='ee-petersonyang87')

import geopandas as gpd
from shapely.geometry import shape, mapping

VECTOR_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'dataset vector')
sector_path = os.path.join(VECTOR_DIR, "sector.shp")
if not os.path.exists(sector_path):
    raise FileNotFoundError(f"{sector_path} not found")

gdf = gpd.read_file(sector_path)
dist_col = None
for col in gdf.columns:
    if gdf[col].dtype == 'object':
        sample = gdf[col].dropna().astype(str).str.lower().tolist()
        if 'gicumbi' in sample:
            dist_col = col
            break

if not dist_col:
    raise ValueError("Could not find a column containing 'Gicumbi' (District) in the shapefile")

gdf_gicumbi = gdf[gdf[dist_col].str.lower() == 'gicumbi'].copy()

if gdf_gicumbi.empty:
    raise ValueError("Found the district column but filtering for 'Gicumbi' returned 0 rows.")

if gdf_gicumbi.crs and gdf_gicumbi.crs.to_string() != "EPSG:4326":
    gdf_gicumbi = gdf_gicumbi.to_crs("EPSG:4326")

exact_geom = gdf_gicumbi.unary_union
bounds = exact_geom.bounds  # (minx, miny, maxx, maxy)

# Create GEE region from bounds for downloading
region = ee.Geometry.Rectangle([bounds[0], bounds[1], bounds[2], bounds[3]])


OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'research results')
os.makedirs(OUTPUT_DIR, exist_ok=True)

TEMP_TIF = os.path.join(OUTPUT_DIR, 'temp_features.tif')
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'rf_model.pkl')


def get_gee_features():
    print("Requesting ML feature composite from Google Earth Engine...")
    agb_collection = ee.ImageCollection("ESA/CCI/Above_Ground_Biomass/V6_0")
    baseline_agb = agb_collection.filterDate('2020-01-01', '2020-12-31').first().select('agb').unmask(0)
    
    palsar = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR_EPOCH").filterDate('2020-01-01', '2020-12-31').first()
    sar_hv = palsar.select('HV')
    sar_hh = palsar.select('HH')
    
    srtm = ee.Image("USGS/SRTMGL1_003")
    elevation = srtm.select('elevation')
    slope = ee.Terrain.slope(elevation)
    
    chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY").filterDate('2010-01-01', '2020-12-31').sum().divide(11)
    
    soil_ph = ee.Image("OpenLandMap/SOL/SOL_PH-H2O_USDA-4C1A2A_M/v02").select('b0')
    soc = ee.Image("projects/soilgrids-isric/soc_mean").select('soc_0-5cm_mean')
    
    gedi_rh98 = ee.ImageCollection("LARSE/GEDI/GEDI02_A_002_MONTHLY").mean().select('rh98')
    gedi_rh98 = gedi_rh98.focal_mean(radius=3, units='pixels').unmask(0)
    
    terraclimate = ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE").filterDate('2010-01-01', '2020-12-31').mean()
    pdsi = terraclimate.select('pdsi')
    tmmx = terraclimate.select('tmmx').multiply(0.1)
    
    landcover = ee.ImageCollection("ESA/WorldCover/v200").first().select('Map')
    
    combined = baseline_agb.rename('baseline_agb') \
        .addBands(sar_hv.rename('sar_hv')) \
        .addBands(sar_hh.rename('sar_hh')) \
        .addBands(slope.rename('slope')) \
        .addBands(elevation.rename('elevation')) \
        .addBands(chirps.select('precipitation').rename('precipitation')) \
        .addBands(soil_ph.rename('soil_ph')) \
        .addBands(soc.rename('soc')) \
        .addBands(gedi_rh98.rename('gedi_rh98')) \
        .addBands(pdsi.rename('pdsi')) \
        .addBands(tmmx.rename('tmmx')) \
        .addBands(landcover.rename('landcover'))

    # Cast to float to prevent mixed-datatype GeoTIFF export errors (HTTP 400)
    combined = combined.toFloat()
    
    url = combined.getDownloadURL({
        'scale': 100,
        'region': region,
        'format': 'GEO_TIFF'
    })
    
    import urllib.request
    import urllib.error
    import zipfile
    
    try:
        urllib.request.urlretrieve(url, TEMP_TIF)
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode()
        print(f"\nGEE HTTP Error {e.code}: {error_msg}\n")
        raise
    
    # GEE sometimes returns the TIFF directly, and sometimes a ZIP.
    try:
        with rasterio.open(TEMP_TIF) as src:
            pass # It is a valid TIFF!
    except rasterio.errors.RasterioIOError:
        # It must be a ZIP file
        import zipfile
        zip_path = TEMP_TIF + ".zip"
        os.rename(TEMP_TIF, zip_path)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            tif_files = [f for f in zip_ref.namelist() if f.endswith('.tif')]
            if len(tif_files) == 1:
                extracted_path = os.path.join(os.path.dirname(TEMP_TIF), tif_files[0])
                zip_ref.extract(tif_files[0], os.path.dirname(TEMP_TIF))
                if os.path.exists(TEMP_TIF):
                    os.remove(TEMP_TIF)
                os.rename(extracted_path, TEMP_TIF)
            else:
                raise RuntimeError(f"Expected 1 TIFF in zip, found: {tif_files}")
        os.remove(zip_path)
    
    print(f"Downloaded spatial features to {TEMP_TIF}")


def smooth_array(array, sigma=1.0):
    """Applies a Gaussian filter to smooth the map, ignoring NaNs outside the region."""
    valid = ~np.isnan(array)
    smoothed = ndimage.gaussian_filter(np.nan_to_num(array), sigma=sigma)
    weights = ndimage.gaussian_filter(valid.astype(float), sigma=sigma)
    return np.where(valid, smoothed / (weights + 1e-8), np.nan)


def reclassify_to_5_classes(array):
    """Reclassifies a continuous array into 5 quantiles (1=Low, 5=Very High)"""
    valid_data = array[~np.isnan(array)]
    if len(valid_data) == 0:
        return array
    
    quantiles = np.quantile(valid_data, [0, 0.2, 0.4, 0.6, 0.8, 1.0])
    quantiles[0] = -np.inf
    quantiles[-1] = np.inf
    
    reclass = np.full_like(array, np.nan)
    for i in range(5):
        mask_idx = (array > quantiles[i]) & (array <= quantiles[i+1])
        reclass[mask_idx] = i + 1
    return reclass


def plot_map_with_elements(array, transform, title, filename):
    fig, ax = plt.subplots(figsize=(12, 10), facecolor='white')
    ax.axis('off')
    
    cmap = ListedColormap(['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'])
    labels = ['Low (1)', 'Moderate (2)', 'Medium (3)', 'High (4)', 'Very High (5)']
    
    # Plot map
    im = ax.imshow(array, cmap=cmap, vmin=1, vmax=5)
    
    # Custom Legend (Placed OUTSIDE the map to prevent overlay)
    patches = [mpatches.Patch(color=cmap.colors[i], label=labels[i]) for i in range(5)]
    ax.legend(handles=patches, loc='center left', bbox_to_anchor=(1.05, 0.5), title=title, 
              frameon=True, facecolor='white', framealpha=1, fontsize=12, title_fontsize=14)
    
    # North Arrow (Placed safely in top-left, with a white background box)
    ax.annotate('N', xy=(0.05, 0.95), xytext=(0.05, 0.88),
                arrowprops=dict(facecolor='black', width=4, headwidth=12),
                ha='center', va='center', fontsize=20, fontweight='bold', 
                xycoords='axes fraction', textcoords='axes fraction',
                bbox=dict(boxstyle="round,pad=0.3", fc="white", ec="black", lw=1))
    
    # Scale Bar (5 km) - Placed safely in bottom-left, with a white background box
    pixel_width_deg = abs(transform[0])
    km_per_deg = 111.32
    pixels_per_5km = 5.0 / (pixel_width_deg * km_per_deg)
    
    x0 = array.shape[1] * 0.05
    y0 = array.shape[0] * 0.95
    
    # Draw a white rectangle behind the scale bar
    rect = mpatches.Rectangle((x0 - array.shape[1]*0.02, y0 - array.shape[0]*0.05), 
                              pixels_per_5km + array.shape[1]*0.04, array.shape[0]*0.07, 
                              linewidth=1, edgecolor='black', facecolor='white')
    ax.add_patch(rect)
    
    ax.plot([x0, x0 + pixels_per_5km], [y0, y0], color='black', linewidth=5)
    ax.text(x0 + pixels_per_5km/2, y0 - array.shape[0]*0.015, '5 km', ha='center', va='bottom', fontsize=14, fontweight='bold')
    
    plt.tight_layout()
    # Save with solid white background (not transparent)
    plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='white', transparent=False)
    plt.close()
    print(f" - Saved {filename}")


def process_and_generate_maps():
    get_gee_features()
    
    print("Loading ML model...")
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Please run train_model.py first.")
    model = joblib.load(MODEL_PATH)
    
    print("Applying exact study area mask...")
    with rasterio.open(TEMP_TIF) as src:
        out_image, out_transform = mask(src, [exact_geom], crop=True, nodata=np.nan)
    
    # The bands match the exact order of the ML features:
    # 0: baseline_agb, 1: sar_hv, 2: sar_hh, 3: slope, 4: elevation, 5: precipitation, 
    # 6: soil_ph, 7: soc, 8: gedi_rh98, 9: pdsi, 10: tmmx, 11: landcover
    
    print("Smoothing feature maps...")
    smoothed_features = []
    for band_idx in range(12):
        smoothed = smooth_array(out_image[band_idx], sigma=1.5)
        smoothed_features.append(smoothed)
    smoothed_features = np.array(smoothed_features)
    
    print("Running spatial ML predictions...")
    valid_mask = ~np.isnan(smoothed_features[0])
    flat_features = [smoothed_features[i][valid_mask] for i in range(12)]
    X = np.stack(flat_features, axis=1)
    
    # Predict
    y_pred = model.predict(X)
    
    predicted_agb = np.full(smoothed_features[0].shape, np.nan)
    predicted_agb[valid_mask] = y_pred
    
    print("Reclassifying and plotting final maps...")
    
    feature_names = [
        'Baseline AGB', 'SAR HV', 'SAR HH', 'Slope', 'Elevation', 
        'Precipitation', 'Soil pH', 'Soil Organic Carbon', 
        'GEDI RH98', 'PDSI', 'Max Temperature', 'Landcover'
    ]
    
    maps_to_plot = {}
    # Add all 12 factor maps
    for i, name in enumerate(feature_names):
        filename = f"{i+1:02d}_{name.replace(' ', '_')}.png"
        maps_to_plot[filename] = (smoothed_features[i], name)
        
    # Add the final prediction map
    maps_to_plot['13_Predicted_AGB.png'] = (predicted_agb, 'Final Predicted AGB')
    
    for filename, (array, title) in maps_to_plot.items():
        reclassified = reclassify_to_5_classes(array)
        plot_map_with_elements(reclassified, out_transform, title, os.path.join(OUTPUT_DIR, filename))
        
    # Clean up temp file
    if os.path.exists(TEMP_TIF):
        os.remove(TEMP_TIF)
    print(f"\nSuccessfully saved all reclassified, smoothed maps to: {OUTPUT_DIR}")


if __name__ == "__main__":
    try:
        process_and_generate_maps()
    except Exception as e:
        print("Error:", e)
        traceback.print_exc()
