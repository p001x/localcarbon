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
    <div style={{ maxWidth: 1020, margin: '0 auto', paddingBottom: 0 }}>

      {/* ── Navbar (Header) ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 40px 0', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--accent)', color: '#000', fontWeight: 900, padding: '4px 8px', borderRadius: 6, fontSize: '1.2rem', letterSpacing: '-0.05em' }}>LCRI</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Environmental Intelligence</div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-sec)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sec)'} onClick={() => navigate('/vision')}>Story Map</span>
          <span style={{ color: 'var(--text-sec)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sec)'} onClick={() => navigate('/methodology')}>Methodology</span>
          <span style={{ color: 'var(--text-sec)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sec)'} onClick={() => navigate('/datasources')}>Data Sources</span>
          <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => navigate('/dashboard')}>Launch App</button>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(46,204,113,0.13) 0%, rgba(9,9,11,0) 60%)',
        border: '1px solid rgba(46,204,113,0.25)',
        borderRadius: 20,
        padding: '52px 40px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: '40px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,rgba(46,204,113,0.03) 0 1px,transparent 1px 60px),repeating-linear-gradient(90deg,rgba(46,204,113,0.03) 0 1px,transparent 1px 60px)', pointerEvents:'none' }} />
        
        {/* Left Column: Text */}
        <div style={{ flex: '1 1 400px', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize:'2.8rem', color:'var(--accent)', margin:'0 0 18px 0', lineHeight:1.1, fontWeight:800, letterSpacing: '-0.02em' }}>
            LCRI Environmental Intelligence
          </h1>
          <p style={{ fontSize:'1.1rem', color:'var(--text-primary)', margin:'0 0 12px 0', fontWeight:500, lineHeight:1.6, maxWidth: '100%' }}>
            Local Carbon Return Index — satellite-driven land triage, 20-year restoration simulation &amp; grassroots verification for Rwanda's conservation pipeline.
          </p>
          <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', margin:'0 0 32px 0', lineHeight:1.7 }}>
            Built on <strong style={{color:'var(--text-sec)'}}>ESA CCI Biomass v7</strong> · <strong style={{color:'var(--text-sec)'}}>NASA GEDI LiDAR</strong> · <strong style={{color:'var(--text-sec)'}}>Sentinel-2 L2A</strong>
          </p>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            <button
              className="btn btn-primary"
              style={{ padding:'13px 28px', fontSize:'0.95rem', fontWeight:700, background:'linear-gradient(135deg, #2ecc71, #27ae60)', boxShadow:'0 4px 20px rgba(46,204,113,0.35)' }}
              onClick={startTour}
            >
              Start Guided Competition Tour →
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding:'13px 24px', fontSize:'0.95rem', fontWeight:600 }}
              onClick={() => navigate('/vision')}
            >
              Explore Story Map
            </button>
          </div>
        </div>

        {/* Right Column: Image */}
        <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <img 
            src="/hero_satellite.jpg" 
            alt="3D Satellite scanning forest" 
            style={{ 
              width: '100%', 
              maxWidth: '380px', 
              borderRadius: '16px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              border: '1px solid rgba(46,204,113,0.3)'
            }} 
          />
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

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize:'0.67rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', fontWeight:700, marginBottom:16, textAlign: 'center' }}>
          How LCRI Works
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ flex: '1 1 200px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>🛰️</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>1. Orbital Scanning</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sec)', lineHeight: 1.5 }}>Ingest real-time Sentinel-2 L2A and ESA CCI Biomass data to assess degraded land.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--border)' }}>→</div>
          <div style={{ flex: '1 1 200px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>🧠</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>2. AI Estimation</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sec)', lineHeight: 1.5 }}>Apply Chave et al. allometry to forecast 20-year CO₂e yield and ecological impact.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--border)' }}>→</div>
          <div style={{ flex: '1 1 200px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>🌱</div>
            <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>3. Carbon Finance</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sec)', lineHeight: 1.5 }}>Issue verified green bonds to local communities, driving grassroots restoration.</div>
          </div>
        </div>
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

      {/* ── Tech Stack & Data Partners ────────────────────────────────── */}
      <div style={{ marginBottom: 36, textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ fontSize:'0.67rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', fontWeight:700, marginBottom:16 }}>
          Powered By Open Earth Observation Data
        </div>
        <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap', opacity: 0.85 }}>
          <div style={{ fontWeight: 800, color: '#f1c40f', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize:'1.3rem'}}>🇪🇺</span> COPERNICUS</div>
          <div style={{ fontWeight: 800, color: '#3498db', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize:'1.3rem'}}>🛰️</span> ESA CCI</div>
          <div style={{ fontWeight: 800, color: '#e74c3c', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize:'1.3rem'}}>🚀</span> NASA GEDI</div>
          <div style={{ fontWeight: 800, color: '#9b59b6', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize:'1.3rem'}}>🌍</span> RCMRD</div>
          <div style={{ fontWeight: 800, color: '#2ecc71', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{fontSize:'1.3rem'}}>💻</span> PYTHON + REACT</div>
        </div>
      </div>

      {/* ── Expanded Footer ──────────────────────────────────────────── */}
      <footer style={{ marginTop: 60, borderTop: '1px solid var(--border)', paddingTop: 40, paddingBottom: 40, display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between' }}>
        
        {/* Column 1: Brand & Contact */}
        <div style={{ flex: '1 1 250px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'var(--border)', color: 'var(--accent)', fontWeight: 900, padding: '4px 8px', borderRadius: 6, fontSize: '1.1rem' }}>LCRI</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Project HQ</div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-sec)', lineHeight: 1.8 }}>
            Kigali Innovation City<br/>
            Kigali, Rwanda<br/>
            <a href="mailto:pierrendorimana16@gmail.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>pierrendorimana16@gmail.com</a><br/>
            +250 798 790 115<br/>
            <a href="https://www.linkedin.com/in/ndorimana-pierre-b470bb2a8/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>LinkedIn Profile</a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Platform</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem', color: 'var(--text-sec)' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sec)'} onClick={() => navigate('/dashboard')}>Satellite Dashboard</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sec)'} onClick={() => navigate('/simulator')}>Restoration Simulator</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sec)'} onClick={() => navigate('/gicumbi')}>Green Gicumbi Audit</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sec)'} onClick={() => navigate('/ledger')}>Community Ledger</span>
          </div>
        </div>

        {/* Column 3: Legal & Citations */}
        <div style={{ flex: '1 1 250px' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Science &amp; Legal</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem', color: 'var(--text-sec)' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sec)'} onClick={() => navigate('/methodology')}>Methodology &amp; Allometry</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sec)'} onClick={() => navigate('/datasources')}>Data Provenance</span>
            <span style={{ color: 'var(--text-muted)' }}>Privacy Policy</span>
          </div>
        </div>

      </footer>
      <div style={{ textAlign: 'center', padding: '24px 0', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        &copy; 2026 Local Carbon Return Index (LCRI) Project. All Earth Observation datasets open-access under CC-BY-4.0.
      </div>

    </div>
  )
}

