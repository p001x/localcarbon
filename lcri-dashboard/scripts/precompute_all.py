import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000"

# Rwanda Districts from config.py
DISTRICTS = [
    "All Rwanda", 
    "Gasabo", "Kicukiro", "Nyarugenge", # Kigali
    "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo", # North
    "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango", # South
    "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana", # East
    "Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rutsiro", "Rusizi" # West
]

def precompute_district(district):
    print(f"\n--- Processing {district} ---")
    
    # 1. Fetch Geometry
    print("  Fetching geometry...")
    try:
        res = requests.get(f"{BASE_URL}/api/district-geometry", params={"country": "Rwanda", "district": district})
        geom = res.json()
        if "error" in geom or "type" not in geom:
            print(f"  Failed to get geometry: {geom}")
            return
    except Exception as e:
        print(f"  Server unreachable: {e}. Is server.py running?")
        return

    # 2. Precompute KPIs (Zonal Stats)
    print("  Computing KPIs...")
    res = requests.post(f"{BASE_URL}/api/kpis", json={"geometry": geom})
    if res.status_code == 200:
        print("  ✅ KPIs Cached")
    else:
        print(f"  ❌ KPI Error: {res.text}")

    # 3. Precompute ML Predictions
    print("  Computing ML Predictions...")
    res = requests.post(f"{BASE_URL}/api/ml-predict", json={"geometry": geom})
    if res.status_code == 200:
        print("  ✅ ML Predictions Cached")
    else:
        print(f"  ❌ ML Error: {res.text}")

    # 4. Precompute Monitoring Images (Multi-Satellite)
    print("  Generating Monitoring Image URLs...")
    res = requests.post(f"{BASE_URL}/api/monitoring-images", json={"geometry": geom})
    if res.status_code == 200:
        print("  ✅ Monitoring Images Cached")
    else:
        print(f"  ❌ Monitoring Images Error: {res.text}")


if __name__ == "__main__":
    print("==================================================")
    print("🚀 LCRI Dashboard Pre-Analysis Script")
    print("==================================================")
    print("This script will run analysis on every district and cache the results.")
    print("When judges use the app, all pre-analyzed areas will load instantly.\n")
    
    start_time = time.time()
    
    for district in DISTRICTS:
        precompute_district(district)
        time.sleep(1) # Small pause to avoid overloading the server/Earth Engine
        
    print("\n==================================================")
    print(f"🎉 Pre-computation complete in {round(time.time() - start_time, 1)} seconds!")
    print("==================================================")
