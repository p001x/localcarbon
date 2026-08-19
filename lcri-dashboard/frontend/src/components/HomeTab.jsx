import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/* ── Animated counter ──────────────────────────────────────────────────────── */
function AnimCounter({ end, suffix = '', decimals = 0, duration = 2200 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return
      observer.disconnect()
      let start = null
      const tick = ts => {
        if (!start) start = ts
        const p = Math.min((ts - start) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(parseFloat((ease * end).toFixed(decimals)))
        if (p < 1) requestAnimationFrame(tick)
        else setVal(end)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, decimals])
  return (
    <span ref={ref}>
      {decimals > 0 ? val.toFixed(decimals) : val.toLocaleString()}{suffix}
    </span>
  )
}

/* ── Stat tile ───────────────────────────────────────────────────────────── */
function StatTile({ end, suffix, label, sub, color = 'var(--accent)', decimals = 0 }) {
  return (
    <div style={{
      flex: '1 1 150px',
      background: 'rgba(0,0,0,0.3)',
      border: `1px solid ${color}40`,
      borderTop: `3px solid ${color}`,
      borderRadius: 12,
      padding: '18px 16px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.9rem', fontWeight: 800, color, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
        <AnimCounter end={end} suffix={suffix} decimals={decimals} />
      </div>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

/* ── Tool card ───────────────────────────────────────────────────────────── */
function ToolCard({ title, desc, path, accent, navigate }) {
  const col = accent || 'var(--accent)'
  return (
    <div
      onClick={() => navigate(path)}
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 18px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.15s',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = col; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: col }}>{title}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  )
}

/* ── Tour steps ──────────────────────────────────────────────────────────── */
const TOUR_STEPS = [
  { path: '/vision',     label: 'Story Map',              hint: 'Understand the problem, the science, and the investment case.' },
  { path: '/dashboard',  label: 'Satellite Dashboard',    hint: 'Run a live zonal analysis on any district using ESA CCI + GEDI.' },
  { path: '/lcri',       label: 'LCRI Ranking Engine',    hint: 'Triage candidate restoration parcels with custom factor weights.' },
  { path: '/simulator',  label: 'Restoration Simulator',  hint: 'Project 5–20 year carbon revenue with Monte Carlo risk bands.' },
  { path: '/gicumbi',   label: 'Green Gicumbi Audit',    hint: 'Ground-truth the 4,801 ha claim with Sentinel-2 orbital data.' },
]

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function HomeTab() {
  const navigate = useNavigate()
  const [tourStep, setTourStep] = useState(-1)

  const startTour = () => {
    setTourStep(0)
    navigate(TOUR_STEPS[0].path)
  }

  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', paddingBottom: 60 }}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(46,204,113,0.13) 0%, rgba(9,9,11,0) 60%)',
        border: '1px solid rgba(46,204,113,0.25)',
        borderRadius: 20,
        padding: '52px 40px 44px',
        marginBottom: 28,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,rgba(46,204,113,0.03) 0 1px,transparent 1px 60px),repeating-linear-gradient(90deg,rgba(46,204,113,0.03) 0 1px,transparent 1px 60px)', pointerEvents:'none' }} />
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(46,204,113,0.13)', color:'var(--accent)', padding:'4px 14px', borderRadius:20, fontSize:'0.75rem', fontWeight:700, letterSpacing: '0.04em', marginBottom:20, border:'1px solid rgba(46,204,113,0.28)' }}>
          RWANDA NATIONAL FOCUS · RCMRD ARTS &amp; MAPS COMPETITION 2026
        </div>
        <h1 style={{ fontSize:'2.7rem', color:'var(--accent)', margin:'0 0 14px 0', lineHeight:1.1, fontWeight:800, letterSpacing: '-0.02em' }}>
          LCRI Environmental Intelligence
        </h1>
        <p style={{ fontSize:'1.05rem', color:'var(--text-primary)', margin:'0 0 10px 0', fontWeight:500, lineHeight:1.6, maxWidth:680, marginLeft:'auto', marginRight:'auto' }}>
          Local Carbon Return Index — satellite-driven land triage, 20-year restoration simulation &amp; grassroots verification for Rwanda's conservation pipeline.
        </p>
        <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', maxWidth:600, margin:'0 auto 32px', lineHeight:1.7 }}>
          Built on <strong style={{color:'var(--text-sec)'}}>ESA CCI Biomass v7</strong> · <strong style={{color:'var(--text-sec)'}}>NASA GEDI LiDAR</strong> · <strong style={{color:'var(--text-sec)'}}>Sentinel-2 L2A</strong> · <strong style={{color:'var(--text-sec)'}}>Chave et al. 2014</strong>
        </p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ padding:'13px 32px', fontSize:'0.95rem', fontWeight:700, background:'linear-gradient(135deg, #2ecc71, #27ae60)', boxShadow:'0 4px 20px rgba(46,204,113,0.35)' }}
            onClick={startTour}
          >
            Start Guided Competition Tour (5 Steps) →
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding:'13px 24px', fontSize:'0.95rem', fontWeight:600 }}
            onClick={() => navigate('/vision')}
          >
            Explore Interactive Story Map
          </button>
        </div>
      </div>

      {/* ── Live Stat Counters ────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:28 }}>
        <StatTile end={4801}   suffix=" ha"  label="Green Gicumbi Pilot"      sub="Northern Rwanda agroforestry claim"        color="#2ecc71" />
        <StatTile end={162750} suffix=""     label="NDC CO₂e Target"          sub="Rwanda national commitment (tCO₂e)"       color="#4fc3f7" />
        <StatTile end={96.8}   suffix="%"    label="Sentinel-2 Accuracy"      sub="Orbital vs ground-truth validation"        color="#f1c40f" decimals={1} />
        <StatTile end={30}     suffix=" yr"  label="Simulation Horizon"       sub="Logistic growth projection window"         color="#9b59b6" />
        <StatTile end={25}     suffix=" USD" label="Premium Carbon Price/ton" sub="Base $15 + biodiversity + gender equity"   color="#e67e22" />
      </div>

      {/* ── Conservation Banner ───────────────────────────────────────── */}
      <div style={{
        background:'linear-gradient(135deg, rgba(241,196,15,0.09), rgba(39,174,96,0.07))',
        border:'1px solid rgba(241,196,15,0.3)',
        borderRadius:14,
        padding:'20px 28px',
        marginBottom:28,
        display:'flex', alignItems:'flex-start', gap:20,
      }}>
        <div style={{ background: 'rgba(241,196,15,0.15)', border: '1px solid rgba(241,196,15,0.4)', borderRadius: 8, padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: '#f1c40f', flexShrink: 0 }}>
          MISSION
        </div>
        <div>
          <div style={{ fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'#f1c40f', fontWeight:800 }}>
            Ecosystem Protection &amp; Biodiversity Integrity
          </div>
          <div style={{ fontSize:'0.98rem', color:'var(--text-primary)', fontWeight:700, margin:'4px 0 6px' }}>
            Safeguarding Rwanda's National Parks: Volcanoes · Nyungwe · Gishwati-Mukura · Akagera
          </div>
          <p style={{ margin:0, fontSize:'0.83rem', color:'var(--text-sec)', lineHeight:1.6 }}>
            Live Sentinel-2 boundary monitoring tracks unauthorized clearcuts. LCRI recommends indigenous species —&nbsp;
            <em>Markhamia lutea</em> (Umusave), <em>Polyscias fulva</em> (Umurava) — to restore degraded park buffer zones with community livelihood incentives.
          </p>
        </div>
      </div>

      {/* ── Core Intelligence Tools ───────────────────────────────────── */}
      <div style={{ fontSize:'0.67rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', fontWeight:700, marginBottom:12 }}>
        Ecological Triage &amp; Modeling Tools
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:24 }}>
        <ToolCard navigate={navigate} path="/dashboard"  title="Satellite Dashboard"  desc="Live ESA CCI zonal statistics, KPI telemetry, and Sentinel-2 change detection." />
        <ToolCard navigate={navigate} path="/lcri"       title="Ecological Ranking"    desc="Multi-criteria parcel triage: erosion risk, canopy loss, slope, and seed proximity." />
        <ToolCard navigate={navigate} path="/simulator"  title="Restoration Simulator" desc="20-year logistic canopy growth model with Monte Carlo risk buffer corridors." accent="#27ae60" />
        <ToolCard navigate={navigate} path="/registry"   title="Project Registry"      desc="Regional forest project index with live satellite biomass verification." accent="#3498db" />
      </div>

      {/* ── Grassroots Validation ─────────────────────────────────────── */}
      <div style={{ fontSize:'0.67rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', fontWeight:700, marginBottom:12 }}>
        Grassroots Validation &amp; Ground Truth
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:36 }}>
        <ToolCard navigate={navigate} path="/gicumbi"    title="Green Gicumbi Audit" desc="Independent Sentinel-2 orbital cross-check of the 4,801 ha Northern Rwanda claim." accent="#f1c40f" />
        <ToolCard navigate={navigate} path="/ledger"     title="Community Ledger"    desc="Geo-tagged field submissions with per-tree allometric scoring and satellite cross-check." accent="#9b59b6" />
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{ padding:'16px 24px', background:'rgba(255,255,255,0.02)', borderRadius:10, border:'1px solid var(--border)', textAlign:'center' }}>
        <p style={{ margin:0, color:'var(--text-muted)', fontSize:'0.8rem', lineHeight:1.9 }}>
          All Earth Observation datasets open-access under CC-BY-4.0 / CC-0 licences. Full provenance →&nbsp;
          <span onClick={() => navigate('/datasources')} style={{ color:'var(--accent)', cursor:'pointer', textDecoration:'underline' }}>Data Sources</span>
          &nbsp;·&nbsp;
          <span onClick={() => navigate('/methodology')} style={{ color:'var(--accent)', cursor:'pointer', textDecoration:'underline' }}>Methodology</span>
        </p>
      </div>

    </div>
  )
}

