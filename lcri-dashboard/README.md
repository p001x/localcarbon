# Local Carbon Return Index (LCRI) Dashboard

> **RCMRD Arts & Maps Competition 2026 — Professional Category, Data Dashboard, Forestry Sub-Category**

A reforestation investment simulator and community planting ledger for Rwanda, built with Streamlit, Folium, GeoPandas, and the ESRI Living Atlas biomass image service.

---

## Features

| Tab | What it does |
|-----|-------------|
| 📍 Dashboard & Map | Interactive folium map with protected areas overlay; draw, upload, or select a district to compute carbon KPIs |
| 📊 LCRI Ranking | Per-district LCRI scoring with live weight sliders and downloadable ranked CSV |
| 🌱 Reforestation Simulator | Logistic growth projections at year 5/10/20 vs. BAU loss; CO2e revenue range |
| 👥 Community Ledger | Umuganda site submission form, sector filter, CSV + GeoJSON export |
| 📖 Methodology | Validation approach, LCRI sanity checks, stated limitations |
| 🗂️ Data Sources | Full provenance table satisfying the 2-approved-dataset competition rule |

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. (Optional) Pre-build zonal stats cache for judging day
C:\Users\user\miniconda3\python.exe scripts\build_cache.py

# 3. Run the app
streamlit run app.py
```

Open http://localhost:8501 in your browser.

---

## Secrets (API Keys)

Copy `.streamlit/secrets.toml.template` → `.streamlit/secrets.toml` and fill in:

- `esri.api_key` — from https://developers.arcgis.com/dashboard/
- `earthengine.*` — from your `ee-petersonyang87-52f0e0a9ad78.json` service account (supplementary layers only)

**Never commit `secrets.toml` to git** — it is listed in `.gitignore`.

For Streamlit Community Cloud: paste the keys into the app's **Secrets** manager in the web UI.

---

## Data Sources

| Dataset | Portal | Role |
|---------|--------|------|
| Global Above Ground Biomass (ESA CCI 2007-2022) | ESRI Living Atlas | **Primary** — satisfies approved-dataset rule |
| Protected Areas (GAUL/BIOPAMA) | Africa Knowledge Platform | **Second approved dataset** |
| Sentinel-2 NDVI / GEDI footprints | Google Earth Engine *(supplementary only)* | Calibration only — NOT cited to satisfy dataset rule |

---

## Reliability Plan (Judging Day)

1. **Pre-cached results**: Run `scripts/build_cache.py` the night before to warm all 5 baseline-site zonal-stats + LCRI caches. The app reads from `data/cache/` first; live ESRI calls are only triggered for custom/drawn/uploaded geometries.
2. **Offline fallback**: If the ESRI service is unreachable, cached KPIs still display for all baseline sites.
3. **No client-side credentials**: All API calls are server-side using `st.secrets`; no key is ever exposed in the browser.

---

## 90-Second Walkthrough Video

> Record a fallback demo before the judging session in case of connectivity issues.
>
> **Suggested script (≤ 90 s):**
> 1. Open the app. Show the Rwanda map with protected areas.
> 2. Select "Gishwati-Mukura Buffer Zone" from the dropdown → KPI cards update.
> 3. Switch to LCRI Ranking tab → adjust Degradation Urgency slider → table re-sorts.
> 4. Switch to Reforestation Simulator → set 500 ha target → Run → show CO2e vs BAU chart.
> 5. Switch to Community Ledger → submit a test polygon.
> 6. Switch to Methodology tab → point to limitations section.
>
> Recommended tool: OBS Studio (free) or Windows + G (Xbox Game Bar).

---

## Repo Structure

```
lcri-dashboard/
  app.py                        # Streamlit entry point (all 6 tabs)
  config.py                     # Constants: CRS, carbon factors, weights, districts
  requirements.txt              # Pinned dependencies
  scripts/
    build_cache.py              # Pre-warms zonal stats + LCRI caches
  data/
    baseline_sites.geojson      # 5 Rwanda study sites
    provenance.csv              # Dataset citations
    community_ledger.geojson    # Umuganda submissions (append-only)
    cache/                      # Cached zonal stats per site/year
  src/
    data_sources.py             # ESRI Living Atlas + protected areas fetchers
    zonal_stats.py              # Server-side zonal statistics + caching
    carbon.py                   # AGB → carbon → CO2e conversions
    lcri.py                     # LCRI scoring and normalization
    simulator.py                # Reforestation Investment Simulator
    change_detection.py         # Year-over-year differencing + trend
    ledger.py                   # Community submission read/write/validate
    ui_components.py            # Reusable Streamlit components
  tests/
    test_carbon.py              # 6 passing tests
    test_lcri.py                # 5 passing tests
```

---

## Formula Reference

```
Carbon Stock (Mg)   = AGB (Mg) × 0.47         # IPCC default
CO2e (Mg)           = Carbon Stock × 3.67      # 44/12 ratio
Sequestration rate  = ΔCO2e / Δyears

LCRI (0–100) = 0.35 × CarbonPotential
             + 0.25 × DegradationUrgency
             + 0.20 × SlopeFeasibility
             + 0.20 × SeedProximity
```

All sub-factors are **min-max normalized within the selected district** before weighting.
