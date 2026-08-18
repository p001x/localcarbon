"""
file_upload.py — Parse study-area files (Shapefile ZIP, KML/KMZ, GeoJSON)
to a canonical GeoJSON geometry dict.

Supported formats
-----------------
.zip  — ZIP archive containing a Shapefile (.shp + sidecar files)
.kml  — Google Keyhole Markup Language polygon
.kmz  — KMZ (ZIP-packaged KML)
.geojson / .json — Raw GeoJSON FeatureCollection, Feature, or Geometry

All output geometries are reprojected to EPSG:4326.
"""
import io
import os
import json
import zipfile
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional

import geopandas as gpd
from shapely.geometry import mapping
from shapely.ops import unary_union


# ─────────────────────────────────────────────────────────────────────────────
# Shapefile (ZIP)
# ─────────────────────────────────────────────────────────────────────────────

def _read_shapefile_zip(data: bytes) -> dict:
    """Extract first .shp from a ZIP archive and return its geometry as GeoJSON."""
    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = os.path.join(tmpdir, 'upload.zip')
        with open(zip_path, 'wb') as f:
            f.write(data)
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(tmpdir)

        shp_files = sorted(Path(tmpdir).glob('**/*.shp'))
        if not shp_files:
            raise ValueError('No .shp file found in ZIP archive. '
                             'Make sure the ZIP contains .shp, .dbf, and .shx files.')

        gdf = gpd.read_file(str(shp_files[0])).to_crs('EPSG:4326')
        if gdf.empty:
            raise ValueError('Shapefile contains no features.')

        valid = gdf[gdf.geometry.notna() & ~gdf.geometry.is_empty]
        if valid.empty:
            raise ValueError('Shapefile has no valid geometries.')

        geom = mapping(unary_union(valid.geometry))
        columns = [c for c in gdf.columns if c != 'geometry']
        return {
            'geometry':      geom,
            'feature_count': len(valid),
            'crs':           'EPSG:4326',
            'columns':       columns[:20],  # cap column list for JSON safety
        }


# ─────────────────────────────────────────────────────────────────────────────
# KML / KMZ
# ─────────────────────────────────────────────────────────────────────────────

def _kml_bytes_from_kmz(data: bytes) -> bytes:
    """Extract the primary .kml file from a KMZ (ZIP) archive."""
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        kml_names = [n for n in zf.namelist() if n.lower().endswith('.kml')]
        if not kml_names:
            raise ValueError('No .kml file found inside KMZ archive.')
        # Prefer doc.kml if present
        target = next((n for n in kml_names if 'doc' in n.lower()), kml_names[0])
        return zf.read(target)


def _parse_kml_xml(kml_str: str) -> list[list]:
    """
    Parse KML XML and return a list of coordinate rings (each ring is a list
    of [lon, lat] pairs).  Works with or without explicit XML namespaces.
    """
    # Strip namespaces for simpler parsing
    import re
    kml_clean = re.sub(r'\sxmlns[^"]*"[^"]*"', '', kml_str)
    kml_clean = re.sub(r'<(\w+:)', '<', kml_clean)
    kml_clean = re.sub(r'</(\w+:)', '</', kml_clean)

    try:
        root = ET.fromstring(kml_clean)
    except ET.ParseError:
        # Last resort: try with the original string
        root = ET.fromstring(kml_str)

    rings = []
    for ce in root.iter('coordinates'):
        text = (ce.text or '').strip()
        ring = []
        for triplet in text.split():
            parts = triplet.split(',')
            if len(parts) >= 2:
                try:
                    ring.append([float(parts[0]), float(parts[1])])
                except ValueError:
                    pass
        if len(ring) >= 3:
            rings.append(ring)
    return rings


def _read_kml(data: bytes) -> dict:
    """Parse KML/KMZ bytes and return GeoJSON geometry."""
    # Try geopandas/fiona (most reliable)
    try:
        import fiona
        fiona.drvsupport.supported_drivers['KML'] = 'rw'
        fiona.drvsupport.supported_drivers['LIBKML'] = 'rw'
        with tempfile.NamedTemporaryFile(suffix='.kml', delete=False) as tf:
            tf.write(data)
            tf_name = tf.name
        try:
            gdf = gpd.read_file(tf_name, driver='KML').to_crs('EPSG:4326')
            if not gdf.empty:
                valid = gdf[gdf.geometry.notna() & ~gdf.geometry.is_empty]
                geom = mapping(unary_union(valid.geometry))
                return {'geometry': geom, 'feature_count': len(valid),
                        'crs': 'EPSG:4326', 'columns': []}
        finally:
            os.unlink(tf_name)
    except Exception:
        pass

    # Fallback: plain XML parsing
    kml_str = data.decode('utf-8', errors='replace')
    rings = _parse_kml_xml(kml_str)
    if not rings:
        raise ValueError('No polygon coordinates found in KML file. '
                         'Ensure the file contains Polygon placemarks.')
    if len(rings) == 1:
        geom: dict = {'type': 'Polygon', 'coordinates': [rings[0]]}
    else:
        geom = {'type': 'MultiPolygon', 'coordinates': [[[r]] for r in rings]}
    return {'geometry': geom, 'feature_count': len(rings), 'crs': 'EPSG:4326', 'columns': []}


# ─────────────────────────────────────────────────────────────────────────────
# GeoJSON
# ─────────────────────────────────────────────────────────────────────────────

def _read_geojson(data: bytes) -> dict:
    """Validate and normalise a GeoJSON file to a single geometry."""
    try:
        obj = json.loads(data.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise ValueError(f'Invalid GeoJSON file: {e}')

    t = obj.get('type', '')
    if t == 'FeatureCollection':
        features = obj.get('features', [])
        if not features:
            raise ValueError('GeoJSON FeatureCollection contains no features.')
        geoms = [f['geometry'] for f in features if f.get('geometry')]
        if not geoms:
            raise ValueError('GeoJSON FeatureCollection has no geometry data.')
        if len(geoms) == 1:
            geom = geoms[0]
        else:
            from shapely.geometry import shape
            geom = mapping(unary_union([shape(g) for g in geoms]))
        return {'geometry': geom, 'feature_count': len(features),
                'crs': 'EPSG:4326', 'columns': []}

    elif t == 'Feature':
        if not obj.get('geometry'):
            raise ValueError('GeoJSON Feature has no geometry.')
        return {'geometry': obj['geometry'], 'feature_count': 1,
                'crs': 'EPSG:4326', 'columns': []}

    elif t in ('Polygon', 'MultiPolygon', 'LineString', 'MultiLineString', 'Point'):
        return {'geometry': obj, 'feature_count': 1, 'crs': 'EPSG:4326', 'columns': []}

    elif t == 'Topology':
        try:
            import fiona
            fiona.drvsupport.supported_drivers['TopoJSON'] = 'r'
            with tempfile.NamedTemporaryFile(suffix='.topojson', delete=False) as tf:
                tf.write(data)
                tf_name = tf.name
            try:
                gdf = gpd.read_file(tf_name, driver='TopoJSON').to_crs('EPSG:4326')
                if not gdf.empty:
                    valid = gdf[gdf.geometry.notna() & ~gdf.geometry.is_empty]
                    from shapely.geometry import shape
                    geom = mapping(unary_union(valid.geometry))
                    return {'geometry': geom, 'feature_count': len(valid),
                            'crs': 'EPSG:4326', 'columns': []}
                else:
                    raise ValueError('TopoJSON contains no features.')
            finally:
                os.unlink(tf_name)
        except Exception as e:
            raise ValueError(f'Failed to parse TopoJSON: {e}')

    else:
        raise ValueError(f'Unrecognised JSON type: "{t}". '
                         f'Expected FeatureCollection, Feature, Geometry, or Topology.')


# ─────────────────────────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────────────────────────

def parse_upload(filename: str, data: bytes) -> dict:
    """
    Detect file type from filename extension and parse to a GeoJSON geometry.

    Returns
    -------
    dict
        geometry      : GeoJSON geometry dict
        feature_count : number of features found
        crs           : 'EPSG:4326'
        columns       : attribute column names (shapefile only)
    """
    name = filename.lower()
    if name.endswith('.zip'):
        return _read_shapefile_zip(data)
    elif name.endswith('.kmz'):
        kml_data = _kml_bytes_from_kmz(data)
        return _read_kml(kml_data)
    elif name.endswith('.kml'):
        return _read_kml(data)
    elif name.endswith('.geojson') or name.endswith('.json') or name.endswith('.topojson'):
        return _read_geojson(data)
    else:
        raise ValueError(
            f'Unsupported file type: "{filename}". '
            'Accepted formats: .zip (Shapefile), .kml, .kmz, .geojson, .topojson'
        )
