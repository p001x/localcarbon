export function getChartOption(kpiData, mlData, timeFilter) {
  if (!kpiData?.carbonStats) return {};
  let years = Object.keys(kpiData.carbonStats).sort();
  
  // Apply time filter
  if (timeFilter === '5y') {
    years = years.slice(-5);
  } else if (timeFilter === '10y') {
    years = years.slice(-10);
  }

  const co2e  = years.map(y => kpiData.carbonStats[y].co2e_mg);
  const agb   = years.map(y => kpiData.carbonStats[y].mean_agb_mg_ha);

  // --- Inject ML Prediction ---
  if (mlData && typeof mlData.predicted_10yr_growth === 'number') {
    const lastYear = parseInt(years[years.length - 1] || "2022");
    years.push(`${lastYear + 10} (AI)`);
    
    const lastAgb = agb[agb.length - 1];
    const predictedAgb = Math.max(0, lastAgb + mlData.predicted_10yr_growth);
    agb.push(predictedAgb);
    
    const lastCo2e = co2e[co2e.length - 1];
    if (lastAgb > 0) {
      co2e.push(lastCo2e * (predictedAgb / lastAgb));
    } else {
      co2e.push(null);
    }
  }

  const agbSeriesData = agb.map((val, idx) => {
    if (mlData && idx === agb.length - 1) {
      // Style the AI predicted bar distinctively
      const isDegrading = mlData.predicted_10yr_growth < 0;
      return { 
        value: val, 
        itemStyle: { color: isDegrading ? 'rgba(231,76,60,0.8)' : 'rgba(46,204,113,0.8)' } 
      };
    }
    return val;
  });

  return {
    backgroundColor: 'transparent',
    textStyle: { fontFamily:'Inter, sans-serif', color:'#80cbc4' },
    tooltip: { trigger:'axis', backgroundColor:'#0d1f17', borderColor:'#1e3a2a',
      textStyle:{ color:'#e8f5e9', fontSize:11 } },
    legend: { data:['CO₂e (Mg)','AGB (Mg/ha)'], textStyle:{ color:'#80cbc4', fontSize:10 }, top:4 },
    grid: { left:52, right:20, top:36, bottom:30 },
    xAxis: { type:'category', data:years,
      axisLine:{ lineStyle:{ color:'#1e3a2a' } }, axisLabel:{ color:'#80cbc4', fontSize:11 } },
    yAxis: [
      { type:'value', name:'CO₂e Mg', nameTextStyle:{ color:'#80cbc4', fontSize:9 },
        axisLabel:{ color:'#80cbc4', fontSize:10 }, splitLine:{ lineStyle:{ color:'#1a2e22' } } },
      { type:'value', name:'AGB Mg/ha', nameTextStyle:{ color:'#80cbc4', fontSize:9 },
        axisLabel:{ color:'#80cbc4', fontSize:10 }, splitLine:{ show:false } },
    ],
    series: [
      { name:'CO₂e (Mg)', data:co2e, type:'line', yAxisIndex:0, smooth:true, symbolSize:5,
        lineStyle:{ color:'#2ecc71', width:2.5 }, itemStyle:{ color:'#2ecc71' },
        areaStyle:{ color:{ type:'linear', x:0,y:0,x2:0,y2:1,
          colorStops:[{ offset:0, color:'rgba(46,204,113,0.22)' },{ offset:1, color:'rgba(46,204,113,0.01)' }] } } },
      { name:'AGB (Mg/ha)', data:agbSeriesData, type:'bar', yAxisIndex:1,
        barMaxWidth:22, itemStyle:{ color:'rgba(79,195,247,0.5)', borderRadius:[3,3,0,0] } }
    ]
  };
}
