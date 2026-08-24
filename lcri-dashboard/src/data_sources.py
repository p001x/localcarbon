import pandas as pd
import geopandas as gpd
import os
import ee
import json

# Conditional caching decorator for running in Flask/non-Streamlit environments
def is_streamlit_running():
    try:
        import streamlit as st
        return st.runtime.exists()
    except Exception:
        return False

if is_streamlit_running():
    import streamlit as st
    cache_data = st.cache_data
    cache_resource = st.cache_resource
else:
    from functools import lru_cache
    def cache_data(func=None, **kwargs):
        if func is None:
            return lambda f: lru_cache(maxsize=128)(f)
        return lru_cache(maxsize=128)(func)
    
    def cache_resource(func=None, **kwargs):
        if func is None:
            return lambda f: lru_cache(maxsize=128)(f)
        return lru_cache(maxsize=128)(func)

# Base data directory relative to the src folder
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
VECTOR_DIR = r"C:\Users\user\Documents\local carbon\dataset vector"
GEE_CRED_PATH = r"C:\Users\user\Documents\local carbon\ee-petersonyang87-52f0e0a9ad78.json"

_ee_initialized = False

@cache_resource
def init_ee():
    """Initializes Earth Engine using the service account JSON directly."""
    global _ee_initialized
    if _ee_initialized:
        return
    try:
        env_creds = os.environ.get("GEE_SERVICE_ACCOUNT_JSON")
        if env_creds:
            # Handle potential escaping issues in environment variables (Vercel sometimes double-escapes newlines)
            if env_creds.startswith("'") and env_creds.endswith("'"):
                env_creds = env_creds[1:-1]
            # Replace escaped newlines if any
            env_creds = env_creds.replace('\\n', '\n')
            
            creds_dict = json.loads(env_creds, strict=False)
            
            from google.oauth2 import service_account
            credentials = service_account.Credentials.from_service_account_info(
                creds_dict, scopes=['https://www.googleapis.com/auth/earthengine']
            )
            project_id = creds_dict.get('project_id')
        else:
            with open(GEE_CRED_PATH, 'r') as f:
                creds_dict = json.load(f)
            from google.oauth2 import service_account
            credentials = service_account.Credentials.from_service_account_info(
                creds_dict, scopes=['https://www.googleapis.com/auth/earthengine']
            )
            project_id = creds_dict.get('project_id')
            
        ee.Initialize(credentials, project=project_id)
        _ee_initialized = True
    except Exception as e:
        import traceback
        print(f"CRITICAL: Earth Engine initialization failed!")
        print(traceback.format_exc())
        print(f"Warning: Earth Engine unavailable: {e}")
        
@cache_data
def get_available_shapefiles():
    """Returns a list of shapefile names available in the dataset vector directory."""
    if not os.path.exists(VECTOR_DIR):
        return []
    files = [f for f in os.listdir(VECTOR_DIR) if f.endswith('.shp')]
    return files

@cache_data
def load_shapefile(filename):
    """Loads a shapefile from the dataset vector directory."""
    path = os.path.join(VECTOR_DIR, filename)
    if os.path.exists(path):
        gdf = gpd.read_file(path)
        if gdf.crs and gdf.crs.to_string() != "EPSG:4326":
            gdf = gdf.to_crs("EPSG:4326")
        return gdf
    return gpd.GeoDataFrame(columns=['geometry'], geometry='geometry', crs="EPSG:4326")

@cache_data
def fetch_districts_by_country(country_name):
    """
    Fetches the list of ADM2_NAME districts/counties for a given country using Earth Engine.
    Falls back to a hardcoded list in offline mode.
    """
    init_ee()
    # Normalize country names to match GAUL
    gaul_country = country_name
    if country_name == "Cote d'Ivoire":
        gaul_country = "Cte d'Ivoire"
    elif country_name == "Reunion":
        gaul_country = "Runion"
        
    try:
        fc = ee.FeatureCollection('FAO/GAUL/2015/level2') \
               .filter(ee.Filter.eq('ADM0_NAME', gaul_country))
        names = fc.aggregate_array('ADM2_NAME').distinct().getInfo()
        # Filter out None/empty values and sort
        names = sorted([name for name in names if name])
        if len(names) == 0:
            raise ValueError("No districts found")
        return names
    except Exception as e:
        print(f"Warning: Offline mode fallback for fetch_districts_by_country ({e})")
        # Fallback to config districts (assuming config has districts for Rwanda mostly, 
        # but we can return a generic mock list to keep the UI working)
        try:
            import config
            return [f"All {country_name}"] + config.DISTRICTS
        except:
            return [f"All {country_name}", "Mock District 1", "Mock District 2"]

@cache_data
def fetch_district_geometry(country_name, district_name):
    """
    Fetches the GeoJSON geometry for a specific district using Google Earth Engine.
    Falls back to a generic bounding box polygon if offline.
    """
    init_ee()
    # Normalize country names to match GAUL
    gaul_country = country_name
    if country_name == "Cote d'Ivoire":
        gaul_country = "Cte d'Ivoire"
    elif country_name == "Reunion":
        gaul_country = "Runion"

    try:
        if district_name == f"All {country_name}":
            # GAUL 2015 sometimes has rendering issues or merges bounds depending on the filter.
            # USDOS LSIB provides strict, accurate international boundaries.
            lsib_country = country_name
            if country_name == "Cote d'Ivoire":
                lsib_country = "Cote d'Ivoire"
            fc = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017') \
                   .filter(ee.Filter.eq('country_na', lsib_country))
        else:
            fc = ee.FeatureCollection('FAO/GAUL/2015/level2') \
                   .filter(ee.Filter.eq('ADM0_NAME', gaul_country)) \
                   .filter(ee.Filter.eq('ADM2_NAME', district_name))
        
        geom = fc.geometry().getInfo()
        if geom and 'coordinates' in geom and len(geom['coordinates']) > 0:
            return geom
        raise ValueError("Empty geometry returned from GEE")
    except Exception as e:
        print(f"Warning: Offline mode fallback for fetch_district_geometry ({e})")
        # Return a generic polygon (approximate bounding box of Rwanda as a fallback)
        # This prevents the UI from crashing with a 404.
        return {
            "type": "Polygon",
            "coordinates": [
                [
                    [28.86, -1.04],
                    [30.89, -1.04],
                    [30.89, -2.83],
                    [28.86, -2.83],
                    [28.86, -1.04]
                ]
            ]
        }

@cache_data
def fetch_protected_areas():
    """
    Loads the Africa Knowledge Platform Protected Areas shapefile.
    """
    shp_path = os.path.join(DATA_DIR, 'gaul_prot_unprot_2020', 'gaul_prot_unprot_2020.shp')
    if os.path.exists(shp_path):
        gdf = gpd.read_file(shp_path)
        if gdf.crs and gdf.crs.to_string() != "EPSG:4326":
            gdf = gdf.to_crs("EPSG:4326")
        return gdf
    else:
        return gpd.GeoDataFrame(columns=['geometry'], geometry='geometry', crs="EPSG:4326")

@cache_data
def get_provenance_data():
    """
    Reads the provenance.csv file to display data sources in the UI.
    """
    csv_path = os.path.join(DATA_DIR, 'provenance.csv')
    if os.path.exists(csv_path):
        return pd.read_csv(csv_path)
    else:
        return pd.DataFrame(columns=['dataset', 'portal', 'access_date', 'citation'])

