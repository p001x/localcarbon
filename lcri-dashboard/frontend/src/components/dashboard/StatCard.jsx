export default function StatCard({ icon, label, value, delta, deltaClass, loading, empty }) {
  return (
    <div className="kpi-card" style={{ position:'relative', minHeight:90 }}>
      <div style={{ fontSize:'1.1rem', marginBottom:4 }}>{icon}</div>
      <div className="kpi-label">{label}</div>
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
          <div className="spinner" style={{ width:16, height:16, borderWidth:2 }} />
          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Loading…</span>
        </div>
      ) : empty ? (
        <div style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-muted)', marginTop:4 }}>—</div>
      ) : (
        <>
          <div className="kpi-value" style={{ fontSize:'1.3rem' }}>{value}</div>
          {delta && <div className={`kpi-delta${deltaClass ? ' '+deltaClass : ''}`}>{delta}</div>}
        </>
      )}
    </div>
  )
}
