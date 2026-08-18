import os
import random
import pandas as pd
import ee
import time

# Define Rwanda bounding box
RWANDA_BBOX = [28.8616, -2.8398, 30.8993, -1.0474]

def init_ee():
    """Initialise Earth Engine with the service account from secrets or default auth."""
    try:
        with open(r"C:\Users\user\Documents\local carbon\ee-petersonyang87-52f0e0a9ad78.json", 'r') as f:
            creds = __import__('json').load(f)
        credentials = ee.ServiceAccountCredentials(creds['client_email'], r"C:\Users\user\Documents\local carbon\ee-petersonyang87-52f0e0a9ad78.json")
        ee.Initialize(credentials, project=creds['project_id'])
    except Exception as e:
        print(f"Error authenticating: {e}")
        raise

def generate_random_points(bbox, n=1000):
    """Generate n random long/lat points within the bounding box."""
    points = []
    for _ in range(n):
        lon = random.uniform(bbox[0], bbox[2])
        lat = random.uniform(bbox[1], bbox[3])
        points.append([lon, lat])
    return points

def extract_features(points):
    """Extract features from GEE for a list of points."""
    print(f"Extracting features for {len(points)} points...")
    
    # 1. Biomass Data (ESA CCI AGB)
    agb_collection = ee.ImageCollection("ESA/CCI/Above_Ground_Biomass/V6_0")
    agb_2010 = agb_collection.filterDate('2010-01-01', '2010-12-31').first()
    agb_2020 = agb_collection.filterDate('2020-01-01', '2020-12-31').first()
    
    # 1.5 ALOS PALSAR L-Band SAR (2010)
    palsar = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR") \
        .filterDate('2010-01-01', '2010-12-31').first()
    sar_hv = palsar.select('HV')
    sar_hh = palsar.select('HH')
    
    # 2. Topography (SRTM)
    srtm = ee.Image("USGS/SRTMGL1_003")
    elevation = srtm.select('elevation')
    slope = ee.Terrain.slope(elevation)
    
    # 3. Climate (CHIRPS Mean Annual Precipitation 2010-2020)
    chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY") \
                .filterDate('2010-01-01', '2020-12-31') \
                .sum().divide(11) # Average annual rainfall over 11 years
                
    # 4. Soil pH (OpenLandMap)
    soil_ph = ee.Image("OpenLandMap/SOL/SOL_PH-H2O_USDA-4C1A2A_M/v02").select('b0')
    
    # 4.5 Soil Organic Carbon (ISRIC SoilGrids)
    soc = ee.Image("projects/soilgrids-isric/soc_mean").select('soc_0-5cm_mean')
    
    # 4.6 GEDI Lidar Canopy Height (RH98)
    gedi_rh98 = ee.ImageCollection("LARSE/GEDI/GEDI02_A_002_MONTHLY").mean().select('rh98')
    
    # 5. Drought & Temp (TerraClimate mean 2010-2020)
    terraclimate = ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE") \
                    .filterDate('2010-01-01', '2020-12-31').mean()
    pdsi = terraclimate.select('pdsi')
    tmmx = terraclimate.select('tmmx').multiply(0.1) # scale factor
    
    # 6. Land Cover (ESA WorldCover)
    landcover = ee.ImageCollection("ESA/WorldCover/v200").first().select('Map')
    
    # Combine all bands
    combined = agb_2010.select('agb').rename('baseline_agb') \
        .addBands(agb_2020.select('agb').rename('agb_2020')) \
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
        
    # Convert points to Earth Engine FeatureCollection
    features = [ee.Feature(ee.Geometry.Point(p)) for p in points]
    fc = ee.FeatureCollection(features)
    
    # Sample the combined image at the points
    sampled = combined.sampleRegions(
        collection=fc,
        scale=100, # 100m resolution to speed up extraction
        geometries=True
    )
    
    # Fetch results from Earth Engine
    data = sampled.getInfo()
    
    results = []
    for feature in data['features']:
        props = feature['properties']
        geom = feature['geometry']['coordinates']
        
        # Only keep points where core data is available
        if 'baseline_agb' in props and 'agb_2020' in props:
            # Calculate 10-year growth
            growth = props['agb_2020'] - props['baseline_agb']
            
            results.append({
                'lon': geom[0],
                'lat': geom[1],
                'baseline_agb': props.get('baseline_agb', 0),
                'agb_2020': props.get('agb_2020', 0),
                'agb_growth_10yr': growth,
                'sar_hv': props.get('sar_hv', 0),
                'sar_hh': props.get('sar_hh', 0),
                'slope': props.get('slope', 0),
                'elevation': props.get('elevation', 0),
                'precipitation': props.get('precipitation', 0),
                'soil_ph': props.get('soil_ph', 0),
                'soc': props.get('soc', 0),
                'gedi_rh98': props.get('gedi_rh98', 0),
                'pdsi': props.get('pdsi', 0),
                'tmmx': props.get('tmmx', 0),
                'landcover': props.get('landcover', 0)
            })
            
    return pd.DataFrame(results)

if __name__ == "__main__":
    print("Initialising Earth Engine...")
    init_ee()
    
    TOTAL_POINTS = 5000  # Reduced to 5k for faster generation during test
    CHUNK_SIZE = 1000
    
    print(f"Generating {TOTAL_POINTS} points in Rwanda...")
    points = generate_random_points(RWANDA_BBOX, n=TOTAL_POINTS)
    
    all_dfs = []
    
    for i in range(0, TOTAL_POINTS, CHUNK_SIZE):
        chunk = points[i:i + CHUNK_SIZE]
        print(f"Processing chunk {i//CHUNK_SIZE + 1} of {TOTAL_POINTS//CHUNK_SIZE}...")
        try:
            df_chunk = extract_features(chunk)
            all_dfs.append(df_chunk)
            print(f"Extracted {len(df_chunk)} valid points.")
        except Exception as e:
            print(f"Error extracting chunk: {e}")
        time.sleep(1) # Small pause between requests
        
    final_df = pd.concat(all_dfs, ignore_index=True)
    
    print(f"Successfully extracted {len(final_df)} valid data points total.")
    
    # Save to CSV
    os.makedirs('data', exist_ok=True)
    out_path = os.path.join('data', 'ml_training_data.csv')
    final_df.to_csv(out_path, index=False)
    print(f"Saved dataset to {out_path}")
