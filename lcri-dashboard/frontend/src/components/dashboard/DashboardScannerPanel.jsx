export default function DashboardScannerPanel({ ctx }) {
  const { hasDistrict, district, targetMonth, setTargetMonth, handleUpdateScannerDate, monitoringLoading, monitoringImgs, selectedIndex, setSelectedIndex } = ctx;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ padding: 20, background: 'var(--panel-bg)', borderRadius: 8, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem' }}>
              🛰️ Sentinel-2 Computer Vision Vegetation Scanner{hasDistrict ? ` — ${district}` : ''}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)', marginTop: 4 }}>
              Live high-resolution satellite imagery for the selected area running real-time Computer Vision analysis.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 'bold' }}>⏱️ Time Machine:</span>
            <input 
              type="month" 
              value={targetMonth} 
              onChange={e => setTargetMonth(e.target.value)} 
              style={{ background: '#1a1a1a', color: '#fff', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 4 }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleUpdateScannerDate}>Scan History</button>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* True Color */}
        <div style={{ flex: 1, minWidth: 300, background: '#0a1912', borderRadius: 8, padding: 10, border: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#80cbc4', marginBottom: 8, textAlign: 'center' }}>Real Satellite Image (True Color)</h4>
          <div style={{ width: '100%', height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: 4, overflow: 'hidden' }}>
            {monitoringLoading ? (
              <div className="spinner" style={{ width: 24, height: 24 }} />
            ) : monitoringImgs?.true_color_url ? (
              <img src={monitoringImgs.true_color_url} alt="True Color Satellite" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem', textAlign: 'center' }}>
                {monitoringImgs 
                  ? (monitoringImgs.offline ? 'Image unavailable (Earth Engine Offline Mode)' : 'Image unavailable (too cloudy or large area)') 
                  : 'Select a district on the map to load image'}
              </span>
            )}
          </div>
        </div>

        {/* Health Scanner */}
        <div style={{ flex: 1, minWidth: 300, background: '#0a1912', borderRadius: 8, padding: 10, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            <button 
              className={`btn btn-sm ${selectedIndex === 'ndvi' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setSelectedIndex('ndvi')}
            >NDVI (Vegetation Density)</button>
            <button 
              className={`btn btn-sm ${selectedIndex === 'evi' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setSelectedIndex('evi')}
            >EVI (Enhanced Vegetation)</button>
            <button 
              className={`btn btn-sm ${selectedIndex === 'ndwi' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setSelectedIndex('ndwi')}
            >NDWI (Water Table)</button>
            <button 
              className={`btn btn-sm ${selectedIndex === 'nbr' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setSelectedIndex('nbr')}
            >NBR (Clearcuts / Burns)</button>
            <button 
              className={`btn btn-sm ${selectedIndex === 'dw' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setSelectedIndex('dw')}
            >Dynamic World (LULC)</button>
            <button 
              className={`btn btn-sm ${selectedIndex === 'hansen' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setSelectedIndex('hansen')}
            >Hansen (Forest Loss)</button>
          </div>
          
          <div style={{ width: '100%', height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: 4, overflow: 'hidden' }}>
            {monitoringLoading ? (
              <div className="spinner" style={{ width: 24, height: 24 }} />
            ) : monitoringImgs?.[`${selectedIndex}_url`] ? (
              <img src={monitoringImgs[`${selectedIndex}_url`]} alt={`${selectedIndex.toUpperCase()} Scanner`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem', textAlign: 'center' }}>
                {monitoringImgs?.offline ? 'Image unavailable (Earth Engine Offline Mode)' : 'Image unavailable'}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {selectedIndex === 'ndvi' && (
              <><span style={{ color: '#d73027', fontWeight: 700 }}>Sick / Clearcut</span><span style={{ color: '#1a9850', fontWeight: 700 }}>Healthy / Dense</span></>
            )}
            {selectedIndex === 'evi' && (
              <><span style={{ color: '#ce7e45', fontWeight: 700 }}>Low Biomass</span><span style={{ color: '#011d01', fontWeight: 700 }}>Dense Canopy</span></>
            )}
            {selectedIndex === 'ndwi' && (
              <><span style={{ color: '#dfc27d', fontWeight: 700 }}>Dry Land</span><span style={{ color: '#018571', fontWeight: 700 }}>Water Body</span></>
            )}
            {selectedIndex === 'nbr' && (
              <><span style={{ color: '#000000', fontWeight: 700 }}>Burned / Destroyed</span><span style={{ color: '#1a9850', fontWeight: 700 }}>Healthy Forest</span></>
            )}
            {selectedIndex === 'dw' && (
              <><span style={{ color: '#419BDF', fontWeight: 700 }}>Water</span>
                <span style={{ color: '#397D49', fontWeight: 700 }}>Trees</span>
                <span style={{ color: '#E49635', fontWeight: 700 }}>Crops</span>
                <span style={{ color: '#C4281B', fontWeight: 700 }}>Built Area</span></>
            )}
            {selectedIndex === 'hansen' && (
              <><span style={{ color: '#ffffcc', fontWeight: 700 }}>Loss in 2001</span><span style={{ color: '#800026', fontWeight: 700 }}>Loss in 2023</span></>
            )}
          </div>
        </div>
        
        {/* Telemetry HUD */}
        <div style={{ flex: '1 1 100%', minWidth: 300, background: 'rgba(46,204,113,0.05)', borderRadius: 8, padding: 16, border: '1px solid rgba(46,204,113,0.3)' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--accent)', marginBottom: 12 }}>🛰️ Satellite Telemetry & Metadata</h4>
          
          {monitoringLoading ? (
            <div className="spinner" style={{ width: 24, height: 24, margin: '20px 0' }} />
          ) : monitoringImgs?.metadata ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Constellation</div>
                <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>{monitoringImgs.metadata.satellite}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Capture Date</div>
                <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>{monitoringImgs.metadata.acquisition_date}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cloud Cover</div>
                <div style={{ fontSize: '1.1rem', color: monitoringImgs.metadata.cloud_cover_pct > 20 ? 'var(--accent-red)' : '#fff', fontWeight: 'bold' }}>
                  {monitoringImgs.metadata.cloud_cover_pct.toFixed(1)}%
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Image Size</div>
                <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>{monitoringImgs.metadata.image_size?.join?.(' x ') || '512 x 512'} px</div>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Telemetry data unavailable</span>
          )}
        </div>
      </div>
    </div>
  )
}
