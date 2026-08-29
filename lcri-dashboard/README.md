# Local Carbon Return Index (LCRI) Dashboard

> **Theme: "Acting Locally for Global Impact"**
> RCMRD Arts & Maps Competition 2026 — Professional Category, Data Dashboard, Forestry Sub-Category

A hybrid reforestation investment simulator (National scale) and community planting ledger (Green Gicumbi Pilot) for Rwanda, built with a modern stack: **React (Vite), Flask, Leaflet, GeoPandas, and Google Earth Engine**.

---

## Features

| Tab | What it does |
|-----|-------------|
| 📍 Dashboard & Map | Interactive Leaflet map with protected areas overlay; draw, upload, or select a district to compute carbon KPIs |
| 📊 LCRI Ranking | Per-district LCRI scoring with live weight sliders and downloadable ranked CSV |
| 🌱 Reforestation Simulator | Logistic growth projections at year 5/10/20 vs. BAU loss; CO2e revenue range |
| 👥 Community Ledger | Umuganda site submission form, sector filter, CSV + GeoJSON export |
| 📖 Methodology | Validation approach, LCRI sanity checks, stated limitations |
| 🗂️ Data Sources | Full provenance table satisfying the 2-approved-dataset competition rule |

---

## Quick Start

```bash
# 1. Install dependencies for the Python backend
pip install -r requirements.txt

# 2. Run the Flask API Server (defaults to port 5001)
python server.py

# 3. Open a new terminal and start the React Frontend
cd frontend
npm install
npm run dev
```

The application will open at `http://localhost:5173` (Frontend) and `http://localhost:5001` (Backend API).

---

## Secrets (API Keys)

The backend connects to Google Earth Engine using a Service Account. 
To run locally, ensure you have your Earth Engine service account JSON file (e.g. `ee-petersonyang87-52f0e0a9ad78.json`) in the project root directory.

When deploying to a live server (like Render or Heroku), store the exact JSON text in an environment variable named:
`GEE_SERVICE_ACCOUNT_JSON`

---

## Data Sources

| Dataset | Portal | Role |
|---------|--------|------|
| Global Above Ground Biomass (NASA ORNL) | Google Earth Engine | **Primary** — satisfies approved-dataset rule |
| Protected Areas (WDPA) | Africa Knowledge Platform / WDPA | **Second approved dataset** |
| Sentinel-2 True Color Imagery | Google Earth Engine | Visual Context only |

---

## Reliability Plan (Judging Day)

1. **Pre-cached results**: Run `python scripts/precompute_all.py` the night before your presentation. This will query every district and cache the Zonal Stats and Machine Learning predictions locally into `data/cache/`.
2. **Instant Loading**: When presenting, selecting any pre-computed district will load in under a second.
3. **Offline Fallback**: If Earth Engine is unavailable (e.g. Service Account pending or internet goes down), the dashboard seamlessly fails over to Mock Data mode, preventing crashes and allowing the presentation to continue seamlessly.

---

## 90-Second Walkthrough Video

> Record a fallback demo before the judging session in case of connectivity issues.
>
> **Suggested script (≤ 90 s):**
> 1. Open the app. Show the Rwanda map with protected areas.
> 2. Select "Gicumbi" from the dropdown → KPI cards update instantly (thanks to the cache!).
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
  server.py                     # Flask API backend entry point
  config.py                     # Constants: CRS, carbon factors, weights, districts
  requirements.txt              # Pinned Python dependencies
  frontend/                     # React + Vite application
    src/
      components/               # UI Tabs (Dashboard, Ledger, Rankings, etc.)
  scripts/
    precompute_all.py           # Pre-warms zonal stats + ML caches for all districts
  data/
    provenance.csv              # Dataset citations
    community_ledger.geojson    # Umuganda submissions (append-only)
    cache/                      # Cached GeoJSON and Zonal Stats per district
  src/
    data_sources.py             # Google Earth Engine initialization and fetching
    zonal_stats.py              # Server-side zonal statistics + caching
    carbon.py                   # AGB → carbon → CO2e conversions
    lcri.py                     # LCRI scoring and normalization
    simulator.py                # Reforestation Investment Simulator
    ledger.py                   # Community submission read/write/validate
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
