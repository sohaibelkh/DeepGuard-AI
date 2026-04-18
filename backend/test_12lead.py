import numpy as np
import json
from ml.model_registry import model_registry

SENTINEL = -999.0

def parse_csv(path):
    with open(path) as f:
        content = f.read()
    rows = []
    for line in content.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parts = [float(x) for x in line.split(',') if x.strip()]
        if parts:
            rows.append(parts)

    col_counts = set(len(r) for r in rows)
    n_cols = len(rows[0])
    if len(col_counts) == 1 and n_cols > 1:
        flat = [SENTINEL, float(n_cols)]
        for row in rows:
            flat.extend(row)
        return flat
    return [v for row in rows for v in row]

files = [
    'ptbxl_normal_00001_lr.csv',
    'ptbxl_normal_00002_lr.csv',
    'ptbxl_normal_00003_lr.csv',
]

print('Running end-to-end predictions on 12-lead PTB-XL test files:\n')
for fname in files:
    values = parse_csv(f'../test_ecg_files/{fname}')
    signal = np.array(values)
    result = model_registry.predict('cnn', signal)
    print(f'{fname}')
    print(f'  Prediction  : {result["prediction"]}')
    print(f'  Confidence  : {round(result["confidence"]*100, 1)}%')
    print(f'  Reliability : {round(result["reliability_score"]*100, 1)}%')
    print(f'  Segments    : {result["total_segments"]}')
    print()
