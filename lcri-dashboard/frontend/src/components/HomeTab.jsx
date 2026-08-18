import { useState } from 'react'

export default function HomeTab({ setActiveTab }) {
  const [tourActive, setTourActive] = useState(false)

  const startTour = () => {
    setTourActive(true)
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Tour Banner */}
      {tourActive && (
        <div style={{
          position: 'sticky', top: '10px', zIndex: 1000,
          background: '#0a1a0d', border: '2px solid var(--accent)',
          borderRadius: '12px', padding: '16px 24px', marginBottom: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', fontWeight: 800 }}>
              🏆 Guided Competition Tour (Step 1 of 5)
            </span>
            <h4 style={{ margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
              1. Project Provenance &amp; Earth Observation Science
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-sec)' }}>
              Review the project narrative below. When ready, click "Next Step" to inspect live Sentinel-2 satellite data.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-sm btn-secondary" onClick={() => setTourActive(false)}>Exit Tour</button>
            <button className="btn btn-sm btn-primary" onClick={() => setActiveTab('dashboard')}>
              Step 2: Satellite Map ➔
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(46,204,113,0.12) 0%, rgba(10,26,13,0) 100%)',
        border: '1px solid rgba(46,204,113,0.3)',
        borderRadius: '16px',
        padding: '40px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'inline-block', background: 'rgba(46,204,113,0.15)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '16px' }}>
          🇷🇼 National Focus: Rwanda Forest Ecosystems
        </div>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--accent)', margin: '0 0 16px 0' }}>
          🌿 LCRI Dashboard
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: '0 0 32px 0', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
          Empowering climate finance and protecting Rwanda's forest ecosystems through open, transparent Earth Observation data.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            style={{ padding: '12px 28px', fontSize: '1.05rem', background: 'linear-gradient(135deg, #2ecc71, #27ae60)' }}
            onClick={startTour}
          >
            🚀 Start Guided Competition Tour
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '12px 24px', fontSize: '1.05rem' }}
            onClick={() => setActiveTab('dashboard')}
          >
            📍 Jump to Map Dashboard
          </button>
        </div>
      </div>

      {/* 🛡️ PROMINENT CONSERVATION BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(241, 196, 15, 0.12) 0%, rgba(39, 174, 96, 0.08) 100%)',
        border: '2px solid rgba(241, 196, 15, 0.4)',
        borderRadius: '16px',
        padding: '24px 32px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: '3rem', flexShrink: 0 }}>🛡️</div>
        <div>
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f1c40f', fontWeight: 800 }}>
            Core Mission: Forest Conservation &amp; Biodiversity Protection
          </div>
          <h3 style={{ margin: '4px 0 8px 0', fontSize: '1.3rem', color: '#ffffff' }}>
            Directly Protecting Rwanda's National Parks &amp; Wildlife Habitats
          </h3>
          <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-sec)', lineHeight: 1.6 }}>
            Our platform uses satellite Earth Observation to guard Rwanda's national parks (<strong>Volcanoes, Nyungwe, Gishwati-Mukura, Akagera</strong>). We track border clearcuts using live Sentinel-2 imagery and recommend native tree species (<em>Markhamia lutea</em>, <em>Polyscias fulva</em>) to restore degraded ecosystems.
          </p>
        </div>
      </div>

      {/* 3 Pillar Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        
        {/* Why this tool */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🎯</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0' }}>The Challenge</h3>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
            The Local Carbon Return Index (LCRI) bridges the gap between climate science and on-the-ground reforestation efforts in Rwanda without expensive field surveys.
          </p>
        </div>

        {/* Why ESA CCI */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', border: '1px solid rgba(52, 152, 219, 0.3)', background: 'rgba(52, 152, 219, 0.03)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🛰️</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Why ESA CCI?</h3>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
            We use ESA CCI Biomass v7.0 cross-validated with NASA GEDI LiDAR for unprecedented accuracy in tracking forest canopy over time.
          </p>
        </div>

        {/* Why Chave 2014 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', border: '1px solid rgba(46, 204, 113, 0.3)', background: 'rgba(46, 204, 113, 0.03)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🌳</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Carbon Science</h3>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
            We utilize Chave et al. (2014) equations &amp; Tallo database—the peer-reviewed gold standard in tropical forest carbon estimation.
          </p>
        </div>

      </div>

      <div style={{ marginTop: '40px', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Designed for the RCMRD Arts &amp; Maps Competition 2026. <br/>
          To view full dataset provenance and citations, visit the <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('datasources'); }} style={{ color: 'var(--accent)' }}>Data Sources</a> tab.
        </p>
      </div>

    </div>
  )
}
