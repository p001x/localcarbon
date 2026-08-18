import config

def calculate_carbon_stock(agb_mg):
    """
    Calculates total carbon stock (Mg) from Above Ground Biomass (Mg),
    incorporating Below Ground Biomass (Roots) using IPCC root-to-shoot ratio.
    """
    bgb_mg = agb_mg * config.ROOT_SHOOT_RATIO
    total_biomass_mg = agb_mg + bgb_mg
    return total_biomass_mg * config.CARBON_FRACTION

def calculate_co2e(carbon_stock_mg):
    """
    Calculates CO2 equivalent (Mg) from Carbon Stock (Mg).
    Formula: Carbon Stock (Mg) * CO2E_RATIO
    """
    return carbon_stock_mg * config.CO2E_RATIO

def calculate_sequestration_rate(co2e_year1, co2e_year2, year1, year2):
    """
    Calculates the annual sequestration rate.
    Formula: (CO2e_year2 - CO2e_year1) / (year2 - year1)
    """
    if year1 == year2:
        return 0.0
    return (co2e_year2 - co2e_year1) / (year2 - year1)

def process_zonal_stats_for_carbon(zonal_stats_dict):
    """
    Enriches the zonal stats dictionary with carbon calculations (AGB + BGB).
    """
    enriched_stats = {}
    for year, stats in zonal_stats_dict.items():
        agb_mg = stats['mean_agb_mg_ha'] * stats['area_ha']
        bgb_mg = agb_mg * config.ROOT_SHOOT_RATIO
        total_biomass_mg = agb_mg + bgb_mg
        carbon_stock = total_biomass_mg * config.CARBON_FRACTION
        co2e = calculate_co2e(carbon_stock)
        
        enriched_stats[year] = {
            **stats,
            "total_agb_mg": round(agb_mg, 2),
            "total_bgb_mg": round(bgb_mg, 2),
            "total_biomass_mg": round(total_biomass_mg, 2),
            "carbon_stock_mg": round(carbon_stock, 2),
            "co2e_mg": round(co2e, 2)
        }
    return enriched_stats
