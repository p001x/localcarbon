import pandas as pd
from scipy.spatial import cKDTree

try:
    _training_data = pd.read_csv('data/ml_training_data.csv')
    _training_data = _training_data.dropna(subset=['lat', 'lon'])
    _kdtree = cKDTree(_training_data[['lat', 'lon']].values)
    
    lat = -5.6
    lng = -65.6
    dist, idx = _kdtree.query([[lat, lng]])
    nearest = _training_data.iloc[idx[0]]
    
    print("Nearest:", nearest['baseline_agb'])
except Exception as e:
    import traceback
    traceback.print_exc()
