import numpy as np
from ml.model_registry import model_registry

files = [
    ('real_100.csv', 'MIT-BIH 100 - Normal sinus rhythm'),
    ('real_101.csv', 'MIT-BIH 101 - Normal'),
    ('real_102.csv', 'MIT-BIH 102 - Bundle branch block'),
    ('real_104.csv', 'MIT-BIH 104 - Paced rhythm'),
    ('real_105.csv', 'MIT-BIH 105 - ST changes'),
]

for fname, label in files:
    sig = np.loadtxt(f'../test_ecg_files/{fname}')
    result = model_registry.predict('cnn', sig)
    pred = result['prediction']
    conf = round(result['confidence'] * 100)
    print(f'{label}')
    print(f'  => Predicted: {pred} ({conf}% confidence)')
    print()
