import os
import ee
import json
import urllib.request
import shutil

# Initialize Earth Engine
print("Initializing Google Earth Engine...")
try:
    with open(r"C:\Users\user\Documents\local carbon\ee-petersonyang87-52f0e0a9ad78.json", 'r') as f:
        creds = json.load(f)
    credentials = ee.ServiceAccountCredentials(creds['client_email'], r"C:\Users\user\Documents\local carbon\ee-petersonyang87-52f0e0a9ad78.json")
    ee.Initialize(credentials, project=creds['project_id'])
except Exception as e:
    print(f"Error authenticating with Service Account: {e}")
    print("Falling back to default auth...")
    ee.Initialize()

# Gicumbi Bounding Box / Polygon
gicumbi_geojson = {
  "type": "Polygon",
  "coordinates": [
    [
      [30.01, -1.75],
      [30.15, -1.75],
      [30.15, -1.55],
      [30.01, -1.55],
      [30.01, -1.75]
    ]
  ]
}
region = ee.Geometry.Polygon(gicumbi_geojson['coordinates'])

OUTPUT_DIR = r"c:\Users\user\Documents\local carbon\research_results"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Datasets definition
datasets = [
    {
        "name": "01_Baseline_AGB",
        "image": ee.Image("LARSE/GEDI/GEDI04_B_002").select('MU').unmask(0),
        "vis": {'min': 0, 'max': 100, 'palette': ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494']}
    },
    {
        "name": "02_SAR_HV",
        "image": ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR_EPOCH").filterDate('2020-01-01', '2020-12-31').first().select('HV'),
        "vis": {'min': -25, 'max': 0}
    },
    {
        "name": "03_SAR_HH",
        "image": ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR_EPOCH").filterDate('2020-01-01', '2020-12-31').first().select('HH'),
        "vis": {'min': -20, 'max': 5}
    },
    {
        "name": "04_Elevation",
        "image": ee.Image("USGS/SRTMGL1_003").select('elevation'),
        "vis": {'min': 1400, 'max': 2500, 'palette': ['#000000', '#474747', '#8a8a8a', '#cccccc', '#ffffff']}
    },
    {
        "name": "05_Slope",
        "image": ee.Terrain.slope(ee.Image("USGS/SRTMGL1_003").select('elevation')),
        "vis": {'min': 0, 'max': 45}
    },
    {
        "name": "06_Precipitation",
        "image": ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY").filterDate('2020-01-01', '2020-12-31').sum(),
        "vis": {'min': 800, 'max': 1400, 'palette': ['#f7fbff', '#c6dbef', '#6baed6', '#2171b5', '#08306b']}
    },
    {
        "name": "07_Soil_pH",
        "image": ee.Image("OpenLandMap/SOL/SOL_PH-H2O_USDA-4C1A2A_M/v02").select('b0'),
        "vis": {'min': 40, 'max': 80}
    },
    {
        "name": "08_Soil_Organic_Carbon",
        "image": ee.Image("projects/soilgrids-isric/soc_mean").select('soc_0-5cm_mean').toFloat(),
        "vis": {'min': 0, 'max': 100}
    },
    {
        "name": "09_GEDI_RH98",
        "image": ee.ImageCollection("LARSE/GEDI/GEDI02_A_002_MONTHLY").mean().select('rh98'),
        "vis": {'min': 0, 'max': 30}
    },
    {
        "name": "10_PDSI_Drought",
        "image": ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE").filterDate('2020-01-01', '2020-12-31').mean().select('pdsi'),
        "vis": {'min': -4, 'max': 4}
    },
    {
        "name": "11_Max_Temp",
        "image": ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE").filterDate('2020-01-01', '2020-12-31').mean().select('tmmx').multiply(0.1),
        "vis": {'min': 15, 'max': 35}
    },
    {
        "name": "12_Landcover",
        "image": ee.ImageCollection("ESA/WorldCover/v200").first().select('Map'),
        "vis": {'min': 10, 'max': 100}
    },
    {
        "name": "13_True_Color",
        "image": ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').filterBounds(region).filterDate('2022-01-01', '2022-12-31').filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)).median(),
        "vis": {'min': 0, 'max': 3000, 'bands': ['B4', 'B3', 'B2']}
    }
]

def download_datasets():
    print(f"Downloading datasets for Gicumbi to {OUTPUT_DIR}...")
    for ds in datasets:
        print(f"Processing {ds['name']}...")
        
        # 1. Download PNG
        png_path = os.path.join(OUTPUT_DIR, f"{ds['name']}.png")
        try:
            url_png = ds['image'].getThumbURL({'region': region, 'dimensions': 800, 'format': 'png', **ds['vis']})
            urllib.request.urlretrieve(url_png, png_path)
            print(f"  - Saved PNG")
        except Exception as e:
            print(f"  - Error saving PNG: {e}")
            
        # 2. Download TIFF
        tif_path = os.path.join(OUTPUT_DIR, f"{ds['name']}.tif") 
        try:
            url_tif = ds['image'].getDownloadURL({
                'region': region,
                'scale': 100,
                'format': 'GEO_TIFF'
            })
            urllib.request.urlretrieve(url_tif, tif_path)
            print(f"  - Saved TIFF")
        except Exception as e:
            print(f"  - Error saving TIFF: {e}")

def gather_ml_results():
    print("\nGathering ML model performance charts...")
    source_dir = r"c:\Users\user\Documents\local carbon\lcri-dashboard\data"
    paper_figures_dir = r"c:\Users\user\Documents\local carbon\lcri-dashboard\paper_figures"
    
    files_to_copy = [
        (os.path.join(source_dir, "confusion_matrix.png"), "ML_01_confusion_matrix.png"),
        (os.path.join(source_dir, "roc_curve.png"), "ML_02_roc_curve.png"),
        (os.path.join(paper_figures_dir, "05_feature_importance.png"), "ML_03_feature_importance.png"),
        (os.path.join(paper_figures_dir, "06_actual_vs_predicted.png"), "ML_04_actual_vs_predicted.png")
    ]
    
    for src, dest_name in files_to_copy:
        dest = os.path.join(OUTPUT_DIR, dest_name)
        if os.path.exists(src):
            shutil.copy(src, dest)
            print(f"  - Copied {dest_name}")
        else:
            print(f"  - Warning: Source file not found: {src}")

if __name__ == "__main__":
    download_datasets()
    gather_ml_results()
    print(f"\nAll operations completed successfully. Data saved in {OUTPUT_DIR}")
