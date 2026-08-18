import { useState, useEffect } from 'react'
import './index.css'
import 'leaflet/dist/leaflet.css'
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
import VisionTab          from './components/VisionTab'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'

const TABS = [
  { id: 'home',         path: '/',            icon: '', label: 'Home Page'             },
  { id: 'vision',       path: '/vision',      icon: '📖', label: 'The LCRI Story Map'  },
  { id: 'dashboard',    path: '/dashboard',   icon: '', label: 'Dashboard & Map'       },
  { id: 'lcri',         path: '/lcri',        icon: '', label: 'LCRI Ranking'          },
  { id: 'simulator',    path: '/simulator',   icon: '', label: 'Reforestation Simulator'},
  { id: 'registry',     path: '/registry',    icon: '', label: 'Project Registry'       },
  { id: 'gicumbi',      path: '/gicumbi',     icon: '', label: 'Green Gicumbi'         },
  { id: 'lens',         path: '/lens',        icon: '', label: 'Interactive Lens'       },
  { id: 'atlas',        path: '/atlas',       icon: '', label: 'Visual Atlas'          },
  { id: 'methodology',  path: '/methodology', icon: '', label: 'Methodology'            },
  { id: 'datasources',  path: '/datasources', icon: '', label: 'Data Sources'          },
]

const TAB_META = {
  home:        { title: 'LCRI Dashboard',           sub: 'Local Carbon Return Index · RCMRD 2026' },
  vision:      { title: 'The LCRI Story Map',       sub: 'Investment-Grade Ecological Intelligence' },
  dashboard:   { title: 'Dashboard & Map',         sub: 'Carbon KPIs · Geospatial Analysis' },
  lcri:        { title: 'LCRI Ranking Engine',      sub: 'Candidate Parcel Scoring' },
  simulator:   { title: 'Reforestation Simulator',  sub: 'Logistic Growth · Investment Projection' },
  registry:    { title: 'Carbon Project Registry',  sub: 'Verified REDD+ & ARR Projects' },
  gicumbi:     { title: 'Green Gicumbi Verification',sub: 'Independent Satellite Verification of Agroforestry' },
  lens:        { title: 'Interactive Carbon Lens',  sub: 'Hover-to-explore Geospatial Layer' },
  atlas:       { title: 'Visual Atlas',             sub: "Africa's Carbon Landscape · 2026" },
  methodology: { title: 'Methodology',              sub: 'Validation Approach · Limitations' },
  datasources: { title: 'Data Sources',             sub: 'Dataset Provenance & Citations' },
}

import { useNavigate } from 'react-router-dom'

export default function App() {
  const navigate = useNavigate()
  // Navigation state is now handled by react-router-dom
  const [isOffline, setIsOffline]         = useState(false)
  const [appConfig, setAppConfig]         = useState(null)
  const [country, setCountry]             = useState('Rwanda')
  const [district, setDistrict]           = useState('All Rwanda')
  const [districtsList, setDistrictsList] = useState([])
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
    })
    
    fetchConfig().then(cfg => {
      setAppConfig(cfg)
      setDistrictsList(cfg.districts)
    }).catch(console.error)
    refreshAreas()
  }, [])

  // Fetch districts when country changes
  useEffect(() => {
    if (!appConfig) return
    if (country === 'Rwanda') {
      setDistrictsList(appConfig.districts)
      setDistrict('All Rwanda')
      return
    }
    fetchDistricts(country).then(list => {
      setDistrictsList(list)
      if (list.length > 0) {
        setDistrict(list[0])
      } else {
        setDistrict(`All ${country}`)
      }
    }).catch(err => {
      console.error(err)
      setDistrictsList([`All ${country}`])
      setDistrict(`All ${country}`)
    })
  }, [country, appConfig])

  const refreshAreas = () => {
    fetchCustomAreas().then(setCustomAreas).catch(console.error)
  }

  const handleDeleteArea = async (name) => {
    await deleteCustomArea(name)
    if (district === name) setDistrict(`All ${country}`)
    refreshAreas()
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

  return (
    <div className="app-shell">
      {isOffline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#d35400', color: 'white', textAlign: 'center', padding: '6px', fontSize: '0.85rem', zIndex: 9999, fontWeight: 'bold' }}>
          ⚠️ Earth Engine Offline Mode — Using Mock Data for Previews
        </div>
      )}
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>LCRI</h1>
          <p>Local Carbon Return Index · Africa 2026</p>
        </div>

        {/* Navigation */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Navigation</div>
          {TABS.map(t => (
            <NavLink 
              key={t.id} 
              to={t.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span>{t.icon}</span> {t.label}
            </NavLink>
          ))}
        </div>

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
          <div>
            <h2>{meta.title}</h2>
            <p>{meta.sub}</p>
          </div>
          <span className="badge badge-green">{country}</span>
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
