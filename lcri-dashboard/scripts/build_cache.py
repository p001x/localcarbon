"""
Phase 9 — Cache pre-builder
=============================
Run this script ONCE before the competition to pre-compute and cache zonal
stats + LCRI scores for all 5 baseline sites so that KPI cards render
instantly on judging day, even if the live ESRI service is slow or rate-limited.

Usage:
    C:\\Users\\user\\miniconda3\\python.exe scripts\\build_cache.py
"""
import json
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.zonal_stats import compute_zonal_stats
from src.carbon import process_zonal_stats_for_carbon
from src.change_detection import calculate_trend
from src.lcri import generate_mock_parcels, calculate_lcri
import config

SITES_PATH = os.path.join("data", "baseline_sites.geojson")
CACHE_DIR  = os.path.join("data", "cache")


def main():
    print("=" * 60)
    print("LCRI Dashboard — Pre-building cache for judging day")
    print("=" * 60)

    with open(SITES_PATH, "r") as f:
        sites = json.load(f)["features"]

    for site in sites:
        props = site["properties"]
        geom  = site["geometry"]
        name  = props["name"]
        district = props["district"]

        print(f"\n-> Processing: {name} ({district})")

        # 1. Zonal stats
        stats = compute_zonal_stats(geom)
        carbon_stats = process_zonal_stats_for_carbon(stats)
        trend = calculate_trend(stats)
        latest_year = sorted(carbon_stats.keys())[-1]
        d = carbon_stats[latest_year]

        print(f"   AGB:          {d['mean_agb_mg_ha']:.1f} Mg/ha")
        print(f"   Carbon stock: {d['carbon_stock_mg']:,.0f} Mg")
        print(f"   CO2e:         {d['co2e_mg']:,.0f} Mg")
        print(f"   Trend:        {trend:+.4f} Mg/ha/yr")

        # 2. LCRI shortlist for district
        parcels = generate_mock_parcels(district, count=50)
        ranked  = calculate_lcri(parcels)

        # Save LCRI shortlist per district to cache
        shortlist_path = os.path.join(
            CACHE_DIR, f"lcri_shortlist_{district.lower().replace(' ', '_')}.json"
        )
        ranked.head(10).to_json(shortlist_path, orient="records", indent=2)
        print(f"   LCRI top-10 saved → {shortlist_path}")

    print("\n✅ Cache build complete. All baseline sites pre-computed.")


if __name__ == "__main__":
    os.makedirs(CACHE_DIR, exist_ok=True)
    main()
