import json
from shapely.geometry import shape, mapping

def get_normalized_geom_str(geojson_geom):
    """
    Normalizes a GeoJSON geometry by rounding coordinates to 5 decimal places (~1m precision).
    This ensures that floating point precision differences do not cause cache misses.
    """
    geom = shape(geojson_geom)
    geom_dict = mapping(geom)
    
    def round_coords(coords):
        if isinstance(coords, (list, tuple)):
            if len(coords) > 0 and isinstance(coords[0], (int, float)):
                return [round(c, 5) for c in coords]
            else:
                return [round_coords(c) for c in coords]
        return coords
        
    geom_dict['coordinates'] = round_coords(geom_dict['coordinates'])
    return json.dumps(geom_dict, sort_keys=True)
