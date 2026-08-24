export default function DashboardMapPanel({ ctx }) {
  const { 
    hasDistrict, district, setDistrict, districtOpts, triggerAnalysis, 
    kpiLoading, aoiGeom, mode, setMode, drawnLayer, saveName, 
    setSaveName, handleSaveArea, saveMsg, availShp, selShp, 
    setSelShp, geeTile, mapRef 
  } = ctx;

  return (
    <div className="col2-23" style={{ marginBottom:20, alignItems:'stretch' }}>

      {/* ── Left control panel ─────────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

        {/* Area of Interest card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize:'0.9rem', color:'var(--accent)', margin: 0, fontWeight:700 }}>
              📍 Area of Interest
            </h3>
            <span style={{ 
              fontSize: '0.72rem', 
              background: 'rgba(241, 196, 15, 0.15)', 
              border: '1px solid rgba(241, 196, 15, 0.4)', 
              color: '#f1c40f', 
              padding: '3px 8px', 
              borderRadius: '12px', 
              fontWeight: 700 
            }}>
              🛡️ Conservation Active (WDPA)
            </span>
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="district-select-inline">Study Area / District</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select id="district-select-inline" className="form-input form-select" value={district}
                onChange={e => setDistrict(e.target.value)} style={{ flex: '1 1 200px' }}>
                {districtOpts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button 
                className="btn btn-primary" 
                title="Run Satellite Analysis"
                onClick={() => triggerAnalysis()}
                disabled={!aoiGeom || kpiLoading}
                style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                {kpiLoading ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : '▶️ Run Analysis'}
              </button>
            </div>
          </div>

          <div className="form-row" style={{ marginBottom:0 }}>
            <label className="form-label">Selection Mode</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[['district','District'],['upload','Upload Shapefile / GeoJSON']].map(([v,l]) => (
                <button key={v} id={`mode-${v}`}
                  className={`btn btn-sm ${mode===v?'btn-primary':'btn-secondary'}`}
                  onClick={() => setMode(v)}>{l}</button>
              ))}
            </div>
          </div>

          {mode === 'upload' && (
            <div className="alert alert-info" style={{ marginTop:10 }}>
              Upload a ZIP file containing your Shapefile (.shp, .shx, .dbf) or a GeoJSON file.
              <div style={{ marginTop:8 }}>
                <input type="file" accept=".zip,.geojson,.json,.topojson" className="form-input" style={{ padding: '4px' }} onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await fetch('/api/upload-area', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (data.geometry) {
                      ctx.setAoiGeom(data.geometry);
                      ctx.setDistrict('Uploaded Area');
                    } else if (data.error) {
                      alert(data.error);
                    }
                  } catch (err) {
                    alert('Upload failed: ' + err.message);
                  }
                }} />
                {aoiGeom && (
                  <div style={{ marginTop:8 }}>
                    <input className="form-input" placeholder="Name this area…" value={saveName} id="save-area-name"
                      onChange={e => setSaveName(e.target.value)} style={{ marginBottom:6 }} />
                    <button className="btn btn-primary btn-sm" id="save-area-btn" onClick={handleSaveArea}>
                      💾 Save & Use
                    </button>
                    {saveMsg && <p style={{ color:'var(--accent)', fontSize:'0.78rem', marginTop:6 }}>{saveMsg}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Overlay layers card */}
        <div className="card">
          <h3 style={{ fontSize:'0.85rem', color:'var(--accent)', marginBottom:10, fontWeight:700 }}>
            🗂️ Overlay Vector Layers
          </h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {availShp.map(s => (
              <label key={s} style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem', cursor:'pointer', color:'var(--text-sec)' }}>
                <input type="checkbox" checked={selShp.includes(s)} id={`shp-${s}`}
                  onChange={e => setSelShp(e.target.checked ? [...selShp,s] : selShp.filter(x => x!==s))} />
                {s.replace('.shp','')}
              </label>
            ))}
          </div>
        </div>

        {/* Quick status card */}
        <div className="card" style={{ background:'rgba(46,204,113,0.04)' }}>
          <h3 style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>
            🛰️ Data Layers Active
          </h3>
          <div style={{ fontSize:'0.76rem', color:'var(--text-sec)', display:'flex', flexDirection:'column', gap:5 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>Protected National Parks</span>
              <span style={{ color:'var(--accent)', fontWeight:600 }}>🛡️ Active (WDPA)</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>AGB Satellite Layer</span>
              <span style={{ color: geeTile ? 'var(--accent)' : 'var(--accent-red)', fontWeight:600 }}>
                {geeTile ? '● Active' : '○ Loading…'}
              </span>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>Vector Overlays</span>
              <span style={{ color:'var(--accent)', fontWeight:600 }}>● {selShp.length} layers</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span>Selected Area</span>
              <span style={{ color: hasDistrict ? 'var(--accent)' : 'var(--text-muted)', fontWeight:600 }}>
                {hasDistrict ? `● ${district}` : '○ None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <div className="map-container" style={{ height:460, position:'relative' }}>
        <div ref={mapRef} style={{ width:'100%', height:'100%' }} />

        {/* Map guide overlay when nothing is selected */}
        {!hasDistrict && !aoiGeom && (
          <div style={{
            position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)',
            background:'rgba(9,9,11,0.85)', border:'1px solid var(--border)',
            borderRadius:8, padding:'8px 16px', fontSize:'0.78rem',
            color:'var(--text-sec)', pointerEvents:'none', zIndex:500,
            backdropFilter:'blur(4px)', whiteSpace:'nowrap'
          }}>
            ☝️ Select a district above or draw a polygon to load carbon analysis
          </div>
        )}
      </div>
    </div>
  )
}
