import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

export const fetchHealth        = ()           => api.get('/health').then(r => r.data)
export const fetchConfig      = ()           => api.get('/config').then(r => r.data)
export const fetchShapefiles  = ()           => api.get('/shapefiles').then(r => r.data)
export const fetchDistricts   = (country)    => api.get(`/districts/${encodeURIComponent(country)}`).then(r => r.data)
export const fetchDistrictBoundary = (name, country) => api.get(`/district-boundary/${encodeURIComponent(name)}`, { params: country ? { country } : {} }).then(r => r.data)
export const fetchGeeTileUrl  = ()           => api.get('/gee-tile-url').then(r => r.data)
export const fetchProtectedAreas = ()        => api.get('/protected-areas').then(r => r.data)
export const fetchShapefileLayer = (name)    => api.get(`/shapefile/${encodeURIComponent(name)}`).then(r => r.data)
export const computeKpis      = (geometry)  => api.post('/kpis', { geometry }).then(r => r.data)
export const predictMl        = (geometry)  => api.post('/ml-predict', { geometry }).then(r => r.data)
export const fetchPointBiomass= (lat, lng, opts = {})  => api.post('/point-biomass', { lat, lng }, opts).then(r => r.data)
export const fetchMonitoringImages = (geometry, targetDate) => api.post('/monitoring-images', { geometry, target_date: targetDate }).then(r => r.data)
export const fetchCustomAreas = ()           => api.get('/custom-areas').then(r => r.data)
export const createCustomArea = (payload)    => api.post('/custom-areas', payload).then(r => r.data)
export const deleteCustomArea = (name)       => api.delete(`/custom-areas/${encodeURIComponent(name)}`).then(r => r.data)
export const fetchLcriRanking = (payload)    => api.post('/lcri-ranking', payload).then(r => r.data)
export const runSimulator     = (payload)    => api.post('/simulator', payload).then(r => r.data)

export const fetchRegistryProjects = ()      => api.get('/registry/projects').then(r => r.data)
export const analyseParcel    = (payload)    => api.post('/parcel/analyse', payload).then(r => r.data)
export const previewReport    = (payload)    => api.post('/report/preview', payload).then(r => r.data)
export const fetchProvenance  = ()           => api.get('/provenance').then(r => r.data)

export const uploadAreaFile   = (formData)   => api.post('/upload-area', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
export const fetchTrueColorTile = ()         => api.get('/true-color-tile').then(r => r.data)

export const fetchLedger      = (sector)     => api.get('/ledger', { params: sector ? { sector } : {} }).then(r => {
  if (r.data && r.data.type === 'FeatureCollection') {
    return (r.data.features || []).map(f => ({ ...(f.properties || {}), geometry: f.geometry }))
  }
  return Array.isArray(r.data) ? r.data : []
})
export const submitLedger     = (payload)    => api.post('/ledger', payload).then(r => r.data)
export const deleteLedgerEntry = (payload)   => api.delete('/ledger', { data: payload }).then(r => r.data)
export const toggleLedgerEntry = (payload)   => api.patch('/ledger', payload).then(r => r.data)
export const analyseTree      = (payload)    => api.post('/tree/analyse', payload).then(r => r.data)
export const fetchKnownSpecies = ()          => api.get('/tree/species').then(r => r.data.species || [])

export const fetchLiveCarbonPrice = () => {
  return fetch('https://api.coingecko.com/api/v3/simple/price?ids=toucan-protocol-nature-carbon-tonne&vs_currencies=usd&include_24hr_change=true')
    .then(r => r.json())
}
