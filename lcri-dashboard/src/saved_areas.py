import json
import os
import datetime
from shapely.geometry import shape
import pyproj

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
SAVED_AREAS_FILE = os.path.join(DATA_DIR, "saved_areas.json")

def load_saved_areas():
    if not os.path.exists(SAVED_AREAS_FILE):
        return {}
    try:
        with open(SAVED_AREAS_FILE, "r") as f:
            return json.load(f)
    except:
        return {}

def save_area(name, geojson_geometry, notes="", stats=None, trend=None):
    areas = load_saved_areas()
    
    geom = shape(geojson_geometry)
    geom_type = geojson_geometry.get("type", "Unknown")
    
    # Calculate geodesic area/length
    geod = pyproj.Geod(ellps="WGS84")
    
    if geom_type in ["Polygon", "MultiPolygon"]:
        area_m2, _ = geod.geometry_area_perimeter(geom)
        metrics = {
            "type": "area",
            "value": abs(area_m2) / 10000.0, # hectares
            "unit": "ha"
        }
    elif geom_type in ["LineString", "MultiLineString"]:
        length_m = geod.geometry_length(geom)
        metrics = {
            "type": "length",
            "value": length_m / 1000.0, # km
            "unit": "km"
        }
    else:
        metrics = {"type": "unknown", "value": 0, "unit": ""}
        
    record = {
        "name": name,
        "notes": notes,
        "geometry": geojson_geometry,
        "metrics": metrics,
        "stats": stats,
        "trend": trend,
        "created_at": datetime.datetime.now().isoformat()
    }
    
    areas[name] = record
    
    with open(SAVED_AREAS_FILE, "w") as f:
        json.dump(areas, f, indent=2)
        
    return record

def delete_area(name):
    areas = load_saved_areas()
    if name in areas:
        del areas[name]
        with open(SAVED_AREAS_FILE, "w") as f:
            json.dump(areas, f, indent=2)
