import { useState, useEffect } from 'react'
import './index.css'
import 'leaflet/dist/leaflet.css'
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { fetchConfig, fetchCustomAreas, deleteCustomArea, fetchDistricts } from './api'
import DashboardTab       from './components/DashboardTab'
import LcriRankingTab     from './components/LcriRankingTab'
import SimulatorTab       from './components/SimulatorTab'
import RegistryTab        from './components/RegistryTab'
import InteractiveLensTab from './components/InteractiveLensTab'
import VisualAtlasTab     from './components/VisualAtlasTab'
import MethodologyTab     from './components/MethodologyTab'
import DataSourcesTab     from './components/DataSourcesTab'
import HomeTab            from './components/HomeTab'
import GicumbiVerificationTab from './components/GicumbiVerificationTab'
import LedgerTab            from './components/LedgerTab'
import VisionTab          from './components/VisionTab'

const DEFAULT_CONFIG = {
  countries: ['Rwanda'],
  districts: [
    'All Rwanda', 'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara',
    'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga', 'Musanze',
    'Ngoma', 'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe', 'Nyamasheke', 'Nyanza',
    'Nyarugenge', 'Nyaruguru', 'Rubavu', 'Ruhango', 'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
  ],
  growthRates: ['agroforestry', 'native_montane', 'bamboo_riparian', 'commercial_timber']
}

const TAB_GROUPS = [
  {
    title: 'Overview & Vision',
    tabs: [
      { id: 'home',         path: '/',            label: 'Home' },
      { id: 'vision',       path: '/vision',      label: 'Story Map' },
    ]
  },
  {
    title: 'Ecological Triage & Modeling',
    tabs: [
      { id: 'dashboard',    path: '/dashboard',   label: 'Satellite Dashboard' },
      { id: 'lcri',         path: '/lcri',        label: 'Ecological Ranking' },
      { id: 'simulator',    path: '/simulator',   label: 'Restoration Simulator' },
      { id: 'registry',    path: '/registry',    label: 'Project Registry' },
    ]
  },
  {
    title: 'Grassroots Validation & Auditing',
    tabs: [
      { id: 'gicumbi',     path: '/gicumbi',     label: 'Green Gicumbi Audit' },
      { id: 'ledger',      path: '/ledger',      label: 'Community Ledger' },
    ]
  },
  {
    title: 'Science & Reference',
    tabs: [
      { id: 'lens',        path: '/lens',        label: 'Interactive Lens' },
      { id: 'atlas',        path: '/atlas',       label: 'Visual Atlas' },
      { id: 'methodology',  path: '/methodology', label: 'Methodology' },
      { id: 'datasources',  path: '/datasources', label: 'Data Sources' },
    ]
  }
]

const TABS = TAB_GROUPS.flatMap(g => g.tabs)

const TAB_META = {
  home:        { title: 'LCRI Environmental Intelligence', sub: 'Local Carbon Return Index · Forest Conservation & Climate Finance' },
  vision:      { title: 'The LCRI Story Map',              sub: 'Protecting Rwanda’s Forest Corridors with Earth Observation' },
  dashboard:   { title: 'Satellite Dashboard & Analytics', sub: 'Live Canopy KPIs · Sentinel-2 & ESA CCI Biomass' },
  lcri:        { title: 'Ecological Ranking Engine',       sub: 'Candidate Parcel Triage: Erosion Risk, Wildlife Buffers & Biomass' },
  simulator:   { title: 'Restoration Simulator',           sub: '20-Year Canopy Trajectory & Community Finance Forecasting' },
  registry:    { title: 'Conservation Project Registry',   sub: 'Regional Forest Projects & Satellite Verification' },
  gicumbi:     { title: 'Green Gicumbi Audit',             sub: 'Independent Satellite Verification of Agroforestry Claims' },
  ledger:      { title: 'Community Ledger',                sub: 'Grassroots Agroforestry Submissions & Allometry' },
  lens:        { title: 'Interactive Biomass Lens',        sub: 'Global Forest Biomass Sequestration Explorer' },
  atlas:       { title: 'Visual Atlas',                    sub: "Rwanda & Regional Carbon Landscapes (2026)" },
  methodology: { title: 'Scientific Methodology',          sub: 'Validation Approach, Allometric Models & Limitations' },
  datasources: { title: 'Data Sources & Provenance',       sub: 'Dataset Provenance, Open-Access Licenses & Citations' },
}

export default function App() {
  const navigate = useNavigate()
  const [isOffline, setIsOffline]         = useState(false)
  const [appConfig, setAppConfig]         = useState(DEFAULT_CONFIG)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [country, setCountry]             = useState('Rwanda')
  const [district, setDistrict]           = useState('All Rwanda')
  const [districtsList, setDistrictsList] = useState(DEFAULT_CONFIG.districts)
  const [customAreas, setCustomAreas]     = useState({})
  
  // Theme Configuration
  const [themeConfig, setThemeConfig] = useState(() => {
    const saved = localStorage.getItem('lcri-theme')
    return saved ? JSON.parse(saved) : { baseTheme: 'dark', accentColor: '#2ecc71' }
  })

  // Apply Theme Configuration
  useEffect(() => {
    const root = document.documentElement
    if (themeConfig.baseTheme === 'light') {
      root.classList.add('light-theme')
    } else {
      root.classList.remove('light-theme')
    }
    
    // Set custom accent colors if changed from default
    if (themeConfig.accentColor) {
      root.style.setProperty('--accent', themeConfig.accentColor)
      root.style.setProperty('--border-glow', themeConfig.accentColor)
    }
    
    localStorage.setItem('lcri-theme', JSON.stringify(themeConfig))
  }, [themeConfig])

  // Load config + custom areas on mount
  useEffect(() => {
    import('./api').then(({ fetchHealth }) => {
      fetchHealth().then(h => setIsOffline(!h.gee_available)).catch(() => setIsOffline(true))
    }).catch(() => setIsOffline(true))
    
    fetchConfig().then(cfg => {
      if (cfg && cfg.districts) {
        setAppConfig(cfg)
        setDistrictsList(cfg.districts)
      }
    }).catch(console.error)
    refreshAreas()
  }, [])

  // Fetch districts when country changes
  useEffect(() => {
    if (!appConfig) return
    if (country === 'Rwanda') {
      setDistrictsList(appConfig.districts || DEFAULT_CONFIG.districts)
    } else {
      fetchDistricts(country)
        .then(d => {
          setDistrictsList(d.districts || [])
          setDistrict(d.districts && d.districts.length > 0 ? d.districts[0] : 'All')
        })
        .catch(() => setDistrictsList([]))
    }
  }, [country, appConfig])

  function refreshAreas() {
    fetchCustomAreas().then(data => {
      setCustomAreas(data.areas || data || {})
    }).catch(console.error)
  }

  function handleDeleteArea(name) {
    if (!window.confirm(`Delete custom area "${name}"?`)) return
    deleteCustomArea(name).then(() => {
      refreshAreas()
      if (district === name) setDistrict('All Rwanda')
    }).catch(console.error)
  }

  if (!appConfig) {
    return (
      <div className="spinner-wrap" style={{ height: '100vh' }}>
        <div className="spinner" />
        <span className="spinner-label">Connecting to LCRI backend…</span>
      </div>
    )
  }

  const location = useLocation()
  // remove leading slash, default to 'home'
  const currentTabId = location.pathname.substring(1) || 'home'
  const meta = TAB_META[currentTabId] || TAB_META['home']
  const districtOptions = [...Object.keys(customAreas), ...districtsList]

  const tabProps = { appConfig, country, district, setDistrict, customAreas, refreshAreas, districtOptions, isOffline }

  if (currentTabId === 'home') {
    return (
      <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', width: '100%', padding: '60px 20px' }}>
        <Routes>
          <Route path="/" element={<HomeTab />} />
        </Routes>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {isOffline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#d35400', color: 'white', textAlign: 'center', padding: '6px', fontSize: '0.85rem', zIndex: 9999, fontWeight: 'bold' }}>
          ⚠️ Earth Engine Offline Mode — Using Mock Data for Previews
        </div>
      )}
      
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <h1>LCRI</h1>
          <p>Local Carbon Return Index · Africa 2026</p>
        </div>

        {/* Categorized Navigation */}
        {TAB_GROUPS.map((group) => (
          <div className="sidebar-section" key={group.title} style={{ paddingBottom: 4 }}>
            <div className="sidebar-section-title">{group.title}</div>
            {group.tabs.map(t => (
              <NavLink 
                key={t.id} 
                to={t.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                style={{ display: 'block', padding: '8px 12px', fontSize: '0.85rem' }}
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        ))}

        <hr className="sidebar-divider" />

        {/* Country badge */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Region Focus</div>
          <div style={{ padding: '0 6px 12px 6px' }}>
            <div style={{ 
              background: 'rgba(46, 204, 113, 0.1)', 
              border: '1px solid rgba(46, 204, 113, 0.3)', 
              borderRadius: '6px', 
              padding: '8px 12px', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              Rwanda (National Focus)
            </div>
          </div>
        </div>

        {/* Study area selector */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Study Area (District/Region)</div>
          <div className="form-row" style={{ padding: '0 6px' }}>
            <select className="form-input form-select" value={district}
              onChange={e => setDistrict(e.target.value)} id="global-district-select">
              {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Saved areas */}
        {Object.keys(customAreas).length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Saved Areas</div>
            {Object.keys(customAreas).map(name => (
              <div key={name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 10px' }}>
                <span style={{ fontSize:'0.8rem', color:'var(--text-sec)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'150px' }}
                  title={name}>{name}</span>
                <button className="btn btn-sm btn-danger" title="Delete"
                  onClick={() => handleDeleteArea(name)} id={`del-area-${name}`}>X</button>
              </div>
            ))}
          </div>
        )}

        <hr className="sidebar-divider" />

        {/* Theme Settings */}
        <div className="sidebar-section" style={{ paddingBottom: 20 }}>
          <div className="sidebar-section-title">Theme Settings</div>
          
          <div className="form-row" style={{ padding: '0 6px', display: 'flex', gap: 10, marginBottom: 12 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="theme" 
                value="dark"
                checked={themeConfig.baseTheme === 'dark'}
                onChange={() => setThemeConfig(prev => ({ ...prev, baseTheme: 'dark' }))}
              /> Dark
            </label>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="theme" 
                value="light"
                checked={themeConfig.baseTheme === 'light'}
                onChange={() => setThemeConfig(prev => ({ ...prev, baseTheme: 'light' }))}
              /> Light
            </label>
          </div>

          <div className="form-row" style={{ padding: '0 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Accent Color</span>
            <input 
              type="color" 
              value={themeConfig.accentColor}
              onChange={(e) => setThemeConfig(prev => ({ ...prev, accentColor: e.target.value }))}
              style={{ width: 30, height: 30, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent' }}
            />
          </div>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────────────── */}
      <main className="main-content" style={{ position: 'relative' }}>
        
        {/* Floating Return to Story Map Button */}
        {currentTabId !== 'vision' && currentTabId !== 'home' && (
          <button 
            className="fab-return-story"
            onClick={() => navigate('/vision')}
          >
            <span style={{ marginRight: 8 }}>←</span> Return to Story Map
          </button>
        )}

        <div className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
            <div>
              <h2>{meta.title}</h2>
              <p className="header-subtitle">{meta.sub}</p>
            </div>
          </div>
          <span className="badge badge-green hide-on-mobile">{country}</span>
        </div>

        <div className="tab-content">
          <Routes>
            <Route path="/"            element={<HomeTab />} />
            <Route path="/vision"      element={<VisionTab />} />
            <Route path="/dashboard"   element={<DashboardTab       {...tabProps} />} />
            <Route path="/lcri"        element={<LcriRankingTab     {...tabProps} />} />
            <Route path="/simulator"   element={<SimulatorTab       {...tabProps} />} />
            <Route path="/registry"    element={<RegistryTab        {...tabProps} />} />
            <Route path="/gicumbi"     element={<GicumbiVerificationTab {...tabProps} />} />
            <Route path="/ledger"      element={<LedgerTab          {...tabProps} />} />
            <Route path="/lens"        element={<InteractiveLensTab {...tabProps} />} />
            <Route path="/atlas"       element={<VisualAtlasTab     {...tabProps} />} />
            <Route path="/methodology" element={<MethodologyTab />} />
            <Route path="/datasources" element={<DataSourcesTab />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
