import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
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
function ScrollyTelling({ steps, navigate, ctaText, ctaLink, title }) {
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
    }, { rootMargin: '-40% 0px -40% 0px' });

    stepRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, [steps]);

  return (
    <div className="scrollytelling-container" style={{ display: 'flex', gap: '40px', marginTop: '80px', position: 'relative' }}>
      {/* Left Column (Text) */}
      <div style={{ flex: '1', paddingBottom: '30vh' }}>
        {title && <h2 className="vision-subtitle" style={{ color: 'var(--accent)', marginBottom: '40px' }}>{title}</h2>}
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            ref={el => stepRefs.current[idx] = el}
            style={{
              minHeight: '40vh',
              padding: '40px',
              marginBottom: '20px',
              background: activeStep === idx ? 'rgba(46, 204, 113, 0.1)' : 'transparent',
              borderLeft: activeStep === idx ? '4px solid var(--accent)' : '4px solid transparent',
              transition: 'all 0.5s ease',
              opacity: activeStep === idx ? 1 : 0.4
            }}
          >
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', marginBottom: '15px' }}>{step.title}</h3>
            <p className="vision-text" style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>{step.text}</p>
          </div>
        ))}
        
        {ctaText && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button onClick={() => navigate(ctaLink)} className="vision-cta">
                {ctaText}
              </button>
          </div>
        )}
      </div>
      
      {/* Right Column (Sticky Visuals) */}
      <div style={{ flex: '1', position: 'sticky', top: '100px', height: '60vh', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
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
              transition: 'opacity 0.8s ease-in-out'
            }}
          />
        ))}
      </div>
    </div>
  );
}


const dashboardSteps = [
  {
    title: "1. The Proposal",
    text: "A local cooperative proposes a 500-hectare restoration project in Gicumbi.",
    img: "/real_photo_1.jpg"
  },
  {
    title: "2. The Safeguard",
    text: "Before a single dollar is invested, the LCRI engine autonomously scans the perimeter. It cross-references the boundaries against the World Database on Protected Areas, guaranteeing the project does not encroach on native wetlands or wildlife reserves.",
    img: "/real_photo_2.jpg"
  },
  {
    title: "3. The Baseline",
    text: "Next, NASA's orbital sensors sweep the terrain. The engine strips away the canopy to reveal the cold truth: a severely degraded baseline of only 12 tons of carbon per hectare.",
    img: "/real_photo_3.jpg"
  },
  {
    title: "4. The Prediction",
    text: "Finally, the Random Forest algorithm takes over. Factoring in the region's steep slopes and soil pH, it projects exactly how the forest will grow. It doesn't just guess—it provides a mathematical guarantee: a 10-year yield of 45 tons per hectare, backed by an 85% AI Confidence Score. The project is now an investment-grade asset.",
    img: "/real_photo_4.jpg"
  }
];

const rankingSteps = [
  {
    title: "1. The Overwhelming Scale",
    text: "With 16,636 hectares across 150 candidate parcels, manual selection is impossible. The LCRI Ranking Engine acts as an autonomous triage system, ingesting massive datasets in milliseconds to find the mathematical sweet spot for restoration.",
    img: "/lcri_scale.jpg"
  },
  {
    title: "2. Multi-Dimensional Weighting",
    text: "It runs a multi-factor analysis, balancing Carbon Potential (35%) for ROI against Degradation Urgency (25%) and Slope Feasibility (20%). You control the weights, ensuring the capital allocation perfectly matches your organization's ESG goals.",
    img: "/lcri_weights.jpg"
  },
  {
    title: "3. Native Species Matching",
    text: "Once the top parcels are isolated, the engine taps into Restor.eco ecological standards. It recommends exact native Rwandan species—like Umusave for agroforestry or Umurava for montane canopy—customized to the parcel's micro-climate.",
    img: "/lcri_species.jpg"
  },
  {
    title: "4. Investment-Ready Output",
    text: "The final output is an actionable, ranked ledger of the top parcels. The highest-scoring land is prioritized for immediate capital deployment, maximizing both carbon yield and biodiversity impact with zero guesswork.",
    img: "/lcri_output.jpg"
  }
];

const simulatorSteps = [
  {
    title: "1. The Base Variables",
    text: "Before breaking ground, project developers must prove financial viability. The Reforestation Simulator allows them to input the target area, operational costs, and the base market price of carbon to instantly generate a 30-year ROI projection.",
    img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "2. Co-Benefit Multipliers",
    text: "Carbon isn't just a gas; it's a social asset. The simulator dynamically adjusts the effective price of your carbon credits if your project meets strict ecological and social standards, such as Biodiversity Protection and Gender Equity in the local workforce.",
    img: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "3. Native Growth Curves",
    text: "Different trees grow differently. The engine applies precise allometric growth equations to specific native Rwandan species like Umusave and Umurava, mapping their exact biomass accumulation trajectories over three decades.",
    img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "4. Risk-Adjusted Projections",
    text: "To ensure absolute market trust, the simulator runs thousands of Monte Carlo risk scenarios. A mandatory 20% risk buffer is automatically deducted from projected gains to mathematically insure the project against future droughts or wildfires.",
    img: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&q=80&w=800"
  }
];

const registrySteps = [
  {
    title: "1. The Verification Crisis",
    text: "For years, carbon markets have suffered from double-counting, opaque accounting, and phantom projects. The LCRI Registry serves as a cryptographic single source of truth, linking every carbon credit directly to verifiable Earth Observation telemetry.",
    img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "2. Global Standard Integration",
    text: "The registry seamlessly synchronizes with global standards like Verra and Gold Standard. It displays real-time data on active REDD+ and ARR projects across the African continent, aggregating them into one unified, transparent ledger.",
    img: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "3. Live Satellite Auditing",
    text: "Investors don't just read the registry; they verify it. Click on any project like the Kasigau Corridor to instantly load Sentinel-2 imagery, allowing stakeholders to independently audit canopy health and biomass density live from their browser.",
    img: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "4. End-to-End Transparency",
    text: "From the first sapling planted by a local Rwandan cooperative to the final carbon credit retired by a multinational corporation, every ton of CO₂ is mathematically tracked. This is how we eliminate greenwashing forever.",
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800"
  }
];

const atlasSteps = [
  {
    title: "1. Where Carbon Lives",
    text: "The Visual Atlas maps above-ground biomass density across local regions. It reveals exactly where the carbon wealth is concentrated—and where it's most threatened by deforestation.",
    img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "2. The Vanishing Canopy",
    text: "We visualize two futures: a massive reforestation pathway versus a business-as-usual trajectory. The 'Carbon Debt Clock' shows the cumulative CO₂e loss if we fail to act. Every year of inaction compounds the debt.",
    img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "3. The Opportunity Map",
    text: "By plotting candidate parcels by their degradation urgency against their carbon potential, the atlas instantly highlights where to plant first. It's an ecological triage system for capital.",
    img: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "4. Green Return Models",
    text: "The platform dynamically forecasts revenue surfaces under various market price scenarios (e.g., Premium vs. Spot). We map how community-reported planting activity translates into certified carbon income.",
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800"
  }
];

const lensSteps = [
  {
    title: "1. Planetary-Scale Observation",
    text: "Carbon isn't static; it breathes. The Interactive Carbon Lens lets you hover over any global forest basin—from the Amazon to the Congo—to instantly see its biomass density and seasonal sequestration cycles.",
    img: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "2. Monthly Sequestration Cycles",
    text: "As you move the lens, a live radar chart reveals the exact monthly flux of carbon capture. Different biomes have different rhythms. Boreal forests peak in summer, while tropical rainforests maintain massive, steady capture year-round.",
    img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "3. NASA / ORNL AGB Data",
    text: "We pull directly from NASA and Oak Ridge National Laboratory's Aboveground Biomass (AGB) datasets. The lens cuts through the noise, translating complex multi-terabyte datasets into an instantaneous visual readout of tCO₂e per hectare.",
    img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "4. Global Carbon Asset Valuation",
    text: "By converting raw biomass metrics into estimated financial credits, the lens provides an immediate snapshot of natural capital value. See precisely how ecological preservation translates into global economic impact.",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
  }
];

const gicumbiSteps = [
  {
    title: "1. The Official Claim",
    text: "Green Gicumbi reported a massive agroforestry initiative, claiming 4,801 hectares planted. But in the voluntary carbon market, claims are no longer enough. We need independent, verifiable proof.",
    img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "2. Orbital Observation",
    text: "Our Earth Engine integration autonomously scans the region using Sentinel-2 multi-spectral bands, comparing the 2019 baseline to present-day NDVI values. The satellite confirms ~4,650 hectares of actual canopy gain—a 97% validation rate.",
    img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "3. Sector-Level Precision",
    text: "We don't just look at the macro picture. The engine breaks down the data sector by sector, ensuring that capital reaches the exact communities performing the work on the ground.",
    img: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "4. National NDC Tracking",
    text: "By translating canopy gain into an estimated 162,750 tCO₂e sequestered, we instantly calculate the project's direct contribution toward Rwanda's 102M tonnes national climate target. Absolute transparency, from the village level to the UN level.",
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800"
  }
];

export default function VisionTab() {
  const navigate = useNavigate();
  const observerRef = useRef(null);
  const mapRef = useRef(null);
  const mapInst = useRef(null);

  useEffect(() => {
    // Setup intersection observer for scroll animations
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up');
          observerRef.current.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observerRef.current.observe(el));

    // Restore scroll position
    const savedScroll = sessionStorage.getItem('storyMapScroll');
    if (savedScroll) {
      // Need a slight delay to ensure DOM is painted
      setTimeout(() => window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'auto' }), 50);
    }

    const handleScroll = () => {
      sessionStorage.setItem('storyMapScroll', window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Initialize Embedded Mini-Map
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    
    // Coordinates for Gishwati-Mukura (approx -1.78, 29.41)
    const map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false })
      .setView([-1.785, 29.412], 12);
      
    // Use dark satellite tiles
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    }).addTo(map);
    
    // Add a dark overlay to make it look cinematic
    L.rectangle([[-90, -180], [90, 180]], {
      color: 'transparent',
      fillColor: '#050b08',
      fillOpacity: 0.4
    }).addTo(map);

    // Mock "Red Zone" polygon showing severe degradation
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

    polygon.bindTooltip("High Risk: Severe Canopy Loss & Soil Erosion", { permanent: true, direction: 'right', className: 'vision-map-tooltip' });
    
    mapInst.current = map;

    return () => {
      map.remove();
      mapInst.current = null;
    };
  }, []);

  return (
    <div className="vision-container">
      
      {/* SECTION 1: The Global Mandate */}
      <section className="vision-section">
        <div className="ambient-glow"></div>
        <div className="vision-content">
          <div className="animate-on-scroll">
            <h1 className="vision-title">Africa Holds the Key to Global Climate Targets.</h1>
            <h2 className="vision-subtitle">But the funds aren't reaching the ground.</h2>
          </div>
          
          <div className="animate-on-scroll delay-1">
            <p className="vision-text">
              The global voluntary carbon market is facing a crisis of confidence. While multinational corporations and governments have pledged billions of dollars toward African reforestation to meet Net-Zero targets by 2030, the actual flow of capital has bottlenecked. The reason? A <strong>catastrophic data deficit</strong>. 
            </p>
            <p className="vision-text">
              Currently, ecological restoration is plagued by "phantom carbon"—projects that look good in a spreadsheet but fail entirely on the ground due to drought, poor soil, or illegal logging. Investors simply cannot trust what they cannot verify. The LCRI platform was built to bridge this chasm, providing the missing layer of cryptographic, satellite-backed proof that turns ecological restoration into a highly secure, transparent, and verifiable financial asset.
            </p>
          </div>
        </div>
        
        {/* Animated Data Tickers */}
        <div className="vision-content" style={{ marginTop: 60 }}>
          <div className="vision-grid">
            <DataTicker endValue={124000} label="Hectares of Deforested Land in Rwanda" suffix=" ha" />
            <DataTicker endValue={85} label="Model Prediction Reliability" suffix="%" />
            <DataTicker endValue={4} label="Endangered Species Corridors Restored" suffix="+" />
          </div>
        </div>
      </section>

      {/* SECTION 2: The Bottleneck (Interactive Slider) */}
      <section className="vision-section">
        <div className="ambient-glow glow-right"></div>
        <div className="vision-content">
          <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>The Devastation of "Blind" Reforestation</h1>
            <h2 className="vision-subtitle" style={{ color: '#e74c3c' }}>A Local Perspective: The Erosion of Nyungwe</h2>
            <p className="vision-text" style={{ margin: '0 auto', maxWidth: 900 }}>
              Without high-fidelity spatial data, tree-planting initiatives are flying blind. Projects often allocate funding to zones with high slopes, severe soil erosion, or active encroachment. When a million trees are planted in the wrong terrain, a million trees die—destroying both the carbon sink and the capital investment. To stop this cycle of failure, we must move from <em>reactive</em> accounting to <em>predictive</em> spatial intelligence. Drag the slider below to witness the harsh reality of unmonitored canopy degradation in Rwanda over the last two decades.
            </p>
          </div>
          
          <div className="animate-on-scroll delay-1" style={{ marginBottom: 40 }}>
            <BeforeAfterSlider 
              beforeImage="/forest_before.jpg" 
              afterImage="/forest_after.jpg" 
              beforeLabel="2001 Baseline (Intact Canopy)" 
              afterLabel="2023 Degradation (Severe Clearcutting)" 
            />
            
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button onClick={() => navigate('/atlas')} className="vision-cta vision-cta-secondary">
                Explore the Visual Atlas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Deep Biodiversity (The "Why") */}
      <section className="vision-section">
        <div className="vision-content" style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center' }}>
          <div className="animate-on-scroll" style={{ flex: '1 1 400px' }}>
            <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>More Than Just Carbon.</h1>
            <h2 className="vision-subtitle" style={{ color: '#f39c12' }}>Rebuilding Biological Corridors</h2>
            <p className="vision-text">
              Reforestation is often reduced to a sterile metric of carbon tonnage, but in fragile ecosystems like the Albertine Rift, it is a desperate race against time to prevent mass extinction. Isolated forest fragments have trapped populations of the endangered <strong>Eastern Chimpanzee</strong> and the endemic <strong>Golden Monkey</strong>, leading to genetic bottlenecking and rapid decline.
            </p>
            <p className="vision-text">
              The LCRI engine rejects the paradigm that carbon and biodiversity are mutually exclusive. By synthesizing historical range maps and habitat suitability models, our AI specifically hunts for <em>critical biological corridors</em>. When we direct capital to restore these specific connective tissues, we don't just capture CO₂—we physically reconnect fragmented ecosystems, allowing apex species to migrate, breed, and thrive across a resurrected landscape.
            </p>
          </div>
          <div className="animate-on-scroll delay-1" style={{ flex: '1 1 400px', height: '400px', position: 'relative' }}>
             {/* Embedded Interactive Leaflet Map */}
             <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 16, border: '2px solid rgba(243,156,18,0.4)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', marginBottom: 20 }}></div>
             
             <div style={{ textAlign: 'center' }}>
               <button onClick={() => navigate('/lcri')} className="vision-cta">
                 Dive into LCRI Rankings
               </button>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: The Innovation (Open Data) */}
      <section className="vision-section">
        <div className="vision-content">
          <div className="animate-on-scroll">
            <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>Investment-Grade Ecological Intelligence</h1>
            <h2 className="vision-subtitle">Fusing Satellite Telemetry with Machine Learning</h2>
            <p className="vision-text">
              To solve the verification crisis, the <strong>Local Carbon Return Index (LCRI)</strong> replaces static PDFs with an active, autonomous machine learning engine. By synthesizing petabytes of open-source Earth Observation telemetry with advanced Random Forest regression algorithms, the LCRI can instantly analyze any parcel of land in Africa. It predicts exact 10-year biomass yields, assigns a mathematical confidence probability, and generates investment-grade risk profiles in milliseconds.
            </p>
          </div>

          <div className="vision-grid">
            <div className="glass-card animate-on-scroll delay-1">
              <span className="card-icon">🛰️</span>
              <h3>Copernicus Sentinel-2</h3>
              <p>We leverage multi-spectral bands from the ESA Sentinel-2 constellation to monitor canopy health (NDVI) and detect forest stress in real-time, forming our Survival Tracker.</p>
            </div>
            
            <div className="glass-card animate-on-scroll delay-2">
              <span className="card-icon">🌍</span>
              <h3>NASA / ORNL AGB</h3>
              <p>By integrating Aboveground Biomass (AGB) density models, we calculate the exact carbon headroom of every hectare, ensuring projects are sited where they are needed most.</p>
            </div>
            
            <div className="glass-card animate-on-scroll delay-3">
              <span className="card-icon">🏔️</span>
              <h3>Terrain Feasibility</h3>
              <p>We combine high-resolution elevation and slope data to avoid high-erosion zones, identifying "Ecological Lifelines" that stabilize soil and protect watersheds.</p>
            </div>
          </div>
          
          {/* Dashboard Scrollytelling */}
          <div className="animate-on-scroll" style={{ marginTop: '80px' }}>
            <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', textAlign: 'center', marginBottom: '20px' }}>The Intelligence Layer</h1>
            <p className="vision-text" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 60px' }}>
              LCRI isn't just a database; it's a real-time command center. Watch how a single parcel transforms from a raw coordinate into a verified carbon asset.
            </p>
            <ScrollyTelling 
              steps={dashboardSteps} 
              navigate={navigate} 
              title="The Anatomy of a Perfect Project"
              ctaText="Analyze with Dashboard & Map" 
              ctaLink="/dashboard" 
            />
          </div>
        </div>
      </section>

      {/* SECTION 4.2: The Prioritization Engine (LCRI Ranking) */}
      <section className="vision-section">
        <div className="vision-content">
          <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>Precision Capital Allocation</h1>
            <h2 className="vision-subtitle" style={{ color: '#80cbc4' }}>The LCRI Ranking Engine</h2>
            <p className="vision-text" style={{ margin: '0 auto', maxWidth: 900 }}>
              With thousands of hectares degraded across Rwanda, the critical question for project developers is: <em>Where do we plant first?</em> The LCRI Ranking Engine acts as an autonomous triage system.
            </p>
          </div>
          
          <div className="animate-on-scroll">
            <ScrollyTelling 
              steps={rankingSteps} 
              navigate={navigate} 
              ctaText="Open LCRI Ranking Engine" 
              ctaLink="/lcri" 
            />
          </div>
        </div>
      </section>

      {/* SECTION 4.3: The Financial Simulator */}
      <section className="vision-section">
        <div className="vision-content">
          <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>Financial Engineering & Risk</h1>
            <h2 className="vision-subtitle" style={{ color: '#2ecc71' }}>The Reforestation Simulator</h2>
            <p className="vision-text" style={{ margin: '0 auto', maxWidth: 900 }}>
              Carbon markets demand financial predictability. Our Monte Carlo simulator transforms ecological variables into certified, risk-adjusted financial projections.
            </p>
          </div>
          
          <div className="animate-on-scroll">
            <ScrollyTelling 
              steps={simulatorSteps} 
              navigate={navigate} 
              ctaText="Run Monte Carlo Simulator" 
              ctaLink="/methodology" 
            />
          </div>
        </div>
      </section>

      {/* SECTION 4.4: The Carbon Project Registry */}
      <section className="vision-section">
        <div className="vision-content">
          <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>Cryptographic Truth</h1>
            <h2 className="vision-subtitle" style={{ color: '#3498db' }}>The Live Project Registry</h2>
            <p className="vision-text" style={{ margin: '0 auto', maxWidth: 900 }}>
              Say goodbye to PDF reports. We aggregate active REDD+ and ARR projects across the continent into a single, interactive, satellite-auditable ledger.
            </p>
          </div>
          
          <div className="animate-on-scroll">
            <ScrollyTelling 
              steps={registrySteps} 
              navigate={navigate} 
              ctaText="Audit the Live Registry" 
              ctaLink="/registry" 
            />
          </div>
        </div>
      </section>

      {/* SECTION 4.5: The Human Sensor Network (Umuganda) */}
      <section className="vision-section">
        <div className="ambient-glow glow-left" style={{ background: 'radial-gradient(circle, rgba(155,89,182,0.1) 0%, rgba(0,0,0,0) 70%)' }}></div>
        <div className="vision-content" style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: 60, alignItems: 'center' }}>
          <div className="animate-on-scroll" style={{ flex: '1 1 400px' }}>
            <div className="glass-card" style={{ padding: '40px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -20, left: -20, fontSize: '3rem' }}>🌱</div>
              <h3 style={{ color: '#9b59b6', marginBottom: 10, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: 2 }}>Umuganda Ledger</h3>
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 8, marginBottom: 15, borderLeft: '3px solid #9b59b6' }}>
                <strong style={{ color: '#fff' }}>Village: Kanyinya Sector</strong><br/>
                <span style={{ color: '#a0b3a9', fontSize: '0.9rem' }}>Planted: 1,200 Polyscias fulva stems</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 8, borderLeft: '3px solid #2ecc71' }}>
                <strong style={{ color: '#fff' }}>Satellite Verification</strong><br/>
                <span style={{ color: '#a0b3a9', fontSize: '0.9rem' }}>Status: Confirmed High Confidence (0.85)</span>
              </div>
            </div>
          </div>
          
          <div className="animate-on-scroll delay-1" style={{ flex: '1 1 400px' }}>
            <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>The Human Sensor Network</h1>
            <h2 className="vision-subtitle" style={{ color: '#9b59b6' }}>Umuganda: Community at the Core</h2>
            <p className="vision-text">
              Satellites and algorithms alone cannot plant a single tree. The true genius of the LCRI platform is its seamless integration with <strong>Umuganda</strong>—Rwanda's profound cultural tradition of mandatory community labor. By equipping local leaders with a decentralized ledger, we transform rural communities into a massive, distributed human sensor network.
            </p>
            <p className="vision-text">
              When a village logs a physical planting event on the ground, our orbital algorithms immediately lock onto those coordinates to cross-check canopy growth over the following months. This bidirectional system—ground-truth human labor validated by autonomous orbital sensors—creates an unbreakable loop of trust. It ensures that indigenous communities are directly compensated for their labor, while providing global capital markets with the absolute, undeniable proof they demand.
            </p>
            
            <div style={{ marginTop: '30px' }}>
              <button onClick={() => navigate('/gicumbi')} className="vision-cta vision-cta-secondary" style={{ borderColor: '#9b59b6', color: '#9b59b6' }}>
                Verify with Green Gicumbi
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4.6: Green Gicumbi Verification */}
      <section className="vision-section">
        <div className="vision-content">
          <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>Ground-Truth Validation</h1>
            <h2 className="vision-subtitle" style={{ color: '#2ecc71' }}>Green Gicumbi Verification</h2>
            <p className="vision-text" style={{ margin: '0 auto', maxWidth: 900 }}>
              Green Gicumbi shows local agroforestry action can be independently verified from space — a model for scaling Rwanda's carbon credit pipeline.
            </p>
          </div>
          
          <div className="animate-on-scroll">
            <ScrollyTelling 
              steps={gicumbiSteps} 
              navigate={navigate} 
              ctaText="Open Gicumbi Verification" 
              ctaLink="/gicumbi" 
            />
          </div>
        </div>
      </section>

      {/* SECTION 4.7: Interactive Carbon Lens */}
      <section className="vision-section">
        <div className="vision-content">
          <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>Global Carbon Dynamics</h1>
            <h2 className="vision-subtitle" style={{ color: '#3498db' }}>Interactive Carbon Lens</h2>
            <p className="vision-text" style={{ margin: '0 auto', maxWidth: 900 }}>
              Hover over the map to explore the world's monthly carbon sequestration cycles and Aboveground Biomass (AGB) density across major global forest basins.
            </p>
          </div>
          
          <div className="animate-on-scroll">
            <ScrollyTelling 
              steps={lensSteps} 
              navigate={navigate} 
              ctaText="Open Interactive Carbon Lens" 
              ctaLink="/lens" 
            />
          </div>
        </div>
      </section>

      {/* SECTION 4.8: Visual Atlas */}
      <section className="vision-section">
        <div className="vision-content">
          <div className="animate-on-scroll" style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h1 className="vision-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>Data-Driven Narratives</h1>
            <h2 className="vision-subtitle" style={{ color: '#f1c40f' }}>Visual Atlas</h2>
            <p className="vision-text" style={{ margin: '0 auto', maxWidth: 900 }}>
              Six data-driven stories drawn from satellite biomass data, field-validated sites, and reforestation investment models.
            </p>
          </div>
          
          <div className="animate-on-scroll">
            <ScrollyTelling 
              steps={atlasSteps} 
              navigate={navigate} 
              ctaText="Explore Visual Atlas" 
              ctaLink="/atlas" 
            />
          </div>
        </div>
      </section>

      {/* SECTION 5: Call to Action */}
      <section className="vision-section">
        <div className="ambient-glow" style={{ background: 'radial-gradient(circle, rgba(46,204,113,0.12) 0%, rgba(0,0,0,0) 60%)' }}></div>
        <div className="vision-content" style={{ textAlign: 'center' }}>
          <div className="animate-on-scroll">
            <h1 className="vision-title">Don't just read the data.</h1>
            <h2 className="vision-subtitle" style={{ color: 'var(--text-primary)' }}>Simulate the future.</h2>
            <p className="vision-text" style={{ margin: '0 auto 40px auto' }}>
              Tested in Rwanda. Built for Africa. Use the LCRI Dashboard to discover actionable planting sites, run financial Monte Carlo simulations, and verify canopy growth in real-time.
            </p>
            
            <div className="vision-cta-group" style={{ justifyContent: 'center' }}>
              <button onClick={() => navigate('/simulator')} className="vision-cta">
                Run Reforestation Simulator
              </button>
              <button onClick={() => navigate('/registry')} className="vision-cta vision-cta-secondary">
                Explore Project Registry
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
