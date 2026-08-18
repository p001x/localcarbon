import pandas as pd
import numpy as np
import config
from src.lcri import generate_mock_parcels, calculate_lcri
from src.carbon import calculate_co2e, calculate_carbon_stock

# Growth curve parameters per site type (Mg/ha/yr)
# Approximate rates based on published Rwanda biomass literature
GROWTH_RATES = {
    "natural_regrowth":        2.5,   # Mg AGB/ha/yr
    "plantation":              6.0,   # Mg AGB/ha/yr (e.g. eucalyptus/pine)
    "degraded_buffer_recovery": 1.5,  # Mg AGB/ha/yr — slower, disturbed areas
}

PROJECTION_YEARS = [5, 10, 20]


def project_biomass_monte_carlo(current_agb_mg_ha, max_agb_mg_ha, slope_deg, site_type, years, num_simulations=1000):
    """
    Projects AGB trajectory using a Monte Carlo simulation.
    Applies random mortality events (fire, drought) each year, tied to slope.
    Returns {year: {"p10": agb, "p50": agb, "p90": agb}}
    """
    rate = GROWTH_RATES.get(site_type, 2.5)
    
    # Dynamic risk: 2% base + 1% per degree of slope
    event_prob = 0.02 + (slope_deg / 100.0)
    
    results = {y: [] for y in years}
    
    for _ in range(num_simulations):
        agb = current_agb_mg_ha
        sim_traj = {}
        for y in range(1, max(years) + 1):
            headroom = max_agb_mg_ha - agb
            agb += headroom * (1 - np.exp(-rate / max_agb_mg_ha))
            
            # Stochastic mortality
            if np.random.rand() < event_prob:
                loss_fraction = np.random.uniform(0.2, 0.5)
                agb *= (1 - loss_fraction)
                
            agb = min(max(agb, 0), max_agb_mg_ha)
            
            if y in years:
                sim_traj[y] = agb
                
        for y in years:
            results[y].append(sim_traj[y])
            
    trajectory = {}
    for y in years:
        trajectory[y] = {
            "p10": round(np.percentile(results[y], 10), 2),
            "p50": round(np.percentile(results[y], 50), 2),
            "p90": round(np.percentile(results[y], 90), 2)
        }
    return trajectory


def project_bau_loss(current_agb_mg_ha, agb_trend_mg_ha_yr, years):
    """
    Business-as-usual (BAU): projects carbon loss if degradation continues.
    Uses exponential decay for negative trends to realistically slow down loss.
    """
    trajectory = {}
    for y in years:
        if current_agb_mg_ha <= 0:
            projected = 0.0
        elif agb_trend_mg_ha_yr < 0:
            projected = current_agb_mg_ha * np.exp((agb_trend_mg_ha_yr / current_agb_mg_ha) * y)
        else:
            projected = current_agb_mg_ha + agb_trend_mg_ha_yr * y
        trajectory[y] = round(max(projected, 0.0), 2)
    return trajectory


def run_simulator(
    district,
    hectare_target=None,
    budget_usd=None,
    cost_per_ha_usd=500.0,
    usd_per_tco2e=config.DEFAULT_USD_PER_TCO2E,
    site_type="natural_regrowth",
    weights=None
):
    """
    Reforestation Investment Simulator.

    Given a district + (hectare_target OR budget_usd), pulls LCRI-ranked
    candidates and returns the top-ranked shortlist that fits the target.

    Parameters
    ----------
    district : str
    hectare_target : float, optional — target total area (ha)
    budget_usd : float, optional — budget to spend; converted to ha target
    cost_per_ha_usd : float — estimated cost per ha to plant
    usd_per_tco2e : float — indicative offset revenue per tonne CO2e
    site_type : str — one of GROWTH_RATES keys
    weights : dict, optional — LCRI weights

    Returns
    -------
    dict with:
      - 'shortlist': DataFrame of selected parcels
      - 'summary': dict of totals (area, cost, CO2e potential, revenue range)
      - 'trajectories': dict per parcel_id of {year: {agb, co2e}}
      - 'bau_trajectories': dict per parcel_id of BAU loss trajectories
    """
    if weights is None:
        weights = config.DEFAULT_WEIGHTS

    if hectare_target is None and budget_usd is None:
        raise ValueError("Provide either hectare_target or budget_usd.")

    # Get LCRI-ranked parcels
    parcels = generate_mock_parcels(district, count=100)
    ranked = calculate_lcri(parcels, weights=weights)

    # Select top-ranked parcels dynamically hitting budget or area limits
    shortlist = []
    cumulative_area = 0.0
    cumulative_cost = 0.0
    
    for _, row in ranked.iterrows():
        # Cost scales with slope
        parcel_cost_per_ha = cost_per_ha_usd * (1 + (row["slope_deg"] / 45.0))
        parcel_total_cost = row["area_ha"] * parcel_cost_per_ha
        
        row_dict = row.to_dict()
        row_dict["cost_per_ha_usd"] = parcel_cost_per_ha
        row_dict["est_cost_usd"] = parcel_total_cost
        
        if budget_usd is not None:
            if cumulative_cost >= budget_usd:
                break
        elif hectare_target is not None:
            if cumulative_area >= hectare_target:
                break
                
        shortlist.append(row_dict)
        cumulative_area += row["area_ha"]
        cumulative_cost += parcel_total_cost
        
    shortlist_df = pd.DataFrame(shortlist)
    if len(shortlist_df) == 0:
        shortlist_df = pd.DataFrame(columns=ranked.columns.tolist() + ["cost_per_ha_usd", "est_cost_usd"])

    # Build trajectories
    trajectories = {}
    bau_trajectories = {}
    for _, row in shortlist_df.iterrows():
        pid = row["parcel_id"]
        traj = project_biomass_monte_carlo(
            row["current_agb_mg_ha"], row["max_agb_mg_ha"], row["slope_deg"], site_type, PROJECTION_YEARS
        )
        bau = project_bau_loss(
            row["current_agb_mg_ha"], row["agb_trend_mg_ha_yr"], PROJECTION_YEARS
        )

        # Convert AGB to CO2e for each year
        area = row["area_ha"]
        trajectories[pid] = {
            y: {
                "agb_mg_ha": agb_dict,
                "co2e_mg": {
                    k: round(calculate_co2e(calculate_carbon_stock(v * area)), 1)
                    for k, v in agb_dict.items()
                }
            }
            for y, agb_dict in traj.items()
        }
        bau_trajectories[pid] = {
            y: {
                "agb_mg_ha": agb,
                "co2e_mg": round(calculate_co2e(calculate_carbon_stock(agb * area)), 1)
            }
            for y, agb in bau.items()
        }

    # Summary totals
    total_area = cumulative_area
    total_cost = cumulative_cost

    # CO2e gain at year 20 vs BAU (using p50 expected case)
    co2e_gain_y20_gross = sum(
        trajectories[pid][20]["co2e_mg"]["p50"] - bau_trajectories[pid][20]["co2e_mg"]
        for pid in trajectories
    )
    
    # 20% Buffer Pool Deduction
    buffer_pool_deduction = co2e_gain_y20_gross * 0.20
    co2e_gain_y20 = co2e_gain_y20_gross - buffer_pool_deduction

    revenue_low  = co2e_gain_y20 * usd_per_tco2e * 0.7   # conservative
    revenue_high = co2e_gain_y20 * usd_per_tco2e * 1.3   # optimistic

    summary = {
        "total_parcels":    len(shortlist_df),
        "total_area_ha":    round(total_area, 2),
        "total_cost_usd":   round(total_cost, 2),
        "co2e_gain_y20_mg": round(co2e_gain_y20, 1),
        "revenue_low_usd":  round(revenue_low, 2),
        "revenue_high_usd": round(revenue_high, 2),
        "note": "NOTE: Indicative only - not a certified carbon valuation.",
    }

    return {
        "shortlist": shortlist_df,
        "summary": summary,
        "trajectories": trajectories,
        "bau_trajectories": bau_trajectories,
    }
