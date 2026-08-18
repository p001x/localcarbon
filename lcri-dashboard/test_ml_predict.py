import json
from src.ml_predictor import extract_ml_features_for_polygon, predict_growth
from src.data_sources import init_ee

init_ee()

geom = {
  "type": "Polygon",
  "coordinates": [
    [
      [30.0, -2.0],
      [30.1, -2.0],
      [30.1, -1.9],
      [30.0, -1.9],
      [30.0, -2.0]
    ]
  ]
}

print("Extracting features...")
features = extract_ml_features_for_polygon(geom)
print(features)
print("Predicting...")
pred = predict_growth(features)
print(pred)
