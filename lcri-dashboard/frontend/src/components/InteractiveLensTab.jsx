import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchGeeTileUrl } from '../api'

const GOOGLE_SAT = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'

function estimateBiomass(lat, lng) {
  const base = 8.0

  // 1. Amazon Rainforest (South America)
  const amazon = 230 * Math.exp(-((lat - (-3.0))**2 + (lng - (-60.0))**2) / 250.0)
  
  // 2. Congo Basin (Africa)
  const congo = 220 * Math.exp(-((lat - 0.0)**2 + (lng - 22.0)**2) / 60.0)
  
  // 3. Southeast Asia Rainforests (Indonesia, PNG, Malaysia)
  const seAsia = 240 * Math.exp(-((lat - (-2.0))**2 + (lng - 115.0)**2) / 100.0)
  
  // 4. Boreal Forests (Siberia / Canada)
  const borealCanada = 70 * Math.exp(-((lat - 60.0)**2 + (lng - (-100.0))**2) / 400.0)
  const borealSiberia = 75 * Math.exp(-((lat - 60.0)**2 + (lng - 90.0)**2) / 1000.0)
  
  // 5. Temperate Forests (US East / Europe)
  const tempUS = 110 * Math.exp(-((lat - 38.0)**2 + (lng - (-80.0))**2) / 80.0)
  const tempEurope = 100 * Math.exp(-((lat - 48.0)**2 + (lng - 15.0)**2) / 100.0)
  
  // Other regional African forest clusters for continuity
  const westAfrica = 160 * Math.exp(-((lat - 6)**2 + (lng + 4)**2) / 25.0)
  const eastAfrica = 140 * Math.exp(-((lat + 2)**2 + (lng - 35)**2) / 16.0)
  const madagascar = 150 * Math.exp(-((lat + 19)**2 + (lng - 47)**2) / 8.0)
  const miombo     = 45 * Math.exp(-((lat + 12)**2 + (lng - 25)**2) / 50.0)
  
  return Math.min(400, Math.max(0, 
    base + amazon + congo + seAsia + borealCanada + borealSiberia + tempUS + tempEurope + westAfrica + eastAfrica + madagascar + miombo
  ))
}

const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const FACTORS = [0.91,0.48,0.40,0.73,0.05,0.03,0.12,0.10,0.18,0.20,0.59,0.59]
const TARGETS = [0.45,0.50,0.45,0.45,0.35,0.25,0.25,0.25,0.30,0.35,0.40,0.45]

export default function InteractiveLensTab() {
  const mapRef  = useRef(null)
  const mapInst = useRef(null)
  const svgRef  = useRef(null)
  const ringRef = useRef(null)
  const [info, setInfo] = useState(null)

  useEffect(() => {
    if (mapInst.current) return
    const map = L.map(mapRef.current, { zoomControl: true }).setView([10.0, 0.0], 2)
    L.tileLayer(GOOGLE_SAT, { attribution:'Google Satellite', maxZoom:20 }).addTo(map)
    mapInst.current = map

    fetchGeeTileUrl().then(d => {
      if (!d.url) return
      const geeLayer = L.tileLayer(d.url, { opacity: 1.0, attribution:'NASA/ORNL AGB', className:'vq-lens-target' })
      geeLayer.addTo(map)

      // Wait for tile layer div to be ready
      const check = setInterval(() => {
        const container = mapRef.current?.querySelector('.vq-lens-target')
        if (!container) return
        clearInterval(check)
        container.style.clipPath = 'circle(0px at 0 0)'
        container.style.willChange = 'clip-path'

        const mapEl = mapRef.current
        mapEl.addEventListener('mousemove', e => {
          const rect = mapEl.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top

          if (ringRef.current) {
            ringRef.current.style.left = `${x - 170}px`
            ringRef.current.style.top  = `${y - 170}px`
            ringRef.current.style.display = 'block'
          }
          container.style.clipPath = `circle(120px at ${x}px ${y}px)`

          const ll = map.containerPointToLatLng([x, y])
          const bm = estimateBiomass(ll.lat, ll.lng) * 2.0
          const co2e = bm * 0.47 * 3.67
          const credit = co2e * 15.5
          setInfo({ seq: co2e.toFixed(1), cred: credit.toFixed(2), lat: ll.lat.toFixed(4), lng: ll.lng.toFixed(4), biomass: bm })
          drawRadar(bm)
        })
        mapEl.addEventListener('mouseleave', () => {
          container.style.clipPath = 'circle(0px at 0 0)'
          if (ringRef.current) ringRef.current.style.display = 'none'
          setInfo(null)
        })
      }, 300)
    }).catch(() => {})

    return () => { map.remove(); mapInst.current = null }
  }, [])

  const drawRadar = (biomass) => {
    const svg = svgRef.current; if (!svg) return
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    const ns = 'http://www.w3.org/2000/svg'
    const mk = t => document.createElementNS(ns, t)
    const cx=170, cy=170, rMin=22, rMax=150

    // Background circle
    const lb = mk('circle'); lb.setAttribute('cx',cx); lb.setAttribute('cy',cy); lb.setAttribute('r',rMin)
    lb.setAttribute('fill','#d9dac2'); lb.setAttribute('stroke','#fff'); lb.setAttribute('stroke-width','1'); svg.appendChild(lb)
    const od = mk('rect'); od.setAttribute('x',cx-2); od.setAttribute('y',cy-2); od.setAttribute('width','4'); od.setAttribute('height','4'); od.setAttribute('fill','#ffa500'); svg.appendChild(od)

    // Concentric scale rings
    ;[50,100,200,300,400].forEach(val => {
      const r = rMin + (val/400)*(rMax-rMin)
      const c = mk('circle'); c.setAttribute('cx',cx); c.setAttribute('cy',cy); c.setAttribute('r',r)
      c.setAttribute('fill','none'); c.setAttribute('stroke','rgba(255,255,255,0.3)')
      if (val<400) c.setAttribute('stroke-dasharray','3,3'); svg.appendChild(c)
      if (val!==400) {
        const t=mk('text'); t.setAttribute('x',cx); t.setAttribute('y',cy-r+10)
        t.setAttribute('text-anchor','middle'); t.setAttribute('fill','rgba(255,255,255,0.8)')
        t.setAttribute('font-size','10'); t.setAttribute('font-family','Arial'); t.textContent=val; svg.appendChild(t)
      }
    })

    const ptsB=[], ptsP=[]
    for (let i=0; i<12; i++) {
      const ang = i*(2*Math.PI/12) - Math.PI/2 + Math.PI/12
      const cos=Math.cos(ang), sin=Math.sin(ang)
      const ln=mk('line'); ln.setAttribute('x1',cx); ln.setAttribute('y1',cy); ln.setAttribute('x2',cx+rMax*cos); ln.setAttribute('y2',cy+rMax*sin)
      ln.setAttribute('stroke','rgba(255,255,255,0.3)'); ln.setAttribute('stroke-width','1'); svg.appendChild(ln)
      const lR=165; const mt=mk('text'); mt.setAttribute('x',cx+lR*cos); mt.setAttribute('y',cy+lR*sin+4)
      mt.setAttribute('text-anchor','middle'); mt.setAttribute('fill','#fff'); mt.setAttribute('font-size','12')
      mt.setAttribute('font-weight','bold'); mt.setAttribute('font-family','Arial'); mt.textContent=MONTHS[i]; svg.appendChild(mt)

      const vB=biomass*FACTORS[i]; const rB=rMin+(vB/400)*(rMax-rMin)
      ptsB.push({x:cx+rB*cos, y:cy+rB*sin, v:Math.round(vB)})
      const vP=biomass*TARGETS[i]; const rP=rMin+(vP/400)*(rMax-rMin)
      ptsP.push({x:cx+rP*cos, y:cy+rP*sin})
    }

    const ppd='M '+ptsP.map(p=>`${p.x} ${p.y}`).join(' L ')+' Z'
    const pp=mk('path'); pp.setAttribute('d',ppd); pp.setAttribute('fill','transparent'); pp.setAttribute('stroke','#f48fb1'); pp.setAttribute('stroke-width','2'); svg.appendChild(pp)
    const bpd='M '+ptsB.map(p=>`${p.x} ${p.y}`).join(' L ')+' Z'
    const bp=mk('path'); bp.setAttribute('d',bpd); bp.setAttribute('fill','rgba(79,195,247,0.4)'); bp.setAttribute('stroke','#4fc3f7'); bp.setAttribute('stroke-width','3'); svg.appendChild(bp)

    ptsB.forEach((p,i) => {
      const ang=i*(2*Math.PI/12)-Math.PI/2+Math.PI/12
      const vt=mk('text'); vt.setAttribute('x',p.x+12*Math.cos(ang)); vt.setAttribute('y',p.y+12*Math.sin(ang)+4)
      vt.setAttribute('text-anchor','middle'); vt.setAttribute('fill','#fff'); vt.setAttribute('font-size','11')
      vt.setAttribute('font-weight','bold'); vt.setAttribute('font-family','Arial'); vt.textContent=p.v; svg.appendChild(vt)
    })
  }

  return (
    <div>
      <div className="hero-label">GEOSPATIAL EXPLORATOR</div>
      <h2 className="hero-title">Interactive Carbon Lens</h2>
      <p className="hero-sub" style={{ marginBottom:12 }}>Hover over the map to explore the world's monthly carbon sequestration cycles and Aboveground Biomass (AGB) density across major global forest basins (Amazon, Congo, Southeast Asia) and temperate/boreal regions via the interactive lens.</p>

      {/* Gaussian Model Disclaimer */}
      <div style={{ background: 'rgba(52,152,219,0.07)', border: '1px solid rgba(52,152,219,0.3)', borderRadius: 10, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ background: 'rgba(52,152,219,0.2)', color: '#4fc3f7', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
          GLOBAL
        </div>
        <div>
          <strong style={{ color: '#4fc3f7', fontSize: '0.82rem' }}>Illustrative Global Biomass Model</strong>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-sec)', lineHeight: 1.5 }}>
            The hover-to-explore readout uses a <strong>Gaussian approximation model</strong> of global AGB density \u2014 calibrated to match known forest basin peaks (Amazon ≈230, Congo ≈220, SE Asia ≈240 Mg C/ha) from published literature.
            It is <strong>not</strong> a live pixel query from the NASA/ORNL satellite tile. The tile layer behind the lens <em>is</em> real NASA/ORNL AGB data; only the on-hover numeric readout is estimated.
          </p>
        </div>
      </div>

      <hr className="divider" />

      <div className="map-container" style={{ height: 560, position:'relative' }}>
        <div ref={mapRef} style={{ width:'100%', height:'100%' }} />

        {/* Radar ring overlay (fixed inside map) */}
        <div ref={ringRef} style={{ position:'absolute', width:340, height:340, pointerEvents:'none', display:'none', zIndex:9999 }}>
          <svg ref={svgRef} width="340" height="340" style={{ position:'absolute', top:0, left:0, overflow:'visible' }} />
        </div>

        {/* Info panel */}
        {info && (
          <div className="lens-overlay-panel">
            <div className="lens-panel-title">Carbon Asset Details</div>
            <div className="lens-panel-row"><span>Carbon Sequestration:</span><span className="lens-panel-val">{info.seq} tCO₂e/ha</span></div>
            <div className="lens-panel-row"><span>Proposed Credit:</span><span className="lens-panel-val">${info.cred} / ha</span></div>
            <div className="lens-panel-row"><span>Location (Lat/Lng):</span><span className="lens-panel-val">{info.lat}°, {info.lng}°</span></div>
          </div>
        )}
      </div>
    </div>
  )
}
