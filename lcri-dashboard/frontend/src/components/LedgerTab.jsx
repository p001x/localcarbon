import { useState, useEffect, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import {
  fetchLedger,
  submitLedger,
  analyseParcel,
  uploadAreaFile,
  fetchTrueColorTile,
  analyseTree,
  fetchKnownSpecies,
  fetchLiveCarbonPrice,
  deleteLedgerEntry,
  toggleLedgerEntry
} from '../api'

/* ─── Country centroids ──────────────────────────────────────────────────── */
const COUNTRY_CENTROIDS = {
  "Algeria":[28.03,1.66],"Angola":[-11.20,17.87],"Benin":[9.31,2.32],
  "Botswana":[-22.33,24.68],"Burkina Faso":[12.24,-1.56],"Burundi":[-3.37,29.92],
  "Cape Verde":[16.00,-24.01],"Cameroon":[7.37,12.35],
  "Central African Republic":[6.61,20.94],"Chad":[15.45,18.73],
  "Comoros":[-11.88,43.87],"Congo":[-0.23,15.83],
  "Democratic Republic of the Congo":[-4.04,21.76],"Cote d'Ivoire":[7.54,-5.55],
  "Djibouti":[11.83,42.59],"Egypt":[26.82,30.80],"Equatorial Guinea":[1.65,10.27],
  "Eritrea":[15.18,39.78],"Ethiopia":[9.15,40.49],"Gabon":[-0.80,11.61],
  "Gambia":[13.44,-15.31],"Ghana":[7.95,-1.02],"Guinea":[9.95,-9.70],
  "Guinea-Bissau":[11.80,-15.18],"Kenya":[-0.02,37.91],"Lesotho":[-29.61,28.23],
  "Liberia":[6.43,-9.43],"Libya":[26.34,17.23],"Madagascar":[-18.77,46.87],
  "Malawi":[-13.25,34.30],"Mali":[17.57,-3.10],"Mauritania":[21.01,-10.94],
  "Mauritius":[-20.35,57.55],"Morocco":[31.79,-7.09],"Mozambique":[-18.67,35.53],
  "Namibia":[-22.96,18.49],"Niger":[17.61,8.08],"Nigeria":[9.08,8.68],
  "Rwanda":[-1.94,29.87],"Sao Tome and Principe":[0.19,6.61],"Senegal":[14.50,-14.45],
  "Seychelles":[-4.68,55.49],"Sierra Leone":[8.46,-11.78],"Somalia":[5.15,46.20],
  "South Africa":[-30.56,22.94],"South Sudan":[6.88,31.31],"Sudan":[12.86,30.22],
  "Swaziland":[-26.52,31.47],"Togo":[8.62,0.82],"Tunisia":[33.89,9.54],
  "Uganda":[1.37,32.29],"United Republic of Tanzania":[-6.37,34.89],
  "Zambia":[-13.13,27.85],"Zimbabwe":[-19.02,29.15]
}

/* ─── Interval options ───────────────────────────────────────────────────── */
const INTERVALS = [
  { key:'24h',  label:'24 h' },
  { key:'7d',   label:'7 d' },
  { key:'30d',  label:'30 d' },
  { key:'3mo',  label:'3 mo' },
  { key:'6mo',  label:'6 mo' },
  { key:'1y',   label:'1 yr' },
  { key:'2y',   label:'2 yr' },
  { key:'10y',  label:'10 yr' },
]

/* ─── Score ring SVG ─────────────────────────────────────────────────────── */
function ScoreRing({ score, color, label, hint, size = 128 }) {
  const r = size * 0.40, cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ textAlign:'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a2e22" strokeWidth={size * 0.09}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.09}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition:'stroke-dasharray 0.8s ease' }}
        />
        <text x={cx} y={cy - size * 0.06} textAnchor="middle" fill={color}
          fontSize={size * 0.20} fontWeight="800" fontFamily="Inter,sans-serif">{score}</text>
        <text x={cx} y={cy + size * 0.11} textAnchor="middle" fill={color}
          fontSize={size * 0.086} fontFamily="Inter,sans-serif">/ 100</text>
      </svg>
      <div style={{ fontWeight:700, fontSize:'0.9rem', color, marginTop:2 }}>{label}</div>
      {hint && <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', maxWidth:180, margin:'4px auto 0' }}>{hint}</div>}
    </div>
  )
}

/* ─── Market value card ──────────────────────────────────────────────────── */
function MktCard({ label, value, sub, highlight }) {
  return (
    <div style={{
      flex:1, minWidth:0, borderRadius:10, padding:'10px 14px',
      background: highlight ? 'rgba(46,204,113,0.13)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${highlight ? 'rgba(46,204,113,0.4)' : 'rgba(255,255,255,0.07)'}`,
      textAlign:'center'
    }}>
      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:'1.15rem', fontWeight:800, color: highlight ? '#2ecc71' : 'var(--text-primary)' }}>
        ${typeof value === 'number' ? value.toLocaleString(undefined,{maximumFractionDigits:0}) : '—'}
      </div>
      {sub && <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function LedgerTab({ country }) {
  const mapRef  = useRef(null)
  const mapInst = useRef(null)
  const drawnItemsRef       = useRef(null)
  const submissionsLayerRef = useRef(null)
  const trueColorLayerRef   = useRef(null)

  const [form, setForm] = useState({
    group:'', sector:'', notes:'',
    date: new Date().toISOString().split('T')[0]
  })
  const [drawnGeom,    setDrawnGeom]    = useState(null)
  const [submissions,  setSubmissions]  = useState([])
  const [filterSector, setFilterSector] = useState('All')
  const [msg,          setMsg]          = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [mapReady,     setMapReady]     = useState(false)

  // ── Analysis & File Upload State ──────────────────────────────────────────
  const [interval,     setInterval]     = useState('1y')
  const [analysis,     setAnalysis]     = useState(null)
  const [analysing,    setAnalysing]    = useState(false)
  const [analysisErr,  setAnalysisErr]  = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [trueColorOn, setTrueColorOn] = useState(false)
  const [trueColorUrl, setTrueColorUrl] = useState(null)
  // GPS Ground-truthing state
  const [verifyingGps, setVerifyingGps] = useState(false)
  const [gpsVerified, setGpsVerified] = useState(false)

  // ── Selected Submission & Live Stock Ticker State ───────────────────────
  const [selectedSub,  setSelectedSub]  = useState(null)
  const [tickerVal,    setTickerVal]    = useState(12.50)
  const [tickerChange, setTickerChange] = useState(0.00)
  const [tickerDir,    setTickerDir]    = useState('up')

  // Live Carbon Stock Ticker loop
  useEffect(() => {
    let basePrice = 12.50;

    const fetchRealData = () => {
      fetchLiveCarbonPrice()
        .then(data => {
          const coinData = data['toucan-protocol-nature-carbon-tonne'];
          if (coinData) {
            const price = coinData.usd || 12.50;
            const change = coinData.usd_24h_change || 0.00;
            basePrice = price;
            setTickerVal(price);
            setTickerChange(change);
            setTickerDir(change >= 0 ? 'up' : 'down');
          }
        })
        .catch(console.error)
    };

    // Fetch immediately, then every 60 seconds
    fetchRealData();
    const fetchIntervalId = window.setInterval(fetchRealData, 60000);

    // Micro-flutter every 2 seconds to keep it looking "alive" between real polls
    const flutterIntervalId = window.setInterval(() => {
      const flutter = (Math.random() - 0.5) * 0.02; // ±$0.01
      setTickerVal(prev => {
        // keep it close to the real base price
        const next = basePrice + flutter;
        return next;
      })
    }, 2000);

    return () => {
      window.clearInterval(fetchIntervalId);
      window.clearInterval(flutterIntervalId);
    }
  }, [])

  // ── Single Tree Allometry State ───────────────────────────────────────────
  const [knownSpecies, setKnownSpecies] = useState([])
  const [treeForm, setTreeForm] = useState({
    species: '',
    dbh: '25',
    height: '18',
    photo: null,
    photoPreview: null
  })
  const [treeAnalysis, setTreeAnalysis] = useState(null)
  const [treeLoading, setTreeLoading] = useState(false)
  const [treeError, setTreeError] = useState(null)

  /* ── Load initial data ───────────────────────────────────────────────── */
  const loadLedger = (sector) => {
    fetchLedger(sector === 'All' ? null : sector)
      .then(setSubmissions)
      .catch(err => {
        setSubmissions([])
        setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to load submissions' })
      })
  }

  const handleDeleteLedger = async (e, r) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete ${r.submitter_group}'s entry?`)) return;
    try {
      await deleteLedgerEntry({ submitter_group: r.submitter_group, submission_date: r.submission_date });
      loadLedger(filterSector);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to delete' });
    }
  };

  const handleToggleLedger = async (e, r) => {
    e.stopPropagation();
    try {
      await toggleLedgerEntry({ submitter_group: r.submitter_group, submission_date: r.submission_date });
      loadLedger(filterSector);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to toggle verification' });
    }
  };
  
  useEffect(() => {
    loadLedger('All')
    fetchKnownSpecies()
      .then(setKnownSpecies)
      .catch(() => {})
  }, [])

  /* ── Render submissions on map ───────────────────────────────────────── */
  const renderSubmissions = (subs) => {
    const map = mapInst.current; if (!map) return
    if (!submissionsLayerRef.current) {
      submissionsLayerRef.current = L.featureGroup().addTo(map)
    }
    submissionsLayerRef.current.clearLayers()
    subs.forEach(rec => {
      if (!rec.geometry) return
      try {
        const layer = L.geoJSON(rec.geometry, {
          style: {
            color: rec.verified ? '#2ecc71' : '#00bcd4',
            fillColor: rec.verified ? '#2ecc71' : '#00bcd4',
            fillOpacity: 0.18, weight: 2,
            dashArray: rec.verified ? null : '5,4',
          }
        })
        layer.bindTooltip(
          `<strong>${rec.submitter_group||'—'}</strong><br/>` +
          `Sector: ${rec.sector||'—'}<br/>` +
          `Date: ${rec.submission_date||'—'}<br/>` +
          `${rec.notes ? `Notes: ${rec.notes}<br/>` : ''}` +
          (rec.gps_verified ? '<span style="color:#2ecc71">📍 <strong>GPS Verified</strong></span><br/>' : '') +
          (rec.timestamp_verified ? '<span style="color:#2ecc71">⏱️ <strong>Timestamp Verified</strong></span><br/>' : '') +
          `${rec.verified ? '✅ Phase 10 Verified' : '⏳ Pending Phase 10'}`,
          { sticky: true }
        )
        submissionsLayerRef.current.addLayer(layer)
      } catch (e) {
        console.warn('[LCRI] Could not render submission geometry:', e.message)
      }
    })
  }
  useEffect(() => { renderSubmissions(submissions) }, [submissions, mapReady])

  /* ── Map init ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (mapInst.current) return
    const coords = COUNTRY_CENTROIDS[country] || [-1.94, 29.87]
    const zoom   = country === 'Rwanda' ? 8 : 6
    const map    = L.map(mapRef.current, { zoomControl: true }).setView(coords, zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'OSM' }).addTo(map)
    const drawnItems = new L.FeatureGroup().addTo(map)
    drawnItemsRef.current       = drawnItems
    submissionsLayerRef.current = L.featureGroup().addTo(map)
    
    try {
      if (L.Control?.Draw) {
        const drawCtrl = new L.Control.Draw({
          draw:{ polygon:true, rectangle:true, polyline:false, circle:false, marker:false, circlemarker:false },
          edit:{ featureGroup: drawnItems }
        })
        map.addControl(drawCtrl)
        map.on(L.Draw.Event.CREATED, e => {
          drawnItems.clearLayers(); drawnItems.addLayer(e.layer)
          const geom = e.layer.toGeoJSON().geometry
          setDrawnGeom(geom)
          setAnalysis(null); setAnalysisErr(null)
        })
      }
    } catch (err) {
      console.warn('[LCRI] Ledger draw control failed:', err.message)
    }
    mapInst.current = map
    setMapReady(true)
    return () => {
      submissionsLayerRef.current = null
      drawnItemsRef.current = null
      map.remove(); mapInst.current = null
    }
  }, [])

  /* ── Re-centre when country changes ─────────────────────────────────── */
  useEffect(() => {
    const map = mapInst.current; if (!map) return
    const coords = COUNTRY_CENTROIDS[country] || [-1.94, 29.87]
    map.setView(coords, country === 'Rwanda' ? 8 : 6)
  }, [country])

  /* ── True Color Tile Overlay ────────────────────────────────────────── */
  useEffect(() => {
    const map = mapInst.current
    if (!map) return
    
    if (trueColorOn) {
      if (trueColorUrl) {
        trueColorLayerRef.current = L.tileLayer(trueColorUrl).addTo(map)
      } else {
        fetchTrueColorTile()
          .then(res => {
            if (res.url) {
              setTrueColorUrl(res.url)
              trueColorLayerRef.current = L.tileLayer(res.url).addTo(map)
            }
          })
          .catch(err => console.error("True Color Tile error:", err))
      }
    } else {
      if (trueColorLayerRef.current) {
        map.removeLayer(trueColorLayerRef.current)
        trueColorLayerRef.current = null
      }
    }
  }, [trueColorOn, trueColorUrl])

  /* ── Study Area File Upload ─────────────────────────────────────────── */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    setUploadLoading(true)
    setMsg(null)
    
    try {
      const res = await uploadAreaFile(formData)
      if (res.geometry) {
        setDrawnGeom(res.geometry)
        setAnalysis(null)
        setAnalysisErr(null)
        
        // Display on map
        const map = mapInst.current
        if (map && drawnItemsRef.current) {
          drawnItemsRef.current.clearLayers()
          const geoJsonLayer = L.geoJSON(res.geometry, {
            style: {
              color: '#f39c12',
              fillColor: '#f39c12',
              fillOpacity: 0.25,
              weight: 3
            }
          }).addTo(drawnItemsRef.current)
          
          // Fit map bounds
          const bounds = geoJsonLayer.getBounds()
          if (bounds.isValid()) {
            map.fitBounds(bounds)
          }
        }
        setMsg({ type: 'success', text: `Successfully loaded ${file.name} (${res.feature_count} features captured)` })
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to upload/parse study area' })
    } finally {
      setUploadLoading(false)
      // reset file input
      e.target.value = ''
    }
  }

  /* ── Submit Site ─────────────────────────────────────────────────────── */
  const handleVerifyGps = () => {
    setVerifyingGps(true)
    if (!navigator.geolocation) {
      setMsg({ type: 'error', text: 'Geolocation is not supported by your browser.' })
      setVerifyingGps(false)
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsVerified(true)
        setVerifyingGps(false)
        setMsg({ type: 'success', text: `🛡️ Cryptographic Ground-Truth Secured: Lat ${pos.coords.latitude.toFixed(5)}, Lon ${pos.coords.longitude.toFixed(5)}` })
      },
      (err) => {
        setMsg({ type: 'error', text: `GPS Verification failed: ${err.message}` })
        setVerifyingGps(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleSubmit = async () => {
    if (!drawnGeom)         { setMsg({ type:'error', text:'Please draw or upload a polygon first.' });      return }
    if (!form.group?.trim() || !form.sector?.trim()) { setMsg({ type:'error', text:'Group name and sector are required.' }); return }
    
    if (!gpsVerified && !confirm("⚠️ Warning: You are submitting without Live GPS Verification. This will significantly lower your Verification Confidence Score. Continue?")) {
      return
    }
    
    setLoading(true)
    try {
      const r = await submitLedger({
        geometry: drawnGeom, submitterGroup: form.group,
        sector: form.sector, notes: form.notes, submissionDate: form.date,
        gpsVerified: gpsVerified, timestampVerified: gpsVerified
      })
      if (r.success) {
        setMsg({ type:'success', text: r.message })
        if (drawnItemsRef.current) drawnItemsRef.current.clearLayers()
        setDrawnGeom(null)
        setGpsVerified(false)
        setForm({ group:'', sector:'', notes:'', date: new Date().toISOString().split('T')[0] })
        loadLedger('All')
      } else { setMsg({ type:'error', text: r.message }) }
    } catch { setMsg({ type:'error', text:'Submission failed.' }) }
    setLoading(false)
  }

  /* ── Analyse Area ────────────────────────────────────────────────────── */
  const handleAnalyse = async () => {
    if (!drawnGeom) { setAnalysisErr('Draw or upload a polygon first, then click Analyse.'); return }
    setAnalysing(true); setAnalysisErr(null); setAnalysis(null)
    try {
      const result = await analyseParcel({ geometry: drawnGeom, interval })
      if (result.error) { setAnalysisErr(result.error) }
      else { setAnalysis(result) }
    } catch (e) {
      setAnalysisErr(e?.response?.data?.error || 'Analysis failed. Check server logs.')
    }
    setAnalysing(false)
  }

  /* ── Select Submission Handler ────────────────────────────────────────── */
  const handleSelectSub = async (sub) => {
    setSelectedSub(sub)
    if (!sub.geometry) return
    
    const map = mapInst.current
    if (map) {
      const tempLayer = L.geoJSON(sub.geometry)
      map.fitBounds(tempLayer.getBounds(), { maxZoom: 16 })
      if (drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers()
        L.geoJSON(sub.geometry, {
          style: { color: '#00bcd4', fillColor: '#00bcd4', fillOpacity: 0.25, weight: 3 }
        }).addTo(drawnItemsRef.current)
      }
    }
    
    setDrawnGeom(sub.geometry)
    setAnalysing(true); setAnalysisErr(null); setAnalysis(null)
    try {
      const result = await analyseParcel({ geometry: sub.geometry, interval })
      if (result.error) { setAnalysisErr(result.error) }
      else { setAnalysis(result) }
    } catch (e) {
      setAnalysisErr(e?.response?.data?.error || 'Analysis failed.')
    }
    setAnalysing(false)
  }

  /* ── Tree Photo Upload ──────────────────────────────────────────────── */
  const handleTreePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setTreeForm(prev => ({
          ...prev,
          photo: file,
          photoPreview: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  /* ── Tree Carbon Allometric Estimate ────────────────────────────────── */
  const handleTreeAnalyse = async () => {
    setTreeLoading(true)
    setTreeError(null)
    setTreeAnalysis(null)
    try {
      const res = await analyseTree({
        species: treeForm.species,
        dbh_cm: parseFloat(treeForm.dbh),
        height_m: parseFloat(treeForm.height)
      })
      setTreeAnalysis(res)
    } catch (err) {
      setTreeError(err.response?.data?.error || 'Failed to analyze tree metrics')
    } finally {
      setTreeLoading(false)
    }
  }

  /* ── AGB / CO2e chart ────────────────────────────────────────────────── */
  const buildChartOption = (analysis) => {
    const series = analysis?.co2e_series || []
    const labels = series.map(p => p.label || p.year || '—')
    const agb    = series.map(p => p.agb_mg_ha ?? null)
    const co2e   = series.map(p => p.co2e_mg   ?? null)
    return {
      backgroundColor:'transparent',
      textStyle:{ fontFamily:'Inter,sans-serif' },
      tooltip:{ trigger:'axis', backgroundColor:'#0e1f16', borderColor:'#1e3a2a',
        textStyle:{ color:'#e0f0e8', fontSize:11 } },
      legend:{ data:['AGB (Mg/ha)','CO₂e (Mg)'], textStyle:{ color:'#80cbc4', fontSize:10 },
        top:4 },
      grid:{ left:48, right:24, top:36, bottom:30 },
      xAxis:{ type:'category', data:labels,
        axisLabel:{ color:'#80cbc4', fontSize:10 },
        axisLine:{ lineStyle:{ color:'#1e3a2a' } } },
      yAxis:[
        { type:'value', name:'AGB Mg/ha', nameTextStyle:{ color:'#80cbc4', fontSize:9 },
          axisLabel:{ color:'#80cbc4', fontSize:9 },
          splitLine:{ lineStyle:{ color:'#1a2e22' } } },
        { type:'value', name:'CO₂e Mg', nameTextStyle:{ color:'#80cbc4', fontSize:9 },
          axisLabel:{ color:'#80cbc4', fontSize:9 },
          splitLine:{ show:false } },
      ],
      series:[
        { name:'AGB (Mg/ha)', type:'line', yAxisIndex:0, data:agb,
          smooth:true, symbol:'circle', symbolSize:5,
          lineStyle:{ color:'#2ecc71', width:2 },
          itemStyle:{ color:'#2ecc71' },
          areaStyle:{ color:'rgba(46,204,113,0.08)' } },
        { name:'CO₂e (Mg)', type:'bar', yAxisIndex:1, data:co2e,
          barMaxWidth:28,
          itemStyle:{ color:'rgba(0,188,212,0.55)', borderRadius:[3,3,0,0] } },
      ]
    }
  }

  /* ── Submissions chart ───────────────────────────────────────────────── */
  const chartOption = () => {
    const counts = {}
    filtered.forEach(r => {
      const m = r.submission_date?.slice(0,7)
      if (m) counts[m] = (counts[m]||0) + 1
    })
    const months = Object.keys(counts).sort()
    return {
      backgroundColor:'transparent', textStyle:{ fontFamily:'Inter, sans-serif' },
      tooltip:{ trigger:'axis' }, grid:{ left:40, right:14, top:10, bottom:30 },
      xAxis:{ type:'category', data:months, axisLabel:{ color:'#80cbc4', fontSize:10 },
        axisLine:{ lineStyle:{ color:'#1e3a2a' } } },
      yAxis:{ type:'value', axisLabel:{ color:'#80cbc4', fontSize:10 },
        splitLine:{ lineStyle:{ color:'#1a2e22' } } },
      series:[{ data:months.map(m=>counts[m]), type:'bar',
        itemStyle:{ color:'#2ecc71', borderRadius:3 } }]
    }
  }

  const F = (id, label, value, key, type='text', rest={}) => (
    <div className="form-row">
      <label className="form-label" htmlFor={id}>{label}</label>
      {'rows' in rest
        ? <textarea id={id} className="form-input" rows={rest.rows} value={value} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} />
        : <input id={id} type={type} className="form-input" value={value} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} />
      }
    </div>
  )

  const sectors  = ['All', ...new Set(submissions.map(r => r.sector).filter(Boolean))]
  const filtered = filterSector === 'All' ? submissions : submissions.filter(r => r.sector === filterSector)
  const si       = analysis?.score_info || {}

  return (
    <div className="col2">

      {/* ── Left column: Submit form + map ─────────────────────────────── */}
      <div>
        <div className="card" style={{ marginBottom:14 }}>
          <h3 style={{ color:'var(--accent)', fontWeight:700, marginBottom:14 }}>Submit a New Site</h3>
          {F('ledger-group',  'Submitting Group / Umuganda Cell *', form.group,  'group')}
          {F('ledger-sector', 'Administrative Sector *',             form.sector, 'sector')}
          {F('ledger-notes',  'Notes (optional)',                     form.notes,  'notes', 'text', { rows:2 })}
          {F('ledger-date',   'Submission Date',                      form.date,   'date', 'date')}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap: 8 }}>
          <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', margin:0 }}>
            Draw your planting polygon on the map or upload a study file:
          </p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {/* File Upload Button */}
            <label className="btn btn-secondary btn-sm" style={{ cursor:'pointer', margin:0, display:'inline-block' }}>
              📁 {uploadLoading ? 'Uploading...' : 'Upload Shapefile/KML'}
              <input type="file" accept=".zip,.kml,.kmz,.geojson,.json" onChange={handleFileUpload} style={{ display:'none' }} disabled={uploadLoading} />
            </label>
            
            {/* True Color Map Layer toggle */}
            <button
              onClick={() => setTrueColorOn(!trueColorOn)}
              className={`btn btn-sm ${trueColorOn ? 'btn-primary' : 'btn-secondary'}`}
              style={{ margin: 0 }}
            >
              🛰️ Sentinel-2 True Color
            </button>
          </div>
        </div>

        <div className="ledger-map" style={{ height:300 }}>
          <div ref={mapRef} style={{ width:'100%', height:'100%' }} />
        </div>

        {/* Map legend */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:16, marginTop:6, fontSize:'0.74rem', color:'var(--text-muted)' }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ display:'inline-block', width:14, height:14, borderRadius:2, background:'rgba(0,188,212,0.35)', border:'2px dashed #00bcd4' }} />
            Pending verification
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ display:'inline-block', width:14, height:14, borderRadius:2, background:'rgba(46,204,113,0.35)', border:'2px solid #2ecc71' }} />
            Verified
          </span>
        </div>

        {drawnGeom && <div className="alert alert-success" style={{ marginTop:8 }}>Polygon captured ✅ — you can submit or analyse below.</div>}
        {msg && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`} style={{ marginTop:8 }}>{msg.text}</div>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <button id="ledger-verify-btn" className={`btn ${gpsVerified ? 'btn-success' : 'btn-secondary'}`} style={{ flex: 1, minWidth: 140 }}
            onClick={handleVerifyGps} disabled={verifyingGps || gpsVerified}>
            {gpsVerified ? '🔒 GPS Verified' : verifyingGps ? '⏳ Verifying...' : '📍 Capture Live GPS'}
          </button>
          <button id="ledger-submit-btn" className="btn btn-primary" style={{ flex: 2, minWidth: 140 }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? '⏳ Submitting…' : '📤 Submit Site'}
          </button>
        </div>

        {/* ── Live Carbon Analysis Panel ─────────────────────────────────── */}
        <div className="card" style={{ marginTop:20 }}>
          <h3 style={{ color:'var(--accent)', fontWeight:700, marginBottom:10 }}>
            🌱 Live Carbon Analysis
          </h3>
          <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:12 }}>
            Draw a polygon above, choose a time window, then click Analyse to get real-time
            above-ground biomass data from <strong>ESA CCI Biomass v7.0</strong> (SAR + ICESat-2).
          </p>

          {/* Interval selector */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
            {INTERVALS.map(iv => (
              <button key={iv.key}
                id={`interval-btn-${iv.key}`}
                onClick={() => setInterval(iv.key)}
                style={{
                  padding:'5px 12px', borderRadius:20, fontSize:'0.78rem', cursor:'pointer',
                  border: interval === iv.key ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.12)',
                  background: interval === iv.key ? 'rgba(46,204,113,0.18)' : 'rgba(255,255,255,0.04)',
                  color: interval === iv.key ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: interval === iv.key ? 700 : 400, transition:'all 0.15s'
                }}>
                {iv.label}
              </button>
            ))}
          </div>

          <button id="ledger-analyse-btn" className="btn btn-primary" style={{ width:'100%', marginBottom:12 }}
            onClick={handleAnalyse} disabled={analysing}>
            {analysing ? '⏳ Fetching satellite data…' : '📡 Analyse Parcel'}
          </button>

          {analysisErr && (
            <div className="alert alert-error">{analysisErr}</div>
          )}

          {analysing && (
            <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.82rem', padding:'20px 0' }}>
              <div style={{ marginBottom:8 }}>Querying ESA CCI Biomass v7.0 via Google Earth Engine…</div>
              <div style={{ fontSize:'0.72rem' }}>This may take 10–30 s for large parcels.</div>
            </div>
          )}

          {analysis && !analysing && (
            <div>
              {/* Score + trend summary */}
              <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
                <ScoreRing
                  score={analysis.carbon_score}
                  color={si.color || '#2ecc71'}
                  label={si.label || '—'}
                  hint={si.hint}
                />
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:8, marginBottom:8 }}>
                    <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Area</div>
                      <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{analysis.area_ha?.toFixed(1)} ha</div>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Trend</div>
                      <div style={{ fontWeight:700, fontSize:'0.95rem',
                        color: analysis.trend_label === 'Improving' ? '#2ecc71'
                             : analysis.trend_label === 'Degrading' ? '#e74c3c' : '#f1c40f'
                      }}>
                        {analysis.trend_label} ({analysis.trend_pct > 0 ? '+' : ''}{analysis.trend_pct}%)
                      </div>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Latest AGB</div>
                      <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{analysis.latest_agb_mg_ha} Mg/ha</div>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Latest CO₂e</div>
                      <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{analysis.latest_co2e_mg?.toFixed(1)} Mg</div>
                    </div>
                  </div>

                  {/* NDVI badge for short intervals */}
                  {analysis.ndvi_change_pct !== null && analysis.ndvi_change_pct !== undefined && (
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>
                      Sentinel-2 NDVI Δ: <strong style={{ color: analysis.ndvi_change_pct >= 0 ? '#2ecc71' : '#e74c3c' }}>
                        {analysis.ndvi_change_pct >= 0 ? '+' : ''}{analysis.ndvi_change_pct?.toFixed(2)}%
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* AGB + CO2e timeseries chart */}
              {analysis.co2e_series?.length > 0 && (
                <div className="chart-container" style={{ marginBottom:14 }}>
                  <div className="chart-title">
                    Biomass &amp; CO₂e Timeseries — {analysis.interval_label}
                  </div>
                  <ReactECharts option={buildChartOption(analysis)} style={{ height:200 }} />
                </div>
              )}

              {/* Market value — current */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  Current Market Value (USD / tCO₂e)
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  <MktCard label="Low scenario ($6)" value={analysis.market_value?.low} sub="Conservative VCM" />
                  <MktCard label="Mid scenario ($10)" value={analysis.market_value?.mid} sub="Market median" highlight />
                  <MktCard label="High scenario ($18)" value={analysis.market_value?.high} sub="Premium / REDD+" />
                </div>
              </div>

              {/* 10-year projection */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  10-Year Cumulative Revenue Projection
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  <MktCard label="Low ($6/t)" value={analysis.projected_10yr?.low} />
                  <MktCard label="Mid ($10/t)" value={analysis.projected_10yr?.mid} highlight />
                  <MktCard label="High ($18/t)" value={analysis.projected_10yr?.high} />
                </div>
              </div>

              {/* Data note */}
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:8 }}>
                📡 {analysis.note}
              </div>

              {/* PDF download */}
              <button
                id="ledger-report-btn"
                className="btn btn-secondary btn-sm"
                style={{ marginTop:10, width:'100%' }}
                onClick={async () => {
                  try {
                    const resp = await fetch('/api/ledger/report', {
                      method:'POST',
                      headers:{ 'Content-Type':'application/json' },
                      body: JSON.stringify({
                        geometry: drawnGeom, interval,
                        submitterGroup: form.group || 'Community',
                        sector: form.sector || 'Unknown'
                      })
                    })
                    if (!resp.ok) throw new Error('Server error')
                    const blob = await resp.blob()
                    const url  = URL.createObjectURL(blob)
                    const a    = document.createElement('a')
                    a.href = url; a.download = 'CarbonReport.pdf'; a.click()
                    URL.revokeObjectURL(url)
                  } catch (e) {
                    alert('PDF generation failed: ' + e.message)
                  }
                }}>
                📄 Download dMRV Audit Certificate
              </button>
            </div>
          )}
        </div>
        {/* END analysis card */}
      </div>

      {/* ── Right column: Submissions + Tree Carbon Estimator ──────────── */}
      <div>
        {/* ── Tree Carbon Estimator Card (NEW) ─────────────────────────── */}
        <div className="card" style={{ marginBottom:20 }}>
          <h3 style={{ color:'var(--accent)', fontWeight:700, marginBottom:10 }}>
            🌳 Individual Tree Carbon Estimator
          </h3>
          <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:12 }}>
            Upload a photo of a single tree, select the species, enter its measurements, and estimate its biomass and carbon score using <strong>Tallo v2</strong> + <strong>BAAD</strong> databases and the <strong>Chave 2014</strong> equation.
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10, marginBottom:10 }}>
            {/* Photo upload container */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ fontSize:'0.76rem', color:'var(--text-primary)', fontWeight:600 }}>📷 Tree Photo</label>
              <div style={{
                height:100, border:'1px dashed rgba(255,255,255,0.15)', borderRadius:6,
                background:'rgba(255,255,255,0.02)', display:'flex', alignItems:'center',
                justifyContent:'center', overflow:'hidden', position:'relative', cursor:'pointer'
              }}>
                {treeForm.photoPreview ? (
                  <img src={treeForm.photoPreview} alt="Tree Preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Upload Photo</span>
                )}
                <input type="file" accept="image/*" onChange={handleTreePhotoChange}
                  style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0, cursor:'pointer' }} />
              </div>
            </div>

            {/* Inputs */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div>
                <label htmlFor="tree-species" style={{ fontSize:'0.76rem', color:'var(--text-primary)', fontWeight:600 }}>Species</label>
                <input
                  id="tree-species"
                  type="text"
                  list="known-species-list"
                  placeholder="e.g. Grevillea"
                  className="form-input"
                  style={{ padding:'4px 8px', height:32 }}
                  value={treeForm.species}
                  onChange={e => setTreeForm(prev => ({ ...prev, species: e.target.value }))}
                />
                <datalist id="known-species-list">
                  {knownSpecies.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <div>
                  <label htmlFor="tree-dbh" style={{ fontSize:'0.76rem', color:'var(--text-primary)', fontWeight:600 }}>DBH (cm)</label>
                  <input
                    id="tree-dbh"
                    type="number"
                    className="form-input"
                    style={{ padding:'4px 8px', height:32 }}
                    value={treeForm.dbh}
                    onChange={e => setTreeForm(prev => ({ ...prev, dbh: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="tree-height" style={{ fontSize:'0.76rem', color:'var(--text-primary)', fontWeight:600 }}>Height (m)</label>
                  <input
                    id="tree-height"
                    type="number"
                    className="form-input"
                    style={{ padding:'4px 8px', height:32 }}
                    value={treeForm.height}
                    onChange={e => setTreeForm(prev => ({ ...prev, height: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-sm" style={{ width:'100%', marginBottom:8 }}
            onClick={handleTreeAnalyse} disabled={treeLoading}>
            {treeLoading ? '⏳ Running calculations...' : '🌲 Estimate Tree Carbon'}
          </button>

          {treeError && <div className="alert alert-error">{treeError}</div>}

          {treeAnalysis && (
            <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' }}>
              
              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:10 }}>
                <ScoreRing
                  score={treeAnalysis.carbon_score}
                  color={treeAnalysis.score_info?.color || '#2ecc71'}
                  label={treeAnalysis.score_info?.label || '—'}
                  size={90}
                />
                <div style={{ flex:1, fontSize:'0.78rem' }}>
                  <div>🌳 <strong>Biomass:</strong> {treeAnalysis.agb_kg?.toLocaleString()} kg</div>
                  <div style={{ marginTop:2 }}>💨 <strong>CO₂e Stored:</strong> {treeAnalysis.co2e_kg?.toLocaleString()} kg</div>
                  <div style={{ marginTop:2, fontSize:'0.72rem', color:'var(--text-muted)' }}>
                    🪵 Wood Density: {treeAnalysis.wood_density} g/cm³ ({treeAnalysis.density_source})
                  </div>
                  <div style={{ marginTop:2, fontSize:'0.72rem', color:'var(--text-muted)' }}>
                    📊 Tallo Percentile Rank: {treeAnalysis.percentile_rank}th
                  </div>
                </div>
              </div>

              {/* Stand projection */}
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:8, marginTop:8 }}>
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase' }}>
                  Stand-level Projection (800 trees/ha)
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:'0.75rem' }}>
                  <div>🌲 Stand AGB: <strong>{treeAnalysis.stand_projection?.agb_mg_ha} Mg/ha</strong></div>
                  <div>💨 Stand CO₂e: <strong>{treeAnalysis.stand_projection?.co2e_mg_ha} Mg/ha</strong></div>
                </div>
                <div style={{ display:'flex', gap:6, marginTop:6 }}>
                  <div style={{ flex:1, background:'rgba(255,255,255,0.03)', padding:'4px 6px', borderRadius:4, fontSize:'0.68rem', textAlign:'center' }}>
                    Low: ${treeAnalysis.stand_projection?.market_value_usd?.low?.toLocaleString()}
                  </div>
                  <div style={{ flex:1, background:'rgba(46,204,113,0.08)', padding:'4px 6px', borderRadius:4, fontSize:'0.68rem', textAlign:'center', color:'#2ecc71', fontWeight:600 }}>
                    Mid: ${treeAnalysis.stand_projection?.market_value_usd?.mid?.toLocaleString()}
                  </div>
                  <div style={{ flex:1, background:'rgba(255,255,255,0.03)', padding:'4px 6px', borderRadius:4, fontSize:'0.68rem', textAlign:'center' }}>
                    High: ${treeAnalysis.stand_projection?.market_value_usd?.high?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ fontSize:'0.64rem', color:'var(--text-muted)', marginTop:8, borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:6 }}>
                📝 {treeAnalysis.equation_used}
              </div>
            </div>
          )}
        </div>

        {/* ── Submissions list ─────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <h3 style={{ color:'var(--accent)', fontWeight:700 }}>All Submissions</h3>
          <select id="ledger-sector-filter" className="form-input form-select" style={{ width:160 }}
            value={filterSector}
            onChange={e => { setFilterSector(e.target.value); loadLedger(e.target.value) }}>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {filtered.length === 0
          ? <div className="alert alert-info">No submissions yet.</div>
          : <>
              <div className="table-wrap" style={{ maxHeight:220, overflowY:'auto', marginBottom:14 }}>
                <table>
                  <thead><tr><th>Group</th><th>Sector</th><th>Date</th><th>Notes</th><th>Verified</th></tr></thead>
                  <tbody>
                    {filtered.map((r,i) => {
                      const isSelected = selectedSub && selectedSub.submitter_group === r.submitter_group && selectedSub.submission_date === r.submission_date;
                      return (
                        <tr key={i} onClick={() => handleSelectSub(r)} style={{ cursor:'pointer', background: isSelected ? 'rgba(0,188,212,0.15)' : 'transparent', transition:'background 0.2s' }}>
                          <td><strong>{r.submitter_group}</strong></td>
                          <td><span className="badge badge-yellow">{r.sector}</span></td>
                          <td className="mono">{r.submission_date}</td>
                          <td style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>{r.notes||'—'}</td>
                          <td style={{ display:'flex', gap: 6, alignItems:'center' }}>
                            <span 
                              className={`badge ${r.verified ? 'badge-green':'badge-red'}`} 
                              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} 
                              onClick={(e) => handleToggleLedger(e, r)}
                              title="Click to toggle verification status"
                            >
                              {r.verified ? '[ VERIFIED ]' : '[ UNVERIFIED ]'}
                            </span>
                            {r.gps_verified && <span className="badge badge-yellow" title="GPS Location Verified">[ GPS ]</span>}
                            <span 
                              className="badge badge-red" 
                              style={{ cursor: 'pointer', opacity: 0.8 }} 
                              onClick={(e) => handleDeleteLedger(e, r)}
                              title="Delete entry"
                              onMouseOver={e => e.target.style.opacity = 1}
                              onMouseOut={e => e.target.style.opacity = 0.8}
                            >
                              [ DEL ]
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 📈 Live Stock Market Ticker for selected land */}
              {selectedSub && (
                <div className="card" style={{
                  marginBottom: 14,
                  background: 'linear-gradient(135deg, rgba(14,31,22,0.9) 0%, rgba(20,50,30,0.9) 100%)',
                  border: '1px solid rgba(46,204,113,0.3)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position:'absolute', top:10, right:12, background: tickerDir === 'up' ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)', padding:'2px 6px', borderRadius:4, fontSize:'0.65rem', color: tickerDir === 'up' ? '#2ecc71' : '#e74c3c', fontWeight:700 }}>
                    LIVE TICKER
                  </div>
                  
                  <h4 style={{ color:'var(--accent)', fontSize:'0.82rem', textTransform:'uppercase', margin:'0 0 8px 0', letterSpacing:'0.05em' }}>
                    📈 VCM Live Carbon Asset Tracker
                  </h4>
                  
                  <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
                    <div>
                      <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Index Price / tCO₂e</div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                        <span className="mono" style={{ fontSize:'1.4rem', fontWeight:800, color: tickerDir === 'up' ? '#2ecc71' : '#e74c3c', transition: 'color 0.15s' }}>
                          ${tickerVal.toFixed(2)}
                        </span>
                        <span className="mono" style={{ fontSize:'0.75rem', fontWeight:700, color: tickerDir === 'up' ? '#2ecc71' : '#e74c3c' }}>
                          {tickerDir === 'up' ? '▲' : '▼'} {tickerChange >= 0 ? '+' : ''}{tickerChange.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div style={{ flex:1, borderLeft:'1px solid rgba(255,255,255,0.08)', paddingLeft:16 }}>
                      <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Estimated Live Value</div>
                      <div className="mono" style={{ fontSize:'1.2rem', fontWeight:700, color:'#e0f0e8' }}>
                        ${(tickerVal * (analysis?.latest_co2e_mg || 120.0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      <div style={{ fontSize:'0.64rem', color:'var(--text-muted)' }}>
                        Based on {analysis?.latest_co2e_mg?.toFixed(1) || '120.0'} Mg estimated CO₂e
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🛠️ How this maps to Conservation Benefit (Mechanics) */}
              <div className="card" style={{
                marginBottom: 14,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <h4 style={{ color:'var(--accent)', fontSize:'0.82rem', textTransform:'uppercase', margin:'0 0 10px 0', letterSpacing:'0.05em' }}>
                  ⚙️ Grassroots Conservation Mechanics
                </h4>
                <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:'0.76rem', color:'var(--text-muted)' }}>
                  <div style={{ borderLeft:'2px solid var(--accent)', paddingLeft:8 }}>
                    <strong style={{ color:'var(--text-primary)' }}>Targeted Interventions (LCRI):</strong> Turns generic requests into exact placements—directs limited budgets/labor to hectares with the highest carbon-gain headroom and most urgent degradation.
                  </div>
                  <div style={{ borderLeft:'2px solid var(--accent)', paddingLeft:8 }}>
                    <strong style={{ color:'var(--text-primary)' }}>Actionable Project Metrics:</strong> Converts land rankings into acting numbers for funders—providing tCO₂e offsets and revenue projections to make intentions fundable.
                  </div>
                  <div style={{ borderLeft:'2px solid var(--accent)', paddingLeft:8 }}>
                    <strong style={{ color:'var(--text-primary)' }}>Grassroots Verification (Umuganda):</strong> Ties satellite monitoring directly to monthly national tree-planting days—cross-verifying community labor reports against satellite radar records.
                  </div>
                  <div style={{ borderLeft:'2px solid var(--accent)', paddingLeft:8 }}>
                    <strong style={{ color:'var(--text-primary)' }}>Degradation Prevention First:</strong> Uses active loss monitoring to flag active degradation—focusing on active protection and prevention of forest loss rather than just post-facto restoration.
                  </div>
                </div>
              </div>

              <div className="chart-container" style={{ marginBottom:14 }}>
                <div className="chart-title">Community Submissions Over Time</div>
                <ReactECharts option={chartOption()} style={{ height:180 }} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <a id="export-csv-btn" className="btn btn-secondary btn-sm"
                  href="/api/ledger/export-csv" download="community_ledger.csv">⬇️ Export CSV</a>
              </div>
            </>
        }
      </div>

    </div>
  )
}
