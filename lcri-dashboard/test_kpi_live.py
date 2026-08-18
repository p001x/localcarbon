import urllib.request
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

req = urllib.request.Request("https://localcarbon.onrender.com/api/kpis", method="POST")
req.add_header("Content-Type", "application/json")
data = json.dumps({"geometry": geom}).encode("utf-8")

try:
    with urllib.request.urlopen(req, data=data) as f:
        print(f"Status: {f.status}")
        print(f.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
