# config.py - Constants and Configuration for LCRI Dashboard

# Coordinate Reference Systems
CRS_PROJECTED = "EPSG:32736"  # UTM 36S for accurate area/distance calculations in Rwanda
CRS_DISPLAY = "EPSG:4326"     # WGS84 for Folium maps and GeoJSON storage

# Carbon Conversion Factors
CARBON_FRACTION = 0.47        # IPCC default fraction: Biomass (Mg) * 0.47 = Carbon Stock (Mg)
CO2E_RATIO = 3.67             # 44/12 ratio: Carbon Stock (Mg) * 3.67 = CO2e (Mg)
ROOT_SHOOT_RATIO = 0.24       # IPCC default for tropical/subtropical forests (BGB = AGB * 0.24)

# Default Weights for LCRI
DEFAULT_WEIGHTS = {
    "carbon_potential": 0.35,
    "degradation_urgency": 0.25,
    "slope_feasibility": 0.20,
    "seed_proximity": 0.20
}

# Prices
DEFAULT_USD_PER_TCO2E = 10.0  # Default carbon offset price

# Rwanda Districts (Admin-2)
RWANDA_DISTRICTS = [
    "All Rwanda", "None",
    # Kigali City
    "Gasabo", "Kicukiro", "Nyarugenge",
    # Northern Province
    "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo",
    # Southern Province
    "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",
    # Eastern Province
    "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana",
    # Western Province
    "Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rutsiro", "Rusizi"
]

AFRICA_COUNTRIES = [
    "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
    "Cape Verde", "Cameroon", "Central African Republic", "Chad", "Comoros",
    "Congo", "Democratic Republic of the Congo", "Cote d'Ivoire", "Djibouti",
    "Egypt", "Equatorial Guinea", "Eritrea", "Ethiopia", "Gabon",
    "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia",
    "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco",
    "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe",
    "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan",
    "Sudan", "Swaziland", "Togo", "Tunisia", "Uganda", "United Republic of Tanzania",
    "Zambia", "Zimbabwe"
]

