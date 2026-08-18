import pytest
import pandas as pd
import numpy as np
from src.lcri import normalize_series, generate_mock_parcels, calculate_lcri


def test_normalize_series_basic():
    s = pd.Series([0.0, 50.0, 100.0])
    result = normalize_series(s)
    assert result[0] == 0.0
    assert result[2] == 100.0
    assert abs(result[1] - 50.0) < 0.01


def test_normalize_series_constant():
    # All same values => all should return 50
    s = pd.Series([75.0, 75.0, 75.0])
    result = normalize_series(s)
    assert all(result == 50.0)


def test_lcri_score_range():
    """All LCRI scores must be between 0 and 100."""
    parcels = generate_mock_parcels("Nyamagabe", count=50)
    result = calculate_lcri(parcels)
    assert result["lcri_score"].between(0, 100).all()


def test_mature_forest_scores_lower_than_degraded():
    """
    Sanity check: A mature high-biomass forest parcel (little headroom)
    should score LOWER on LCRI than a highly degraded parcel of the same land cover.
    """
    data = {
        "current_agb_mg_ha":    [320.0, 30.0],
        "max_agb_mg_ha":        [350.0, 350.0],
        "agb_trend_mg_ha_yr":   [0.5,  -4.5],   # mature: growing; degraded: losing
        "slope_deg":            [5.0,   5.0],    # same slope
        "seed_dist_m":          [200.0, 200.0],  # same seed proximity
        "area_ha":              [50.0,  50.0],
    }
    df = pd.DataFrame(data)
    df["parcel_id"] = ["mature_forest", "degraded_parcel"]
    df["district"] = "TestDistrict"
    df["land_cover_class"] = "tropical_forest"

    result = calculate_lcri(df)

    # degraded parcel should rank higher (index 0 after sort desc)
    top_parcel = result.iloc[0]["parcel_id"]
    assert top_parcel == "degraded_parcel", (
        f"Expected degraded_parcel to rank highest, got {top_parcel}"
    )


def test_custom_weights():
    """Changing weights to 100% carbon_potential should rank by headroom only."""
    parcels = generate_mock_parcels("Nyamasheke", count=20)
    weights_all_carbon = {
        "carbon_potential": 1.0,
        "degradation_urgency": 0.0,
        "slope_feasibility": 0.0,
        "seed_proximity": 0.0,
    }
    result = calculate_lcri(parcels, weights=weights_all_carbon)

    # Highest LCRI should correspond to highest carbon potential headroom
    top_headroom = (parcels["max_agb_mg_ha"] - parcels["current_agb_mg_ha"]).max()
    top_result_headroom = result.iloc[0]["max_agb_mg_ha"] - result.iloc[0]["current_agb_mg_ha"]
    assert abs(top_result_headroom - top_headroom) < 0.01
