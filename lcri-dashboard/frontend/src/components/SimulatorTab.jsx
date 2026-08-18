import { useState, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { runSimulator } from '../api'

export default function SimulatorTab({ country, district, appConfig }) {
  const [siteType, setSiteType]   = useState('natural_regrowth')
  const [inputMode, setInputMode] = useState('hectares')
  const [haTarget, setHaTarget]   = useState(500)
  const [budget, setBudget]       = useState(250000)
  const [costPerHa, setCostPerHa] = useState(500)
  const [marketScenario, setMarketScenario] = useState('10') // base
  const [coBenefits, setCoBenefits] = useState({ biodiversity: false, gender: false })
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const effectiveUsdPerT = () => {
    let base = parseFloat(marketScenario)
    if (coBenefits.biodiversity) base *= 1.20 // +20%
    if (coBenefits.gender) base *= 1.10       // +10%
    return base
  }

  const handleRun = () => {
    setLoading(true); setError(null)
    runSimulator({
      country,
      district,
      hectareTarget: inputMode === 'hectares' ? haTarget : null,
      budgetUsd: inputMode === 'budget' ? budget : null,
      costPerHa, usdPerTco2e: effectiveUsdPerT(), siteType
    }).then(d => { setResult(d); setLoading(false) })
      .catch(e => { setError('Simulation failed. Check server.'); setLoading(false) })
  }

  const chartOption = useCallback(() => {
    if (!result) return {}
    const years = appConfig.projectionYears || [5,10,20]
    
    // Aggregate across parcels
    const traj_p50 = years.map(y => Object.values(result.trajectories || {}).reduce((s,p) => s + (p[y]?.co2e_mg?.p50 || 0), 0))
    const traj_p10 = years.map(y => Object.values(result.trajectories || {}).reduce((s,p) => s + (p[y]?.co2e_mg?.p10 || 0), 0))
    const traj_p90 = years.map(y => Object.values(result.trajectories || {}).reduce((s,p) => s + (p[y]?.co2e_mg?.p90 || 0), 0))
    const bau  = years.map(y => Object.values(result.bauTrajectories || {}).reduce((s,p) => s + (p[y]?.co2e_mg || 0), 0))
    
    return {
      backgroundColor: 'transparent', textStyle: { fontFamily:'Inter, sans-serif' },
      tooltip: { trigger:'axis', formatter: p => `Year ${p[0].name}<br/>${p.map(s => `${s.seriesName}: ${s.value?.toLocaleString(undefined, {maximumFractionDigits:1})} Mg`).join('<br/>')}` },
      legend: { top: 4, textStyle: { color:'#80cbc4', fontSize:11 } },
      grid: { left: 60, right:16, top:40, bottom:30 },
      xAxis: { type:'category', data: years.map(y=>`Year ${y}`), axisLabel:{color:'#80cbc4'}, axisLine:{lineStyle:{color:'#1e3a2a'}} },
      yAxis: { type:'value', axisLabel:{color:'#80cbc4',fontSize:10}, splitLine:{lineStyle:{color:'#1a2e22'}} },
      series: [
        { name:'p90 (Optimistic)', type:'line', data:traj_p90, smooth:true, symbol:'none', lineStyle:{color:'#2ecc71',type:'dotted',width:1}, itemStyle:{color:'#2ecc71'} },
        { name:'p50 (Expected)', type:'line', data:traj_p50, smooth:true, symbolSize:8,
          lineStyle:{color:'#2ecc71',width:3}, itemStyle:{color:'#2ecc71'},
          areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(46,204,113,0.2)'},{offset:1,color:'rgba(46,204,113,0.02)'}]}} },
        { name:'p10 (Pessimistic)', type:'line', data:traj_p10, smooth:true, symbol:'none', lineStyle:{color:'#2ecc71',type:'dotted',width:1}, itemStyle:{color:'#2ecc71'} },
        { name:'Business-as-Usual', type:'line', data:bau, smooth:true, symbolSize:8,
          lineStyle:{color:'#e74c3c',width:3,type:'dashed'}, itemStyle:{color:'#e74c3c'} }
      ]
    }
  }, [result])

  return (
    <div>
      <div className="alert alert-warn" style={{ marginBottom:16 }}>
        All projections are indicative and based on simulated parcel data. Not a certified carbon valuation.
      </div>
      <div className="alert alert-info" style={{ marginBottom:16, borderLeft: '4px solid #3498db', background: 'rgba(52, 152, 219, 0.05)' }}>
        <strong>Data Note:</strong> Parcels shown below are Monte Carlo simulated scenarios based on district-level averages to demonstrate simulator functionality, not identifiable real-world land plots. Planting costs dynamically scale with terrain slope.
      </div>
      {result && result.is_extrapolated_zone && (
        <div className="alert alert-error" style={{ marginBottom:16 }}>
          <strong>Geographic Extrapolation Warning:</strong> This parcel is outside the calibrated tropical zone (Chave 2014 equations). Fallback algorithms applied. <strong>Accuracy is low until local field plots are uploaded.</strong>
        </div>
      )}

      <div className="card" style={{ marginBottom:20 }}>
        <div className="form-group" style={{ flexWrap:'wrap', marginBottom:14 }}>
          <div>
            <label className="form-label">Site Type</label>
            <select className="form-input form-select" id="site-type-select" value={siteType} onChange={e=>setSiteType(e.target.value)}>
              {(appConfig.growthRates||[]).map(g => <option key={g} value={g}>{g.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Define Target By</label>
            <div style={{ display:'flex', gap:8, marginTop:6 }}>
              {[['hectares','Hectares'],['budget','Budget (USD)']].map(([v,l]) => (
                <button key={v} id={`mode-${v}`} className={`btn btn-sm ${inputMode===v?'btn-primary':'btn-secondary'}`}
                  onClick={() => setInputMode(v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group" style={{ flexWrap:'wrap' }}>
          {inputMode === 'hectares'
            ? <div className="form-row"><label className="form-label">Target Area (ha)</label>
                <input id="ha-input" type="number" className="form-input" value={haTarget} min={1} step={50} onChange={e=>setHaTarget(+e.target.value)} /></div>
            : <div className="form-row"><label className="form-label">Budget (USD)</label>
                <input id="budget-input" type="number" className="form-input" value={budget} min={1000} step={10000} onChange={e=>setBudget(+e.target.value)} /></div>
          }
          <div className="form-row">
            <label className="form-label">Base Cost / ha (USD)</label>
            <input id="cost-input" type="number" className="form-input" value={costPerHa} min={50} step={50} onChange={e=>setCostPerHa(+e.target.value)} />
          </div>
          <div className="form-row">
            <label className="form-label">Market Scenario (Base Price)</label>
            <select className="form-input form-select" value={marketScenario} onChange={e=>setMarketScenario(e.target.value)} style={{ marginTop: 6 }}>
              <option value="5">🐻 Bear Market ($5 / tCO₂e)</option>
              <option value="10">Baseline ($10 / tCO₂e)</option>
              <option value="30">🐂 Premium Market ($30 / tCO₂e)</option>
            </select>
          </div>
          
          <div className="form-row" style={{ minWidth: 200 }}>
            <label className="form-label">Co-Benefit Multipliers</label>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={coBenefits.biodiversity} onChange={e=>setCoBenefits(c => ({...c, biodiversity: e.target.checked}))} />
                🐸 Biodiversity Protection (+20%)
              </label>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={coBenefits.gender} onChange={e=>setCoBenefits(c => ({...c, gender: e.target.checked}))} />
                👩🏽 Gender Equity (+10%)
              </label>
            </div>
          </div>
          
          <div className="form-row" style={{ background: 'rgba(46,204,113,0.05)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(46,204,113,0.2)' }}>
            <label className="form-label">Effective Price</label>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
              ${effectiveUsdPerT().toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ tCO₂e</span>
            </div>
          </div>
        </div>

        <button id="run-simulator-btn" className="btn btn-primary" style={{ width:'100%', marginTop:8 }}
          onClick={handleRun} disabled={loading}>
          {loading ? '⏳ Simulating…' : '▶ Run Simulator'}
        </button>
      </div>

      {/* Recommended Native Tree Species (Restor.eco standard) */}
      <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(46,204,113,0.3)', background: 'rgba(46,204,113,0.03)' }}>
        <h3 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 12 }}>
          Restor.eco Standard: Recommended Native Rwandan Tree Species — {district || 'Rwanda'}
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-sec)', marginBottom: 14 }}>
          Ecologically matched native species optimized for soil nitrogen fixation, canopy cover, and rapid biomass accumulation in Rwanda's agro-ecological zones:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { local: 'Umusave', species: 'Markhamia lutea', trait: 'Fast Agroforestry Hardwood', WoodDensity: '0.54 g/cm³' },
            { local: 'Umurava', species: 'Polyscias fulva', trait: 'High-Biomass Montane Canopy', WoodDensity: '0.42 g/cm³' },
            { local: 'Umugondo', species: 'Acacia polyacantha', trait: 'Nitrogen-Fixing Soil Builder', WoodDensity: '0.68 g/cm³' },
            { local: 'Umurinzi', species: 'Erythrina abyssinica', trait: 'Drought-Resistant Pioneer', WoodDensity: '0.38 g/cm³' },
            { local: 'Umuseke', species: 'Podocarpus latifolius', trait: 'High Carbon Density Climax', WoodDensity: '0.56 g/cm³' }
          ].map(s => (
            <div key={s.species} style={{ background: '#0a1a0d', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{s.local}</div>
              <div style={{ fontStyle: 'italic', fontSize: '0.78rem', color: 'var(--accent)' }}>{s.species}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-sec)', marginTop: 4 }}>● {s.trait}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>ρ = {s.WoodDensity}</div>
            </div>
          ))}
        </div>
      </div>
      {error && <div className="alert alert-error" style={{ marginTop:10 }}>{error}</div>}

      {result && (
        <>
          <div className="kpi-grid" style={{ marginBottom:16 }}>
            <div className="kpi-card"><div className="kpi-label">Parcels Selected</div><div className="kpi-value">{result.summary.total_parcels}</div></div>
            <div className="kpi-card"><div className="kpi-label">Total Area</div><div className="kpi-value">{result.summary.total_area_ha?.toFixed(0)}</div><div className="kpi-delta">ha</div></div>
            <div className="kpi-card"><div className="kpi-label">Est. Cost</div><div className="kpi-value">${(result.summary.total_cost_usd/1000).toFixed(0)}k</div></div>
            <div className="kpi-card"><div className="kpi-label">CO₂e Gain @Yr20</div><div className="kpi-value">{(result.summary.co2e_gain_y20_mg/1000).toFixed(1)}k</div><div className="kpi-delta">Mg CO₂e</div></div>
          </div>
          <div className="alert alert-success" style={{ marginBottom:16 }}>
            Indicative revenue range @ year 20: <strong>${result.summary.revenue_low_usd?.toLocaleString()}</strong> – <strong>${result.summary.revenue_high_usd?.toLocaleString()}</strong> USD
          </div>

          <div className="chart-container" style={{ marginBottom:20 }}>
            <div className="chart-title">Projected CO₂e (Monte Carlo Risk Adjusted)</div>
            <ReactECharts option={chartOption()} style={{ height: 280 }} />
          </div>
          
          <div className="alert alert-warn" style={{ marginBottom:16, borderLeft: '4px solid #e67e22', background: 'rgba(230, 126, 34, 0.05)' }}>
            <strong>Risk Buffer:</strong> A mandatory <strong>20% buffer pool</strong> deduction has been automatically applied to the projected Year 20 CO₂e gains to insure against future mortality events (fire, drought, pests).
          </div>

          <div className="card">
            <h3 style={{ color:'var(--accent)', fontWeight:700, marginBottom:12 }}>Selected Parcels Shortlist</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Parcel ID</th><th>Land Cover</th><th>Area (ha)</th><th>AGB (Mg/ha)</th><th>Cost/ha</th><th>Est. Cost</th><th>LCRI Score</th></tr></thead>
                <tbody>
                  {result.shortlist.map(r => (
                    <tr key={r.parcel_id}>
                      <td className="mono">{r.parcel_id}</td>
                      <td><span className="badge badge-green">{r.land_cover_class}</span></td>
                      <td>{r.area_ha?.toFixed(1)}</td>
                      <td>{r.current_agb_mg_ha?.toFixed(1)}</td>
                      <td>${r.cost_per_ha_usd?.toFixed(0)}</td>
                      <td>${r.est_cost_usd?.toFixed(0)}</td>
                      <td><span style={{ fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight:700 }}>{r.lcri_score?.toFixed(2)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
