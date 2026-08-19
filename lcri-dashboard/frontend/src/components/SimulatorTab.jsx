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
      {/* Conservation Framing Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(39, 174, 96, 0.12) 0%, rgba(10, 26, 13, 0.4) 100%)',
        border: '1px solid rgba(46, 204, 113, 0.35)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px'
      }}>
        <div style={{ background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: 6, padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
          SIMULATOR
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 800 }}>
            Triple-Benefit Conservation Simulation
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '3px 0 5px' }}>
            Forecasting Ecological Biomass Recovery &amp; Community Stewardship
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-sec)', lineHeight: 1.5 }}>
            This simulator models the 20-year ecological trajectory of native forest regeneration. Climate finance (carbon credit valuation) is calculated strictly as a <strong>catalytic funding mechanism</strong> to pay local smallholder stewards and maintain permanent park buffer zones against encroachment.
          </p>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom:16, borderLeft: '4px solid #3498db', background: 'rgba(52, 152, 219, 0.05)' }}>
        <strong>[DATA NOTE]</strong> Candidate plots are Monte Carlo simulated scenarios based on district-level averages to demonstrate ecological growth trajectories (Chave 2014) and terrain-adjusted planting costs.
      </div>
      {result && result.is_extrapolated_zone && (
        <div className="alert alert-error" style={{ marginBottom:16 }}>
          <strong>Geographic Extrapolation Warning:</strong> This parcel is outside the calibrated tropical zone (Chave 2014 equations). Fallback algorithms applied.
        </div>
      )}

      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ color:'var(--accent)', fontWeight:700, fontSize:'1rem', marginBottom:14 }}>
          Restoration Target &amp; Ecological Settings
        </h3>
        <div className="form-group" style={{ flexWrap:'wrap', marginBottom:14 }}>
          <div>
            <label className="form-label">Regeneration Niche</label>
            <select className="form-input form-select" id="site-type-select" value={siteType} onChange={e=>setSiteType(e.target.value)}>
              {(appConfig.growthRates||[]).map(g => <option key={g} value={g}>{g.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Define Scale By</label>
            <div style={{ display:'flex', gap:8, marginTop:6 }}>
              {[['hectares','Restoration Area (ha)'],['budget','Conservation Budget (USD)']].map(([v,l]) => (
                <button key={v} id={`mode-${v}`} className={`btn btn-sm ${inputMode===v?'btn-primary':'btn-secondary'}`}
                  onClick={() => setInputMode(v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group" style={{ flexWrap:'wrap' }}>
          {inputMode === 'hectares'
            ? <div className="form-row"><label className="form-label">Target Restoration Area (ha)</label>
                <input id="ha-input" type="number" className="form-input" value={haTarget} min={1} step={50} onChange={e=>setHaTarget(+e.target.value)} /></div>
            : <div className="form-row"><label className="form-label">Conservation Budget (USD)</label>
                <input id="budget-input" type="number" className="form-input" value={budget} min={1000} step={10000} onChange={e=>setBudget(+e.target.value)} /></div>
          }
          <div className="form-row">
            <label className="form-label">Nursery &amp; Terracing Cost / ha (USD)</label>
            <input id="cost-input" type="number" className="form-input" value={costPerHa} min={50} step={50} onChange={e=>setCostPerHa(+e.target.value)} />
          </div>
          <div className="form-row">
            <label className="form-label">Carbon Credit Price Scenario</label>
            <select className="form-input form-select" value={marketScenario} onChange={e=>setMarketScenario(e.target.value)} style={{ marginTop: 6 }}>
              <option value="5">Conservative Floor ($5 / tCO₂e)</option>
              <option value="10">Standard Voluntary Market ($10 / tCO₂e)</option>
              <option value="30">Premium High-Integrity Credit ($30 / tCO₂e)</option>
            </select>
          </div>
          
          <div className="form-row" style={{ minWidth: 220 }}>
            <label className="form-label">Ecological Co-Benefit Multipliers</label>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={coBenefits.biodiversity} onChange={e=>setCoBenefits(c => ({...c, biodiversity: e.target.checked}))} />
                Wildlife Corridor &amp; Biodiversity Protection (+20%)
              </label>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={coBenefits.gender} onChange={e=>setCoBenefits(c => ({...c, gender: e.target.checked}))} />
                Community Livelihoods &amp; Gender Inclusivity (+10%)
              </label>
            </div>
          </div>
          
          <div className="form-row" style={{ background: 'rgba(46,204,113,0.05)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(46,204,113,0.2)' }}>
            <label className="form-label">Effective Credit Price</label>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
              ${effectiveUsdPerT().toFixed(2)} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ tCO₂e</span>
            </div>
          </div>
        </div>

        <button id="run-simulator-btn" className="btn btn-primary" style={{ width:'100%', marginTop:8 }}
          onClick={handleRun} disabled={loading}>
          {loading ? 'Projecting Ecological Growth Trajectory…' : 'Simulate 20-Year Conservation Trajectory'}
        </button>
      </div>

      {/* Recommended Native Tree Species (Restor.eco standard) */}
      <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(46,204,113,0.3)', background: 'rgba(46,204,113,0.03)' }}>
        <h3 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 10 }}>
          Restor.eco Native Species Suite — {district || 'Rwanda'}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-sec)', marginBottom: 12, lineHeight: 1.4 }}>
          Recommended indigenous tree species designed for soil stabilization on steep Rwandan terrain and long-term carbon accumulation:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { local: 'Umusave', species: 'Markhamia lutea', trait: 'Agroforestry Hardwood', WoodDensity: '0.54 g/cm³' },
            { local: 'Umurava', species: 'Polyscias fulva', trait: 'High Montane Canopy', WoodDensity: '0.42 g/cm³' },
            { local: 'Umugondo', species: 'Acacia polyacantha', trait: 'Soil Nitrogen Fixer', WoodDensity: '0.68 g/cm³' },
            { local: 'Umurinzi', species: 'Erythrina abyssinica', trait: 'Erosion & Drought Buffer', WoodDensity: '0.38 g/cm³' },
            { local: 'Umuseke', species: 'Podocarpus latifolius', trait: 'Climax Wildlife Canopy', WoodDensity: '0.56 g/cm³' }
          ].map(s => (
            <div key={s.species} style={{ background: '#0a1a0d', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{s.local}</div>
              <div style={{ fontStyle: 'italic', fontSize: '0.78rem', color: 'var(--accent)' }}>{s.species}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-sec)', marginTop: 4 }}>● {s.trait}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>Density: {s.WoodDensity}</div>
            </div>
          ))}
        </div>
      </div>
      {error && <div className="alert alert-error" style={{ marginTop:10 }}>{error}</div>}

      {result && (
        <>
          {/* Triple-Benefit KPI Dashboard */}
          <div className="kpi-grid" style={{ marginBottom:16 }}>
            <div className="kpi-card">
              <div className="kpi-label">Area Restored</div>
              <div className="kpi-value">{result.summary.total_area_ha?.toFixed(0)}</div>
              <div className="kpi-delta">hectares canopy</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Carbon Rebuilt @Yr20</div>
              <div className="kpi-value">{(result.summary.co2e_gain_y20_mg/1000).toFixed(1)}k</div>
              <div className="kpi-delta">Mg CO₂e Sequestered</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Community Implementation Cost</div>
              <div className="kpi-value">${(result.summary.total_cost_usd/1000).toFixed(0)}k</div>
              <div className="kpi-delta">Local stewardship &amp; nurseries</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Sustainable Stewardship Yield</div>
              <div className="kpi-value">${(result.summary.revenue_high_usd/1000).toFixed(0)}k</div>
              <div className="kpi-delta">20-yr climate finance ceiling</div>
            </div>
          </div>

          <div className="alert alert-success" style={{ marginBottom:16 }}>
            <strong>Conservation Finance Projection:</strong> Over a 20-year horizon, this restoration corridor can generate <strong>${result.summary.revenue_low_usd?.toLocaleString()}</strong> – <strong>${result.summary.revenue_high_usd?.toLocaleString()} USD</strong> in verified carbon finance to fund community forest guards and agricultural extension.
          </div>

          <div className="chart-container" style={{ marginBottom:20 }}>
            <div className="chart-title">20-Year Biomass &amp; Carbon Recovery Trajectory (Monte Carlo Risk Corridors)</div>
            <ReactECharts option={chartOption()} style={{ height: 280 }} />
          </div>
          
          <div className="alert alert-warn" style={{ marginBottom:16, borderLeft: '4px solid #e67e22', background: 'rgba(230, 126, 34, 0.05)' }}>
            <strong>Ecological Risk Buffer:</strong> A mandatory <strong>20% permanence buffer deduction</strong> is automatically factored in to insure against wildland fire, drought mortality, and pest outbreaks.
          </div>

          <div className="card">
            <h3 style={{ color:'var(--accent)', fontWeight:700, marginBottom:12 }}>Selected Restoration Plots Shortlist</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Parcel ID</th><th>Ecological Cover</th><th>Area (ha)</th><th>Current Biomass</th><th>Nursery Cost/ha</th><th>Total Upfront</th><th>LCRI Score</th></tr></thead>
                <tbody>
                  {result.shortlist.map(r => (
                    <tr key={r.parcel_id}>
                      <td className="mono">{r.parcel_id}</td>
                      <td><span className="badge badge-green">{r.land_cover_class}</span></td>
                      <td>{r.area_ha?.toFixed(1)}</td>
                      <td>{r.current_agb_mg_ha?.toFixed(1)} <span style={{fontSize:'0.65rem', color:'var(--text-muted)'}}>Mg/ha</span></td>
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

