import { useState, useCallback, useEffect } from 'react';
import { computeKpis, predictMl, fetchMonitoringImages } from '../api';

export default function useCarbonAnalysis(aoiGeom, targetMonth) {
  const [kpiData, setKpiData] = useState(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState(null);

  const [mlData, setMlData] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  const [monitoringImgs, setMonitoringImgs] = useState(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);

  const triggerAnalysis = useCallback((targetGeom = aoiGeom) => {
    if (!targetGeom) {
      setKpiData(null);
      setMlData(null);
      setMonitoringImgs(null);
      return;
    }
    setKpiLoading(true);
    setKpiError(null);
    setMlLoading(true);
    setMonitoringLoading(true);
    
    computeKpis(targetGeom)
      .then(d => { setKpiData(d); setKpiLoading(false); })
      .catch(() => { setKpiError('KPI computation failed — check backend connection'); setKpiLoading(false); });
      
    predictMl(targetGeom)
      .then(d => { setMlData(d); setMlLoading(false); })
      .catch(() => { setMlLoading(false); });
      
    fetchMonitoringImages(targetGeom, targetMonth)
      .then(d => { setMonitoringImgs(d); setMonitoringLoading(false); })
      .catch(() => { setMonitoringLoading(false); });
  }, [aoiGeom, targetMonth]);

  const handleUpdateScannerDate = useCallback(() => {
    if (!aoiGeom) return;
    setMonitoringLoading(true);
    fetchMonitoringImages(aoiGeom, targetMonth)
      .then(d => { setMonitoringImgs(d); setMonitoringLoading(false); })
      .catch(() => { setMonitoringLoading(false); });
  }, [aoiGeom, targetMonth]);

  // Auto-trigger when AOI changes
  useEffect(() => {
    triggerAnalysis(aoiGeom);
  }, [aoiGeom, triggerAnalysis]);

  const latest = kpiData?.carbonStats ? (() => {
    const y = Object.keys(kpiData.carbonStats).sort().slice(-1)[0];
    return kpiData.carbonStats[y];
  })() : null;

  return {
    kpiData, kpiError, kpiLoading,
    mlData, mlLoading,
    monitoringImgs, monitoringLoading,
    triggerAnalysis, handleUpdateScannerDate,
    latest
  };
}
