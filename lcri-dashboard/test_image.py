import json
from src.image_vision import generate_monitoring_images

# Let's load Nyarugenge boundary or a large polygon
with open('src/data/district.shp', 'rb') as f:
    pass # Wait, we don't have geojson easily accessible here.

import requests
# Or we can just call the local server API if it's running.
# Let's just create a dummy polygon with many vertices, or we can use the fetchDistrictBoundary api from server.py directly.

import ee
ee.Initialize()

from server import get_district_boundary

geom = get_district_boundary("Nyarugenge", "Rwanda")
print("Geometry type:", geom['type'])
print("Coordinates length:", len(geom['coordinates'][0][0]))

try:
    urls = generate_monitoring_images(geom, "2023-10")
    print(urls)
except Exception as e:
    import traceback
    traceback.print_exc()
