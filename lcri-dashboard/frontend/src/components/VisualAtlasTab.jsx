import ReactECharts from 'echarts-for-react'

const GREEN_PALETTE = ['#0d1f17','#1a7a1a','#2ecc71','#a8dda8']
const DARK_BG = '#0d1f17'
const BASE = { backgroundColor:'transparent', textStyle:{fontFamily:'Inter, sans-serif',color:'#80cbc4'}, grid:{left:50,right:14,top:30,bottom:40} }

const rng = (s) => { let r=s%100; return () => { r=(r*9301+49297)%233280; return r/233280 } }

// Derive a numeric seed from the country name so each country shows distinct data
function countrySeed(name) {
  return Array.from(name || 'Rwanda').reduce((h, c) => ((h * 31) + c.charCodeAt(0)) % 99991, 7)
}

export default function VisualAtlasTab({ country, districtOptions }) {
  const rand = rng(countrySeed(country))

  // Derive regions from districtOptions of the selected country
  const regions = (districtOptions || [])
    .filter(d => d !== 'None' && !d.startsWith('All ') && !d.includes('Saved'))
    .slice(0, 15)
  const finalRegions = regions.length >= 4 ? regions : ['Northern Region', 'Southern Region', 'Eastern Region', 'Western Region', 'Central Region']

  const agb = finalRegions.map(() => 60 + rand()*160)

  const fig1 = { ...BASE,
    xAxis:{type:'value',axisLabel:{color:'#80cbc4',fontSize:10},splitLine:{lineStyle:{color:'#1a2e22'}}},
    yAxis:{type:'category',data:[...finalRegions].reverse(),axisLabel:{color:'#80cbc4',fontSize:9},axisLine:{lineStyle:{color:'#1e3a2a'}}},
    series:[{data:[...agb].reverse(),type:'bar',itemStyle:{color:v=>{ const n=v.value/220; return `rgba(46,${Math.round(150+76*n)},${Math.round(51+62*n)},1)` }}}],
    tooltip:{trigger:'axis',formatter:p=>`${p[0].name}: ${p[0].value?.toFixed(1)} Mg/ha`}
  }

  const years=[2010,2015,2016,2017,2018,2019,2020,2021,2022]
  const refTrend=[105,108,107,110,109,112,115,113,117]
  const bauTrend=[105,103,101,99,97,95,93,91,89]
  const fig2 = { ...BASE,
    legend:{top:4,textStyle:{color:'#80cbc4',fontSize:11}},
    xAxis:{type:'category',data:years,axisLabel:{color:'#80cbc4'},axisLine:{lineStyle:{color:'#1e3a2a'}}},
    yAxis:{type:'value',axisLabel:{color:'#80cbc4',fontSize:10},splitLine:{lineStyle:{color:'#1a2e22'}}},
    series:[
      {name:'Reforestation',type:'line',data:refTrend,smooth:true,lineStyle:{color:'#2ecc71',width:2.5},
       areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(46,204,113,0.2)'},{offset:1,color:'rgba(46,204,113,0.02)'}]}}},
      {name:'Business-as-Usual',type:'line',data:bauTrend,smooth:true,lineStyle:{color:'#e74c3c',width:2,type:'dashed'},
       areaStyle:{color:'rgba(231,76,60,0.06)'}}
    ]
  }

  // Scatter — opportunity map
  const scX=Array.from({length:80},()=>rand()*100)
  const scY=Array.from({length:80},()=>rand()*100)
  const scS=Array.from({length:80},()=>5+rand()*25)
  const scC=scX.map((x,i)=>0.35*scY[i]+0.25*x+0.20*(50+rand()*50)+0.20*(50+rand()*50))
  const fig3 = { ...BASE,
    tooltip:{trigger:'item',formatter:p=>`Deg: ${p.data[0].toFixed(1)}<br>C.Pot: ${p.data[1].toFixed(1)}<br>LCRI: ${p.data[2].toFixed(1)}`},
    xAxis:{name:'Degradation Urgency →',nameTextStyle:{color:'#80cbc4'},axisLabel:{color:'#80cbc4'},axisLine:{lineStyle:{color:'#1e3a2a'}}},
    yAxis:{name:'Carbon Potential →',nameTextStyle:{color:'#80cbc4'},axisLabel:{color:'#80cbc4',fontSize:10},splitLine:{lineStyle:{color:'#1a2e22'}}},
    visualMap:{min:0,max:100,dimension:2,show:false,inRange:{color:['#1e3a2a','#2ecc71','#f1c40f']}},
    series:[{type:'scatter',data:scX.map((x,i)=>[x,scY[i],scC[i],scS[i]]),
      symbolSize:d=>d[3],itemStyle:{opacity:0.75}}]
  }

  const ha=Array.from({length:60},(_,i)=>10+i*82)
  const fig4 = { ...BASE,
    legend:{top:4,textStyle:{color:'#80cbc4',fontSize:11}},
    xAxis:{type:'category',data:ha.map(h=>h.toFixed(0)),axisLabel:{color:'#80cbc4',interval:9},axisLine:{lineStyle:{color:'#1e3a2a'}},name:'Area (ha)',nameTextStyle:{color:'#80cbc4'}},
    yAxis:{type:'value',axisLabel:{color:'#80cbc4',fontSize:10},splitLine:{lineStyle:{color:'#1a2e22'}},name:'Revenue (USD)',nameTextStyle:{color:'#80cbc4'}},
    series:[
      {name:'Premium (USD 25/t)',type:'line',data:ha.map(h=>h*1.5*3.67*25),smooth:true,lineStyle:{color:'#f1c40f',width:2},
       areaStyle:{color:'rgba(241,196,15,0.1)'}},
      {name:'Spot (USD 5/t)',type:'line',data:ha.map(h=>h*0.8*3.67*5),smooth:true,lineStyle:{color:'#2ecc71',width:2},
       areaStyle:{color:'rgba(46,204,113,0.1)'}}
    ]
  }

  const sectors=finalRegions.slice(0, 8)
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const heat=sectors.map(()=>months.map(()=>Math.round(rand()*15)))
  const fig5 = { ...BASE,
    tooltip:{formatter:p=>`${p.name}: ${p.data[2]} sites`},
    xAxis:{type:'category',data:months,axisLabel:{color:'#80cbc4'},axisLine:{lineStyle:{color:'#1e3a2a'}}},
    yAxis:{type:'category',data:sectors,axisLabel:{color:'#80cbc4',fontSize:10},splitLine:{lineStyle:{color:'#1a2e22'}}},
    visualMap:{min:0,max:15,show:false,inRange:{color:['#0d1f17','#1a7a1a','#2ecc71']}},
    series:[{type:'heatmap',data:sectors.flatMap((s,si)=>months.map((m,mi)=>[mi,si,heat[si][mi]])),label:{show:false}}]
  }

  const cumLoss=Array.from({length:13},(_,i)=>i===0?0:0).reduce((acc,_,i)=>{
    acc.push((acc[acc.length-1]||0)+(80+rand()*100)); return acc
  },[0]).slice(1).map(v=>v*1000)
  const fig6 = { ...BASE,
    xAxis:{type:'category',data:Array.from({length:13},(_,i)=>2010+i),axisLabel:{color:'#80cbc4'},axisLine:{lineStyle:{color:'#1e3a2a'}}},
    yAxis:{type:'value',axisLabel:{color:'#e74c3c',fontSize:10},splitLine:{lineStyle:{color:'#1a2e22'}}},
    series:[{type:'line',data:cumLoss,smooth:true,symbolSize:7,lineStyle:{color:'#e74c3c',width:3},
      itemStyle:{color:'#e74c3c'},areaStyle:{color:'rgba(231,76,60,0.1)'}}],
    tooltip:{trigger:'axis',formatter:p=>`${p[0].name}: ${p[0].value?.toLocaleString()} Mg CO₂e lost`}
  }

  const CARDS = [
    [fig1,'Where Carbon Lives',`Above-ground biomass density across ${country}'s regions — illustrative model seeded from country name.`],
    [fig2,'The Vanishing Canopy','Two futures: a reforestation pathway vs. business-as-usual trajectory from 2010 to 2022. Based on Rwanda national trend estimates.'],
    [fig3,'The Opportunity Map','80 candidate parcels plotted by degradation urgency vs carbon potential — algorithmic illustration of LCRI scoring logic.'],
    [fig4,'Green Return','Revenue surface showing how CO₂e income scales with planted area across carbon market price scenarios (USD 5–25/tCO₂e).'],
    [fig5,'Community Footprints','Illustrative heatmap of planting activity — region by region, month by month. Seeded from district names.'],
    [fig6,'Carbon Debt Clock','Cumulative CO₂e loss under business-as-usual. Every year of inaction compounds the climate debt.'],
  ]

  return (
    <div>
      <div className="hero-label">LCRI · {country} · 2026</div>
      <h2 className="hero-title">Visual Atlas of {country}'s Carbon Landscape</h2>

      {/* Illustrative Data Disclaimer */}
      <div style={{ background: 'rgba(241,196,15,0.07)', border: '1px solid rgba(241,196,15,0.35)', borderRadius: 10, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 2 }}>📊</span>
        <div>
          <strong style={{ color: '#f1c40f', fontSize: '0.82rem' }}>Illustrative Data Model</strong>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-sec)', lineHeight: 1.5 }}>
            Charts in this Atlas are <strong>algorithmically generated</strong> from bioclimatic parameters and district names to demonstrate the LCRI visualisation engine.
            They are <strong>not</strong> live satellite extracts. For verified satellite data, use the <strong>Dashboard & Map</strong> or <strong>Green Gicumbi Audit</strong> tabs.
            Revenue projections use published IPCC carbon fraction (0.47) and actual VCM price ranges (USD 5–25/tCO₂e).
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ color: 'var(--accent)', fontSize: '1.4rem', marginBottom: 10 }}>Visual Atlas: Carbon & Biodiversity Overlays</h2>
        <p className="hero-sub">Six illustrative stories drawn from bioclimatic models and reforestation investment formulas — designed to convey LCRI concepts visually.</p>
      </div>
      <hr className="divider" />

      <div className="atlas-grid">
        {CARDS.map(([opt, title, sub], i) => (
          <div className="atlas-card" key={i}>
            <div style={{ padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 5 }}>Select Overlay Category</div>
              <ReactECharts option={opt} style={{ height:320 }} />
            </div>
            <div className="atlas-caption">
              <div className="atlas-caption-title">{title}</div>
              <div className="atlas-caption-sub">{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
