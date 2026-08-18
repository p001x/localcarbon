import pytest
import config
from src.carbon import calculate_carbon_stock, calculate_co2e, calculate_sequestration_rate, process_zonal_stats_for_carbon
from src.change_detection import calculate_yoy_difference, calculate_trend

def test_calculate_carbon_stock():
    # 100 Mg AGB * 0.47 = 47.0 Mg Carbon
    assert calculate_carbon_stock(100) == 47.0
    assert calculate_carbon_stock(0) == 0.0

def test_calculate_co2e():
    # 100 Mg Carbon * 3.67 = 367.0 Mg CO2e
    assert calculate_co2e(100) == 367.0

def test_calculate_sequestration_rate():
    # Gained 100 Mg CO2e over 5 years (2020-2025) -> 20 Mg CO2e/year
    assert calculate_sequestration_rate(100, 200, 2020, 2025) == 20.0
    
    # Same year should return 0 to avoid division by zero
    assert calculate_sequestration_rate(100, 100, 2020, 2020) == 0.0

def test_process_zonal_stats_for_carbon():
    mock_stats = {
        "2020": {"mean_agb_mg_ha": 100.0, "area_ha": 10.0}
    }
    enriched = process_zonal_stats_for_carbon(mock_stats)
    
    # 100 Mg/ha * 10 ha = 1000 Mg AGB
    assert enriched["2020"]["total_agb_mg"] == 1000.0
    
    # 1000 Mg AGB * 0.47 = 470 Mg Carbon
    assert enriched["2020"]["carbon_stock_mg"] == 470.0
    
    # 470 Mg Carbon * 3.67 = 1724.9 Mg CO2e
    assert enriched["2020"]["co2e_mg"] == 1724.9

def test_calculate_yoy_difference():
    mock_stats = {
        "2010": {"mean_agb_mg_ha": 100.0},
        "2015": {"mean_agb_mg_ha": 110.0},
        "2016": {"mean_agb_mg_ha": 105.0}
    }
    
    diffs = calculate_yoy_difference(mock_stats)
    assert diffs["2010-2015"] == 10.0
    assert diffs["2015-2016"] == -5.0

def test_calculate_trend():
    # Linearly increasing AGB: y = 2x - 3930
    # For x = [2010, 2011, 2012], y = [90, 92, 94] -> slope should be 2.0
    mock_stats = {
        "2010": {"mean_agb_mg_ha": 90.0},
        "2011": {"mean_agb_mg_ha": 92.0},
        "2012": {"mean_agb_mg_ha": 94.0}
    }
    slope = calculate_trend(mock_stats)
    assert slope == 2.0
    
    # Degrading AGB
    mock_stats_degrade = {
        "2010": {"mean_agb_mg_ha": 100.0},
        "2011": {"mean_agb_mg_ha": 95.0},
        "2012": {"mean_agb_mg_ha": 90.0}
    }
    slope_degrade = calculate_trend(mock_stats_degrade)
    assert slope_degrade == -5.0
