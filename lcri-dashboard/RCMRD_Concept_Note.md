# Local Carbon Return Index (LCRI) – Environmental Intelligence
**Author:** Pierre Ndorimana
**Competition Theme:** Acting Locally for Global Impact
**Submission:** RCMRD Arts & Maps Competition 2026
**Contact:** pierrendorimana16@gmail.com | +250 798 790 115

---

## 1. Executive Summary
The Local Carbon Return Index (LCRI) is a high-performance environmental intelligence platform designed to bridge the gap between orbital Earth Observation data and grassroots conservation finance. Aligning directly with the RCMRD 2026 theme *"Acting Locally for Global Impact,"* the LCRI platform uses Rwanda as a primary ground-truth focal point while maintaining a scalable, global architecture. 

By triangulating satellite data to identify degraded lands and simulate 20-year carbon return yields, the platform enables local communities to receive direct, verified green bonds for localized ecosystem restoration.

*(Please insert a screenshot below of your Home Page showing the 3D Satellite and "How LCRI Works" diagram to hook the judges immediately.)*

> **[🖼️ PLACEHOLDER: INSERT HOME PAGE SCREENSHOT HERE]**

---

## 2. Acting Locally for Global Impact (Theme Alignment)
While climate change is a global crisis, carbon sequestration physically occurs at the local level. The LCRI platform visualizes this by offering a dual-lens experience:
1. **The Global Lens:** A high-performance interactive story map that allows users to explore global biomass approximations and understand the planetary scale of the carbon crisis.
2. **The Local Reality (Rwanda National Focus):** The platform drills down into local Rwandan districts (e.g., Gicumbi, Bugesera), providing hyper-local satellite telemetry and individual parcel triage. This proves that planetary targets can only be achieved by empowering local actors.

> **[🖼️ PLACEHOLDER: INSERT STORY MAP SCREENSHOT HERE]**
*(Insert a screenshot of the glowing interactive global map to demonstrate the 'Global Impact' aspect of the theme).*

---

## 3. Open Earth Observation Data Integration
The LCRI dashboard is built upon the ingestion and synthesis of three primary open-access Earth Observation datasets, adhering to RCMRD's strict open-data requirements:

1. **Copernicus Sentinel-2 L2A:** Utilized for high-resolution (10m) multi-spectral tracking of forest boundaries, unauthorized clearcutting, and real-time Normalized Difference Vegetation Index (NDVI) baseline assessments.
2. **ESA CCI Biomass (v7):** Leveraged as the primary orbital dataset for Above-Ground Biomass (AGB) density baselines, allowing the AI to establish the current carbon stock (tCO₂e/ha) of any selected parcel.
3. **NASA GEDI LiDAR:** Used in conjunction with ESA CCI for structural canopy height verification and topography modeling, vital for calculating erosion risk on steep Rwandan terrain.

---

## 4. Core Methodology & The LCRI Engine
The core of the platform is the **LCRI Score**, a multi-criteria ecological triage algorithm. The dashboard calculates this score based on:
*   **Canopy Loss & Erosion Risk:** Prioritizing steep slopes that have suffered recent deforestation.
*   **Seed Proximity:** Factoring in the distance to primary forests (e.g., Nyungwe or Gishwati-Mukura National Parks) to calculate natural regeneration potential.

> **[🖼️ PLACEHOLDER: INSERT SATELLITE DASHBOARD SCREENSHOT HERE]**
*(Insert a screenshot of the Satellite Dashboard zoomed into a Rwandan district, showing the data overlays).*

### 4.1 The Restoration Simulator
Once a parcel is identified, the platform utilizes the **Restoration Simulator**. By applying established allometric equations (Chave et al., 2014) combined with a logistic growth model, the AI forecasts the 20-year Above-Ground Biomass yield. This translates raw ecological growth into a financial metric (Premium Carbon Price/ton), factoring in biodiversity and gender-equity premiums to incentivize local farmers.

> **[🖼️ PLACEHOLDER: INSERT RESTORATION SIMULATOR SCREENSHOT HERE]**
*(Insert a screenshot of the Simulator chart showing the 20-year carbon growth curve).*

---

## 5. Platform Architecture & Innovation
To ensure accessibility even in low-bandwidth regions, the application was engineered using a decoupled modern stack:
*   **Frontend (React/Vite):** A high-performance, hardware-accelerated user interface running at 60FPS. To eliminate network latency when exploring global biomass data, the application uses local Gaussian approximation models on the client side, allowing for instantaneous exploration before querying the backend for deep regional analytics.
*   **Backend (Python/Flask):** A robust server architecture that handles data routing, community ledger submissions, and the complex allometric math required for simulation.

---

## 6. Grassroots Validation (The Community Ledger)
Remote sensing is only as good as its ground truth. The LCRI platform includes a **Community Ledger**, allowing local farmers and conservationists to submit geo-tagged field reports with per-tree allometric measurements. This provides an independent cross-check against orbital Sentinel-2 data, ensuring carbon credits are issued with absolute integrity.

> **[🖼️ PLACEHOLDER: INSERT COMMUNITY LEDGER SCREENSHOT HERE]**
*(Insert a screenshot of the Community Ledger or Green Gicumbi Audit page).*

---

## 7. Conclusion
The Local Carbon Return Index proves that open-source Earth Observation data can be directly tied to grassroots financial empowerment. By leveraging ESA, NASA, and Copernicus data to guide local action in Rwanda, LCRI acts as a scalable blueprint for the entire African continent.
