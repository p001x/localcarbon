export default function DashboardReportsPanel({ ctx }) {
  const {
    hasDistrict, district, aoiGeom,
    pdfLoading, handleDownloadPdf,
    customAreas, reportMd, handlePreviewReport
  } = ctx;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ background: 'rgba(46,204,113,0.05)', border: '1px solid rgba(46,204,113,0.3)' }}>
        <h3 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>
          📄 Official Carbon Audit Verification Report Generator
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)', marginBottom: 16 }}>
          Export an official, citable 2-page PDF Verification Report for {hasDistrict ? <strong>{district}</strong> : 'any selected area'}. Includes satellite biomass statistics, IPCC AR6 conversion factors, and carbon credit market valuation.
        </p>
        <button 
          className="btn btn-primary" 
          onClick={handleDownloadPdf} 
          disabled={pdfLoading || (!hasDistrict && !aoiGeom)} 
          style={{ padding: '10px 24px', fontSize: '0.95rem', fontWeight: 700 }}
        >
          {pdfLoading ? '⏳ Generating PDF Report…' : `📄 Download ${district || 'District'} Audit Report (PDF)`}
        </button>
      </div>

      {customAreas[district] && (
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h3 style={{ color:'var(--accent)', fontWeight:700 }}>📄 Scientific Report — {district}</h3>
            <button className="btn btn-secondary btn-sm" id="preview-report-btn" onClick={handlePreviewReport}>
              Preview Report Markdown
            </button>
          </div>
          {reportMd && (
            <pre style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--text-sec)', whiteSpace:'pre-wrap', lineHeight:1.7 }}>
              {reportMd}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
