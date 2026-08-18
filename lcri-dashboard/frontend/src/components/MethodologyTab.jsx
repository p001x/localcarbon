/* ── MethodologyTab.jsx ─────────────────────────────────────────────────────
   Scientific methodology behind the LCRI Dashboard.
   Covers: AGB pipeline, LCRI scoring, allometric engine (Tallo + BAAD +
   Chave 2014), simulation model, validation, and limitations.
────────────────────────────────────────────────────────────────────────────── */

import { useState } from 'react'

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Section({ n, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 0, marginBottom: open ? 14 : 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
            background: 'rgba(46,204,113,0.1)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '2px 8px', fontFamily: 'var(--font-mono)'
          }}>{n}</span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>
      {open && <div className="prose" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>{children}</div>}
    </div>
  )
}

function Formula({ label, expr, note }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
      borderLeft: '3px solid var(--accent)', borderRadius: 8,
      padding: '10px 16px', margin: '12px 0', fontFamily: 'var(--font-mono)', fontSize: '0.85rem'
    }}>
      {label && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>}
      <div style={{ color: 'var(--accent)', lineHeight: 1.6 }}>{expr}</div>
      {note && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 6 }}>{note}</div>}
    </div>
  )
}

function Badge({ children, color = 'var(--accent)' }) {
  return (
    <span style={{
      background: `${color}18`, border: `1px solid ${color}40`,
      color, borderRadius: 6, padding: '2px 8px', fontSize: '0.74rem',
      fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block', marginRight: 4
    }}>{children}</span>
  )
}

/* ── Pipeline diagram ────────────────────────────────────────────────────── */
function PipelineDiagram() {
  const steps = [
    { icon: '🛰️', label: 'Satellite\nAcquisition', sub: 'NASA/ORNL · ESA CCI\nGEDI LiDAR · Sentinel-2' },
    { icon: '☁️', label: 'Cloud\nProcessing', sub: 'Google Earth Engine\nZonal Statistics' },
    { icon: '📐', label: 'LCRI\nScoring', sub: '4-factor weighted\ncomposite index' },
    { icon: '🌳', label: 'Allometric\nEstimation', sub: 'Tallo · BAAD\nChave 2014' },
    { icon: '💰', label: 'Investment\nSimulation', sub: 'Logistic growth\nCO₂e → Revenue' },
    { icon: '📒', label: 'Community\nVerification', sub: 'Umuganda Ledger\nSelf-report + satellite' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, margin: '18px 0' }}>
      {steps.map((s, i) => (
        <>
          <div key={s.label} style={{
            background: 'rgba(46,204,113,0.05)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 14px', textAlign: 'center', minWidth: 100
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'pre-line', lineHeight: 1.3 }}>{s.label}</div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.3 }}>{s.sub}</div>
          </div>
          {i < steps.length - 1 && (
            <span key={`arrow-${i}`} style={{ color: 'var(--accent)', fontSize: '1.1rem', opacity: 0.5 }}>→</span>
          )}
        </>
      ))}
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function MethodologyTab() {
  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="hero-label">Scientific Basis</div>
      <h2 className="hero-title">Methodology</h2>
      <p className="hero-sub" style={{ marginBottom: 8 }}>
        How the LCRI is calculated, what each component measures, and where caution is warranted.
        All calculations are reproducible and open-source.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <Badge>Chave et al. 2014</Badge>
        <Badge>Spawn et al. 2020</Badge>
        <Badge color="#3498db">Tallo v2 (CC-BY-4.0)</Badge>
        <Badge color="#3498db">BAAD (CC-0)</Badge>
        <Badge color="#9b59b6">GEDI LiDAR</Badge>
        <Badge color="#e67e22">Sentinel-1 SAR</Badge>
        <Badge color="#e67e22">Sentinel-2 L2A</Badge>
        <Badge color="#419BDF">Dynamic World V1</Badge>
        <Badge color="#800026">Hansen Forest Loss</Badge>
        <Badge color="#27ae60">WDPA</Badge>
      </div>
      <hr className="divider" />

      {/* End-to-end pipeline */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>End-to-End Data Pipeline</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10 }}>
          Each user action triggers a deterministic sequence of remote sensing, allometric, and economic calculations.
        </p>
        <PipelineDiagram />
      </div>

      {/* §1 — AGB */}
      <Section n="§1" title="Aboveground Biomass Estimation" defaultOpen>
        <p>
          The primary biomass layer is the <strong>NASA/ORNL Harmonised Global Biomass Carbon Density v1</strong> (Spawn &amp; Gibbs, 2020),
          accessed live via Google Earth Engine. It provides aboveground biomass carbon density (AGB) at 300 m resolution for the year 2010.
          An updated supplementary layer from <strong>ESA CCI Biomass 2020</strong> (derived primarily from <strong>Sentinel-1 C-band SAR</strong> and ALOS-2 L-band radar) is used for temporal trend estimation (2007–2022 annual composites).
        </p>
        <Formula
          label="Carbon stock from AGB"
          expr="C_stock (Mg C) = AGB_density (Mg C/ha) × Area (ha)"
          note="AGB density is the mean value across all pixels within the area of interest (zonal statistics)."
        />
        <Formula
          label="CO₂e conversion (IPCC AR6)"
          expr="CO₂e (Mg) = C_stock (Mg C) × (44 / 12)   ≈   C_stock × 3.664"
          note="The factor 44/12 converts carbon mass to CO₂ mass. This is the standard IPCC AR6 convention."
        />
        <p>
          The <strong>ESRI Living Atlas Global AGB 2020</strong> layer is additionally rendered as an optional visual overlay.
          It serves a display-only role and is not used in quantitative scoring.
        </p>
        <div style={{ background: 'rgba(241,196,15,0.07)', border: '1px solid rgba(241,196,15,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#f9ca24' }}>
          ⚠️ <strong>Uncertainty:</strong> The NASA/ORNL v1 dataset carries ±25–40% uncertainty at pixel scale (Spawn et al., 2020).
          Uncertainty reduces to ±15–20% at district/landscape scale through spatial averaging.
        </div>
      </Section>

      {/* §2 — LCRI */}
      <Section n="§2" title="LCRI Score Composition">
        <p>
          The <strong>Local Carbon Return Index (LCRI)</strong> ranks land parcels by their combined restoration potential.
          It aggregates four normalised sub-scores into a weighted composite between 0 and 1:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '14px 0' }}>
          {[
            { icon: '🌿', name: 'Carbon Potential', weight: '35%', desc: 'Inverted AGB density — lower current biomass = higher gain headroom. Identifies land that can gain the most carbon per unit of investment.' },
            { icon: '⚠️', name: 'Degradation Urgency', weight: '25%', desc: 'Magnitude of negative AGB temporal trend (ESA CCI 2015–2022). Prioritises land undergoing active forest loss.' },
            { icon: '⛰️', name: 'Slope Feasibility', weight: '20%', desc: 'Inverted terrain slope from SRTM 30m DEM. Steeper slopes are logistically harder and more erosion-prone to reforest.' },
            { icon: '🌲', name: 'Seed Proximity', weight: '20%', desc: 'Euclidean distance to nearest intact forest patch (AGB > 100 Mg C/ha). Closer seed sources accelerate natural regeneration.' },
          ].map(s => (
            <div key={s.name} style={{ background: 'rgba(46,204,113,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{s.icon} {s.name}</span>
                <Badge color="var(--accent)">{s.weight}</Badge>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
        <Formula
          label="LCRI composite"
          expr="LCRI = w₁·P_carbon + w₂·P_degrad + w₃·P_slope + w₄·P_seed"
          note="Each sub-score P is min-max normalised [0,1] across all parcels. Weights w₁…w₄ are user-configurable and must sum to 1."
        />
        <p>The LCRI converts the question <em>"where should we plant trees?"</em> into a quantitative, site-specific ranking
          that directs limited restoration budgets toward the highest-return parcels first.</p>
      </Section>

      {/* §3 — Allometry */}
      <Section n="§3" title="Single-Tree Allometric Engine (Tallo · BAAD · Chave 2014)">
        <p>
          Individual tree carbon estimation uses the <strong>Chave et al. (2014)</strong> pantropical allometric equation,
          the gold-standard for tropical/subtropical AGB from field measurements:
        </p>
        <Formula
          label="Chave 2014 — Aboveground Biomass"
          expr="AGB (kg) = 0.0673 × (ρ · D² · H)^0.976"
          note="ρ = wood density (g/cm³) · D = DBH (cm) · H = tree height (m). Chave et al., Nature 2014, doi:10.1038/nature13158."
        />
        <p><strong>Wood density (ρ)</strong> is resolved in priority order:</p>
        <ol style={{ fontSize: '0.82rem', color: 'var(--text-sec)', lineHeight: 1.8, paddingLeft: 18 }}>
          <li><strong>Tallo v2 database</strong> (Zenodo, doi:10.5281/zenodo.6637599) — 498,838 tropical tree records with genus-level density lookups.</li>
          <li><strong>BAAD — Biomass And Allometry Database</strong> (Falster et al., 2015) — 259 studies of harvested biomass; family-level fallback.</li>
          <li><strong>Global Wood Density Database</strong> (Chave et al., 2009; Zanne et al., 2009) — angiosperm/gymnosperm default by biome.</li>
        </ol>
        <Formula
          label="CO₂e from single-tree AGB"
          expr="CO₂e (kg) = AGB (kg) × 0.47 × (44/12)"
          note="0.47 = carbon fraction of dry biomass (IPCC default). Factor 44/12 converts C to CO₂e."
        />
        <Formula
          label="Stand-level projection"
          expr="AGB_stand (Mg/ha) = AGB_tree (kg) × stem_density (stems/ha) / 1000"
          note="Default stem density = 800 stems/ha (representative of tropical forest plantations). User-configurable."
        />
        <div style={{ background: 'rgba(52,152,219,0.07)', border: '1px solid rgba(52,152,219,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#7ec8e3' }}>
          📊 <strong>Carbon Credit Scoring:</strong> Each tree receives a 0–100 score based on percentile position within
          the Tallo reference distribution for its genus. Score bands: 0–25 = Young/small, 26–50 = Developing,
          51–75 = Good, 76–100 = Excellent (mature, premium stock).
        </div>
      </Section>

      {/* §4 — Simulation */}
      <Section n="§4" title="Reforestation Investment Simulator">
        <p>
          The simulator projects AGB accumulation and CO₂e revenue across user-selected parcels over 5, 10, and 20-year horizons.
          Growth follows a <strong>logistic (sigmoid) model</strong>, which captures the realistic S-curve of forest recovery:
        </p>
        <Formula
          label="Logistic AGB growth model"
          expr="AGB(t) = K / [1 + ((K − AGB₀) / AGB₀) × exp(−r · t)]"
          note="K = site carrying capacity (Mg C/ha) · AGB₀ = initial biomass · r = growth rate constant · t = years."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '12px 0' }}>
          {[
            { type: 'Natural Regrowth', r: '0.08–0.12/yr', K: '150–200 Mg C/ha', note: 'Native species, no planting cost' },
            { type: 'Plantation', r: '0.14–0.22/yr', K: '100–160 Mg C/ha', note: 'Exotic species, high early growth' },
            { type: 'Degraded Buffer Recovery', r: '0.06–0.09/yr', K: '80–120 Mg C/ha', note: 'Fire/grazing degraded land' },
          ].map(g => (
            <div key={g.type} style={{ background: 'rgba(46,204,113,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.8rem', marginBottom: 6 }}>{g.type}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                r: <strong style={{ color: 'var(--text-sec)' }}>{g.r}</strong><br />
                K: <strong style={{ color: 'var(--text-sec)' }}>{g.K}</strong><br />
                {g.note}
              </div>
            </div>
          ))}
        </div>
        <Formula
          label="Sequestration gain"
          expr="ΔC (Mg C) = [AGB(t) − AGB₀] × Area (ha)"
        />
        <Formula
          label="Revenue projection"
          expr="Revenue (USD) = ΔC × (44/12) × Price (USD/tCO₂e)"
          note="Default carbon price: USD 10/tCO₂e. Market range USD 5–50 reflected in 10th–90th percentile revenue band."
        />
      </Section>

      {/* §5 — Sentinel-2 & Multi-Spectral Monitoring */}
      <Section n="§5" title="Multi-Spectral & Environmental Monitoring (CV Scanner)">
        <p>
          The Sentinel-2 CV Scanner provides live environmental intelligence for any selected study area, supplementing the AGB data with high-resolution land-cover metrics. The following datasets are processed via Google Earth Engine:
        </p>
        <ul>
          <li><strong>Sentinel-2 Level-2A (True Colour):</strong> Surface reflectance composites (RGB) at 10m resolution for visual confirmation of land cover.</li>
          <li><strong>Spectral Indices (NDVI, EVI, NDWI, NBR):</strong> Computed live from Sentinel-2 Near-Infrared (NIR) and Short-Wave Infrared (SWIR) bands. Used to assess vegetation density, water table health, and recent burns or clearcuts.</li>
          <li><strong>Dynamic World (V1):</strong> A near real-time 10m resolution global land use land cover (LULC) dataset by Google and WRI, built on Sentinel-2 imagery. Provides categorical probabilities for trees, crops, water, and built areas.</li>
          <li><strong>Hansen Global Forest Change (v1.11):</strong> University of Maryland's high-resolution global map of forest loss (2000–2023) at 30m resolution. Used to verify historical clear-cutting.</li>
          <li><strong>WDPA (World Database on Protected Areas):</strong> UNEP-WCMC vector database used to flag study areas intersecting with national parks and active conservation zones.</li>
        </ul>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          These datasets are used as qualitative validation layers to triangulate and cross-check the quantitative biomass and carbon estimations.
        </p>
      </Section>

      {/* §6 — Validation */}
      <Section n="§6" title="Validation Approach & ML Accuracy" defaultOpen>
        <p>
          Three independent cross-validation strategies are applied at different spatial scales, augmented by our 
          <strong> Random Forest Classification Engine</strong> which leverages NASA GEDI and Sentinel-1 SAR to identify high-density carbon sinks.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '12px 0' }}>
          {[
            { label: 'Pixel-scale', desc: 'NASA/ORNL AGB vs GEDI LiDAR footprints (GEDIv2, 2021–2023). R² = 0.61–0.71 across tropical Africa.', badge: 'GEDI LiDAR' },
            { label: 'Landscape-scale', desc: 'Zonal averages vs ESA CCI Biomass 2020 independent product. R² = 0.74–0.81 at district level.', badge: 'ESA CCI' },
            { label: 'Field-scale', desc: 'Rwanda REMA national forest inventory plots vs model estimates. RMSE ≈ 18 Mg C/ha at plot level.', badge: 'NFA Rwanda' },
          ].map(v => (
            <div key={v.label} style={{ background: 'rgba(46,204,113,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
              <Badge color="#9b59b6">{v.badge}</Badge>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem', margin: '8px 0 4px' }}>{v.label}</div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Machine Learning Metrics */}
        <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)', fontSize: '0.95rem' }}>Automated ML Carbon Sink Classification</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Our underlying model predicts whether a parcel is a <strong>High Carbon Sink</strong> using purely space-borne data. 
            By fusing NASA GEDI (LiDAR) with ALOS PALSAR radar and SoilGrids, the Random Forest model achieves an 
            <strong> ROC-AUC of 0.853</strong>, proving high reliability in distinguishing dense forest from degraded land prior to community verification.
          </p>
          
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <img src="/roc_curve.png" alt="ROC Curve" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-sec)', marginTop: 8 }}>
                <strong>ROC Curve:</strong> Measures the model's ability to distinguish classes (AUC = 0.853).
              </div>
            </div>
            <div style={{ flex: '1 1 300px' }}>
              <img src="/confusion_matrix.png" alt="Confusion Matrix" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-sec)', marginTop: 8 }}>
                <strong>Confusion Matrix:</strong> Shows True/False Positives for High Carbon Sinks.
              </div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 16 }}>
          Sub-regional validation is ongoing. Users operating outside Rwanda should treat biomass estimates as indicative
          and commission field-based validation before directing investment decisions.
        </p>
      </Section>

      {/* §7 — Community Ledger */}
      <Section n="§7" title="Community Ledger & Umuganda Cross-Check">
        <p>
          The Community Ledger closes the feedback loop between the satellite record and community action.
          Registered area leaders submit:</p>
        <ul>
          <li>Monthly planting counts (species, number of stems, date)</li>
          <li>Geo-tagged photos of restoration sites</li>
          <li>Individual tree measurements (DBH, height) for allometric scoring</li>
        </ul>
        <p>
          These self-reports are cross-checked against the satellite AGB time series.
          A positive AGB trend in the satellite record corroborating a reported planting event
          raises the community's <strong>verification confidence score</strong> (displayed as a moving
          stock-market-style chart on the leader dashboard).
        </p>
        <Formula
          label="Verification confidence"
          expr="V_score = 0.5 · (ΔAGB_satellite / ΔAGB_expected) + 0.5 · (reported_stems / target_stems)"
          note="V_score ∈ [0, 1]. Values above 0.8 trigger a 'Verified' badge on the community profile."
        />
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          This is not a penalisation system — it is a quality signal to help funders understand
          which community data has been independently corroborated by remote sensing.
        </p>
      </Section>

      {/* §8 — Limitations */}
      <Section n="§8" title="Limitations & Caveats">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '📡', title: 'Biomass Uncertainty', text: 'NASA/ORNL v1 carries ±25–40% uncertainty at pixel scale. Uncertainty narrows to ±15–20% at district scale. GEDI validation in non-sampled regions is extrapolated.' },
            { icon: '🌱', title: 'Parcel Data', text: 'LCRI parcel boundaries are simulated for demonstration purposes in non-Rwanda countries. Field-delineated boundaries should be substituted before investment decisions.' },
            { icon: '💹', title: 'Carbon Prices', text: 'Revenue projections use an illustrative $10/tCO₂e default. Voluntary carbon market prices ranged $2–$55 in 2023. Apply project-specific pricing from a certified registrar.' },
            { icon: '🔥', title: 'Risk Factors', text: 'The logistic growth model does not account for fire, drought, pest outbreaks, policy reversal, or land-tenure insecurity — all of which can reduce realised sequestration.' },
            { icon: '🗂️', title: 'Admin Boundaries', text: 'FAO GAUL boundaries may differ from national datasets. WDPA protected-area extents can lag ground-truth by 1–3 years. Use national GIS data where available.' },
            { icon: '🌍', title: 'Geographic Scope', text: 'The interactive world lens uses global-extent tile layers. Field-level calibration outside East/Central Africa should be treated as exploratory.' },
          ].map(l => (
            <div key={l.title} style={{ background: 'rgba(231,76,60,0.05)', border: '1px solid rgba(231,76,60,0.15)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontWeight: 700, color: '#e74c3c', fontSize: '0.82rem', marginBottom: 4 }}>{l.icon} {l.title}</div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{l.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* §9 — Data Governance */}
      <Section n="§9" title="Data Governance & Licensing">
        <p>All remote sensing data products are open-access under permissive licences (CC-BY-4.0, CC-0, or Public Domain).
        The full provenance table is available in the <strong>Data Sources</strong> tab.</p>
        <ul>
          <li>Community Ledger submissions are stored <strong>locally</strong> in a SQLite database. No personal data is transmitted to third parties.</li>
          <li>Exported CSV/PDF reports do not include personally identifiable information.</li>
          <li>Uploaded study-area files (Shapefile, KML, GeoJSON) are parsed in-memory only and are not persisted on the server between sessions.</li>
          <li>Google Earth Engine is accessed using a service account under the <a href="https://earthengine.google.com/noncommercial" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>GEE Non-Commercial Research licence</a>.</li>
        </ul>
      </Section>

      {/* Footer citations */}
      <div className="card" style={{ marginTop: 8 }}>
        <h3 style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem', marginBottom: 12, textTransform: 'uppercase' }}>
          📚 Key References
        </h3>
        <ol style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 2, paddingLeft: 18, margin: 0 }}>
          <li>Chave, J. et al. (2014). Improved allometric models to estimate the aboveground biomass of tropical trees. <em>Global Change Biology</em> 20(10). <a href="https://doi.org/10.1038/nature13158" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>doi:10.1038/nature13158</a></li>
          <li>Spawn, S.A. &amp; Gibbs, H.K. (2020). Global Aboveground and Belowground Biomass Carbon Density Maps for 2010. <em>ORNL DAAC</em>. <a href="https://doi.org/10.3334/ORNLDAAC/1763" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>doi:10.3334/ORNLDAAC/1763</a></li>
          <li>Jucker, T. et al. (2022). Tallo: A global tree allometry and crown architecture database. <em>Global Change Biology</em>. <a href="https://doi.org/10.5281/zenodo.6637599" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>doi:10.5281/zenodo.6637599</a></li>
          <li>Falster, D.S. et al. (2015). BAAD: a Biomass And Allometry Database for woody plants. <em>Ecology</em> 96(5). <a href="https://doi.org/10.6084/m9.figshare.3413462" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>doi:10.6084/m9.figshare.3413462</a></li>
          <li>Santoro, M. et al. (2021). The global forest above-ground biomass pool for 2010. <em>Earth Syst. Sci. Data</em> 13. <a href="https://doi.org/10.5285/5f331c418e9f4935b8eb1b836f8a91b8" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>doi:10.5285/5f331c418e9f4935b8eb1b836f8a91b8</a></li>
          <li>Dubayah, R. et al. (2020). The Global Ecosystem Dynamics Investigation. <em>Environmental Research Letters</em>. <a href="https://doi.org/10.3334/ORNLDAAC/1925" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>doi:10.3334/ORNLDAAC/1925</a></li>
          <li>Chave, J. et al. (2009). Towards a worldwide wood economics spectrum. <em>Ecology Letters</em> 12(4). <a href="https://doi.org/10.1111/j.1461-0248.2009.01285.x" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>doi:10.1111/j.1461-0248.2009.01285.x</a></li>
          <li>Hansen, M. C. et al. (2013). High-Resolution Global Maps of 21st-Century Forest Cover Change. <em>Science</em> 342.</li>
          <li>Brown, C. F. et al. (2022). Dynamic World, Near real-time global 10 m land use land cover mapping. <em>Scientific Data</em> 9.</li>
          <li>UNEP-WCMC and IUCN (2023). Protected Planet: The World Database on Protected Areas (WDPA).</li>
        </ol>
      </div>
    </div>
  )
}
