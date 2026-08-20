import { useState, useEffect, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchRegistryProjects, analyseParcel } from '../api'

function ScoreRing({ score, color, label, hint, size = 128 }) {
  const r = size * 0.40, cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ textAlign:'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a2e22" strokeWidth={size * 0.09}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.09}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition:'stroke-dasharray 0.8s ease' }}
        />
        <text x={cx} y={cy - size * 0.06} textAnchor="middle" fill={color}
          fontSize={size * 0.20} fontWeight="800" fontFamily="Inter,sans-serif">{score}</text>
        <text x={cx} y={cy + size * 0.11} textAnchor="middle" fill={color}
          fontSize={size * 0.086} fontFamily="Inter,sans-serif">/ 100</text>
      </svg>
      <div style={{ fontWeight:700, fontSize:'0.9rem', color, marginTop:2 }}>{label}</div>
      {hint && <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', maxWidth:180, margin:'4px auto 0' }}>{hint}</div>}
    </div>
  )
}

function MktCard({ label, value, sub, highlight }) {
  return (
    <div style={{
      flex:1, minWidth:0, borderRadius:10, padding:'10px 14px',
      background: highlight ? 'rgba(46,204,113,0.13)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${highlight ? 'rgba(46,204,113,0.4)' : 'rgba(255,255,255,0.07)'}`,
      textAlign:'center'
    }}>
      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:'1.15rem', fontWeight:800, color: highlight ? '#2ecc71' : 'var(--text-primary)' }}>
        ${typeof value === 'number' ? value.toLocaleString(undefined,{maximumFractionDigits:0}) : '—'}
      </div>
      {sub && <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

export default function RegistryTab() {
  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const layerGroup = useRef(null)

  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    fetchRegistryProjects().then(data => {
      setProjects(data)
    }).catch(err => {
      console.error(err)
      setErrorMsg("Failed to load registry projects.")
    })
  }, [])

  useEffect(() => {
    if (!mapInst.current && mapRef.current) {
      mapInst.current = L.map(mapRef.current).setView([-1.94, 29.87], 4)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInst.current)
      layerGroup.current = L.layerGroup().addTo(mapInst.current)
      
      // Fix for grey map tiles on initial render when container size isn't fully resolved yet
      setTimeout(() => {
        if (mapInst.current) mapInst.current.invalidateSize()
      }, 250)
    }
  }, [])

  useEffect(() => {
    if (!mapInst.current || !layerGroup.current) return
    layerGroup.current.clearLayers()

    projects.forEach(p => {
      if (p.bounds) {
        const layer = L.geoJSON(p.bounds, {
          style: {
            color: selectedProject?.id === p.id ? '#2ecc71' : '#f39c12',
            weight: selectedProject?.id === p.id ? 3 : 2,
            fillOpacity: 0.2
          }
        }).addTo(layerGroup.current)
        
        layer.on('click', () => {
          selectProject(p)
        })
      }
    })

    if (selectedProject && selectedProject.bounds && layerGroup.current.getLayers().length > 0) {
      const selectedLayer = L.geoJSON(selectedProject.bounds)
      mapInst.current.fitBounds(selectedLayer.getBounds(), { padding: [50, 50] })
    }
  }, [projects, selectedProject])

  const selectProject = (p) => {
    setSelectedProject(p)
    setAnalysis(null)
  }

  const handleAnalyse = async () => {
    if (!selectedProject || !selectedProject.bounds) return
    setLoadingAnalysis(true)
    setErrorMsg("")
    try {
      const res = await analyseParcel({ geometry: selectedProject.bounds.geometry, interval: '1y' })
      setAnalysis(res)
    } catch (e) {
      setErrorMsg("Analysis failed. ESA CCI service might be unavailable.")
    } finally {
      setLoadingAnalysis(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflow: 'hidden' }}>
      
      {/* Top row: Map and Project Details */}
      <div style={{ display: 'flex', gap: '20px', flex: '1 1 auto', minHeight: '400px', flexWrap: 'wrap' }}>
        
        <div className="card" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', minHeight: '300px' }}>
          <div ref={mapRef} style={{ flex: 1, width: '100%' }}></div>
        </div>
        
        <div className="card" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <h3>Certified Conservation &amp; Carbon Projects</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)', marginBottom: '10px' }}>
            Select a verified REDD+ or ARR project from the registry to view its boundaries and run live satellite analysis.
          </p>

          {/* Illustrative Registry Disclaimer */}
          <div style={{ background: 'rgba(241,196,15,0.07)', border: '1px solid rgba(241,196,15,0.3)', borderRadius: 8, padding: '10px 12px', marginBottom: '15px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ background: 'rgba(241,196,15,0.2)', color: '#f1c40f', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
              DEMO
            </div>
            <div>
              <strong style={{ color: '#f1c40f', fontSize: '0.78rem' }}>Illustrative Registry</strong>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-sec)', lineHeight: 1.4 }}>
                The projects listed below are <strong>illustrative examples</strong> with mock issuance numbers designed for the competition demo.
              </p>
            </div>
          </div>
          

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {projects.map(p => (
              <div 
                key={p.id} 
                onClick={() => selectProject(p)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: selectedProject?.id === p.id ? '2px solid #2ecc71' : '1px solid var(--border-color)',
                  background: selectedProject?.id === p.id ? 'rgba(46,204,113,0.1)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{p.name}</strong>
                  <span className="badge badge-gray">{p.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-sec)' }}>
                  <span>Country: {p.country}</span>
                  <span>Method: {p.methodology}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-sec)', marginTop: '4px' }}>
                  <span style={{ color: p.status === 'Issuing' ? '#2ecc71' : '#f39c12' }}>● {p.status}</span>
                  <span><strong>{p.issued_tco2e.toLocaleString()}</strong> tCO₂e</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Live Analysis */}
      {selectedProject && (
        <div className="card" style={{ flex: '0 0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <h3>ESA CCI Satellite Verification: {selectedProject.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)', margin: 0 }}>
                Query the live ESA CCI Biomass v7.0 dataset for this project's exact geometry to verify carbon stock claims.
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleAnalyse} disabled={loadingAnalysis}>
              {loadingAnalysis ? 'Querying Satellites...' : 'Verify with Satellite Data'}
            </button>
          </div>
          
          {errorMsg && <div style={{ color: '#e74c3c', marginTop: '10px' }}>{errorMsg}</div>}

          {analysis && !loadingAnalysis && (
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
              <div style={{ flex: '0 0 auto' }}>
                <ScoreRing 
                  score={analysis.carbon_score} 
                  color={analysis.score_info?.color || '#2ecc71'} 
                  label={analysis.score_info?.label || 'Good'} 
                  hint="Live ESA CCI LCRI Score"
                  size={120} 
                />
              </div>
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <MktCard label="Est. Carbon Stock (tCO₂e)" value={analysis.latest_co2e_mg} highlight />
                  <MktCard label="Area (Hectares)" value={Math.round(analysis.area_ha)} />
                  <MktCard label="Avg AGB (Mg/ha)" value={analysis.latest_agb_mg_ha} />
                  <MktCard label="10yr Growth Trend" value={analysis.trend_pct} sub="%" />
                </div>
                {analysis.co2e_series && (
                  <div style={{ height: '140px', width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px' }}>
                    <ReactECharts
                      style={{ height: '100%', width: '100%' }}
                      option={{
                        grid: { top: 10, right: 10, bottom: 20, left: 50 },
                        tooltip: { trigger: 'axis' },
                        xAxis: { type: 'category', data: Object.keys(analysis.co2e_series), axisLabel: { color: '#888' } },
                        yAxis: { type: 'value', axisLabel: { color: '#888', formatter: (v) => `${v/1000}k` }, splitLine: { lineStyle: { color: '#333' } } },
                        series: [{ data: Object.values(analysis.co2e_series), type: 'line', smooth: true, color: '#2ecc71', areaStyle: { color: 'rgba(46,204,113,0.2)' } }]
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
