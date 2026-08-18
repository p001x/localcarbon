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
      <div className="col2-32">
        {/* Controls */}
        <div className="card">
          <h3 style={{ color:'var(--accent)', fontWeight:700, marginBottom:14 }}>Factor Weights</h3>
          <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:14 }}>Target: <strong style={{ color:'var(--text-primary)' }}>{district}</strong></p>
          {W('carbon_potential',    '🌳 Carbon Potential'  )}
          {W('degradation_urgency', '⚠️ Degradation Urgency')}
          {W('slope_feasibility',   '⛰️ Slope Feasibility'  )}
          {W('seed_proximity',      '🌱 Seed Proximity'     )}
          {Math.abs(total - 1) > 0.01 && <div className="alert alert-warn" style={{ marginTop:8 }}>Weights sum to {total.toFixed(2)} — ideal is 1.0</div>}
          <button id="run-ranking-btn" className="btn btn-primary" style={{ width:'100%', marginTop:14 }}
          onClick={run} disabled={loading}>
          {loading ? '⏳ Scoring Candidate Parcels…' : '▶ Calculate LCRI Ranking'}
        </button>
      </div>

      {/* Recommended Native Tree Species (Restor.eco standard) */}
      <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(46,204,113,0.3)', background: 'rgba(46,204,113,0.03)' }}>
        <h3 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 12 }}>
          🌱 Restor.eco Standard: Recommended Native Rwandan Species — {district || 'Rwanda'}
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', marginBottom: 14 }}>
          Ecologically matched native species optimized for soil nitrogen fixation, canopy cover, and rapid biomass accumulation:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { local: 'Umusave', species: 'Markhamia lutea', trait: 'Agroforestry Hardwood', WoodDensity: '0.54 g/cm³' },
            { local: 'Umurava', species: 'Polyscias fulva', trait: 'Montane Canopy', WoodDensity: '0.42 g/cm³' },
            { local: 'Umugondo', species: 'Acacia polyacantha', trait: 'Nitrogen-Fixing Legume', WoodDensity: '0.68 g/cm³' },
            { local: 'Umurinzi', species: 'Erythrina abyssinica', trait: 'Drought-Resistant Pioneer', WoodDensity: '0.38 g/cm³' },
            { local: 'Umuseke', species: 'Podocarpus latifolius', trait: 'High Carbon Climax', WoodDensity: '0.56 g/cm³' }
          ].map(s => (
            <div key={s.species} style={{ background: '#0a1a0d', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{s.local}</div>
              <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: 'var(--accent)' }}>{s.species}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-sec)', marginTop: 2 }}>● {s.trait}</div>
            </div>
          ))}
        </div>
      </div>

        {/* Summary KPIs */}
        {data && (
          <div>
            <div className="kpi-grid" style={{ marginBottom:16 }}>
              <div className="kpi-card"><div className="kpi-label">Parcels</div><div className="kpi-value">{data.length.toLocaleString()}</div></div>
              <div className="kpi-card"><div className="kpi-label">Total Area</div><div className="kpi-value">{data.reduce((a,r)=>a+r.area_ha,0).toFixed(0)}</div><div className="kpi-delta">ha</div></div>
              <div className="kpi-card"><div className="kpi-label">Top LCRI</div><div className="kpi-value">{Math.max(...data.map(r=>r.lcri_score)).toFixed(2)}</div></div>
            </div>
            <button className="btn btn-secondary btn-sm" id="download-csv-btn" style={{ marginBottom:12 }} onClick={downloadCsv}>⬇️ Download Ranked CSV</button>
          </div>
        )}
      </div>

      {data && (
        <div style={{ marginTop: 20 }}>
          <div className="table-wrap" style={{ maxHeight: 340, overflowY:'auto', marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  {['Parcel ID','Land Cover','Area (ha)','AGB (Mg/ha)','Trend','C.Potential','Deg.Urgency','Slope','Seed','LCRI Score'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((r,i) => (
                  <tr key={r.parcel_id}>
                    <td className="mono">{r.parcel_id}</td>
                    <td><span className="badge badge-green">{r.land_cover_class}</span></td>
                    <td>{r.area_ha?.toFixed(1)}</td>
                    <td>{r.current_agb_mg_ha?.toFixed(1)}</td>
                    <td style={{ color: r.agb_trend_mg_ha_yr < 0 ? 'var(--accent-red)' : 'var(--accent)' }}>
                      {r.agb_trend_mg_ha_yr > 0 ? '+' : ''}{r.agb_trend_mg_ha_yr?.toFixed(2)}
                    </td>
                    <td><ScoreBar value={r.norm_carbon_potential} /></td>
                    <td><ScoreBar value={r.norm_degradation_urgency} /></td>
                    <td><ScoreBar value={r.norm_slope_feasibility} /></td>
                    <td><ScoreBar value={r.norm_seed_proximity} /></td>
                    <td><ScoreBar value={r.lcri_score} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="chart-container">
            <div className="chart-title">Top 10 Parcels — Sub-factor Breakdown</div>
            <ReactECharts option={barOption()} style={{ height: 280 }} />
          </div>
        </div>
      )}
    </div>
  )


}
