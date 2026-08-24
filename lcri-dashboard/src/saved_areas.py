import json
import os
import datetime
import sqlite3
from shapely.geometry import shape
import pyproj

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
SAVED_AREAS_FILE = os.path.join(DATA_DIR, "saved_areas.json")
DB_FILE = os.path.join(DATA_DIR, "lcri_database.db")

def _get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def _init_db():
    conn = _get_db()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS saved_areas (
            name TEXT PRIMARY KEY,
            notes TEXT,
            geometry_json TEXT,
            metrics_json TEXT,
            stats_json TEXT,
            trend REAL,
            created_at TEXT
        )
    ''')
    conn.commit()
    
    # Migration from JSON
    if os.path.exists(SAVED_AREAS_FILE):
        try:
            with open(SAVED_AREAS_FILE, "r") as f:
                old_data = json.load(f)
            
            for name, record in old_data.items():
                c.execute("SELECT name FROM saved_areas WHERE name = ?", (name,))
                if not c.fetchone():
                    c.execute('''
                        INSERT INTO saved_areas 
                        (name, notes, geometry_json, metrics_json, stats_json, trend, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        name,
                        record.get("notes", ""),
                        json.dumps(record.get("geometry", {})),
                        json.dumps(record.get("metrics", {})),
                        json.dumps(record.get("stats")) if record.get("stats") else None,
                        record.get("trend"),
                        record.get("created_at")
                    ))
            conn.commit()
            
            # Rename the old file so we don't migrate again
            os.rename(SAVED_AREAS_FILE, SAVED_AREAS_FILE + ".migrated")
        except Exception as e:
            print(f"Migration error: {e}")
            pass
            
    conn.close()

# Initialize on module load
_init_db()

def load_saved_areas():
    conn = _get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM saved_areas ORDER BY created_at DESC")
    rows = c.fetchall()
    conn.close()
    
    result = {}
    for r in rows:
        result[r["name"]] = {
            "name": r["name"],
            "notes": r["notes"],
            "geometry": json.loads(r["geometry_json"]) if r["geometry_json"] else None,
            "metrics": json.loads(r["metrics_json"]) if r["metrics_json"] else None,
            "stats": json.loads(r["stats_json"]) if r["stats_json"] else None,
            "trend": r["trend"],
            "created_at": r["created_at"]
        }
    return result

def save_area(name, geojson_geometry, notes="", stats=None, trend=None):
    geom = shape(geojson_geometry)
    geom_type = geojson_geometry.get("type", "Unknown")
    
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
        
    created_at = datetime.datetime.now().isoformat()
    
    conn = _get_db()
    c = conn.cursor()
    c.execute('''
        INSERT OR REPLACE INTO saved_areas 
        (name, notes, geometry_json, metrics_json, stats_json, trend, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        name,
        notes,
        json.dumps(geojson_geometry),
        json.dumps(metrics),
        json.dumps(stats) if stats else None,
        trend,
        created_at
    ))
    conn.commit()
    conn.close()
        
    return {
        "name": name,
        "notes": notes,
        "geometry": geojson_geometry,
        "metrics": metrics,
        "stats": stats,
        "trend": trend,
        "created_at": created_at
    }

def delete_area(name):
    conn = _get_db()
    c = conn.cursor()
    c.execute("DELETE FROM saved_areas WHERE name = ?", (name,))
    conn.commit()
    conn.close()
