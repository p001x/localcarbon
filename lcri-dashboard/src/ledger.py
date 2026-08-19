import geopandas as gpd
import pandas as pd
from shapely.geometry import shape
import os
import json
from datetime import date

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
LEDGER_PATH = os.path.join(DATA_DIR, 'community_ledger.geojson')

REQUIRED_FIELDS = ["submitter_group", "sector", "submission_date"]


def _load_ledger():
    """Loads the community ledger GeoJSON, returning an empty GeoDataFrame if absent."""
    if os.path.exists(LEDGER_PATH) and os.path.getsize(LEDGER_PATH) > 0:
        try:
            return gpd.read_file(LEDGER_PATH)
        except Exception:
            pass
    return gpd.GeoDataFrame(
        columns=["geometry", "submitter_group", "sector", "submission_date", "notes"],
        geometry="geometry",
        crs="EPSG:4326"
    )


def get_all_submissions():
    """Returns the full community ledger as a GeoDataFrame."""
    return _load_ledger()


def get_submissions_by_sector(sector):
    """Filter ledger by sector name."""
    gdf = _load_ledger()
    if gdf.empty:
        return gdf
    return gdf[gdf["sector"].str.lower() == sector.lower()]


import threading
_ledger_lock = threading.Lock()

def submit_community_site(geojson_geometry, submitter_group, sector, notes="", submission_date=None, gps_verified=False, timestamp_verified=False):
    """
    Appends a new community-reported planting site to the ledger.

    Parameters
    ----------
    geojson_geometry : dict  — GeoJSON geometry (Polygon / LineString)
    submitter_group : str    — name of the Umuganda group
    sector : str             — administrative sector name
    notes : str              — optional free text
    submission_date : str    — ISO date string, defaults to today
    gps_verified: bool       — Whether the GPS location was captured securely
    timestamp_verified: bool — Whether the timestamp was captured securely

    Returns
    -------
    dict with 'success' (bool) and 'message' (str)
    """
    submitter_group = (submitter_group or "").strip()
    sector = (sector or "").strip()
    notes = (notes or "").strip()

    # Validation
    if not submitter_group:
        return {"success": False, "message": "Submitter group name is required."}
    if not sector:
        return {"success": False, "message": "Sector is required."}

    try:
        geom = shape(geojson_geometry)
    except Exception as e:
        return {"success": False, "message": f"Invalid geometry: {e}"}

    if submission_date is None:
        submission_date = str(date.today())

    new_row = gpd.GeoDataFrame(
        [{
            "geometry": geom,
            "submitter_group": submitter_group,
            "sector": sector,
            "submission_date": submission_date,
            "notes": notes,
            "verified": False,   # always False on submission — Phase 10 labels this
            "gps_verified": gps_verified,
            "timestamp_verified": timestamp_verified,
        }],
        geometry="geometry",
        crs="EPSG:4326"
    )

    with _ledger_lock:
        existing = _load_ledger()

        if existing.empty:
            combined = new_row
        else:
            combined = pd.concat([existing, new_row], ignore_index=True)
            combined = gpd.GeoDataFrame(combined, geometry="geometry", crs="EPSG:4326")

        combined.to_file(LEDGER_PATH, driver="GeoJSON")
        
    return {"success": True, "message": f"Site submitted by '{submitter_group}' in sector '{sector}'."}



def delete_submission(submitter_group, submission_date):
    """Deletes matching rows from the ledger."""
    with _ledger_lock:
        gdf = _load_ledger()
        if gdf.empty:
            return {"success": False, "message": "Ledger is empty."}
            
        initial_len = len(gdf)
        mask = (gdf['submitter_group'] == submitter_group) & (gdf['submission_date'] == submission_date)
        gdf = gdf[~mask]
        
        if len(gdf) == initial_len:
            return {"success": False, "message": "Entry not found."}
            
        gdf.to_file(LEDGER_PATH, driver="GeoJSON")
        return {"success": True, "message": "Entry deleted."}

def toggle_verification(submitter_group, submission_date):
    """Toggles the verified status of matching rows."""
    with _ledger_lock:
        gdf = _load_ledger()
        if gdf.empty:
            return {"success": False, "message": "Ledger is empty."}
            
        mask = (gdf['submitter_group'] == submitter_group) & (gdf['submission_date'] == submission_date)
        if not mask.any():
            return {"success": False, "message": "Entry not found."}
            
        # Toggle boolean value (handling possible missing/NaN with fillna)
        gdf.loc[mask, 'verified'] = ~gdf.loc[mask, 'verified'].fillna(False).astype(bool)
        
        gdf.to_file(LEDGER_PATH, driver="GeoJSON")
        return {"success": True, "message": "Verification status toggled."}


def export_ledger_csv():
    """Returns the ledger as a CSV bytes object for download."""
    gdf = _load_ledger()
    if gdf.empty:
        return b"No submissions yet."
    df = gdf.drop(columns="geometry", errors="ignore")
    return df.to_csv(index=False).encode("utf-8")
