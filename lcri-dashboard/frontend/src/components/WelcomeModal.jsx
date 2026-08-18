import { useState, useEffect } from 'react'

export default function WelcomeModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#0a1a0d',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--accent)' }}>
            🌿 Welcome to the LCRI Dashboard
          </h2>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-sec)', fontSize: '0.95rem' }}>
            Empowering climate finance through open Earth Observation data.
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: 'rgba(46, 204, 113, 0.05)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Why we built this</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-sec)', lineHeight: 1.6 }}>
              The Local Carbon Return Index (LCRI) was created to bridge the gap between high-level climate science and on-the-ground reforestation efforts in Africa. We utilize rigorous, peer-reviewed satellite data to evaluate forest ecosystems and validate carbon claims without requiring expensive, on-the-ground manual surveys.
            </p>
          </div>

          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛰️ Why ESA CCI Biomass?
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-sec)', lineHeight: 1.6 }}>
              We use the <strong>ESA Climate Change Initiative (CCI) Biomass v7.0</strong> dataset because it provides the most robust, globally harmonized satellite measurements of above-ground biomass. By cross-validating with NASA GEDI LiDAR, it offers unprecedented accuracy for tracking deforestation and forest growth across the African continent over time.
            </p>
          </div>

          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌳 The Science of Carbon
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-sec)', lineHeight: 1.6 }}>
              When estimating carbon yields, we utilize the <strong>Chave et al. (2014)</strong> allometric equations and the <strong>Tallo database</strong>. These represent the peer-reviewed gold standard in tropical forest carbon estimation, ensuring our CO₂ equivalent (CO₂e) metrics are scientifically defensible for certified carbon registries.
            </p>
          </div>
          
        </div>

        {/* Footer */}
        <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary" 
            onClick={onClose}
            style={{ padding: '10px 24px', fontSize: '1rem' }}
          >
            Explore the Dashboard
          </button>
        </div>
        
        {/* Close button (top right) */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '24px', right: '32px',
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1
          }}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
