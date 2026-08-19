import sys
import json
import pandas as pd
sys.path.append('.')
from src.ledger import get_all_submissions
gdf = get_all_submissions()
if gdf.empty:
    print('empty')
for col in gdf.columns:
    if pd.api.types.is_datetime64_any_dtype(gdf[col]):
        gdf[col] = gdf[col].astype(str)
out = json.loads(gdf.to_json())
print(out.keys())
print('SUCCESS')
