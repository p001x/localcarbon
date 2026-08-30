import React from 'react'

export default function GettingStartedTab() {
  return (
    <div className="getting-started-container animate-fade-in" style={{ padding: '10px 0', maxWidth: '900px', margin: '0 auto' }}>
      
      <div className="hero-section" style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h2 className="hero-title" style={{ fontSize: '2rem' }}>Welcome to LCRI Dashboard</h2>
        <p className="hero-sub" style={{ fontSize: '1.1rem', color: 'var(--text-sec)', maxWidth: '600px', margin: '0 auto' }}>
          Your central hub for tracking, simulating, and verifying ecological restoration and carbon sequestration across Rwanda.
        </p>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '30px' }}>
        <strong>Note on Live Satellite Data:</strong> Upon initial launch, the dashboard may temporarily start in offline mode. Please allow up to 30 seconds for the Earth Engine service account to authenticate and come online to access live biomass layers.
      </div>

      <div className="guide-section">
        <h3 style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
          1. Overview & Vision
        </h3>
        <div className="col2" style={{ marginBottom: '30px' }}>
          <div className="card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Home</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sec)' }}>
              The high-level summary of the dashboard's capabilities. Start here to get a quick pulse of the environmental intelligence tools available.
            </p>
          </div>
          <div className="card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Story Map</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sec)' }}>
              An interactive, scrollytelling journey explaining the context of Rwanda's forest corridors and how earth observation protects them.
            </p>
          </div>
        </div>

        <h3 style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
          2. Ecological Triage & Modeling
        </h3>
        <div className="col2" style={{ marginBottom: '30px' }}>
          <div className="card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Satellite Dashboard</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sec)' }}>
              View live canopy KPIs and biomass metrics across different districts. Use the sidebar to switch regions and compare data.
            </p>
          </div>
          <div className="card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Ecological Ranking (LCRI)</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sec)' }}>
              Triage candidate parcels based on erosion risk, wildlife buffers, and biomass potential to prioritize conservation efforts.
            </p>
          </div>
          <div className="card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Restoration Simulator</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sec)' }}>
              Forecast canopy trajectories and community finance over a 20-year span based on different restoration interventions.
            </p>
          </div>
          <div className="card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Project Registry</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sec)' }}>
              A verifiable ledger of regional forest projects verified through satellite imagery and on-the-ground reporting.
            </p>
          </div>
        </div>

        <h3 style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
          3. Grassroots Validation & Auditing
        </h3>
        <div className="col2" style={{ marginBottom: '30px' }}>
          <div className="card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Green Gicumbi Audit</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sec)' }}>
              Independent satellite verification of agroforestry claims specific to the Green Gicumbi initiative.
            </p>
          </div>
          <div className="card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Community Ledger</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sec)' }}>
              Review grassroots agroforestry submissions and allometric data provided by local farmers and community validators.
            </p>
          </div>
        </div>

        <h3 style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
          4. Science & Reference
        </h3>
        <div className="col2" style={{ marginBottom: '30px' }}>
          <div className="card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Visual Atlas & Lens</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sec)' }}>
              Explore the global forest biomass sequestration explorer and visual carbon landscapes mapped for Rwanda.
            </p>
          </div>
          <div className="card">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Methodology & Data</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-sec)' }}>
              Dive into the scientific methodology, allometric models, limitations, and data provenance ensuring trust in the system.
            </p>
          </div>
        </div>
        
      </div>
      
      <div className="alert alert-info" style={{ marginTop: '20px' }}>
        <strong>Pro Tip:</strong> Use the sidebar on the left to quickly jump between these tools and change your active Study Area.
      </div>

    </div>
  )
}
