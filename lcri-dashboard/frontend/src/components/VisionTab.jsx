import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import ReactECharts from 'echarts-for-react';
import BeforeAfterSlider from './BeforeAfterSlider';
import './VisionTab.css';

// ── Animated Data Ticker Component ──────────────────────────────────────────
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
    }, { threshold: 0.2 });
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

// ── Fluid Image Scrollytelling Stage with Telemetry HUD ───────────────────────
function ImageScrollyTelling({ steps, navigate, ctaText, ctaLink, title, badge = "ORBITAL PIPELINE" }) {
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
    }, { rootMargin: '-25% 0px -30% 0px', threshold: 0.25 });

    stepRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, [steps]);

  const currentStep = steps[activeStep] || steps[0];

  return (
    <div className="scrollytelling-container">
      {/* Left Narrative Column */}
      <div className="scrollytelling-text">
        {title && <h2 className="vision-subtitle" style={{ color: 'var(--accent)', marginBottom: '24px' }}>{title}</h2>}
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            ref={el => stepRefs.current[idx] = el}
            className={`scrolly-step-card ${activeStep === idx ? 'active' : ''}`}
          >
            <div className="scrolly-step-chip">
              <span>●</span> STEP 0{idx + 1} OF 0{steps.length} · {badge}
            </div>
            <h3 className="scrolly-step-title">{step.title}</h3>
            <p className="vision-text">{step.text}</p>
          </div>
        ))}
        
        {ctaText && (
          <div style={{ marginTop: '20px' }}>
            <button onClick={() => navigate(ctaLink)} className="vision-cta">
              {ctaText} →
            </button>
          </div>
        )}
      </div>
      
      {/* Right Sticky Telemetry Visual Stage */}
      <div className="scrollytelling-visual">
        <div className="visual-step-badge">
          🛰️ STEP 0{activeStep + 1} / 0{steps.length}: {currentStep.title}
        </div>

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
              transform: activeStep === idx ? 'scale(1)' : 'scale(1.04)',
              transition: 'opacity 0.65s ease-in-out, transform 0.85s ease-out'
            }}
          />
        ))}

        {/* Live HUD Telemetry Overlay */}
        <div className="visual-hud-footer">
          <span style={{ color: '#2ecc71', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#2ecc71', animation: 'pulse 1.5s infinite' }}></span>
            {currentStep.hudTag || "ORBITAL TELEMETRY"}
          </span>
          <span style={{ color: 'var(--text-sec)', fontSize: '0.8rem' }}>
            {currentStep.hudCoords || "Gicumbi Sector · 1.58° S, 30.06° E"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Fluid Chart Scrollytelling Stage ─────────────────────────────────────────
function ChartScrollyTelling({ steps, navigate, ctaText, ctaLink, title, badge = "LIVE TELEMETRY" }) {
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
    }, { rootMargin: '-25% 0px -30% 0px', threshold: 0.25 });
    stepRefs.current.forEach(ref => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [steps]);

  const currentOption = steps[activeStep]?.chartOption || {};

  return (
    <div className="scrollytelling-container">
      {/* Left Narrative Column */}
      <div className="scrollytelling-text">
        {title && <h2 className="vision-subtitle" style={{ color: 'var(--accent)', marginBottom: '24px' }}>{title}</h2>}
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            ref={el => stepRefs.current[idx] = el}
            className={`scrolly-step-card ${activeStep === idx ? 'active' : ''}`}
          >
            <div className="scrolly-step-chip">
              <span>●</span> STEP 0{idx + 1} OF 0{steps.length} · {badge}
            </div>
            <h3 className="scrolly-step-title">{step.title}</h3>
            <p className="vision-text">{step.text}</p>
          </div>
        ))}
        {ctaText && (
          <div style={{ marginTop: '20px' }}>
            <button onClick={() => navigate(ctaLink)} className="vision-cta">
              {ctaText} →
            </button>
          </div>
        )}
      </div>

      {/* Right Sticky Chart Visual Stage */}
      <div className="scrollytelling-visual" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="visual-step-badge">
          📊 FRAME 0{activeStep + 1} / 0{steps.length}: {steps[activeStep]?.title}
        </div>
        <div style={{ width: '100%', height: 'calc(100% - 30px)', marginTop: '20px' }}>
          <ReactECharts 
            option={currentOption} 
            notMerge={false}
            lazyUpdate={true}
            style={{ height: '100%', width: '100%' }} 
          />
        </div>
      </div>
    </div>
  );
}

// ── Narrative Bridge Component ──────────────────────────────────────────────
function NarrativeBridge({ icon, tag, question, answer, nextStageId }) {
  const scrollTo = () => {
    const el = document.getElementById(nextStageId);
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  return (
    <div className="narrative-bridge" onClick={scrollTo} style={{ cursor: 'pointer' }}>
      <div className="bridge-left">
        <div className="bridge-icon">{icon}</div>
        <div>
          <div className="bridge-tag">{tag}</div>
          <h4 className="bridge-question">{question}</h4>
          <p className="bridge-answer">{answer}</p>
        </div>
      </div>
      <div className="bridge-arrow">↓</div>
    </div>
  );
}

// ── Step Data Definitions with Telemetry HUD Meta ───────────────────────────
const orbitalScanSteps = [
  {
    title: "1. The Proposal & Perimeter",
    text: "A local farming cooperative submits a 500-hectare agroforestry project in Gicumbi District, Northern Rwanda.",
    img: "/images/dashboard_proposal_1787155462625.jpg",
    hudTag: "SENTINEL-2 (10m) · 500 ha PROPOSED AREA",
    hudCoords: "Gicumbi District · 1.581° S, 30.063° E"
  },
  {
    title: "2. Autonomous WDPA Safeguards",
    text: "Before capital is deployed, orbital algorithms cross-reference boundaries against the World Database on Protected Areas (WDPA), ensuring native biological corridors are safeguarded.",
    img: "/images/dashboard_safeguard_1787155473240.jpg",
    hudTag: "WDPA SHIELD: VERIFIED · 0% ENCROACHMENT",
    hudCoords: "Albertine Rift Buffer Zone · Protected"
  },
  {
    title: "3. Orbital Baseline Extraction",
    text: "NASA and ESA orbital sensors sweep the terrain. The engine strips away canopy reflections to establish the degraded baseline of only 12 tons of carbon per hectare.",
    img: "/images/dashboard_baseline_1787155483215.jpg",
    hudTag: "NASA GEDI / ORNL · 12 tC/ha DEGRADED BASELINE",
    hudCoords: "NDVI Spectral Index: 0.32 (Severely Eroded)"
  },
  {
    title: "4. Machine Learning Yield Prediction",
    text: "Random Forest models factor in slope gradients, soil moisture, and climatic curves to project a 10-year yield of 45 tC/ha with an 85% AI Confidence Score.",
    img: "/maps/13_Predicted_AGB.png",
    hudTag: "AI MODEL: RANDOM FOREST · 45 tC/ha FORECAST",
    hudCoords: "85% Reliability Probability"
  }
];

const baseChartTheme = {
  backgroundColor: 'transparent',
  grid: { top: 60, right: 25, bottom: 45, left: 20, containLabel: true },
  textStyle: { color: '#a0b3a9', fontFamily: 'Inter, system-ui, sans-serif' },
  xAxis: {
    type: 'category',
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
    axisLabel: { color: '#a0b3a9', fontSize: 11 }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    axisLabel: { color: '#a0b3a9', fontSize: 11 }
  }
};

const gicumbiProofSteps = [
  {
    title: "1. The Ground Claim (4,801 ha)",
    text: "Between 2019 and 2024, Green Gicumbi mobilized thousands of local farmers across 9 sectors to plant 4,801 hectares of steep montane hills.",
    chartOption: {
      ...baseChartTheme,
      title: { text: 'Green Gicumbi: Claimed Tree Planting by Sector', left: 'center', top: 10, textStyle: { color: '#fff', fontSize: 13 } },
      xAxis: { ...baseChartTheme.xAxis, data: ['Byumba', 'Kaniga', 'Manyagiro', 'Miyove', 'Mukarange', 'Rubaya', 'Rushaki', 'Rutare', 'Shangasha'], axisLabel: { color: '#a0b3a9', rotate: 30 } },
      yAxis: { ...baseChartTheme.yAxis, name: 'Claimed (ha)' },
      series: [{ name: 'Claimed', type: 'bar', data: [580, 520, 610, 490, 540, 510, 480, 560, 511], itemStyle: { color: 'rgba(155, 89, 182, 0.7)', borderRadius: [4, 4, 0, 0] } }]
    }
  },
  {
    title: "2. Sentinel-2 Orbital Observation",
    text: "Sentinel-2 multi-spectral NDVI bands autonomously compared 2019 baselines to 2026 present-day imagery, confirming 4,650 hectares of net canopy gain—a 97% validation rate.",
    chartOption: {
      ...baseChartTheme,
      title: { text: 'Claimed vs. Satellite-Verified Canopy Gain', left: 'center', top: 10, textStyle: { color: '#2ecc71', fontSize: 13 } },
      legend: { data: ['Claimed (ha)', 'Satellite Verified (ha)'], top: 35, textStyle: { color: '#a0b3a9', fontSize: 11 } },
      xAxis: { ...baseChartTheme.xAxis, data: ['Byumba', 'Kaniga', 'Manyagiro', 'Miyove', 'Mukarange', 'Rubaya', 'Rushaki', 'Rutare', 'Shangasha'], axisLabel: { color: '#a0b3a9', rotate: 30 } },
      yAxis: { ...baseChartTheme.yAxis, name: 'Hectares' },
      series: [
        { name: 'Claimed (ha)', type: 'bar', data: [580, 520, 610, 490, 540, 510, 480, 560, 511], itemStyle: { color: 'rgba(155, 89, 182, 0.45)', borderRadius: [4, 4, 0, 0] } },
        { name: 'Satellite Verified (ha)', type: 'bar', data: [562, 508, 595, 472, 526, 498, 465, 542, 482], itemStyle: { color: '#2ecc71', borderRadius: [4, 4, 0, 0] } }
      ]
    }
  },
  {
    title: "3. Sector Accuracy Audit (Avg 96.8%)",
    text: "Disaggregating findings sector by sector proves that community forestry was executed uniformly without phantom drop-offs.",
    chartOption: {
      ...baseChartTheme,
      title: { text: 'Sector Validation Accuracy (%)', left: 'center', top: 10, textStyle: { color: '#f1c40f', fontSize: 13 } },
      xAxis: { ...baseChartTheme.xAxis, data: ['Byumba', 'Kaniga', 'Manyagiro', 'Miyove', 'Mukarange', 'Rubaya', 'Rushaki', 'Rutare', 'Shangasha'], axisLabel: { color: '#a0b3a9', rotate: 30 } },
      yAxis: { ...baseChartTheme.yAxis, min: 85, max: 100, name: 'Accuracy %' },
      series: [{ type: 'line', smooth: true, data: [96.9, 97.7, 97.5, 96.3, 97.4, 97.6, 96.9, 96.8, 94.3], itemStyle: { color: '#f1c40f' }, lineStyle: { width: 3 } }]
    }
  },
  {
    title: "4. Carbon Yield: 162,750 tCO₂e",
    text: "Translating verified canopy gain into carbon tonnage establishes 162,750 tCO₂e sequestered, feeding directly into Rwanda's national climate contributions.",
    chartOption: {
      ...baseChartTheme,
      title: { text: 'Cumulative Carbon Sequestered (Gicumbi)', left: 'center', top: 10, textStyle: { color: '#2ecc71', fontSize: 13 } },
      xAxis: { ...baseChartTheme.xAxis, data: ['2020', '2021', '2022', '2023', '2024', '2025', '2026 (Target)'], axisLabel: { color: '#a0b3a9' } },
      yAxis: { ...baseChartTheme.yAxis, name: 'tCO₂e' },
      series: [{ type: 'line', smooth: true, data: [12000, 38000, 72000, 110000, 138000, 152000, 162750], areaStyle: { color: 'rgba(46, 204, 113, 0.25)' }, itemStyle: { color: '#2ecc71' } }]
    }
  }
];

const capitalSimulationSteps = [
  {
    title: "1. 30-Year Carbon Yield Model",
    text: "Simulate biological growth curves for native Polyscias fulva and agroforestry Grevillea robusta across 30 years under changing climate parameters.",
    chartOption: {
      ...baseChartTheme,
      title: { text: '30-Year Cumulative Carbon Sequestration', left: 'center', top: 10, textStyle: { color: '#2ecc71', fontSize: 13 } },
      legend: { data: ['Polyscias fulva (Native)', 'Grevillea robusta (Agroforestry)'], top: 35, textStyle: { color: '#a0b3a9', fontSize: 11 } },
      xAxis: { ...baseChartTheme.xAxis, data: ['Yr 1', 'Yr 5', 'Yr 10', 'Yr 15', 'Yr 20', 'Yr 25', 'Yr 30'] },
      yAxis: { ...baseChartTheme.yAxis, name: 'tCO₂/ha' },
      series: [
        { name: 'Polyscias fulva (Native)', type: 'line', smooth: true, data: [2, 18, 55, 105, 160, 210, 245], itemStyle: { color: '#2ecc71' } },
        { name: 'Grevillea robusta (Agroforestry)', type: 'line', smooth: true, data: [4, 30, 75, 120, 150, 175, 190], itemStyle: { color: '#3498db' } }
      ]
    }
  },
  {
    title: "2. Carbon Price Sensitivity Curves",
    text: "Dynamic revenue modeling across conservative ($15/ton), base ($25/ton), and premium biodiversity ($40/ton) market scenarios.",
    chartOption: {
      ...baseChartTheme,
      title: { text: 'Project Revenue by Carbon Price Curve ($/tCO₂)', left: 'center', top: 10, textStyle: { color: '#f1c40f', fontSize: 13 } },
      legend: { data: ['$15/t (Voluntary Base)', '$25/t (Article 6.2 Target)', '$40/t (Biodiversity Premium)'], top: 35, textStyle: { color: '#a0b3a9', fontSize: 11 } },
      xAxis: { ...baseChartTheme.xAxis, data: ['Yr 5', 'Yr 10', 'Yr 15', 'Yr 20', 'Yr 25', 'Yr 30'] },
      yAxis: { ...baseChartTheme.yAxis, name: 'Revenue ($M)' },
      series: [
        { name: '$15/t (Voluntary Base)', type: 'bar', data: [0.18, 0.55, 1.05, 1.60, 2.10, 2.45], itemStyle: { color: 'rgba(241, 196, 15, 0.4)' } },
        { name: '$25/t (Article 6.2 Target)', type: 'bar', data: [0.30, 0.92, 1.75, 2.67, 3.50, 4.08], itemStyle: { color: 'rgba(52, 152, 219, 0.7)' } },
        { name: '$40/t (Biodiversity Premium)', type: 'bar', data: [0.48, 1.47, 2.80, 4.27, 5.60, 6.53], itemStyle: { color: '#2ecc71' } }
      ]
    }
  },
  {
    title: "3. 20% Monte Carlo Risk Buffer",
    text: "Every carbon transaction autonomously locks 20% of credits into an orbital escrow pool to insure against drought, wildfire, or seedling loss.",
    chartOption: {
      ...baseChartTheme,
      title: { text: 'Risk Buffer Escrow vs Tradeable Volume', left: 'center', top: 10, textStyle: { color: '#e74c3c', fontSize: 13 } },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '55%'],
        data: [
          { value: 80, name: 'Tradeable Carbon (80%)', itemStyle: { color: '#2ecc71' } },
          { value: 20, name: 'Risk Buffer Escrow (20%)', itemStyle: { color: '#e74c3c' } }
        ],
        label: { color: '#fff', fontSize: 12 }
      }]
    }
  },
  {
    title: "4. Equitable Community Benefit Split",
    text: "Transparent revenue sharing guarantees that 60% of all credit proceeds go directly to local cooperative bank accounts and tree nurseries.",
    chartOption: {
      ...baseChartTheme,
      title: { text: 'Smart-Contract Carbon Revenue Distribution', left: 'center', top: 10, textStyle: { color: '#bb8fce', fontSize: 13 } },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '55%'],
        data: [
          { value: 60, name: 'Local Cooperatives (60%)', itemStyle: { color: '#9b59b6' } },
          { value: 20, name: 'Monitoring & GEE Telemetry (20%)', itemStyle: { color: '#3498db' } },
          { value: 20, name: 'National Green Fund FONERWA (20%)', itemStyle: { color: '#2ecc71' } }
        ],
        label: { color: '#fff', fontSize: 12 }
      }]
    }
  }
];

const STAGES = [
  { id: 'stage-1', num: '01', title: 'The Crisis & Baseline', icon: '🚨' },
  { id: 'stage-2', num: '02', title: 'The Orbital Scan',      icon: '🛰️' },
  { id: 'stage-3', num: '03', title: 'Grassroots Action',     icon: '🌱' },
  { id: 'stage-4', num: '04', title: 'Space Proof & ML',      icon: '🔍' },
  { id: 'stage-5', num: '05', title: 'Capital & Return',       icon: '💰' },
];

export default function VisionTab() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const [activeStage, setActiveStage] = useState('stage-1');

  // Sticky Stage Scroll Tracker
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 220;
      for (let i = STAGES.length - 1; i >= 0; i--) {
        const el = document.getElementById(STAGES[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveStage(STAGES[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToStage = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.pageYOffset - 75;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  // Initialize Biodiversity Corridor Map in Stage 2
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    
    const map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false })
      .setView([-1.785, 29.412], 12);
      
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    }).addTo(map);

    const degradedPolygon = [
      [-1.77, 29.40], [-1.77, 29.43], [-1.79, 29.42], [-1.80, 29.40]
    ];
    
    const polygon = L.polygon(degradedPolygon, {
      color: '#e74c3c',
      fillColor: '#c0392b',
      weight: 2,
      fillOpacity: 0.35,
      dashArray: '5, 5'
    }).addTo(map);

    polygon.bindTooltip("Albertine Rift Corridor · Chimpanzee & Golden Monkey Zone", { 
      permanent: true, 
      direction: 'right', 
      className: 'vision-map-tooltip' 
    });
    
    mapInst.current = map;

    return () => {
      map.remove();
      mapInst.current = null;
    };
  }, []);

  return (
    <div className="vision-container">
      
      {/* ── STICKY TOP STAGE NAVIGATION BAR ── */}
      <div className="vision-chapter-nav">
        <div className="vision-chapter-title">
          <span>📖</span> The LCRI Connected Journey
        </div>
        <div className="vision-chapter-pills">
          {STAGES.map((st) => (
            <button
              key={st.id}
              onClick={() => scrollToStage(st.id)}
              className={`chapter-pill ${activeStage === st.id ? 'active' : ''}`}
            >
              <span className="pill-number">STAGE {st.num}</span>
              <span>{st.icon} {st.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── HERO BANNER ── */}
      <div style={{ maxWidth: 1150, margin: '30px auto 0 auto', padding: '0 24px' }}>
        <div className="vision-hero-banner">
          <span className="hero-tag">RCMRD Arts & Maps 2026 · "Acting Locally for Global Impact"</span>
          <h1 style={{ fontSize: 'clamp(1.9rem, 3.8vw, 2.7rem)', color: '#fff', marginBottom: 14, fontWeight: 800 }}>
            From Grassroots Tree Planting to Space-Verified Carbon Capital
          </h1>
          <p style={{ color: 'var(--text-sec)', fontSize: '1.12rem', lineHeight: 1.75, margin: 0 }}>
            Follow the complete step-by-step lifecycle: How Rwanda's cultural tradition of community planting (<em>Umuganda</em>) connects with orbital satellite telemetry and machine learning to turn degraded hills into investment-grade carbon assets.
          </p>
        </div>
      </div>

      {/* ── CONNECTED 5-STAGE STORY SPINE ── */}
      <div className="story-spine-container">

        {/* ════════════════════════════════════════════════════════════
            STAGE 1: THE CRISIS & GROUND BASELINE
           ════════════════════════════════════════════════════════════ */}
        <div id="stage-1" className="stage-wrapper">
          <div className="stage-header">
            <span className="stage-badge stage-badge-1">STAGE 01 · THE PROBLEM</span>
            <span style={{ color: 'var(--text-sec)', fontWeight: 600 }}>The African Carbon Deficit</span>
          </div>

          <h1 className="vision-title">Africa Holds the Key to Global Climate Targets.</h1>
          <h2 className="vision-subtitle" style={{ color: '#ff6b6b' }}>Yet international carbon capital bottlenecks before reaching the soil.</h2>

          <div style={{ maxWidth: 880 }}>
            <p className="vision-text">
              While global corporations have pledged billions to African reforestation to meet Net-Zero goals, capital flow is constrained by a <strong>catastrophic data deficit</strong>. 
            </p>
            <p className="vision-text">
              Reforestation projects are often plagued by "phantom carbon"—initiatives that look promising on paper but fail due to severe slopes, erosion, or lack of community stewardship. The LCRI platform bridges this divide by providing continuous satellite-backed proof.
            </p>
          </div>

          {/* Live Data Tickers */}
          <div className="vision-grid" style={{ marginTop: 32 }}>
            <DataTicker endValue={124000} label="Hectares of Degraded Land in Rwanda" suffix=" ha" />
            <DataTicker endValue={85} label="Model Prediction Reliability" suffix="%" />
            <DataTicker endValue={4} label="Endangered Species Corridors Restored" suffix="+" />
          </div>

          {/* Before / After Slider */}
          <div style={{ marginTop: 48 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h3 style={{ color: '#2ecc71', fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Visualizing Restored Montane Landscapes</h3>
              <p className="vision-text" style={{ margin: '0 auto', maxWidth: 750 }}>
                Drag the interactive slider below to witness the transformation from severe degradation to thriving restored canopy in Rwanda's montane landscapes.
              </p>
            </div>
            <BeforeAfterSlider 
              beforeImage="/images/rwanda_before.jpg" 
              afterImage="/images/rwanda_after.jpg" 
              beforeLabel="2018: Severe Erosion & Degradation (Green Gicumbi)" 
              afterLabel="2026: Radical Terracing & Agroforestry (Restored)" 
            />
          </div>
        </div>

        {/* ── NARRATIVE BRIDGE 1 → 2 ── */}
        <NarrativeBridge 
          icon="🛰️"
          tag="NEXT STEP IN THE CHAIN"
          question="How do we identify degraded land without spending millions on manual surveys?"
          answer="Stage 2: Orbital satellites sweep the country from space to map exact biomass density and erosion boundaries."
          nextStageId="stage-2"
        />

        {/* ════════════════════════════════════════════════════════════
            STAGE 2: THE ORBITAL SCAN & SAFEGUARDS
           ════════════════════════════════════════════════════════════ */}
        <div id="stage-2" className="stage-wrapper">
          <div className="stage-header">
            <span className="stage-badge stage-badge-2">STAGE 02 · ORBITAL DISCOVERY</span>
            <span style={{ color: 'var(--text-sec)', fontWeight: 600 }}>Space Telemetry & Biodiversity Safeguards</span>
          </div>

          <h1 className="vision-title">Autonomous Satellite Telemetry from Space.</h1>
          <h2 className="vision-subtitle" style={{ color: '#5dade2' }}>Fusing Sentinel-2, NASA GEDI, and AI models into an automated discovery engine.</h2>

          {/* Biodiversity Corridor Spotlight */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 36, alignItems: 'center', margin: '36px 0' }}>
            <div style={{ flex: '1 1 380px' }}>
              <h3 style={{ color: '#f39c12', fontSize: '1.4rem', fontWeight: 700, marginBottom: 12 }}>
                Protecting Critical Albertine Rift Corridors
              </h3>
              <p className="vision-text">
                In fragile ecosystems like Gishwati-Mukura and Nyungwe, reforestation is a race to reconnect fragmented habitats for the endangered <strong>Eastern Chimpanzee</strong> and the endemic <strong>Golden Monkey</strong>.
              </p>
              <p className="vision-text">
                The LCRI engine automatically scans WDPA boundaries to ensure projects safeguard native biomes while prioritizing high-biodiversity corridors.
              </p>
              <button onClick={() => navigate('/lens')} className="vision-cta" style={{ marginTop: 8 }}>
                Open Interactive Satellite Lens →
              </button>
            </div>

            <div style={{ flex: '1 1 380px', height: '340px', position: 'relative' }}>
              <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 18, border: '2px solid rgba(243,156,18,0.4)', boxShadow: '0 16px 36px rgba(0,0,0,0.5)' }}></div>
            </div>
          </div>

          {/* Scrollytelling Stage: The Anatomy of a Verified Project */}
          <div style={{ marginTop: 50 }}>
            <ImageScrollyTelling 
              steps={orbitalScanSteps} 
              navigate={navigate} 
              title="The 4-Step Orbital Ingestion Pipeline"
              badge="ORBITAL SCAN"
              ctaText="View 13-Layer Data Atlas" 
              ctaLink="/atlas" 
            />
          </div>
        </div>

        {/* ── NARRATIVE BRIDGE 2 → 3 ── */}
        <NarrativeBridge 
          icon="🌱"
          tag="NEXT STEP IN THE CHAIN"
          question="Now that satellites mapped the coordinates, who actually plants the trees?"
          answer="Stage 3: Rwanda's cultural tradition of Umuganda mobilizes local farming cooperatives on the ground."
          nextStageId="stage-3"
        />

        {/* ════════════════════════════════════════════════════════════
            STAGE 3: GRASSROOTS ACTION & GPS LEDGER
           ════════════════════════════════════════════════════════════ */}
        <div id="stage-3" className="stage-wrapper">
          <div className="stage-header">
            <span className="stage-badge stage-badge-3">STAGE 03 · GROUND ACTION</span>
            <span style={{ color: 'var(--text-sec)', fontWeight: 600 }}>The Human Sensor Network</span>
          </div>

          <h1 className="vision-title">Satellites Don't Plant Trees. Communities Do.</h1>
          <h2 className="vision-subtitle" style={{ color: '#bb8fce' }}>Umuganda: Community Stewardship at the Core</h2>

          <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: 40, alignItems: 'center', marginTop: 32 }}>
            <div style={{ flex: '1 1 380px' }}>
              <div className="glass-card" style={{ padding: '32px', position: 'relative', border: '1px solid rgba(155, 89, 182, 0.4)' }}>
                <div style={{ position: 'absolute', top: -18, left: -18, fontSize: '2.5rem' }}>🌱</div>
                <h3 style={{ color: '#bb8fce', marginBottom: 14, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  Live Umuganda Community Ledger
                </h3>
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: 14, borderRadius: 10, marginBottom: 12, borderLeft: '4px solid #bb8fce' }}>
                  <strong style={{ color: '#fff' }}>Sector: Kanyinya / Gicumbi District</strong><br/>
                  <span style={{ color: '#a0b3a9', fontSize: '0.9rem' }}>Species: 1,200 Polyscias fulva & Grevillea stems planted</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.5)', padding: 14, borderRadius: 10, borderLeft: '4px solid #2ecc71' }}>
                  <strong style={{ color: '#fff' }}>Sentinel-2 Orbital Cross-Check</strong><br/>
                  <span style={{ color: '#a0b3a9', fontSize: '0.9rem' }}>Telemetry Status: High Confidence Emergence (85%)</span>
                </div>
              </div>
            </div>
            
            <div style={{ flex: '1 1 380px' }}>
              <p className="vision-text">
                The core breakthrough of LCRI is uniting high-tech space data with <strong>Umuganda</strong>—Rwanda’s national tradition of monthly community service.
              </p>
              <p className="vision-text">
                When local cooperatives log their planting perimeters into the Community Ledger, orbital satellites automatically lock onto those coordinates to monitor seedling emergence month after month.
              </p>
              
              <div style={{ marginTop: 24, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/ledger')} className="vision-cta" style={{ background: '#9b59b6', color: '#fff' }}>
                  Open Community Ledger →
                </button>
                <button onClick={() => navigate('/gicumbi')} className="vision-cta vision-cta-secondary" style={{ borderColor: '#9b59b6', color: '#bb8fce' }}>
                  View Gicumbi Audit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── NARRATIVE BRIDGE 3 → 4 ── */}
        <NarrativeBridge 
          icon="🔍"
          tag="NEXT STEP IN THE CHAIN"
          question="Once seedlings are in the ground, how do international funders verify they grew?"
          answer="Stage 4: Multi-year Sentinel-2 NDVI change detection independently audits real canopy gain."
          nextStageId="stage-4"
        />

        {/* ════════════════════════════════════════════════════════════
            STAGE 4: SPACE PROOF & ML VALIDATION
           ════════════════════════════════════════════════════════════ */}
        <div id="stage-4" className="stage-wrapper">
          <div className="stage-header">
            <span className="stage-badge stage-badge-4">STAGE 04 · PROOF OF SURVIVAL</span>
            <span style={{ color: 'var(--text-sec)', fontWeight: 600 }}>Ground-Truth Case Study: Green Gicumbi</span>
          </div>

          <h1 className="vision-title">4,650 Hectares Independently Validated.</h1>
          <h2 className="vision-subtitle" style={{ color: '#f4d03f' }}>How satellite telemetry confirmed a 97% validation rate in Northern Rwanda.</h2>

          <div style={{ maxWidth: 880, marginBottom: 36 }}>
            <p className="vision-text">
              Between 2019 and 2026, the Green Gicumbi project mobilized local communities across 9 sectors. LCRI's automated Sentinel-2 engine audited all 4,801 claimed hectares, confirming 4,650 ha of net new canopy and generating <strong>162,750 tons of verified CO₂e sequestered</strong>.
            </p>
          </div>

          {/* Scrollytelling Stage: Gicumbi Data Proof */}
          <ChartScrollyTelling 
            steps={gicumbiProofSteps} 
            navigate={navigate} 
            title="The Verification Proof Chain"
            badge="GICUMBI CASE STUDY"
            ctaText="Audit Green Gicumbi Verification" 
            ctaLink="/gicumbi" 
          />
        </div>

        {/* ── NARRATIVE BRIDGE 4 → 5 ── */}
        <NarrativeBridge 
          icon="💰"
          tag="NEXT STEP IN THE CHAIN"
          question="With verified carbon proven by space, how do we price it and distribute capital?"
          answer="Stage 5: The LCRI Ranking Engine and 30-Year Financial Simulator model market returns and community payouts."
          nextStageId="stage-5"
        />

        {/* ════════════════════════════════════════════════════════════
            STAGE 5: CAPITAL ALLOCATION & FINANCIAL RETURN
           ════════════════════════════════════════════════════════════ */}
        <div id="stage-5" className="stage-wrapper">
          <div className="stage-header">
            <span className="stage-badge stage-badge-5">STAGE 05 · CAPITAL ENGINE</span>
            <span style={{ color: 'var(--text-sec)', fontWeight: 600 }}>Precision Carbon Finance & Payouts</span>
          </div>

          <h1 className="vision-title">Turning Ecological Truth into Investment Capital.</h1>
          <h2 className="vision-subtitle" style={{ color: '#58d68d' }}>From satellite telemetry to Article 6.2 carbon revenue and local community wealth.</h2>

          <div style={{ maxWidth: 880, marginBottom: 36 }}>
            <p className="vision-text">
              Transparent, space-verified carbon commands premium prices on international markets ($25–$40/tCO₂e). The LCRI engine models 30-year yield curves, locks a 20% risk buffer into orbital escrow, and automatically channels 60% of revenues back into local farmer cooperatives.
            </p>
          </div>

          {/* Scrollytelling Stage: Capital & Financial Simulator */}
          <ChartScrollyTelling 
            steps={capitalSimulationSteps} 
            navigate={navigate} 
            title="30-Year Capital & Risk Architecture"
            badge="FINANCIAL ENGINE"
            ctaText="Launch Reforestation Simulator" 
            ctaLink="/simulator" 
          />

          {/* Final Call to Action Box */}
          <div style={{ marginTop: 60, padding: '48px 36px', background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.12) 0%, rgba(10, 25, 20, 0.95) 100%)', border: '1px solid rgba(46, 204, 113, 0.35)', borderRadius: 24, textAlign: 'center', boxShadow: '0 20px 48px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: 12 }}>
              Don't just read the story. Explore the platform.
            </h2>
            <p className="vision-text" style={{ margin: '0 auto 32px auto', maxWidth: 700 }}>
              Tested in Rwanda. Built for Africa. Explore live satellite layers, run financial simulations, and audit community planting in real-time.
            </p>
            <div className="vision-cta-group" style={{ justifyContent: 'center' }}>
              <button onClick={() => navigate('/dashboard')} className="vision-cta">
                Explore Satellite Dashboard →
              </button>
              <button onClick={() => navigate('/simulator')} className="vision-cta vision-cta-secondary">
                Run 30-Yr Simulator
              </button>
              <button onClick={() => navigate('/lcri')} className="vision-cta vision-cta-secondary">
                View Parcel Rankings
              </button>
              <button onClick={() => navigate('/registry')} className="vision-cta vision-cta-secondary">
                Open Project Registry
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
