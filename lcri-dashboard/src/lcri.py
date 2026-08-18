import pandas as pd
import numpy as np
import random
import config

# ── Caching ─────────────────────────────────────────────────────────────────
# We need to support both Streamlit (st.cache_data) and Flask (no Streamlit).
# lru_cache CANNOT be used with pd.DataFrame args (unhashable type).
# So we implement a simple in-process dict cache for generate_mock_parcels
# keyed on (district_name, count), and skip caching for calculate_lcri
# (it's fast enough — pure pandas arithmetic, no GEE calls).

def is_streamlit_running():
    try:
        import streamlit as st
        return st.runtime.exists()
    except Exception:
        return False

_PARCEL_CACHE: dict = {}

def _cache_parcels(func):
    """Thin dict-based cache for generate_mock_parcels(district_name, count)."""
    def wrapper(district_name, count=50):
        key = (district_name, count)
        if key not in _PARCEL_CACHE:
            _PARCEL_CACHE[key] = func(district_name, count)
        return _PARCEL_CACHE[key]
    wrapper.__name__ = func.__name__
    return wrapper

# Max plausible AGB for each land-cover class in Mg/ha
# Based on Rwanda biome types
MAX_AGB_BY_CLASS = {
    "tropical_forest": 350.0,
    "woodland": 180.0,
    "degraded_buffer": 120.0,
    "plantation": 200.0,
    "shrubland": 80.0,
}

# Sanity seed values per district to ensure consistent mocking
DISTRICT_SEEDS = {d: i for i, d in enumerate(config.RWANDA_DISTRICTS)}


def normalize_series(series):
    """
    Min-max normalizes a pandas Series to a 0–100 scale.
    If all values are equal, returns 50 for all (no variation).
    """
    min_val = series.min()
    max_val = series.max()
    if max_val == min_val:
        return pd.Series([50.0] * len(series), index=series.index)
    return (series - min_val) / (max_val - min_val) * 100.0


@_cache_parcels
def generate_mock_parcels(district_name, count=50):
    """
    Generates a DataFrame of realistic candidate planting parcels for a given district.
    Values vary by district to simulate real-world heterogeneity.
    """
    import hashlib
    seed = int(hashlib.md5(district_name.encode('utf-8')).hexdigest(), 16) % 10000
    rng = np.random.default_rng(seed)

    # Assign land-cover classes
    classes = rng.choice(
        list(MAX_AGB_BY_CLASS.keys()),
        size=count,
        p=[0.15, 0.25, 0.30, 0.15, 0.15]
    )

    # District modifier to vary values per district
    district_modifier = (seed % 10) / 10.0  # 0.0 to 0.9

    records = []
    for i, lc_class in enumerate(classes):
        max_agb = MAX_AGB_BY_CLASS[lc_class]

        # Current AGB: varies based on degradation level
        current_agb = rng.uniform(0.1 * max_agb, 0.85 * max_agb)

        # Annual AGB change trend (Mg/ha/yr) — negative for degraded parcels
        agb_trend = rng.uniform(-5.0, 2.0) * (1 + district_modifier)

        # Slope in degrees: 0–45
        slope_deg = rng.uniform(0, 45)

        # Distance to nearest intact forest edge in meters
        seed_dist_m = rng.uniform(50, 10000)

        # Area
        area_ha = rng.uniform(1, 200)

        records.append({
            "parcel_id": f"{district_name[:3].upper()}-{i+1:04d}",
            "district": district_name,
            "land_cover_class": lc_class,
            "current_agb_mg_ha": round(current_agb, 2),
            "max_agb_mg_ha": round(max_agb, 2),
            "agb_trend_mg_ha_yr": round(agb_trend, 4),
            "slope_deg": round(slope_deg, 2),
            "seed_dist_m": round(seed_dist_m, 1),
            "area_ha": round(area_ha, 2),
        })

    return pd.DataFrame(records)


def calculate_lcri(parcels_df, weights=None):
    """
    Calculates the LCRI score for each parcel in parcels_df.

    Formula:
    LCRI = w1 * CarbonPotential + w2 * DegradationUrgency
         + w3 * SlopeFeasibility + w4 * SeedProximity

    All sub-factors are min-max normalized to 0–100 WITHIN the parcels_df
    (i.e., within the currently selected district) before weighting.

    Parameters
    ----------
    parcels_df : pd.DataFrame
        Output from generate_mock_parcels() or real parcel data.
    weights : dict, optional
        Dictionary with keys: carbon_potential, degradation_urgency,
        slope_feasibility, seed_proximity. Defaults to config.DEFAULT_WEIGHTS.

    Returns
    -------
    pd.DataFrame
        Original data enriched with raw sub-factor scores, normalized
        sub-factor scores, and the final LCRI score. Sorted descending.
    """
    if weights is None:
        weights = config.DEFAULT_WEIGHTS

    df = parcels_df.copy()

    # 1. Compute raw sub-factors

    # CarbonPotential: headroom = max AGB - current AGB
    # Higher headroom = better planting candidate
    df["raw_carbon_potential"] = df["max_agb_mg_ha"] - df["current_agb_mg_ha"]

    # DegradationUrgency: stronger negative trend = higher urgency
    # We negate the trend so negative trends become large positive values
    df["raw_degradation_urgency"] = -df["agb_trend_mg_ha_yr"]

    # SlopeFeasibility: gentler slope = higher feasibility
    # Invert so 0° = 100, 45° = 0
    df["raw_slope_feasibility"] = 45.0 - df["slope_deg"]
    # Cap any values below 0 (shouldn't happen given our range but be safe)
    df["raw_slope_feasibility"] = df["raw_slope_feasibility"].clip(lower=0)

    # SeedProximity: closer distance = higher score
    # Invert distance
    df["raw_seed_proximity"] = 1.0 / (df["seed_dist_m"] + 1.0)

    # 2. Normalize each factor to 0–100 WITHIN the district
    df["norm_carbon_potential"] = normalize_series(df["raw_carbon_potential"])
    df["norm_degradation_urgency"] = normalize_series(df["raw_degradation_urgency"])
    df["norm_slope_feasibility"] = normalize_series(df["raw_slope_feasibility"])
    df["norm_seed_proximity"] = normalize_series(df["raw_seed_proximity"])

    # 3. Calculate weighted LCRI score (0–100)
    df["lcri_score"] = (
        weights["carbon_potential"]     * df["norm_carbon_potential"]
        + weights["degradation_urgency"]  * df["norm_degradation_urgency"]
        + weights["slope_feasibility"]    * df["norm_slope_feasibility"]
        + weights["seed_proximity"]       * df["norm_seed_proximity"]
    ).round(2)

    # Sort by LCRI descending
    return df.sort_values("lcri_score", ascending=False).reset_index(drop=True)
