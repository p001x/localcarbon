import requests
import time

BASE_URL = "https://local-carbon-ui.onrender.com"

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
    print(f"\n--- Processing {district} on LIVE SERVER ---")
    
    # 1. Fetch Geometry
    print("  Fetching geometry...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    try:
        res = requests.get(f"{BASE_URL}/api/district-boundary/{district}", params={"country": "Rwanda"}, headers=headers)
        if res.status_code != 200:
            print(f"  ❌ Error fetching geometry: HTTP {res.status_code}\n{res.text[:100]}")
            return
        try:
            geom = res.json()
        except Exception as e:
            print(f"  ❌ Failed to parse JSON. Response was:\n{res.text[:200]}")
            return
            
        if not geom or "type" not in geom:
            print(f"  ❌ Failed to get valid geometry.")
            return
    except Exception as e:
        print(f"  ❌ Server unreachable: {e}")
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

if __name__ == "__main__":
    print("==================================================")
    print("🚀 LIVE SERVER Pre-Analysis Script")
    print(f"Targeting: {BASE_URL}")
    print("==================================================")
    
    start_time = time.time()
    
    for district in DISTRICTS:
        precompute_district(district)
        time.sleep(1)
        
    print("\n==================================================")
    print(f"🎉 Live Server Pre-computation complete in {round(time.time() - start_time, 1)} seconds!")
    print("==================================================")
