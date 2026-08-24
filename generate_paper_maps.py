import os
import ee
import json
import urllib.request
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.offsetbox import AnchoredOffsetbox, AuxTransformBox
from PIL import Image
import numpy as np

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

# 1. Fetch Exact Geometry for Gicumbi District
print("Fetching exact Gicumbi District boundaries from FAO/GAUL...")
gaul = ee.FeatureCollection("FAO/GAUL/2015/level2")
gicumbi_feature = gaul.filter(ee.Filter.eq('ADM2_NAME', 'Gicumbi')).first()
region = gicumbi_feature.geometry()

# Palette for 5 classes (ColorBrewer RdYlGn)
PALETTE = ['#d7191c', '#fdae61', '#ffffbf', '#abdda4', '#2b83ba']
PALETTE_HEX = PALETTE # Matplotlib can use these hex codes directly

datasets = [
    {"name": "01_Baseline_AGB", "image": ee.Image("LARSE/GEDI/GEDI04_B_002").select('MU').unmask(0), "unit": "Mg/ha"},
    {"name": "02_SAR_HV", "image": ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR_EPOCH").filterDate('2020-01-01', '2020-12-31').first().select('HV'), "unit": "dB"},
    {"name": "03_SAR_HH", "image": ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/SAR_EPOCH").filterDate('2020-01-01', '2020-12-31').first().select('HH'), "unit": "dB"},
    {"name": "04_Elevation", "image": ee.Image("USGS/SRTMGL1_003").select('elevation'), "unit": "m"},
    {"name": "05_Slope", "image": ee.Terrain.slope(ee.Image("USGS/SRTMGL1_003").select('elevation')), "unit": "degrees"},
    {"name": "06_Precipitation", "image": ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY").filterDate('2020-01-01', '2020-12-31').sum(), "unit": "mm"},
    {"name": "07_Soil_pH", "image": ee.Image("OpenLandMap/SOL/SOL_PH-H2O_USDA-4C1A2A_M/v02").select('b0').multiply(0.1), "unit": "pH"},
    {"name": "08_Soil_Organic_Carbon", "image": ee.Image("projects/soilgrids-isric/soc_mean").select('soc_0-5cm_mean').toFloat(), "unit": "dg/kg"},
    {"name": "09_GEDI_RH98", "image": ee.ImageCollection("LARSE/GEDI/GEDI02_A_002_MONTHLY").mean().select('rh98'), "unit": "m"},
    {"name": "10_PDSI_Drought", "image": ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE").filterDate('2020-01-01', '2020-12-31').mean().select('pdsi'), "unit": "Index"},
    {"name": "11_Max_Temp", "image": ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE").filterDate('2020-01-01', '2020-12-31').mean().select('tmmx').multiply(0.1), "unit": "°C"},
    {"name": "12_Landcover", "image": ee.ImageCollection("ESA/WorldCover/v200").first().select('Map'), "unit": "Class"}
]

def add_north_arrow(ax):
    # Add a simple North arrow
    x, y, arrow_length = 0.95, 0.95, 0.05
    ax.annotate('N', xy=(x, y), xytext=(x, y-arrow_length),
                arrowprops=dict(facecolor='black', width=3, headwidth=10),
                ha='center', va='center', fontsize=12,
                xycoords=ax.transAxes)

def add_scale_bar(ax):
    # Adds a generic visual scale bar 
    # Gicumbi is roughly ~35km across. We add a visual representation.
    # Note: since this is an unprojected PNG, the scale bar is symbolic for cartographic completion.
    rect = mpatches.Rectangle((0.05, 0.05), 0.2, 0.015, color='black', transform=ax.transAxes)
    ax.add_patch(rect)
    rect_white = mpatches.Rectangle((0.15, 0.05), 0.1, 0.015, color='white', ec='black', transform=ax.transAxes)
    ax.add_patch(rect_white)
    ax.text(0.05, 0.07, '0', transform=ax.transAxes, fontsize=9)
    ax.text(0.15, 0.07, '10', transform=ax.transAxes, fontsize=9)
    ax.text(0.25, 0.07, '20 km', transform=ax.transAxes, fontsize=9)


print("Generating Publication Maps for datasets...")
for ds in datasets:
    name = ds['name']
    unit = ds['unit']
    print(f"\nProcessing {name}...")
    
    img = ds['image']
    band_name = img.bandNames().get(0).getInfo()
    
    # Calculate min and max for the actual region
    stats = img.reduceRegion(
        reducer=ee.Reducer.minMax(),
        geometry=region,
        scale=250, # 250m to prevent timeouts
        maxPixels=1e10
    ).getInfo()
    
    min_val = stats.get(f"{band_name}_min", 0)
    max_val = stats.get(f"{band_name}_max", 1)
    
    if min_val is None or max_val is None:
        print(f"Skipping {name}, min/max could not be calculated.")
        continue
        
    if min_val == max_val:
        max_val = min_val + 1 # Prevent div by 0
        
    print(f"  Range: {min_val:.2f} to {max_val:.2f} {unit}")
    
    # 5 Equal Intervals
    interval = (max_val - min_val) / 5
    ranges = []
    for i in range(5):
        ranges.append((min_val + i*interval, min_val + (i+1)*interval))
        
    # Reclassify image to 0-4
    expr = f"floor((b(0) - {min_val}) / {interval})"
    class_img = img.expression(expr).clamp(0, 4)
    
    # Clip to exact Gicumbi boundary
    class_img = class_img.clip(region)
    
    # Download as PNG
    temp_png = os.path.join(OUTPUT_DIR, f"temp_{name}.png")
    try:
        url = class_img.getThumbURL({
            'region': region.bounds(), # Must pass bounds to frame it, but it's clipped to region!
            'dimensions': 1200,
            'format': 'png',
            'min': 0,
            'max': 4,
            'palette': PALETTE
        })
        urllib.request.urlretrieve(url, temp_png)
    except Exception as e:
        print(f"  Error fetching image from GEE: {e}")
        continue
        
    # Plot using Matplotlib
    try:
        image = Image.open(temp_png)
        
        fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
        ax.imshow(image)
        ax.axis('off')
        
        # Add Title
        title = name[3:].replace('_', ' ') + " Distribution (Gicumbi District)"
        plt.title(title, fontsize=16, pad=15, weight='bold')
        
        # Add Legend
        class_names = ["Low", "Moderate", "Medium", "High", "Very High"]
        patches = []
        for i, (rmin, rmax) in enumerate(ranges):
            label = f"{class_names[i]} ({rmin:.1f} - {rmax:.1f} {unit})"
            patches.append(mpatches.Patch(color=PALETTE_HEX[i], label=label))
            
        # Place legend outside the map to prevent overlay
        legend = ax.legend(handles=patches, bbox_to_anchor=(1.02, 0.5), loc='center left', title='Classes (Equal Interval)', framealpha=0.9)
        legend.get_title().set_weight('bold')
        
        # Add Cartographic Elements
        add_north_arrow(ax)
        add_scale_bar(ax)
        
        # Save Final Map
        final_out = os.path.join(OUTPUT_DIR, f"MAP_Publication_{name}.png")
        plt.tight_layout()
        plt.savefig(final_out, bbox_inches='tight', dpi=300, transparent=False, facecolor='white')
        plt.close()
        
        print(f"  Saved publication map: {final_out}")
    except Exception as e:
        print(f"  Error plotting map: {e}")
    finally:
        if os.path.exists(temp_png):
            os.remove(temp_png)
            
print("\nAll publication maps generated successfully!")
