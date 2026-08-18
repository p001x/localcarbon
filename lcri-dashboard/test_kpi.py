import requests
import json

geom = {
  "type": "Polygon",
  "coordinates": [
    [
      [30.0, -1.6],
      [30.1, -1.6],
      [30.1, -1.7],
      [30.0, -1.7],
      [30.0, -1.6]
    ]
  ]
}

try:
    res = requests.post("http://localhost:5000/api/kpis", json={"geometry": geom})
    print(f"Status: {res.status_code}")
    print(res.text)
except Exception as e:
    print(f"Error: {e}")
