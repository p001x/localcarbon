import sys
import os
import json
import ee

# Set up paths
repo_root = r"c:\Users\user\Documents\local carbon"
dashboard_dir = os.path.join(repo_root, "lcri-dashboard")
sys.path.append(dashboard_dir)

# Read credentials
cred_path = os.path.join(repo_root, "ee-petersonyang87-52f0e0a9ad78.json")
with open(cred_path, 'r') as f:
    creds_dict = json.load(f)

# Authenticate
from google.oauth2 import service_account
credentials = service_account.Credentials.from_service_account_info(
    creds_dict, scopes=['https://www.googleapis.com/auth/earthengine']
)
ee.Initialize(credentials)

print("Earth Engine Authenticated successfully!")

import datetime

try:
    print("Fetching GAUL boundary...")
    gicumbi_fc = ee.FeatureCollection("FAO/GAUL/2015/level2").filter(ee.Filter.eq('ADM2_NAME', 'Gicumbi'))
    clip_geom = gicumbi_fc.geometry()
    
    print("Geometry retrieved.")
    
    # 2019 baseline (Project start)
    s2_2019 = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
              .filterDate('2019-01-01', '2019-12-31')
              .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
              .median()
              .clip(clip_geom))
              
    now = datetime.datetime.utcnow()
    start_date = (now - datetime.timedelta(days=365)).strftime('%Y-%m-%d')
    end_date = now.strftime('%Y-%m-%d')
    s2_present = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                 .filterDate(start_date, end_date)
                 .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                 .median()
                 .clip(clip_geom))
                 
    hansen = ee.Image("UMD/hansen/global_forest_change_2022_v1_10")
    loss = hansen.select('loss').clip(clip_geom).updateMask(hansen.select('loss').eq(1))
    
    vis_ndvi = {'min': 0, 'max': 0.8, 'palette': ['white', 'green']}
    vis_loss = {'min': 0, 'max': 1, 'palette': ['red']}
    
    def add_ndvi(img):
        return img.normalizedDifference(['B8', 'B4']).rename('NDVI')
        
    ndvi_2019 = add_ndvi(s2_2019)
    ndvi_present = add_ndvi(s2_present)

    print("Generating Map IDs...")
    map1 = ndvi_2019.getMapId(vis_ndvi)['tile_fetcher'].url_format
    print("Map 1:", map1)
    map2 = ndvi_present.getMapId(vis_ndvi)['tile_fetcher'].url_format
    print("Map 2:", map2)
    map3 = loss.getMapId(vis_loss)['tile_fetcher'].url_format
    print("Map 3:", map3)
    
    print("SUCCESS!")
except Exception as e:
    import traceback
    traceback.print_exc()
