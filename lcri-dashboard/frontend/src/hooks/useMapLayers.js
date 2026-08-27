import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { fetchDistrictBoundary, fetchGeeTileUrl, fetchShapefileLayer, fetchShapefiles } from '../api';

const CARTO_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ESRI_SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ECOLOGICAL = ['Parks.shp', 'Wetlands.shp', 'Lakes.shp', 'rwanda.shp'];

const COUNTRY_VIEW = {
  "Rwanda": [-1.94,29.87,8],
  // You can add more countries here as needed
};

export default function useMapLayers(country, district, customAreas, mode, setMode, setAoiGeom, aoiGeom) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const layersRef = useRef({ gee: null, pa: null, overlays: [], aoi: null });
  const customAreasRef = useRef(customAreas);
  customAreasRef.current = customAreas;

  const [drawnLayer, setDrawnLayer] = useState(null);
  const [geeTile, setGeeTile] = useState(null);
  const [availShp, setAvailShp] = useState([]);
  const [selShp, setSelShp] = useState(['Parks.shp','Wetlands.shp']);

  // Init map
  useEffect(() => {
    if (mapInst.current) return;
    const [initLat, initLng, initZoom] = COUNTRY_VIEW['Rwanda'] || [0, 20, 4];
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true })
      .setView([initLat, initLng], initZoom);
      
    // Set Dark Base Map
    const darkBase = L.tileLayer(CARTO_DARK, { attribution: '&copy; CARTO', maxZoom: 20 });
    const satBase = L.tileLayer(ESRI_SAT, { attribution: 'Tiles &copy; Esri', maxZoom: 20 });
    
    // Add default base
    darkBase.addTo(map);
    
    // Setup Layer Control
    layersRef.current.baseMaps = {
      "Dark Cinematic (Recommended)": darkBase,
      "Satellite (ESRI)": satBase
    };
    layersRef.current.overlayMaps = {};
    
    layersRef.current.layerControl = L.control.layers(layersRef.current.baseMaps, layersRef.current.overlayMaps, { position: 'topleft' }).addTo(map);

    mapInst.current = map;

    try {
      // Draw control removed based on user request
    } catch (err) {
      console.warn('[LCRI] Map init warning:', err.message);
    }

    fetchGeeTileUrl().then(d => { if (d.url) setGeeTile(d.url) }).catch(() => {});
    fetchShapefiles().then(files => setAvailShp(files.filter(f => ECOLOGICAL.includes(f)))).catch(() => {});

    return () => { map.remove(); mapInst.current = null; };
  }, [setAoiGeom]);

  // Recenter on country change
  useEffect(() => {
    const map = mapInst.current; if (!map) return;
    const [lat, lng, zoom] = COUNTRY_VIEW[country] || [0, 20, 4];
    map.flyTo([lat, lng], zoom, { duration: 1.2 });
  }, [country]);

  // GEE Tile Layer Update
  useEffect(() => {
    const map = mapInst.current; if (!map) return;
    
    if (layersRef.current.gee) { 
      map.removeLayer(layersRef.current.gee); 
      layersRef.current.layerControl.removeLayer(layersRef.current.gee);
      layersRef.current.gee = null; 
    }
    
    if (geeTile) {
      const newGeeLayer = L.tileLayer(geeTile, { opacity: 0.85, attribution: 'NASA/ORNL AGB' });
      layersRef.current.gee = newGeeLayer;
      
      // Auto-add to map and to layer controls
      newGeeLayer.addTo(map);
      layersRef.current.layerControl.addOverlay(newGeeLayer, "🌿 Carbon Biomass (AGB)");
    }
  }, [geeTile]);

  // Vector overlays
  useEffect(() => {
    const map = mapInst.current; if (!map) return;
    layersRef.current.overlays.forEach(l => map.removeLayer(l));
    layersRef.current.overlays = [];
    selShp.forEach(name => {
      fetchShapefileLayer(name).then(geojson => {
        const l = L.geoJSON(geojson, {
          style: {
            fillColor: name.includes('Park') ? '#f1c40f' : '#3498db',
            color: '#2c3e50', weight: 1, fillOpacity: 0.3
          },
          onEachFeature: (feature, layer) => {
            layer.on('click', () => {
              setAoiGeom(feature.geometry);
              setMode('upload');
              try { map.fitBounds(layer.getBounds(), { padding:[30,30] }); } catch (_) {}
            });
            const pName = feature.properties?.Name || feature.properties?.NAME || feature.properties?.name;
            if (pName) {
              layer.bindTooltip(`Click to analyze: ${pName}`);
            }
          }
        }).addTo(map);
        layersRef.current.overlays.push(l);
        // Add to layer controls so user can toggle it
        layersRef.current.layerControl.addOverlay(l, `🗺️ ${name.replace('.shp', '')}`);
      }).catch(() => {});
    });
  }, [selShp, setAoiGeom, setMode]);

  // District boundary
  useEffect(() => {
    const map = mapInst.current; if (!map) return;
    
    // Skip district logic entirely if we are in upload mode
    // (the uploaded geometry effect handles the map drawing)
    if (mode === 'upload') return;

    if (layersRef.current.aoi) { map.removeLayer(layersRef.current.aoi); layersRef.current.aoi = null; }
    if (mode !== 'district' || !district || district === 'None' || district.startsWith('All ') || district === 'Uploaded Area') {
      setAoiGeom(null); return;
    }
    
    if (customAreasRef.current[district]) {
      const geom = customAreasRef.current[district].geometry || customAreasRef.current[district];
      setAoiGeom(geom);
      const layer = L.geoJSON(geom, { 
        style:{ fillColor:'#e74c3c', color:'#c0392b', weight:3, fillOpacity:0.25 },
        onEachFeature: (feature, l) => {
          l.bindTooltip(`<div style="padding: 4px;"><strong>${district}</strong><br/>Saved Parcel</div>`, { sticky: true, className: 'vision-map-tooltip' });
        }
      }).addTo(map);
      layersRef.current.aoi = layer;
      try { map.fitBounds(layer.getBounds(), { padding:[30,30] }); } catch (_) {}
      return;
    }

    fetchDistrictBoundary(district, country).then(geom => {
      if (!geom) return;
      setAoiGeom(geom);
      const layer = L.geoJSON(geom, { style:{ fillColor:'#00ff88', color:'#00ff88', weight:2.5, fillOpacity:0.08 } }).addTo(map);
      layersRef.current.aoi = layer;
      try { map.fitBounds(layer.getBounds(), { padding:[30,30] }); } catch (_) {}
    }).catch(() => {});
  }, [district, country, mode, setAoiGeom]);

  // Uploaded geometry boundary
  useEffect(() => {
    const map = mapInst.current; if (!map) return;
    if (mode === 'upload' && aoiGeom) {
      if (layersRef.current.aoi) { map.removeLayer(layersRef.current.aoi); }
      const layer = L.geoJSON(aoiGeom, { style:{ fillColor:'#9b59b6', color:'#8e44ad', weight:2, fillOpacity:0.2 } }).addTo(map);
      layersRef.current.aoi = layer;
      try { map.fitBounds(layer.getBounds(), { padding:[30,30] }); } catch (_) {}
    }
  }, [aoiGeom, mode]);

  return {
    mapRef, mapInst, drawnLayer, geeTile, availShp, selShp, setSelShp
  };
}
