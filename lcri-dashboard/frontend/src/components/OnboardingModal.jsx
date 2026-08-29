import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if the user has already seen the onboarding modal
    const hasSeenOnboarding = localStorage.getItem('lcri-onboarding-seen')
    if (!hasSeenOnboarding) {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('lcri-onboarding-seen', 'true')
  }

  const handleGoToGuide = () => {
    handleClose()
    navigate('/guide')
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-fade-in" style={{ padding: '30px', maxWidth: '500px', width: '90%', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '10px', color: 'var(--accent)' }}>Welcome to LCRI</h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-sec)', marginBottom: '24px' }}>
          Your environmental intelligence dashboard for tracking, verifying, and forecasting forest conservation.
        </p>
        
        <div style={{ textAlign: 'left', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--accent)', color: '#000', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>Explore the Map</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Use the Satellite Dashboard to view live biomass metrics.</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--accent)', color: '#000', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>Simulate Growth</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Forecast canopy trajectories in the Restoration Simulator.</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ background: 'var(--accent)', color: '#000', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>Verify Projects</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Review grassroots claims in the Community Ledger.</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={handleClose}>
            Skip for now
          </button>
          <button className="btn btn-primary" onClick={handleGoToGuide}>
            Read Full Guide
          </button>
        </div>
      </div>
    </div>
  )
}
