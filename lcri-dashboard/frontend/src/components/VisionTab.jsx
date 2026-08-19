import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import ReactECharts from 'echarts-for-react';
import BeforeAfterSlider from './BeforeAfterSlider';
import './VisionTab.css';

// Animated Ticker Component
function DataTicker({ endValue, label, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  
  useEffect(() => {
    let observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let startTime = null;
        const animate = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          setCount(Math.floor(progress * endValue));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [endValue, duration]);

  return (
    <div className="ticker-box" ref={ref}>
      <div className="ticker-number">{count.toLocaleString()}{suffix}</div>
      <div className="ticker-label">{label}</div>
    </div>
  );
}

// ScrollyTelling Component for dynamic narrative sections
function ImageScrollyTelling({ steps, navigate, ctaText, ctaLink, title }) {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = stepRefs.current.findIndex(ref => ref === entry.target);
          if (index !== -1) {
            setActiveStep(index);
          }
        }
      });
    }, { rootMargin: '-35% 0px -35% 0px' });

    stepRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, [steps]);

  return (
    <div className="scrollytelling-container" style={{ display: 'flex', gap: '40px', marginTop: '60px', position: 'relative' }}>
      {/* Left Column (Text) */}
      <div style={{ flex: '1', paddingBottom: '25vh' }}>
        {title && <h2 className="vision-subtitle" style={{ color: 'var(--accent)', marginBottom: '30px' }}>{title}</h2>}
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            ref={el => stepRefs.current[idx] = el}
            style={{
              minHeight: '38vh',
              padding: '32px',
              marginBottom: '20px',
              background: activeStep === idx ? 'rgba(46, 204, 113, 0.1)' : 'transparent',
              borderLeft: activeStep === idx ? '4px solid var(--accent)' : '4px solid transparent',
              borderRadius: '0 12px 12px 0',
              transition: 'all 0.4s ease',
              opacity: activeStep === idx ? 1 : 0.4
            }}
          >
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.6rem', marginBottom: '12px' }}>{step.title}</h3>
            <p className="vision-text" style={{ fontSize: '1.1rem', lineHeight: '1.75' }}>{step.text}</p>
          </div>
        ))}
        
        {ctaText && (
          <div style={{ textAlign: 'left', marginTop: '30px', paddingLeft: '32px' }}>
            <button onClick={() => navigate(ctaLink)} className="vision-cta">
              {ctaText} →
            </button>
          </div>
        )}
      </div>
      
      {/* Right Column (Sticky Visuals) */}
      <div style={{ flex: '1', position: 'sticky', top: '90px', height: '58vh', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
        {steps.map((step, idx) => (
          <img 
            key={idx}
            src={step.img} 
            alt={step.title}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: activeStep === idx ? 1 : 0,
              transition: 'opacity 0.7s ease-in-out'
            }}
          />
        ))}
      </div>
    </div>
  );
}

// MapScrollyTelling Component for interactive geospatial narratives
function MapScrollyTelling({ steps, navigate, ctaText, ctaLink, title }) {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef([]);
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = stepRefs.current.findIndex(ref => ref === entry.target);
          if (index !== -1) setActiveStep(index);
        }
      });
    }, { rootMargin: '-35% 0px -35% 0px' });
    stepRefs.current.forEach(ref => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [steps]);

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false, dragging: false }).setView([-1.94, 29.87], 8);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    }).addTo(map);
    L.rectangle([[-90, -180], [90, 180]], { color: 'transparent', fillColor: '#050b08', fillOpacity: 0.4 }).addTo(map);
    mapInst.current = map;
    return () => { map.remove(); mapInst.current = null; };
  }, []);

  useEffect(() => {
    if (!mapInst.current) return;
    const step = steps[activeStep];
    if (step && step.mapConfig) {
      if (step.mapConfig.center && step.mapConfig.zoom) {
        mapInst.current.flyTo(step.mapConfig.center, step.mapConfig.zoom, { duration: 1.5 });
      }
      if (layerRef.current) {
        mapInst.current.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      if (step.mapConfig.polygon) {
        layerRef.current = L.polygon(step.mapConfig.polygon, step.mapConfig.style || { color: '#2ecc71', weight: 2 }).addTo(mapInst.current);
      }
    }
  }, [activeStep, steps]);

  return (
    <div className="scrollytelling-container" style={{ display: 'flex', gap: '40px', marginTop: '60px', position: 'relative' }}>
      <div style={{ flex: '1', paddingBottom: '25vh' }}>
        {title && <h2 className="vision-subtitle" style={{ color: 'var(--accent)', marginBottom: '30px' }}>{title}</h2>}
        {steps.map((step, idx) => (
          <div key={idx} ref={el => stepRefs.current[idx] = el}
            style={{ minHeight: '38vh', padding: '32px', marginBottom: '20px', background: activeStep === idx ? 'rgba(46, 204, 113, 0.1)' : 'transparent', borderLeft: activeStep === idx ? '4px solid var(--accent)' : '4px solid transparent', borderRadius: '0 12px 12px 0', transition: 'all 0.4s ease', opacity: activeStep === idx ? 1 : 0.4 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.6rem', marginBottom: '12px' }}>{step.title}</h3>
            <p className="vision-text" style={{ fontSize: '1.1rem', lineHeight: '1.75' }}>{step.text}</p>
          </div>
        ))}
        {ctaText && <div style={{ textAlign: 'left', marginTop: '30px', paddingLeft: '32px' }}><button onClick={() => navigate(ctaLink)} className="vision-cta">{ctaText} →</button></div>}
      </div>
      <div style={{ flex: '1', position: 'sticky', top: '90px', height: '58vh', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
      </div>
    </div>
  );
}

// ChartScrollyTelling Component for data narratives
function ChartScrollyTelling({ steps, navigate, ctaText, ctaLink, title }) {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = stepRefs.current.findIndex(ref => ref === entry.target);
          if (index !== -1) setActiveStep(index);
        }
      });
    }, { rootMargin: '-35% 0px -35% 0px' });
    stepRefs.current.forEach(ref => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [steps]);

  const currentOption = steps[activeStep]?.chartOption || {};

  return (
    <div className="scrollytelling-container" style={{ display: 'flex', gap: '40px', marginTop: '60px', position: 'relative' }}>
      <div style={{ flex: '1', paddingBottom: '25vh' }}>
        {title && <h2 className="vision-subtitle" style={{ color: 'var(--accent)', marginBottom: '30px' }}>{title}</h2>}
        {steps.map((step, idx) => (
          <div key={idx} ref={el => stepRefs.current[idx] = el}
            style={{ minHeight: '38vh', padding: '32px', marginBottom: '20px', background: activeStep === idx ? 'rgba(46, 204, 113, 0.1)' : 'transparent', borderLeft: activeStep === idx ? '4px solid var(--accent)' : '4px solid transparent', borderRadius: '0 12px 12px 0', transition: 'all 0.4s ease', opacity: activeStep === idx ? 1 : 0.4 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.6rem', marginBottom: '12px' }}>{step.title}</h3>
            <p className="vision-text" style={{ fontSize: '1.1rem', lineHeight: '1.75' }}>{step.text}</p>
          </div>
        ))}
        {ctaText && <div style={{ textAlign: 'left', marginTop: '30px', paddingLeft: '32px' }}><button onClick={() => navigate(ctaLink)} className="vision-cta">{ctaText} →</button></div>}
      </div>
      <div style={{ flex: '1', position: 'sticky', top: '90px', height: '58vh', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
        <ReactECharts option={currentOption} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
}

const dashboardSteps = [
  {
    title: "1. The Proposal",
    text: "A local cooperative proposes a 500-hectare restoration project in Gicumbi District, Rwanda.",
    img: "/images/dashboard_proposal_1787155462625.jpg"
  },
  {
    title: "2. The Safeguard",
    text: "Before capital is deployed, the LCRI engine autonomously scans the perimeter. It cross-references boundaries against the World Database on Protected Areas (WDPA), guaranteeing the project safeguards native reserves.",
    img: "/images/dashboard_safeguard_1787155473240.jpg"
  },
  {
    title: "3. The Baseline",
    text: "Next, NASA and ESA orbital sensors sweep the terrain. The engine strips away the canopy to reveal the baseline: a degraded state of only 12 tons of carbon per hectare.",
    img: "/images/dashboard_baseline_1787155483215.jpg"
  },
  {
    title: "4. The Prediction",
    text: "Finally, the Random Forest algorithm takes over. Factoring in steep slopes and soil conditions, it projects a 10-year yield of 45 tons per hectare with an 85% AI Confidence Score, creating an investment-grade asset.",
    img: "/images/dashboard_prediction_1787155494547.jpg"
  }
];

const rankingBaseOpt = { backgroundColor:'transparent', textStyle:{fontFamily:'Inter',color:'#80cbc4'}, tooltip:{}, xAxis:{type:'category',axisLabel:{color:'#80cbc4'},axisLine:{lineStyle:{color:'#1e3a2a'}}}, yAxis:{type:'value',axisLabel:{color:'#80cbc4'},splitLine:{lineStyle:{color:'#1a2e22'}}} };

const rankingSteps = [
  {
    title: "1. The Overwhelming Scale",
    text: "With 16,636 hectares across 150 candidate parcels, manual selection is impossible. The LCRI Ranking Engine acts as an autonomous triage system, analyzing massive datasets in milliseconds to isolate optimal restoration zones.",
    chartOption: { ...rankingBaseOpt, xAxis: { type:'category', data:['P1','P2','P3','P4','P5','...P150'] }, series: [{ type: 'bar', data: [12,15,8,30,22,10], itemStyle: { color: '#3498db' } }] }
  },
  {
    title: "2. Multi-Dimensional Weighting",
    text: "It runs a multi-factor analysis: Carbon Potential (35%), Degradation Urgency (25%), Slope Feasibility (20%), and Community Engagement (20%). Users can adjust live weight sliders to align capital allocation with specific ESG targets.",
    chartOption: { ...rankingBaseOpt, tooltip: { trigger: 'item' }, xAxis: {show: false}, yAxis: {show: false}, series: [{ type: 'pie', radius: ['40%', '70%'], data: [{value:35, name:'Carbon Potential'}, {value:25, name:'Degradation'}, {value:20, name:'Slope'}, {value:20, name:'Community'}], label: { color: '#80cbc4' } }] }
  },
  {
    title: "3. Native Species Matching",
    text: "Once top parcels are isolated, the engine pairs each parcel with native Rwandan tree species—such as Umusave (Markhamia lutea) for agroforestry or Umurava (Polyscias fulva) for montane slopes.",
    chartOption: { ...rankingBaseOpt, xAxis: { type: 'value', name: 'Suitability' }, yAxis: { type: 'category', data: ['Polyscias fulva', 'Markhamia lutea', 'Grevillea'] }, series: [{ type: 'bar', data: [95, 88, 70], itemStyle: { color: '#2ecc71' } }] }
  },
  {
    title: "4. Investment-Ready Output",
    text: "The final output is an actionable, ranked ledger. Highest-scoring land is prioritized for immediate capital deployment, maximizing both carbon yield and ecological integrity.",
    chartOption: { ...rankingBaseOpt, xAxis: { type: 'category', data: ['Rank 1', 'Rank 2', 'Rank 3', 'Rank 4'] }, series: [{ type: 'bar', data: [98, 92, 85, 80], itemStyle: { color: '#f1c40f' } }] }
  }
];

const simulatorSteps = [
  {
    title: "1. The Base Variables",
    text: "Project developers enter target area, operational costs, and market carbon prices to simulate 30-year financial returns and net present value (NPV).",
    chartOption: {
      ...rankingBaseOpt,
      title: { text: '30-Year Carbon Sequestration (tCO₂e)', textStyle: { color: '#80cbc4', fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['Yr 1', 'Yr 5', 'Yr 10', 'Yr 15', 'Yr 20', 'Yr 25', 'Yr 30'], axisLabel: { color: '#80cbc4' } },
      yAxis: { type: 'value', name: 'tCO₂e / ha', axisLabel: { color: '#80cbc4' }, splitLine: { lineStyle: { color: '#1a2e22' } } },
      series: [{ name: 'Accumulated Carbon', type: 'line', smooth: true, data: [2, 18, 48, 85, 122, 150, 168], areaStyle: { color: 'rgba(46, 204, 113, 0.25)' }, itemStyle: { color: '#2ecc71' } }]
    }
  },
  {
    title: "2. Co-Benefit Multipliers",
    text: "Carbon is priced higher when projects demonstrate tangible biodiversity protection and gender equity in the local planting workforce.",
    chartOption: {
      ...rankingBaseOpt,
      title: { text: 'Carbon Credit Pricing Premium ($/ton)', textStyle: { color: '#80cbc4', fontSize: 14 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: ['Base Carbon', '+ Biodiversity', '+ Gender Equity', 'Total Premium'], axisLabel: { color: '#80cbc4', interval: 0 } },
      yAxis: { type: 'value', name: 'USD ($)', axisLabel: { color: '#80cbc4' }, splitLine: { lineStyle: { color: '#1a2e22' } } },
      series: [{ type: 'bar', data: [15, 6, 4, { value: 25, itemStyle: { color: '#f1c40f' } }], itemStyle: { color: '#3498db' } }]
    }
  },
  {
    title: "3. Native Growth Curves",
    text: "Precise allometric growth equations model native Rwandan species (Umusave, Polyscias fulva) across 3 decades of biomass accumulation.",
    chartOption: {
      ...rankingBaseOpt,
      title: { text: 'Native Species Growth Dynamics', textStyle: { color: '#80cbc4', fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['Polyscias fulva (Umurava)', 'Markhamia lutea (Umusave)', 'Grevillea robusta'], textStyle: { color: '#80cbc4' }, top: 25 },
      xAxis: { type: 'category', data: ['Yr 0', 'Yr 5', 'Yr 10', 'Yr 15', 'Yr 20', 'Yr 25', 'Yr 30'], axisLabel: { color: '#80cbc4' } },
      yAxis: { type: 'value', name: 'Biomass (Mg/ha)', axisLabel: { color: '#80cbc4' }, splitLine: { lineStyle: { color: '#1a2e22' } } },
      series: [
        { name: 'Polyscias fulva (Umurava)', type: 'line', smooth: true, data: [0, 22, 54, 88, 118, 140, 155], itemStyle: { color: '#2ecc71' } },
        { name: 'Markhamia lutea (Umusave)', type: 'line', smooth: true, data: [0, 14, 42, 78, 112, 145, 172], itemStyle: { color: '#f39c12' } },
        { name: 'Grevillea robusta', type: 'line', smooth: true, data: [0, 10, 28, 52, 76, 98, 115], itemStyle: { color: '#3498db' } }
      ]
    }
  },
  {
    title: "4. Risk-Adjusted Projections",
    text: "Monte Carlo risk scenarios apply a mandatory 20% risk buffer, guaranteeing conservative projections resilient to drought and wildfire risks.",
    chartOption: {
      ...rankingBaseOpt,
      title: { text: 'Monte Carlo 20% Risk Buffer Corridor', textStyle: { color: '#80cbc4', fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['Yr 1', 'Yr 5', 'Yr 10', 'Yr 15', 'Yr 20', 'Yr 25', 'Yr 30'], axisLabel: { color: '#80cbc4' } },
      yAxis: { type: 'value', name: 'Net Revenue ($k)', axisLabel: { color: '#80cbc4' }, splitLine: { lineStyle: { color: '#1a2e22' } } },
      series: [
        { name: 'Optimistic (P90)', type: 'line', smooth: true, data: [5, 45, 120, 210, 310, 420, 510], lineStyle: { type: 'dashed' }, itemStyle: { color: '#2ecc71' } },
        { name: 'Expected (P50)', type: 'line', smooth: true, data: [3, 32, 90, 165, 245, 330, 405], itemStyle: { color: '#3498db' } },
        { name: 'Risk-Buffered Floor (P10)', type: 'line', smooth: true, data: [2, 24, 68, 125, 185, 250, 310], areaStyle: { color: 'rgba(231, 76, 60, 0.15)' }, itemStyle: { color: '#e74c3c' } }
      ]
    }
  }
];

const registrySteps = [
  {
    title: "1. The Verification Crisis",
    text: "Carbon markets historically suffered from opacity and phantom credits. The LCRI Registry acts as a cryptographic single source of truth, linking every credit directly to Earth Observation telemetry.",
    img: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "2. Global Standard Integration",
    text: "Synchronized with international benchmarks (Verra, Gold Standard), the registry aggregates active REDD+ and ARR projects across Africa into one transparent ledger.",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "3. Live Satellite Auditing",
    text: "Stakeholders can inspect projects across the continent to load Sentinel-2 imagery and audit canopy health and biomass density directly from the browser.",
    img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "4. End-to-End Transparency",
    text: "From the first sapling planted by a rural cooperative to the retired credit, every ton of CO₂ is mathematically accounted for, ending greenwashing.",
    img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80"
  }
];

const gicumbiSteps = [
  {
    title: "1. The Official Claim",
    text: "Green Gicumbi reported a massive agroforestry initiative claiming 4,801 hectares planted across 9 sectors.",
    chartOption: {
      ...rankingBaseOpt,
      title: { text: 'Claimed Agroforestry Hectares by Sector', textStyle: { color: '#80cbc4', fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['Byumba', 'Kaniga', 'Manyagiro', 'Miyove', 'Mukarange', 'Rubaya', 'Rushaki', 'Rutare', 'Shangasha'], axisLabel: { color: '#80cbc4', rotate: 30 } },
      yAxis: { type: 'value', name: 'Hectares (ha)', axisLabel: { color: '#80cbc4' }, splitLine: { lineStyle: { color: '#1a2e22' } } },
      series: [{ type: 'bar', data: [580, 520, 610, 490, 540, 510, 480, 560, 511], itemStyle: { color: '#9b59b6' } }]
    }
  },
  {
    title: "2. Orbital Observation",
    text: "Sentinel-2 multi-spectral bands autonomously compare 2019 baselines to present-day NDVI, confirming ~4,650 hectares of actual canopy gain (a 97% validation rate).",
    chartOption: {
      ...rankingBaseOpt,
      title: { text: 'Claimed vs. Sentinel-2 Verified Canopy Gain', textStyle: { color: '#80cbc4', fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['Claimed (ha)', 'Satellite Verified (ha)'], textStyle: { color: '#80cbc4' } },
      xAxis: { type: 'category', data: ['Byumba', 'Kaniga', 'Manyagiro', 'Miyove', 'Mukarange', 'Rubaya', 'Rushaki', 'Rutare', 'Shangasha'], axisLabel: { color: '#80cbc4', rotate: 30 } },
      yAxis: { type: 'value', name: 'Hectares', axisLabel: { color: '#80cbc4' }, splitLine: { lineStyle: { color: '#1a2e22' } } },
      series: [
        { name: 'Claimed (ha)', type: 'bar', data: [580, 520, 610, 490, 540, 510, 480, 560, 511], itemStyle: { color: 'rgba(155, 89, 182, 0.6)' } },
        { name: 'Satellite Verified (ha)', type: 'bar', data: [562, 508, 595, 472, 526, 498, 465, 542, 482], itemStyle: { color: '#2ecc71' } }
      ]
    }
  },
  {
    title: "3. Sector-Level Precision",
    text: "The engine disaggregates findings sector by sector, verifying that resources directly reach the grassroots communities doing the physical planting.",
    chartOption: {
      ...rankingBaseOpt,
      title: { text: 'Sector Validation Accuracy (%)', textStyle: { color: '#80cbc4', fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['Byumba', 'Kaniga', 'Manyagiro', 'Miyove', 'Mukarange', 'Rubaya', 'Rushaki', 'Rutare', 'Shangasha'], axisLabel: { color: '#80cbc4', rotate: 30 } },
      yAxis: { type: 'value', min: 80, max: 100, name: 'Accuracy %', axisLabel: { color: '#80cbc4' }, splitLine: { lineStyle: { color: '#1a2e22' } } },
      series: [{ type: 'line', smooth: true, data: [96.9, 97.7, 97.5, 96.3, 97.4, 97.6, 96.9, 96.8, 94.3], itemStyle: { color: '#f1c40f' }, markLine: { data: [{ type: 'average', name: 'Avg 96.8%' }] } }]
    }
  },
  {
    title: "4. National NDC Tracking",
    text: "Translating canopy gain into an estimated 162,750 tCO₂e sequestered directly tracks Rwanda's national climate contribution targets.",
    chartOption: {
      ...rankingBaseOpt,
      title: { text: 'Cumulative CO₂e Contribution (Green Gicumbi)', textStyle: { color: '#80cbc4', fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['2020', '2021', '2022', '2023', '2024', '2025', '2026 (Target)'], axisLabel: { color: '#80cbc4' } },
      yAxis: { type: 'value', name: 'tCO₂e Sequestered', axisLabel: { color: '#80cbc4' }, splitLine: { lineStyle: { color: '#1a2e22' } } },
      series: [{ type: 'line', smooth: true, data: [12000, 38000, 72000, 110000, 138000, 152000, 162750], areaStyle: { color: 'rgba(46, 204, 113, 0.3)' }, itemStyle: { color: '#2ecc71' } }]
    }
  }
];

const CHAPTERS = [
  { id: 'act-1', num: '01', title: 'The Crisis & Baseline', icon: '🚨' },
  { id: 'act-2', num: '02', title: 'Ecological Science',    icon: '🛰️' },
  { id: 'act-3', num: '03', title: 'Grassroots Action',     icon: '🌱' },
  { id: 'act-4', num: '04', title: 'Capital Engine',        icon: '📊' },
];

export default function VisionTab() {
  const navigate = useNavigate();
  const observerRef = useRef(null);
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const [activeChapter, setActiveChapter] = useState('act-1');

  // Sticky Chapter Tracker
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (let i = CHAPTERS.length - 1; i >= 0; i--) {
        const el = document.getElementById(CHAPTERS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveChapter(CHAPTERS[i].id);
          break;
        }
      }
      sessionStorage.setItem('storyMapScroll', window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToChapter = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Setup intersection observer for scroll animations
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up');
          observerRef.current.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observerRef.current.observe(el));

    // Restore scroll position
    const savedScroll = sessionStorage.getItem('storyMapScroll');
    if (savedScroll) {
      setTimeout(() => window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'auto' }), 50);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  // Initialize Embedded Mini-Map for Biodiversity
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    
    // Coordinates for Gishwati-Mukura (approx -1.78, 29.41)
    const map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false })
      .setView([-1.785, 29.412], 12);
      
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    }).addTo(map);
    
    L.rectangle([[-90, -180], [90, 180]], {
      color: 'transparent',
      fillColor: '#050b08',
      fillOpacity: 0.4
    }).addTo(map);

    const degradedPolygon = [
      [-1.77, 29.40], [-1.77, 29.43], [-1.79, 29.42], [-1.80, 29.40]
    ];
    
    const polygon = L.polygon(degradedPolygon, {
      color: '#e74c3c',
      fillColor: '#c0392b',
      weight: 2,
      fillOpacity: 0.3,
      dashArray: '5, 5'
    }).addTo(map);

    polygon.bindTooltip("Critical Biodiversity Corridor (Chimpanzee & Golden Monkey Habitat)", { permanent: true, direction: 'right', className: 'vision-map-tooltip' });
    
    mapInst.current = map;

    return () => {
      map.remove();
      mapInst.current = null;
    };
  }, []);

  return (
    <div className="vision-container">
      
      {/* ── STICKY CHAPTER NAVIGATION BAR ── */}
      <div className="vision-chapter-nav">
        <div className="vision-chapter-title">
          <span>📖</span> The LCRI Story Map
        </div>
        <div className="vision-chapter-pills">
          {CHAPTERS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => scrollToChapter(ch.id)}
              className={`chapter-pill ${activeChapter === ch.id ? 'active' : ''}`}
            >
              <span className="pill-number">ACT {ch.num}</span>
              <span>{ch.icon} {ch.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── EXECUTIVE OVERVIEW HERO BANNER ── */}
      <div style={{ maxWidth: 1100, margin: '40px auto 0 auto', padding: '0 24px' }}>
        <div className="vision-hero-banner">
          <span className="hero-tag">RCMRD Arts & Maps 2026 · "Acting Locally for Global Impact"</span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', color: '#fff', marginBottom: 12, fontWeight: 800 }}>
            From Grassroots Tree Planting to Space-Verified Carbon Credits
          </h1>
          <p style={{ color: 'var(--text-sec)', fontSize: '1.1rem', lineHeight: 1.7, margin: 0 }}>
            This interactive Story Map demonstrates how the <strong>Local Carbon Return Index (LCRI)</strong> bridges Rwanda's cultural tradition of community planting (<em>Umuganda</em>) with orbital satellite telemetry and machine learning to create transparent, investment-grade carbon assets.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          ACT 1: THE CRISIS & BASELINE
         ════════════════════════════════════════════════════════════ */}
      <div id="act-1">
        {/* Section 1: Global Mandate */}
        <section className="vision-section">
          <div className="ambient-glow"></div>
          <div className="vision-content">
            <div className="act-header">
              <span className="act-badge act-badge-1">ACT 01</span>
              <span style={{ color: 'var(--text-sec)', fontWeight: 600 }}>The Crisis & Deforestation Baseline</span>
            </div>
            
            <div className="animate-on-scroll">
              <h1 className="vision-title">Africa Holds the Key to Global Climate Targets.</h1>
              <h2 className="vision-subtitle">Yet carbon funds bottleneck before reaching the ground.</h2>
            </div>
            
            <div className="animate-on-scroll delay-1">
              <p className="vision-text">
                While global corporations have pledged billions to African reforestation to meet Net-Zero goals, capital flow is constrained by a <strong>catastrophic data deficit</strong>. 
              </p>
              <p className="vision-text">
                Reforestation projects are often plagued by "phantom carbon"—initiatives that look promising on paper but fail due to drought, severe slopes, or lack of community stewardship. The LCRI platform provides the missing layer of verifiable, satellite-backed proof that turns ecological restoration into a trusted asset.
              </p>
            </div>

            {/* Tickers */}
            <div className="vision-grid" style={{ marginTop: 40 }}>
              <DataTicker endValue={124000} label="Hectares of Deforested Land in Rwanda" suffix=" ha" />
              <DataTicker endValue={85} label="Model Prediction Reliability" suffix="%" />
              <DataTicker endValue={4} label="Endangered Species Corridors Restored" suffix="+" />
            </div>
          </div>
        </section>

        {/* Section 2: Before/After Slider */}
        <section className="vision-section">
          <div className="ambient-glow glow-right"></div>
          <div className="vision-content">
            <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '36px' }}>
              <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.8vw, 3.2rem)' }}>The Power of Verified Reforestation</h1>
              <h2 className="vision-subtitle" style={{ color: '#2ecc71' }}>A Local Perspective: Canopy Restoration in Critical Biomes</h2>
              <p className="vision-text" style={{ margin: '0 auto', maxWidth: 880 }}>
                With high-fidelity spatial data, tree planting succeeds even on steep slopes or high-erosion areas. Drag the slider below to witness the transformation from severe degradation to thriving restored canopy in Rwanda's montane landscapes.
              </p>
            </div>
            
            <div className="animate-on-scroll delay-1">
              <BeforeAfterSlider 
                beforeImage="/images/rwanda_before.jpg" 
                afterImage="/images/rwanda_after.jpg" 
                beforeLabel="2018: Severe Erosion & Degradation (Green Gicumbi)" 
                afterLabel="2026: Radical Terracing & Agroforestry (Restored)" 
              />
            </div>
          </div>
        </section>
      </div>

      {/* ════════════════════════════════════════════════════════════
          ACT 2: ECOLOGICAL SCIENCE & CORRIDORS
         ════════════════════════════════════════════════════════════ */}
      <div id="act-2">
        {/* Section 3: Biodiversity Corridors */}
        <section className="vision-section">
          <div className="vision-content">
            <div className="act-header">
              <span className="act-badge act-badge-2">ACT 02</span>
              <span style={{ color: 'var(--text-sec)', fontWeight: 600 }}>Ecological Science & Space Telemetry</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center' }}>
              <div className="animate-on-scroll" style={{ flex: '1 1 400px' }}>
                <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.2vw, 2.8rem)' }}>More Than Just Carbon.</h1>
                <h2 className="vision-subtitle" style={{ color: '#f39c12' }}>Rebuilding Critical Biological Corridors</h2>
                <p className="vision-text">
                  In fragile ecosystems like the Albertine Rift, reforestation is also a race to reconnect fragmented habitats for the endangered <strong>Eastern Chimpanzee</strong> and the endemic <strong>Golden Monkey</strong>.
                </p>
                <p className="vision-text">
                  The LCRI engine prioritizes critical biological corridors, ensuring carbon investments double as biodiversity life-support systems.
                </p>
                <div style={{ marginTop: 24 }}>
                  <button onClick={() => navigate('/lcri')} className="vision-cta">
                    View Species & Parcel Suitability →
                  </button>
                </div>
              </div>

              <div className="animate-on-scroll delay-1" style={{ flex: '1 1 400px', height: '380px', position: 'relative' }}>
                <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 16, border: '2px solid rgba(243,156,18,0.4)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Earth Observation & Map Scrollytelling */}
        <section className="vision-section">
          <div className="vision-content">
            <div className="animate-on-scroll">
              <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>Investment-Grade Ecological Intelligence</h1>
              <h2 className="vision-subtitle">Fusing Satellite Telemetry with Machine Learning</h2>
              <p className="vision-text">
                The LCRI synthesizes open-source Earth Observation datasets with Random Forest regression models to predict 10-year biomass yields, quantify carbon stock, and compute AI confidence probabilities.
              </p>
            </div>

            {/* Satellite Biomass Telemetry Showcase Card */}
            <div className="animate-on-scroll delay-1" style={{ margin: '30px 0', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(46, 204, 113, 0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
              <img 
                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80" 
                alt="Satellite Aboveground Biomass Heatmap & Telemetry" 
                style={{ width: '100%', height: 'auto', maxHeight: '420px', objectFit: 'cover', display: 'block' }} 
              />
              <div style={{ background: 'rgba(5, 15, 10, 0.95)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid rgba(46, 204, 113, 0.2)' }}>
                <span style={{ color: '#2ecc71', fontSize: '0.9rem', fontWeight: 700 }}>🛰️ LIVE EO TELEMETRY · SENTINEL-2 SPECTRAL INDICES & NASA/ORNL AGB DENSITY</span>
                <span style={{ color: 'var(--text-sec)', fontSize: '0.85rem' }}>Resolution: 10m · Radiometric Calibration: Level-2A BOA</span>
              </div>
            </div>

            <div className="vision-grid">
              <div className="glass-card animate-on-scroll delay-1">
                <span className="card-icon">🛰️</span>
                <h3>Copernicus Sentinel-2</h3>
                <p>Multi-spectral bands track canopy NDVI, seasonal health, and vegetative stress in near real-time.</p>
              </div>
              
              <div className="glass-card animate-on-scroll delay-2">
                <span className="card-icon">🌍</span>
                <h3>NASA / ORNL Biomass</h3>
                <p>Aboveground Biomass (AGB) density models calculate carbon stock and sequestration headroom per hectare.</p>
              </div>
              
              <div className="glass-card animate-on-scroll delay-3">
                <span className="card-icon">🏔️</span>
                <h3>Terrain Feasibility</h3>
                <p>Slope and elevation models identify high-erosion zones to stabilize watersheds and prevent seedling loss.</p>
              </div>
            </div>

            <div className="animate-on-scroll" style={{ marginTop: '60px' }}>
              <ImageScrollyTelling 
                steps={dashboardSteps} 
                navigate={navigate} 
                title="The Anatomy of a Verified Project"
                ctaText="Open Dashboard & Map" 
                ctaLink="/dashboard" 
              />
            </div>
          </div>
        </section>
      </div>

      {/* ════════════════════════════════════════════════════════════
          ACT 3: GRASSROOTS ACTION & VALIDATION
         ════════════════════════════════════════════════════════════ */}
      <div id="act-3">
        {/* Section 5: Umuganda Ledger */}
        <section className="vision-section">
          <div className="ambient-glow glow-left" style={{ background: 'radial-gradient(circle, rgba(155,89,182,0.12) 0%, rgba(0,0,0,0) 70%)' }}></div>
          <div className="vision-content">
            <div className="act-header">
              <span className="act-badge act-badge-3">ACT 03</span>
              <span style={{ color: 'var(--text-sec)', fontWeight: 600 }}>The Grassroots Sensor Network</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: 50, alignItems: 'center' }}>
              <div className="animate-on-scroll" style={{ flex: '1 1 400px' }}>
                <div className="glass-card" style={{ padding: '36px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -20, left: -20, fontSize: '2.8rem' }}>🌱</div>
                  <h3 style={{ color: '#9b59b6', marginBottom: 12, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: 2 }}>Umuganda Community Ledger</h3>
                  <div style={{ background: 'rgba(0,0,0,0.5)', padding: 14, borderRadius: 8, marginBottom: 12, borderLeft: '3px solid #9b59b6' }}>
                    <strong style={{ color: '#fff' }}>Sector: Kanyinya / Gicumbi</strong><br/>
                    <span style={{ color: '#a0b3a9', fontSize: '0.9rem' }}>Species: 1,200 Polyscias fulva stems planted</span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.5)', padding: 14, borderRadius: 8, borderLeft: '3px solid #2ecc71' }}>
                    <strong style={{ color: '#fff' }}>Sentinel-2 Orbital Cross-Check</strong><br/>
                    <span style={{ color: '#a0b3a9', fontSize: '0.9rem' }}>Status: Confirmed High Confidence (0.85)</span>
                  </div>
                </div>
              </div>
              
              <div className="animate-on-scroll delay-1" style={{ flex: '1 1 400px' }}>
                <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.2vw, 2.8rem)' }}>The Human Sensor Network</h1>
                <h2 className="vision-subtitle" style={{ color: '#9b59b6' }}>Umuganda: Community at the Core</h2>
                <p className="vision-text">
                  Satellites alone cannot plant trees. The core innovation of LCRI is its integration with <strong>Umuganda</strong>—Rwanda’s cultural tradition of monthly community labor.
                </p>
                <p className="vision-text">
                  When local cooperatives log planting polygons, orbital satellites autonomously monitor canopy emergence. This bidirectional loop of human action validated by space creates undeniable transparency.
                </p>
                
                <div style={{ marginTop: 24, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <button onClick={() => navigate('/ledger')} className="vision-cta" style={{ background: '#9b59b6', color: '#fff' }}>
                    Explore Community Ledger →
                  </button>
                  <button onClick={() => navigate('/gicumbi')} className="vision-cta vision-cta-secondary" style={{ borderColor: '#9b59b6', color: '#9b59b6' }}>
                    View Gicumbi Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Green Gicumbi Verification Scrollytelling (Interactive ECharts) */}
        <section className="vision-section">
          <div className="vision-content">
            <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.2vw, 2.8rem)' }}>Ground-Truth Case Study</h1>
              <h2 className="vision-subtitle" style={{ color: '#2ecc71' }}>Green Gicumbi Verification (4,801 ha)</h2>
              <p className="vision-text" style={{ margin: '0 auto', maxWidth: 880 }}>
                How satellite telemetry independently validated 4,650 hectares of actual canopy gain out of a 4,801 ha claim—achieving a 97% validation rate.
              </p>
            </div>
            
            <div className="animate-on-scroll">
              <ChartScrollyTelling 
                steps={gicumbiSteps} 
                navigate={navigate} 
                ctaText="Open Green Gicumbi Verification" 
                ctaLink="/gicumbi" 
              />
            </div>
          </div>
        </section>
      </div>

      {/* ════════════════════════════════════════════════════════════
          ACT 4: PRECISION CAPITAL & SIMULATION
         ════════════════════════════════════════════════════════════ */}
      <div id="act-4">
        {/* Section 7: LCRI Ranking */}
        <section className="vision-section">
          <div className="vision-content">
            <div className="act-header">
              <span className="act-badge act-badge-4">ACT 04</span>
              <span style={{ color: 'var(--text-sec)', fontWeight: 600 }}>Precision Capital & Financial Projections</span>
            </div>

            <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.2vw, 2.8rem)' }}>Precision Capital Allocation</h1>
              <h2 className="vision-subtitle" style={{ color: '#80cbc4' }}>The LCRI Ranking Engine</h2>
              <p className="vision-text" style={{ margin: '0 auto', maxWidth: 880 }}>
                With thousands of degraded hectares across Rwanda, the LCRI Ranking Engine prioritizes parcels by balancing carbon potential, degradation urgency, terrain feasibility, and community capacity.
              </p>
            </div>
            
            <div className="animate-on-scroll">
              <ChartScrollyTelling 
                steps={rankingSteps} 
                navigate={navigate} 
                ctaText="Open LCRI Ranking Engine" 
                ctaLink="/lcri" 
              />
            </div>
          </div>
        </section>

        {/* Section 8: Financial Simulator (Interactive ECharts) */}
        <section className="vision-section">
          <div className="vision-content">
            <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.2vw, 2.8rem)' }}>Financial Engineering & Risk Buffering</h1>
              <h2 className="vision-subtitle" style={{ color: '#2ecc71' }}>The Reforestation Investment Simulator</h2>
              <p className="vision-text" style={{ margin: '0 auto', maxWidth: 880 }}>
                Run Monte Carlo risk simulations, adjust co-benefit multipliers, and model 30-year revenue projections under fluctuating carbon price curves.
              </p>
            </div>
            
            <div className="animate-on-scroll">
              <ChartScrollyTelling 
                steps={simulatorSteps} 
                navigate={navigate} 
                ctaText="Run Reforestation Simulator" 
                ctaLink="/simulator" 
              />
            </div>
          </div>
        </section>

        {/* Section 9: Carbon Project Registry (Cryptographic Scientific Infographics) */}
        <section className="vision-section">
          <div className="vision-content">
            <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.2vw, 2.8rem)' }}>Cryptographic Truth & Live Auditing</h1>
              <h2 className="vision-subtitle" style={{ color: '#3498db' }}>Pan-African Project Registry</h2>
              <p className="vision-text" style={{ margin: '0 auto', maxWidth: 880 }}>
                Audit active REDD+ and ARR projects across Africa in real-time, connecting global carbon markets to verifiable Earth Observation records.
              </p>
            </div>
            
            <div className="animate-on-scroll">
              <ImageScrollyTelling 
                steps={registrySteps} 
                navigate={navigate} 
                ctaText="Audit Live Registry" 
                ctaLink="/registry" 
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── SECTION 5: FINAL CALL TO ACTION ── */}
      <section className="vision-section">
        <div className="ambient-glow" style={{ background: 'radial-gradient(circle, rgba(46,204,113,0.15) 0%, rgba(0,0,0,0) 60%)' }}></div>
        <div className="vision-content" style={{ textAlign: 'center' }}>
          <div className="animate-on-scroll">
            <h1 className="vision-title">Don't just read the story.</h1>
            <h2 className="vision-subtitle" style={{ color: 'var(--text-primary)' }}>Simulate the impact.</h2>
            <p className="vision-text" style={{ margin: '0 auto 36px auto' }}>
              Tested in Rwanda. Built for Africa. Discover planting sites, run financial simulations, and audit canopy growth in real-time.
            </p>
            
            <div className="vision-cta-group" style={{ justifyContent: 'center' }}>
              <button onClick={() => navigate('/dashboard')} className="vision-cta">
                Explore Satellite Dashboard →
              </button>
              <button onClick={() => navigate('/simulator')} className="vision-cta vision-cta-secondary">
                Run Restoration Simulator
              </button>
              <button onClick={() => navigate('/registry')} className="vision-cta vision-cta-secondary">
                View Project Registry
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
