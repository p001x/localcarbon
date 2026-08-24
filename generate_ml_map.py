import os
import ee
import json
import pandas as pd
import urllib.request
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.offsetbox import AnchoredOffsetbox, AuxTransformBox
from PIL import Image

# Initialize Earth Engine
print("Initializing Google Earth Engine...")
try:
    with open(r"C:\Users\user\Documents\local carbon\ee-petersonyang87-52f0e0a9ad78.json", 'r') as f:
        creds = json.load(f)
    credentials = ee.ServiceAccountCredentials(creds['client_email'], r"C:\Users\user\Documents\local carbon\ee-petersonyang87-52f0e0a9ad78.json")
    ee.Initialize(credentials, project=creds['project_id'])
except Exception as e:
    print("Falling back to default auth...")
    ee.Initialize()

OUTPUT_DIR = r"c:\Users\user\Documents\local carbon\research_results"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. Load the training data to train the EE Classifier
print("Loading local training data...")
df = pd.read_csv(r"c:\Users\user\Documents\local carbon\lcri-dashboard\data\ml_training_data.csv")
features = ['baseline_agb', 'sar_hv', 'sar_hh', 'slope', 'elevation', 'precipitation', 'soil_ph', 'soc', 'gedi_rh98', 'pdsi', 'tmmx', 'landcover']

# Filter valid vegetation types just like in train_model.py
df = df.dropna(subset=features + ['agb_2020'])
df = df[df['landcover'].isin([10, 20, 30, 40])]
df = df[(df['baseline_agb'] >= 0) & (df['baseline_agb'] < 400)]
df = df[(df['agb_2020'] >= 0) & (df['agb_2020'] < 400)]

# Add the target classification column
median_agb = df['agb_2020'].median()
df['High_Carbon_Sink'] = (df['agb_2020'] > median_agb).astype(int)

# Create EE Feature Collection
print("Converting to Earth Engine Features...")
ee_features = []
for idx, row in df.iterrows():
    geom = ee.Geometry.Point([row['lon'], row['lat']])
    props = {feat: row[feat] for feat in features}
    props['High_Carbon_Sink'] = int(row['High_Carbon_Sink'])
    props['agb_2020'] = float(row['agb_2020'])
    ee_features.append(ee.Feature(geom, props))

fc = ee.FeatureCollection(ee_features)

print("Training Earth Engine Random Forest Models...")
# Classifier (1/0)
rf_classifier = ee.Classifier.smileRandomForest(150, maxNodes=20).setOutputMode('CLASSIFICATION').train(fc, 'High_Carbon_Sink', features)

# Regressor (Continuous Biomass)
rf_regressor = ee.Classifier.smileRandomForest(150, maxNodes=20).setOutputMode('REGRESSION').train(fc, 'agb_2020', features)

print("Fetching exact Gicumbi District boundaries from FAO/GAUL...")
gaul = ee.FeatureCollection("FAO/GAUL/2015/level2")
gicumbi_feature = gaul.filter(ee.Filter.eq('ADM2_NAME', 'Gicumbi')).first()
region = gicumbi_feature.geometry()

# Stack datasets exactly as in the training script
print("Building stacked 12-band image...")
agb_2010 = ee.ImageCollection("ESA/CCI/Above_Ground_Biomass/V6_0").filterDate('2010-01-01', '2010-12-31').first().select('agb').rename('baseline_agb').unmask(0)
palsar = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR").filterDate('2010-01-01', '2010-12-31').first()
sar_hv = palsar.select('HV').rename('sar_hv')
sar_hh = palsar.select('HH').rename('sar_hh')
srtm = ee.Image("USGS/SRTMGL1_003")
elevation = srtm.select('elevation').rename('elevation')
slope = ee.Terrain.slope(elevation).rename('slope')
chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY").filterDate('2010-01-01', '2020-12-31').sum().divide(11).rename('precipitation')
soil_ph = ee.Image("OpenLandMap/SOL/SOL_PH-H2O_USDA-4C1A2A_M/v02").select('b0').rename('soil_ph')
soc = ee.Image("projects/soilgrids-isric/soc_mean").select('soc_0-5cm_mean').toFloat().rename('soc')
gedi_rh98 = ee.ImageCollection("LARSE/GEDI/GEDI02_A_002_MONTHLY").mean().select('rh98').rename('gedi_rh98')
terraclimate = ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE").filterDate('2010-01-01', '2020-12-31').mean()
pdsi = terraclimate.select('pdsi').rename('pdsi')
tmmx = terraclimate.select('tmmx').multiply(0.1).rename('tmmx')
landcover = ee.ImageCollection("ESA/WorldCover/v200").first().select('Map').rename('landcover')

stacked_img = agb_2010.addBands([sar_hv, sar_hh, slope, elevation, chirps, soil_ph, soc, gedi_rh98, pdsi, tmmx, landcover])

print("Running spatial inference over Gicumbi...")
classified_img = stacked_img.classify(rf_classifier).clip(region)
regressed_img = stacked_img.classify(rf_regressor).clip(region)

def add_cartography(ax):
    # Add a simple North arrow
    x, y, arrow_length = 0.95, 0.95, 0.05
    ax.annotate('N', xy=(x, y), xytext=(x, y-arrow_length),
                arrowprops=dict(facecolor='black', width=3, headwidth=10),
                ha='center', va='center', fontsize=12,
                xycoords=ax.transAxes)
    # Generic Scale bar
    rect = mpatches.Rectangle((0.05, 0.05), 0.2, 0.015, color='black', transform=ax.transAxes)
    ax.add_patch(rect)
    rect_white = mpatches.Rectangle((0.15, 0.05), 0.1, 0.015, color='white', ec='black', transform=ax.transAxes)
    ax.add_patch(rect_white)
    ax.text(0.05, 0.07, '0', transform=ax.transAxes, fontsize=9)
    ax.text(0.15, 0.07, '10', transform=ax.transAxes, fontsize=9)
    ax.text(0.25, 0.07, '20 km', transform=ax.transAxes, fontsize=9)

# 1. Save Classification Map (0=Low, 1=High)
print("Rendering Classification Map...")
cls_url = classified_img.getThumbURL({
    'region': region.bounds(),
    'dimensions': 1200,
    'format': 'png',
    'min': 0,
    'max': 1,
    'palette': ['#d7191c', '#1a9641'] # Red to Green
})
cls_png = os.path.join(OUTPUT_DIR, "temp_cls.png")
urllib.request.urlretrieve(cls_url, cls_png)

try:
    fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
    ax.imshow(Image.open(cls_png))
    ax.axis('off')
    plt.title("ML Predicted High Carbon Sinks (Classification)", fontsize=16, pad=15, weight='bold')
    
    patches = [
        mpatches.Patch(color='#d7191c', label="Low Potential (Degraded)"),
        mpatches.Patch(color='#1a9641', label="High Potential (Carbon Sink)")
    ]
    legend = ax.legend(handles=patches, bbox_to_anchor=(1.02, 0.5), loc='center left', title='Sink Potential', framealpha=0.9)
    legend.get_title().set_weight('bold')
    add_cartography(ax)
    
    final_out = os.path.join(OUTPUT_DIR, "MAP_Publication_ML_Classification.png")
    plt.tight_layout()
    plt.savefig(final_out, bbox_inches='tight', dpi=300, facecolor='white')
    plt.close()
    print(f"Saved {final_out}")
except Exception as e:
    print(e)
finally:
    if os.path.exists(cls_png):
        os.remove(cls_png)

# 2. Save Regression Map (Continuous/5-class)
print("Rendering Regression Map...")
stats = regressed_img.reduceRegion(reducer=ee.Reducer.minMax(), geometry=region, scale=250, maxPixels=1e10).getInfo()
min_val = stats.get("classification_min", 0)
max_val = stats.get("classification_max", 400)

interval = (max_val - min_val) / 5
expr = f"floor((b(0) - {min_val}) / {interval})"
reg_class_img = regressed_img.expression(expr).clamp(0, 4)

reg_url = reg_class_img.getThumbURL({
    'region': region.bounds(),
    'dimensions': 1200,
    'format': 'png',
    'min': 0,
    'max': 4,
    'palette': ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'] # Sequential Yellow to Blue
})
reg_png = os.path.join(OUTPUT_DIR, "temp_reg.png")
urllib.request.urlretrieve(reg_url, reg_png)

try:
    fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
    ax.imshow(Image.open(reg_png))
    ax.axis('off')
    plt.title("ML Predicted Total Biomass (Regression)", fontsize=16, pad=15, weight='bold')
    
    class_names = ["Low", "Moderate", "Medium", "High", "Very High"]
    palette_hex = ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494']
    patches = []
    for i in range(5):
        rmin = min_val + i*interval
        rmax = min_val + (i+1)*interval
        label = f"{class_names[i]} ({rmin:.1f} - {rmax:.1f} Mg/ha)"
        patches.append(mpatches.Patch(color=palette_hex[i], label=label))
        
    legend = ax.legend(handles=patches, bbox_to_anchor=(1.02, 0.5), loc='center left', title='Predicted AGB', framealpha=0.9)
    legend.get_title().set_weight('bold')
    add_cartography(ax)
    
    final_out = os.path.join(OUTPUT_DIR, "MAP_Publication_ML_Regression.png")
    plt.tight_layout()
    plt.savefig(final_out, bbox_inches='tight', dpi=300, facecolor='white')
    plt.close()
    print(f"Saved {final_out}")
except Exception as e:
    print(e)
finally:
    if os.path.exists(reg_png):
        os.remove(reg_png)

print("Finished!")
