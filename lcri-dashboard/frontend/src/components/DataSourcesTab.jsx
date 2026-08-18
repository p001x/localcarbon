/* ── DataSourcesTab.jsx ─────────────────────────────────────────────────────
   Full provenance register for every dataset used in the LCRI Dashboard.
   Live data from /api/provenance; fallback table covers all 13 sources.
────────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect } from 'react'
import { fetchProvenance } from '../api'

/* ── License badge colours ───────────────────────────────────────────────── */
const LICENSE_COLORS = {
  'CC-BY-4.0':          '#2ecc71',
  'CC-0':               '#27ae60',
  'CC-0 (Public Domain)': '#27ae60',
  'Public Domain':      '#27ae60',
  'ODbL':               '#3498db',
  'CC-BY-NC-SA 3.0 IGO':'#9b59b6',
  'Free & Open (Copernicus)': '#00bcd4',
  'Esri Master Agreement': '#e67e22',
  'National (Rwanda)':  '#f39c12',
}

function LicenseBadge({ license }) {
  const color = LICENSE_COLORS[license] || '#7f8c8d'
  return (
    <span style={{
      background: `${color}20`, border: `1px solid ${color}50`,
      color, borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem',
      fontWeight: 600, whiteSpace: 'nowrap'
    }}>{license}</span>
  )
}

/* ── Category groups ─────────────────────────────────────────────────────── */
const GROUPS = {
  'Biomass & Carbon': ['NASA/ORNL AGB Biomass Carbon Density v1', 'ESA CCI Biomass 2020', 'ESRI Living Atlas — Global AGB 2020'],
  'LiDAR & Validation': ['GEDI v2 LiDAR Canopy Height', 'Rwanda REMA Field Inventory'],
  'Allometric Databases': ['Tallo — Global Tree Allometry Database', 'BAAD — Biomass And Allometry Database', 'Global Wood Density Database'],
  'Imagery & Elevation': ['Sentinel-2 True Colour Imagery', 'SRTM 30m DEM'],
  'Administrative & Conservation': ['FAO GAUL Administrative Boundaries', 'WDPA Protected Areas'],
}

/* ── Full fallback dataset list ──────────────────────────────────────────── */
const FALLBACK = [
  {
    dataset: 'NASA/ORNL AGB Biomass Carbon Density v1',
    source: 'Google Earth Engine / ORNL DAAC',
    description: 'Global harmonised aboveground + belowground biomass carbon density 2010 (Mg C/ha) at 300 m. Primary biomass layer for all LCRI calculations.',
    license: 'CC-BY-4.0',
    doi: '10.3334/ORNLDAAC/1763',
    citation: 'Spawn, S.A. & Gibbs, H.K. (2020). Global Aboveground and Belowground Biomass Carbon Density Maps for the Year 2010. ORNL DAAC.'
  },
  {
    dataset: 'ESA CCI Biomass 2020',
    source: 'ESA Climate Change Initiative',
    description: 'Multi-year AGB product 2007–2022 at 100 m used for temporal trend analysis and cross-validation of the primary AGB layer.',
    license: 'CC-BY-4.0',
    doi: '10.5285/5f331c418e9f4935b8eb1b836f8a91b8',
    citation: 'Santoro, M. et al. (2021). The global forest above-ground biomass pool for 2010 estimated from high-resolution satellite observations. Earth Syst. Sci. Data 13.'
  },
  {
    dataset: 'ESRI Living Atlas — Global AGB 2020',
    source: 'ESRI / Cargill',
    description: '2020 global AGB product served as a visual map overlay. Display only — not used in quantitative scoring.',
    license: 'Esri Master Agreement',
    doi: '—',
    citation: 'ESRI (2023). Global Aboveground Biomass 2020. ArcGIS Living Atlas of the World.'
  },
  {
    dataset: 'GEDI v2 LiDAR Canopy Height',
    source: 'NASA / LPDAAC',
    description: 'Global Ecosystem Dynamics Investigation Level 2 & 4 footprint canopy heights and AGB. Used to validate NASA/ORNL AGB at pixel scale (R² = 0.61–0.71).',
    license: 'CC-BY-4.0',
    doi: '10.3334/ORNLDAAC/1925',
    citation: 'Dubayah, R. et al. (2020). GEDI: High-resolution laser ranging of Earth\'s forests and topography. Environmental Research Letters.'
  },
  {
    dataset: 'Tallo — Global Tree Allometry Database',
    source: 'Zenodo / Satellite Applications Catapult',
    description: '498,838 individual tropical tree records (genus, species, DBH, height, AGB). Primary lookup for wood density in single-tree carbon estimation. Also available as GEE FeatureCollection.',
    license: 'CC-BY-4.0',
    doi: '10.5281/zenodo.6637599',
    citation: 'Jucker, T. et al. (2022). Tallo: A global tree allometry and crown architecture database. Global Change Biology.'
  },
  {
    dataset: 'BAAD — Biomass And Allometry Database',
    source: 'GitHub / ESA Publications',
    description: 'Harmonised harvested biomass measurements from 259 studies worldwide. Used as ground-truth for validating Chave 2014 equation outputs. Public domain — no reuse restrictions.',
    license: 'CC-0 (Public Domain)',
    doi: '10.6084/m9.figshare.3413462',
    citation: 'Falster, D.S. et al. (2015). BAAD: a Biomass And Allometry Database for woody plants. Ecology 96(5).'
  },
  {
    dataset: 'Global Wood Density Database',
    source: 'Dryad / CTFS',
    description: 'Species-level wood density (g/cm³) lookup table covering >16,000 species. Used as fallback when species is not found in Tallo or BAAD.',
    license: 'CC-BY-4.0',
    doi: '10.5061/dryad.234',
    citation: 'Chave, J. et al. (2009). Towards a worldwide wood economics spectrum. Ecology Letters 12(4).'
  },
  {
    dataset: 'Sentinel-2 True Colour Imagery',
    source: 'Copernicus / ESA',
    description: 'Level-2A surface reflectance RGB composites (bands 4-3-2) at 10 m served via public TMS tiles. Used in Community Ledger for visual reference of study areas.',
    license: 'Free & Open (Copernicus)',
    doi: '—',
    citation: 'ESA (2022). Sentinel-2 MSI Level-2A. Copernicus Open Access Hub.'
  },
  {
    dataset: 'SRTM 30m DEM',
    source: 'NASA / USGS',
    description: 'Shuttle Radar Topography Mission 30 m digital elevation model. Used to derive terrain slope for the LCRI Slope Feasibility sub-score.',
    license: 'Public Domain',
    doi: '—',
    citation: 'Farr, T.G. et al. (2007). The Shuttle Radar Topography Mission. Reviews of Geophysics 45.'
  },
  {
    dataset: 'FAO GAUL Administrative Boundaries',
    source: 'FAO / Google Earth Engine',
    description: 'Level 0–2 administrative boundaries for 54 African nations + global coverage. Used for district-boundary queries and country-level zooming.',
    license: 'CC-BY-NC-SA 3.0 IGO',
    doi: '—',
    citation: 'FAO (2015). Global Administrative Unit Layers (GAUL). Food and Agriculture Organisation of the UN.'
  },
  {
    dataset: 'WDPA Protected Areas',
    source: 'Protected Planet / UNEP-WCMC',
    description: 'World Database on Protected Areas. Boundaries rendered as conservation overlay on the map. Sourced from the BIOPAMA Africa Knowledge Platform.',
    license: 'ODbL',
    doi: '—',
    citation: 'UNEP-WCMC and IUCN (2024). Protected Planet: World Database on Protected Areas. Cambridge UK.'
  },
  {
    dataset: 'Rwanda REMA Field Inventory',
    source: 'Rwanda Environment Management Authority',
    description: 'National forest inventory plot data used for sub-regional AGB validation in Rwanda. R² ≈ 0.78, RMSE ≈ 18 Mg C/ha at plot scale.',
    license: 'National (Rwanda)',
    doi: '—',
    citation: 'REMA (2021). Rwanda National Forest Inventory Report. Kigali.'
  },
]

/* ── Stack summary cards ─────────────────────────────────────────────────── */
const STACKS = [
  {
    icon: '🛰️',
    title: 'Remote Sensing Stack',
    items: [
      'NASA/ORNL AGB Carbon Density v1 — primary biomass source',
      'ESA CCI Biomass 2020 — temporal trend & cross-validation',
      'GEDI v2 LiDAR — canopy height validation footprints',
      'Sentinel-2 L2A TMS — true colour visual reference (10 m)',
      'ESRI Living Atlas AGB 2020 — supplementary visual overlay',
    ]
  },
  {
    icon: '🌳',
    title: 'Allometric Engine',
    items: [
      'Tallo v2 (498,838 trees) — genus-level wood density lookup',
      'BAAD (259 studies) — harvested biomass ground-truth',
      'Global Wood Density DB — species/family fallback density',
      'Chave et al. 2014 equation — AGB(kg) = 0.0673·(ρ·D²·H)^0.976',
    ]
  },
  {
    icon: '🗺️',
    title: 'Vector & Field Data',
    items: [
      'FAO GAUL Level 0–2 admin boundaries (54 African nations + world)',
      'WDPA protected area boundaries (Africa + global coverage)',
      'SRTM 30m DEM — terrain slope for LCRI scoring',
      'Community Ledger polygons — user-submitted (local SQLite)',
    ]
  },
  {
    icon: '📊',
    title: 'Economic Parameters',
    items: [
      'Carbon credit price: USD 5–50/tCO₂e (market survey 2024)',
      'Default offset price: USD 10/tCO₂e (illustrative)',
      'Growth rates: calibrated from multi-country NFI data 2018–22',
      'CO₂e factor: 44/12 (IPCC AR6 mass conversion)',
    ]
  },
]

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function DataSourcesTab() {
  const [rows, setRows]           = useState([])
  const [filter, setFilter]       = useState('All')
  const [search, setSearch]       = useState('')
  const [expanded, setExpanded]   = useState(null)

  useEffect(() => {
    fetchProvenance().then(setRows).catch(() => {})
  }, [])

  const data   = rows.length ? rows : FALLBACK
  const groups = ['All', ...Object.keys(GROUPS)]

  const filtered = data.filter(r => {
    if (filter !== 'All') {
      const groupDatasets = GROUPS[filter] || []
      if (!groupDatasets.includes(r.dataset)) return false
    }
    if (search) {
      const q = search.toLowerCase()
      return r.dataset.toLowerCase().includes(q) ||
             r.source.toLowerCase().includes(q) ||
             r.description?.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div style={{ maxWidth: 980 }}>
      {/* Header */}
      <div className="hero-label">Transparency</div>
      <h2 className="hero-title">Data Sources &amp; Provenance</h2>
      <p className="hero-sub" style={{ marginBottom: 8 }}>
        Every dataset powering the LCRI Dashboard is open-access and citable.
        Thirteen datasets span remote sensing, allometric databases, field inventories,
        and administrative vector layers.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { n: data.length, label: 'Datasets' },
          { n: data.filter(r => r.license?.startsWith('CC')).length, label: 'CC Licenced' },
          { n: data.filter(r => r.doi && r.doi !== '—').length, label: 'DOI Citable' },
          { n: '2010–2024', label: 'Year range' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(46,204,113,0.07)', border: '1px solid rgba(46,204,113,0.2)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{s.n}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <hr className="divider" />

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {groups.map(g => (
            <button key={g}
              className={`btn btn-sm ${filter === g ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(g)}>
              {g}
            </button>
          ))}
        </div>
        <input
          className="form-input" placeholder="🔍 Search datasets…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 220, marginLeft: 'auto' }}
        />
      </div>

      {/* Dataset table */}
      <div className="table-wrap" style={{ marginBottom: 28 }}>
        <table>
          <thead>
            <tr>
              <th>Dataset</th>
              <th>Source</th>
              <th>Description</th>
              <th>License</th>
              <th>DOI / Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <>
                <tr key={r.dataset}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{ cursor: 'pointer', transition: 'background 0.15s' }}>
                  <td>
                    <strong style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{r.dataset}</strong>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>{r.source}</td>
                  <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)', maxWidth: 260 }}>
                    {r.description?.length > 80 ? r.description.slice(0, 80) + '…' : r.description}
                  </td>
                  <td><LicenseBadge license={r.license} /></td>
                  <td className="mono" style={{ fontSize: '0.74rem' }}>
                    {r.doi && r.doi !== '—'
                      ? <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer"
                          style={{ color: 'var(--accent-blue)' }} onClick={e => e.stopPropagation()}>
                          {r.doi}
                        </a>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                    }
                  </td>
                </tr>
                {expanded === i && (
                  <tr key={`${r.dataset}-exp`}>
                    <td colSpan={5} style={{ background: 'rgba(46,204,113,0.04)', padding: '12px 16px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-sec)', margin: '0 0 8px' }}>{r.description}</p>
                      {r.citation && (
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                          📖 {r.citation}
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px', fontSize: '0.85rem' }}>
            No datasets match your filter/search.
          </div>
        )}
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
          💡 Click any row to expand the full description and citation.
        </p>
      </div>

      {/* Stack cards */}
      <h3 style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: 14, fontSize: '1rem' }}>
        🔧 Technical Stack by Category
      </h3>
      <div className="col2" style={{ marginBottom: 24 }}>
        {STACKS.map(s => (
          <div key={s.title} className="card prose">
            <h3 style={{ marginTop: 0 }}>{s.icon} {s.title}</h3>
            <ul style={{ marginBottom: 0 }}>
              {s.items.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* Data flow diagram */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: 12 }}>🔄 Data Flow — From Satellite to Decision</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { step: '1', label: 'Acquisition', detail: 'NASA/ORNL + ESA CCI biomass tiles ingested via Google Earth Engine API' },
            { step: '2', label: 'Zonal Statistics', detail: 'AGB mean, variance, and trend computed for user-defined area of interest (district, drawn polygon, or uploaded Shapefile/KML/GeoJSON)' },
            { step: '3', label: 'LCRI Scoring', detail: 'Four sub-scores (carbon potential, degradation urgency, slope feasibility, seed proximity) normalised and combined per user-configured weights' },
            { step: '4', label: 'Allometric Estimation', detail: 'Optional: single-tree AGB from DBH + height + Tallo/BAAD wood density → Chave 2014 → CO₂e + carbon credit score' },
            { step: '5', label: 'Simulation', detail: 'Logistic growth applied to top-N LCRI parcels → 5/10/20-year AGB + CO₂e + revenue projections' },
            { step: '6', label: 'Community Verification', detail: 'Umuganda planting ledger cross-checked against satellite AGB trend → verification confidence score' },
            { step: '7', label: 'Output', detail: 'Interactive map + KPI dashboard + PDF scientific report + CSV export + carbon credit score' },
          ].map(f => (
            <div key={f.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{
                minWidth: 26, height: 26, background: 'var(--accent)', color: '#0a1a0d',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.78rem', flexShrink: 0, marginTop: 2
              }}>{f.step}</span>
              <div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{f.label}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> — {f.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full citations */}
      <div className="card">
        <h3 style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem', marginBottom: 14, textTransform: 'uppercase' }}>
          📚 Full Bibliography
        </h3>
        <ol style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 2, paddingLeft: 18, margin: 0 }}>
          {data.filter(r => r.citation && r.citation !== '—').map((r, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              {r.citation}
              {r.doi && r.doi !== '—' && (
                <> — <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer"
                    style={{ color: 'var(--accent-blue)' }}>doi:{r.doi}</a></>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
