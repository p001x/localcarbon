import { useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { fetchLcriRanking } from '../api'

export default function LcriRankingTab({ country, district, appConfig }) {
  const [weights, setWeights] = useState({ carbon_potential:0.35, degradation_urgency:0.25, slope_feasibility:0.20, seed_proximity:0.20 })
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)

  const total = Object.values(weights).reduce((a,b) => a+b, 0)

  const run = () => {
    setLoading(true)
    fetchLcriRanking({ country, district, weights, count: 150 })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const ScoreBar = ({ value }) => {
    const cls = value < 33 ? 'low' : value < 66 ? 'mid' : ''
    return (
      <div className="score-bar-wrap">
        <div className="score-bar"><div className="score-bar-fill" style={{ width:`${value}%` }} /></div>
        <span style={{ fontSize:'0.75rem', fontFamily:'var(--font-mono)', color:'var(--accent)', minWidth:30 }}>{value?.toFixed(1)}</span>
      </div>
    )
  }

  const barOption = useCallback(() => {
    if (!data) return {}
    const top10 = data.slice(0, 10)
    return {
      backgroundColor: 'transparent', textStyle: { fontFamily: 'Inter, sans-serif' },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 4, textStyle: { color: '#80cbc4', fontSize: 11 } },
      grid: { left: 60, right: 14, top: 40, bottom: 50 },
      xAxis: { type: 'category', data: top10.map(r => r.parcel_id), axisLabel: { color:'#80cbc4', rotate:35, fontSize:10 }, axisLine: { lineStyle: { color:'#1e3a2a' } } },
      yAxis: { type: 'value', max: 100, axisLabel: { color:'#80cbc4', fontSize:10 }, splitLine: { lineStyle: { color:'#1a2e22' } } },
      series: [
        { name:'Carbon Potential',    type:'bar', stack:'s', data: top10.map(r=>r.norm_carbon_potential),    itemStyle:{color:'#2ecc71'} },
        { name:'Degradation Urgency', type:'bar', stack:'s', data: top10.map(r=>r.norm_degradation_urgency), itemStyle:{color:'#e74c3c'} },
        { name:'Slope Feasibility',   type:'bar', stack:'s', data: top10.map(r=>r.norm_slope_feasibility),   itemStyle:{color:'#3498db'} },
        { name:'Seed Proximity',      type:'bar', stack:'s', data: top10.map(r=>r.norm_seed_proximity),      itemStyle:{color:'#f39c12'} },
      ]
    }
  }, [data])

  const downloadCsv = () => {
    if (!data) return
    const cols = ['parcel_id','land_cover_class','area_ha','current_agb_mg_ha','agb_trend_mg_ha_yr','lcri_score']
    const csv = [cols.join(','), ...data.map(r => cols.map(c => r[c]).join(','))].join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv)
    a.download = `lcri_ranking_${district}.csv`; a.click()
  }

  const W = (key, label) => {
    const pct = Math.round(weights[key] * 100)
    return (
      <div className="slider-row" key={key}>
        <span className="slider-label">{label}</span>
        <input type="range" id={`w-${key}`} min={0} max={1} step={0.05} value={weights[key]}
          style={{ '--pct': `${pct}%` }}
          onChange={e => setWeights(w => ({ ...w, [key]: parseFloat(e.target.value) }))} />
        <span className="slider-value">{pct}%</span>
      </div>
    )
  }

  return (
    <div>
      {/* Ecological Integrity & Native Conservation Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(46,204,113,0.12) 0%, rgba(39,174,96,0.04) 100%)',
        border: '1px solid rgba(46,204,113,0.35)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px'
      }}>
        <span style={{ fontSize: '1.8rem', flexShrink: 0, marginTop: '2px' }}>🛡️</span>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 800 }}>
            Ecological Integrity &amp; Biodiversity Safeguards
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '3px 0 5px' }}>
            Conservation-First Triage: Protecting Rwanda's Forest Corridors &amp; Catchments
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-sec)', lineHeight: 1.5 }}>
            LCRI prioritizes parcels that serve as <strong>wildlife corridors</strong> near National Parks (Volcanoes, Nyungwe, Gishwati-Mukura), <strong>steep slopes (&gt;25°) vulnerable to erosion</strong>, and degraded catchments. Pure exotic monocultures (e.g. <em>Eucalyptus</em>) are penalized in favor of mixed native species.
          </p>
        </div>
      </div>

      <div className="col2-32">
        {/* Controls */}
        <div className="card">
          <h3 style={{ color:'var(--accent)', fontWeight:700, marginBottom:14 }}>Ecological &amp; Terrain Weights</h3>
          <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:14 }}>Target District: <strong style={{ color:'var(--text-primary)' }}>{district}</strong></p>
          {W('carbon_potential',    '🌳 Biomass Recovery Potential'  )}
          {W('degradation_urgency', '⚠️ Canopy Loss & Threat Urgency')}
          {W('slope_feasibility',   '⛰️ Slope Stability & Erosion Risk'  )}
          {W('seed_proximity',      '🌱 Native Forest Patch Proximity'     )}
          {Math.abs(total - 1) > 0.01 && <div className="alert alert-warn" style={{ marginTop:8 }}>Weights sum to {total.toFixed(2)} — ideal is 1.0</div>}
          <button id="run-ranking-btn" className="btn btn-primary" style={{ width:'100%', marginTop:14 }}
            onClick={run} disabled={loading}>
            {loading ? '⏳ Running Ecological Triage…' : '▶ Run Conservation Triage'}
          </button>
        
          {/* Cadastral Simulation Transparency Note */}
          <div style={{ background: 'rgba(52,152,219,0.08)', border: '1px solid rgba(52,152,219,0.25)', borderRadius: '8px', padding: '10px 12px', marginTop: '14px', fontSize: '0.74rem', color: 'var(--text-sec)', lineHeight: 1.4 }}>
            ℹ️ <strong>Cadastral Triage Simulation:</strong> Candidate plots are simulated from {district || 'district'} bioclimatic envelopes to rank priority zones for community Umuganda planting and slope terracing.
          </div>
        </div>

        {/* Recommended Native Tree Species (Restor.eco standard) */}
        <div className="card" style={{ border: '1px solid rgba(46,204,113,0.3)', background: 'rgba(46,204,113,0.03)' }}>
          <h3 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 10 }}>
            🌱 Restor.eco Native Species Selection — {district || 'Rwanda'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-sec)', marginBottom: 12, lineHeight: 1.4 }}>
            Ecologically matched native species that maximize soil nitrogen fixation, watershed stability, and Albertine Rift biodiversity:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
            {[
              { local: 'Umusave', species: 'Markhamia lutea', trait: 'Agroforestry & Soil Fertility', icon: '🍃' },
              { local: 'Umurava', species: 'Polyscias fulva', trait: 'Montane Canopy Recovery', icon: '🌳' },
              { local: 'Umugondo', species: 'Acacia polyacantha', trait: 'Nitrogen-Fixing Pioneer', icon: '🌿' },
              { local: 'Umurinzi', species: 'Erythrina abyssinica', trait: 'Erosion & Drought Buffer', icon: '🛡️' },
              { local: 'Umuseke', species: 'Podocarpus latifolius', trait: 'Climax Wildlife Habitat', icon: '🦜' }
            ].map(s => (
              <div key={s.species} style={{ background: '#0a1a0d', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap: 5 }}>
                  <span>{s.icon}</span>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{s.local}</strong>
                </div>
                <div style={{ fontStyle: 'italic', fontSize: '0.74rem', color: 'var(--accent)' }}>{s.species}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>● {s.trait}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      {data && (
        <div style={{ marginTop: 20 }}>
          <div className="kpi-grid" style={{ marginBottom:16 }}>
            <div className="kpi-card">
              <div className="kpi-label">Candidate Parcels</div>
              <div className="kpi-value">{data.length.toLocaleString()}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Restoration Area</div>
              <div className="kpi-value">{data.reduce((a,r)=>a+r.area_ha,0).toFixed(0)}</div>
              <div className="kpi-delta">ha</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">High-Priority Parcels</div>
              <div className="kpi-value">{data.filter(r => r.lcri_score >= 60).length}</div>
              <div className="kpi-delta">Score &gt; 60</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Top Ecological LCRI</div>
              <div className="kpi-value" style={{ color: 'var(--accent)' }}>{Math.max(...data.map(r=>r.lcri_score)).toFixed(1)}</div>
              <div className="kpi-delta">/ 100</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-sec)' }}>
              Parcels ranked by composite conservation index (Biomass Recovery + Canopy Urgency + Erosion Risk + Native Connectivity).
            </span>
            <button className="btn btn-secondary btn-sm" id="download-csv-btn" onClick={downloadCsv}>
              ⬇️ Download Priority CSV
            </button>
          </div>

          <div className="table-wrap" style={{ maxHeight: 360, overflowY:'auto', marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  {['Parcel ID','Ecological Niche','Area (ha)','Current Biomass','Canopy Trend','Biomass Potential','Threat Urgency','Erosion / Slope','Seed Source','LCRI Score'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((r,i) => {
                  const isTop = r.lcri_score >= 70
                  const isSlope = r.norm_slope_feasibility >= 65
                  return (
                    <tr key={r.parcel_id}>
                      <td className="mono" style={{ fontWeight: isTop ? 700 : 400 }}>
                        {r.parcel_id}
                        {isTop && <span title="Top Conservation Priority" style={{ marginLeft: 4 }}>⭐</span>}
                      </td>
                      <td>
                        <span className={`badge ${isSlope ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize:'0.7rem' }}>
                          {isSlope ? '⛰️ Steep Catchment' : r.land_cover_class}
                        </span>
                      </td>
                      <td>{r.area_ha?.toFixed(1)}</td>
                      <td>{r.current_agb_mg_ha?.toFixed(1)} <span style={{fontSize:'0.65rem', color:'var(--text-muted)'}}>Mg/ha</span></td>
                      <td style={{ color: r.agb_trend_mg_ha_yr < 0 ? 'var(--accent-red)' : 'var(--accent)', fontWeight: 600 }}>
                        {r.agb_trend_mg_ha_yr > 0 ? '+' : ''}{r.agb_trend_mg_ha_yr?.toFixed(2)}
                      </td>
                      <td><ScoreBar value={r.norm_carbon_potential} /></td>
                      <td><ScoreBar value={r.norm_degradation_urgency} /></td>
                      <td><ScoreBar value={r.norm_slope_feasibility} /></td>
                      <td><ScoreBar value={r.norm_seed_proximity} /></td>
                      <td><ScoreBar value={r.lcri_score} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="chart-container">
            <div className="chart-title">Top 10 Priority Parcels — Ecological Sub-factor Breakdown</div>
            <ReactECharts option={barOption()} style={{ height: 280 }} />
          </div>
        </div>
      )}
    </div>
  )



}
