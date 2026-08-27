import { useState, useCallback } from 'react'
import { createCustomArea, previewReport } from '../api'
import DashboardMapPanel from './dashboard/DashboardMapPanel'
import DashboardKpiPanel from './dashboard/DashboardKpiPanel'
import DashboardScannerPanel from './dashboard/DashboardScannerPanel'
import DashboardReportsPanel from './dashboard/DashboardReportsPanel'
import useCarbonAnalysis from '../hooks/useCarbonAnalysis'
import useMapLayers from '../hooks/useMapLayers'
import { getChartOption } from '../utils/chartConfig'

export default function DashboardTab({ appConfig, country, district, setDistrict, customAreas, refreshAreas, districtOptions }) {
  const [mode,       setMode]       = useState('district')
  const [targetMonth, setTargetMonth] = useState('')
  const [aoiGeom,    setAoiGeom]    = useState(null)
  const [selectedIndex, setSelectedIndex] = useState('ndvi')
  const [saveName,   setSaveName]   = useState('')
  const [saveMsg,    setSaveMsg]    = useState(null)
  const [reportMd,   setReportMd]   = useState(null)
  const [dashSubTab, setDashSubTab] = useState('map')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [timeFilter, setTimeFilter] = useState('all') // '5y', '10y', 'all'

  // Custom Hooks
  const { 
    kpiData, kpiError, kpiLoading, 
    mlData, mlLoading, 
    monitoringImgs, monitoringLoading, 
    triggerAnalysis, handleUpdateScannerDate, latest 
  } = useCarbonAnalysis(aoiGeom, targetMonth)

  const { 
    mapRef, mapInst, drawnLayer, geeTile, availShp, selShp, setSelShp 
  } = useMapLayers(country, district, customAreas, mode, setMode, setAoiGeom, aoiGeom)

  const handleSaveArea = async () => {
    if (!saveName || !aoiGeom) { setSaveMsg('Name and geometry required.'); return }
    try {
      await createCustomArea({ name: saveName, geometry: aoiGeom })
      setSaveMsg(`✅ Saved "${saveName}"`)
      refreshAreas()
      setSaveName('')
    } catch { setSaveMsg('Save failed.') }
  }

  const handleDownloadPdf = async () => {
    const areaName = district || 'Selected_Area'
    setPdfLoading(true)
    try {
      const res = await fetch('/api/report/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          savedRecord: { name: areaName, geometry: aoiGeom || {} },
          stats: kpiData?.carbonStats || {},
          trend: kpiData?.trend || 0
        })
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${areaName}_Carbon_Audit_Report.pdf`
      a.click()
      setPdfLoading(false)
    } catch (e) {
      console.error('PDF download error:', e)
      alert('Failed to generate PDF report. Please check the network connection and try again.')
      setPdfLoading(false)
    }
  }

  const handlePreviewReport = async () => {
    const area = customAreas[district]
    if (!area) return
    const md = await previewReport({ savedRecord: area, stats: area.stats, trend: area.trend || 0 })
    setReportMd(md.markdown)
  }

  const chartOption = useCallback(() => {
    return getChartOption(kpiData, mlData, timeFilter)
  }, [kpiData, mlData, timeFilter])

  const hasDistrict = district && district !== 'None' && !district.startsWith('All ')
  const districtOpts = districtOptions || (appConfig?.districts || [])

  const ctx = {
    mode, setMode, kpiData, kpiError, kpiLoading, hasDistrict, aoiGeom, setAoiGeom, district, 
    handleDownloadPdf, latest, mlData, mlLoading, timeFilter, setTimeFilter, 
    chartOption, setDistrict, districtOpts, triggerAnalysis, drawnLayer, saveName, 
    setSaveName, handleSaveArea, saveMsg, availShp, selShp, setSelShp, geeTile, 
    mapRef, targetMonth, setTargetMonth, handleUpdateScannerDate, monitoringLoading, 
    monitoringImgs, selectedIndex, setSelectedIndex, pdfLoading, customAreas,
    reportMd, handlePreviewReport
  }

  return (
    <div>
      {/* ── Sub-Tab Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12, flexWrap: 'wrap' }}>
        {[
          ['map', '1. Map & Carbon KPIs'],
          ['scanner', '2. Multi-Satellite CV Scanner'],
          ['reports', '3. Audit & Reports']
        ].map(([key, label]) => (
          <button 
            key={key} 
            className={`btn ${dashSubTab === key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setDashSubTab(key)
              if (key === 'map') {
                setTimeout(() => {
                  if (mapInst && mapInst.current) {
                    mapInst.current.invalidateSize()
                  }
                }, 150)
              }
            }}
            style={{ fontWeight: 700, fontSize: '0.9rem', padding: '8px 16px' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── SUB-TAB 1: MAP & CARBON KPIS ───────────────────────────────── */}
      <div style={{ display: dashSubTab === 'map' ? 'block' : 'none' }}>
        <DashboardMapPanel ctx={ctx} />
        <DashboardKpiPanel ctx={ctx} />
      </div>

      {/* ── SUB-TAB 2: SENTINEL-2 CV SCANNER ───────────────────────────── */}
      <div style={{ display: dashSubTab === 'scanner' ? 'block' : 'none' }}>
        <DashboardScannerPanel ctx={ctx} />
      </div>

      {/* ── SUB-TAB 3: AUDIT & REPORTS ───────────────────────────────── */}
      <div style={{ display: dashSubTab === 'reports' ? 'block' : 'none' }}>
        <DashboardReportsPanel ctx={ctx} />
      </div>
    </div>
  )
}
