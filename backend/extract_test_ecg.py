import wfdb
import numpy as np
import os

os.makedirs('../test_ecg_files', exist_ok=True)
mitdb = 'data/mitdb'

records = sorted([f.replace('.hea','') for f in os.listdir(mitdb) if f.endswith('.hea')])
print('Found records:', records)

for rec in records[:6]:
    try:
        signal, fields = wfdb.rdsamp(f'{mitdb}/{rec}', sampto=3600)
        lead = signal[:, 0]
        out = f'../test_ecg_files/real_{rec}.csv'
        np.savetxt(out, lead, fmt='%.5f')
        print(f'  real_{rec}.csv  =>  {len(lead)} samples, fs={fields["fs"]}Hz')
    except Exception as e:
        print(f'  {rec} failed: {e}')

print('Done.')
