import numpy as np

def calculate_yoy_difference(zonal_stats_dict):
    """
    Computes year-over-year differences in AGB.
    Takes the output of the zonal stats engine.
    """
    years = sorted([int(y) for y in zonal_stats_dict.keys()])
    differences = {}
    
    for i in range(1, len(years)):
        prev_year = str(years[i-1])
        curr_year = str(years[i])
        
        diff = zonal_stats_dict[curr_year]['mean_agb_mg_ha'] - zonal_stats_dict[prev_year]['mean_agb_mg_ha']
        differences[f"{prev_year}-{curr_year}"] = round(diff, 2)
        
    return differences

def calculate_trend(zonal_stats_dict):
    """
    Calculates the linear regression trend slope for AGB across the epochs.
    A negative slope indicates degradation, and a positive slope indicates growth.
    """
    years = sorted([int(y) for y in zonal_stats_dict.keys()])
    agb_values = [zonal_stats_dict[str(y)]['mean_agb_mg_ha'] for y in years]
    
    if len(years) < 2:
        return 0.0
        
    # polyfit(x, y, 1) returns [slope, intercept]
    slope, intercept = np.polyfit(years, agb_values, 1)
    
    return round(slope, 4)
