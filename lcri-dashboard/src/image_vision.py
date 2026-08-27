import ee
import datetime
from shapely.geometry import shape

def generate_monitoring_images(geojson_geom, target_date_str=None):
    """
    Returns True Color, NDVI, NDWI, NBR, and EVI image URLs for the given polygon 
    using Sentinel-2, Landsat 8, or Landsat 7 depending on the requested date.
    Also returns Dynamic World and Hansen Forest Loss where available.
    """
    geom = shape(geojson_geom)
    if geom.geom_type not in ('Polygon', 'MultiPolygon'):
        raise ValueError("Only polygons are supported for image monitoring")

    from src.data_sources import _ee_initialized
    if not _ee_initialized:
        return {
            "true_color_url": None,
            "ndvi_url": None,
            "ndwi_url": None,
            "nbr_url": None,
            "evi_url": None,
            "dw_url": None,
            "hansen_url": None,
            "offline": True,
            "metadata": {
                "acquisition_date": "Mock Mode (Offline)",
                "cloud_cover_pct": 0,
                "resolution": "N/A",
                "satellite": "Mock Data",
                "mean_ndvi": 0.5,
                "mean_evi": 0.5,
                "image_size": [512, 512]
            }
        }
        
    ee_geom = ee.Geometry(geojson_geom)
    bbox = ee_geom.bounds()
    
    # 1. Determine target date and satellite
    target_year = datetime.datetime.utcnow().year
    if target_date_str:
        try:
            dt = datetime.datetime.strptime(target_date_str, "%Y-%m")
            target_year = dt.year
            if dt.month == 12:
                end_dt = datetime.datetime(dt.year + 1, 1, 1)
            else:
                end_dt = datetime.datetime(dt.year, dt.month + 1, 1)
            now = ee.Date(end_dt.strftime('%Y-%m-%dT00:00:00Z'))
        except ValueError:
            now = ee.Date(datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'))
    else:
        now = ee.Date(datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'))
        
    start_date = now.advance(-90, 'day')

    satellite_name = "Sentinel-2A/B"
    resolution = "10m/px"
    
    # Setup collection and band names based on the target year
    if target_year >= 2016:
        # Sentinel-2
        col = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED") \
            .filterBounds(ee_geom) \
            .filterDate(start_date, now) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
            
        def scale_s2(img):
            return img.multiply(0.0001).copyProperties(img, img.propertyNames())
        col = col.map(scale_s2)

        band_blue = 'B2'
        band_green = 'B3'
        band_red = 'B4'
        band_nir = 'B8'
        band_swir = 'B12'
        rgb_max = 0.3
    elif target_year >= 2013:
        # Landsat 8 Surface Reflectance
        col = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2") \
            .filterBounds(ee_geom) \
            .filterDate(start_date, now) \
            .filter(ee.Filter.lt('CLOUD_COVER', 30))
            
        def scale_l8(img):
            optical = img.select('SR_B.').multiply(0.0000275).add(-0.2)
            return img.addBands(optical, None, True).copyProperties(img, img.propertyNames())
        col = col.map(scale_l8)

        band_blue = 'SR_B2'
        band_green = 'SR_B3'
        band_red = 'SR_B4'
        band_nir = 'SR_B5'
        band_swir = 'SR_B7'
        rgb_max = 0.3
        satellite_name = "Landsat 8"
        resolution = "30m/px"
    else:
        # Landsat 7 Surface Reflectance
        col = ee.ImageCollection("LANDSAT/LE07/C02/T1_L2") \
            .filterBounds(ee_geom) \
            .filterDate(start_date, now) \
            .filter(ee.Filter.lt('CLOUD_COVER', 30))
            
        def scale_l7(img):
            optical = img.select('SR_B.').multiply(0.0000275).add(-0.2)
            return img.addBands(optical, None, True).copyProperties(img, img.propertyNames())
        col = col.map(scale_l7)

        band_blue = 'SR_B1'
        band_green = 'SR_B2'
        band_red = 'SR_B3'
        band_nir = 'SR_B4'
        band_swir = 'SR_B7'
        rgb_max = 0.3
        satellite_name = "Landsat 7"
        resolution = "30m/px"
        
    # Get metadata from the most recent granule
    recent_img = ee.Image(col.sort('system:time_start', False).first())
    
    # Create a median composite to ensure full coverage over the bounding box
    img = col.median().clip(bbox)

    # Extract metadata
    try:
        acq_date = ee.Date(recent_img.get('system:time_start')).format('YYYY-MM-dd').getInfo()
        cloud_prop = 'CLOUDY_PIXEL_PERCENTAGE' if target_year >= 2016 else 'CLOUD_COVER'
        cloud_cover = round(recent_img.get(cloud_prop).getInfo(), 2)
    except Exception:
        acq_date = f"No recent cloud-free image (<90d)"
        cloud_cover = None
        
    # 2. Generate True Color (RGB) Image URL
    rgb_vis = {
        'bands': [band_red, band_green, band_blue],
        'min': 0,
        'max': rgb_max,
        'gamma': 1.4,
        'region': bbox,
        'dimensions': 512,
        'format': 'png'
    }
    try:
        rgb_url = img.getThumbURL(rgb_vis)
    except Exception:
        rgb_url = None
        
    # 3. Generate Health Scanner (NDVI) Image URL
    ndvi = img.normalizedDifference([band_nir, band_red]).rename('NDVI')
    ndvi_vis = {
        'min': 0.1, 'max': 0.8,
        'palette': ['d73027', 'fc8d59', 'fee08b', 'd9ef8b', '91cf60', '1a9850'],
        'region': bbox, 'dimensions': 512, 'format': 'png'
    }
    try:
        ndvi_url = ndvi.getThumbURL(ndvi_vis)
    except Exception:
        ndvi_url = None
        
    # 4. Generate Water Scanner (NDWI) Image URL
    ndwi = img.normalizedDifference([band_green, band_nir]).rename('NDWI')
    ndwi_vis = {
        'min': -0.3, 'max': 0.3,
        'palette': ['a6611a', 'dfc27d', 'f5f5f5', '80cdc1', '018571', '003c30', '00155a'],
        'region': bbox, 'dimensions': 512, 'format': 'png'
    }
    try:
        ndwi_url = ndwi.getThumbURL(ndwi_vis)
    except Exception:
        ndwi_url = None

    # 5. Generate Burn/Clearcut Scanner (NBR) Image URL
    nbr = img.normalizedDifference([band_nir, band_swir]).rename('NBR')
    nbr_vis = {
        'min': -0.5, 'max': 0.8,
        'palette': ['000000', 'a50026', 'd73027', 'f46d43', 'fdae61', 'fee08b', 'd9ef8b', 'a6d96a', '66bd63', '1a9850', '006837'],
        'region': bbox, 'dimensions': 512, 'format': 'png'
    }
    try:
        nbr_url = nbr.getThumbURL(nbr_vis)
    except Exception:
        nbr_url = None

    # 6. Generate Enhanced Vegetation Index (EVI) Image URL
    evi = img.expression(
        '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
            'NIR': img.select(band_nir),
            'RED': img.select(band_red),
            'BLUE': img.select(band_blue)
        }).rename('EVI')
    
    evi_vis = {
        'min': 0.0, 'max': 1.0,
        'palette': ['ffffff', 'ce7e45', 'df923d', 'f1b555', 'fcd163', '99b718', '74a901', '66a000', '529400', '3e8601', '207401', '056201', '004c00', '023b01', '012e01', '011d01', '011301'],
        'region': bbox, 'dimensions': 512, 'format': 'png'
    }
    try:
        evi_url = evi.getThumbURL(evi_vis)
    except Exception:
        evi_url = None

    # Calculate regional mean stats
    try:
        stats = img.addBands(ndvi).addBands(evi).reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=ee_geom,
            scale=30 if target_year < 2016 else 10,
            maxPixels=1e9,
            bestEffort=True
        ).getInfo()
        mean_ndvi = round(stats.get('NDVI'), 3) if stats.get('NDVI') is not None else None
        mean_evi = round(stats.get('EVI'), 3) if stats.get('EVI') is not None else None
    except Exception:
        mean_ndvi = None
        mean_evi = None
        
    # 7. Dynamic World (Real-time Land Cover) - Only available 2015+
    dw_url = None
    if target_year >= 2015:
        dw_col = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1') \
            .filterBounds(ee_geom) \
            .filterDate(start_date, now)
        
        dw = ee.Image(dw_col.mode()).select('label').clip(bbox)
        dw_vis = {
            'min': 0, 'max': 8,
            'palette': ['419BDF','397D49','88B053','7A87C6','E49635','DFC35A','C4281B','A59B8F','B39FE1'],
            'region': bbox, 'dimensions': 512, 'format': 'png'
        }
        try:
            dw_url = dw.getThumbURL(dw_vis)
        except Exception:
            dw_url = None

    # 8. Hansen Global Forest Change (Loss Year)
    hansen = ee.Image('UMD/hansen/global_forest_change_2022_v1_10').clip(bbox)
    lossyear = hansen.select('lossyear')
    hansen_vis = {
        'min': 1, 'max': 23,
        'palette': ['ffffcc','ffeda0','fed976','feb24c','fd8d3c','fc4e2a','e31a1c','bd0026','800026'],
        'region': bbox, 'dimensions': 512, 'format': 'png'
    }
    try:
        hansen_url = lossyear.updateMask(lossyear.gt(0)).getThumbURL(hansen_vis)
    except Exception:
        hansen_url = None

    return {
        "true_color_url": rgb_url,
        "ndvi_url": ndvi_url,
        "ndwi_url": ndwi_url,
        "nbr_url": nbr_url,
        "evi_url": evi_url,
        "dw_url": dw_url,
        "hansen_url": hansen_url,
        "metadata": {
            "acquisition_date": acq_date,
            "cloud_cover_pct": cloud_cover,
            "resolution": resolution,
            "satellite": satellite_name,
            "mean_ndvi": mean_ndvi,
            "mean_evi": mean_evi,
            "image_size": [512, 512]
        }
    }
