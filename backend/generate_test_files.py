"""
Generate proper 12-lead ECG test CSV files from PTB-XL data.
Each file: rows = samples, columns = 12 leads (Lead I, II, III, aVR, aVL, aVF, V1-V6)
"""
import wfdb
import numpy as np
import os
import pandas as pd

os.makedirs('../test_ecg_files', exist_ok=True)

# PTB-XL records with known diagnoses (from the database)
# These are confirmed records with clear single-label diagnoses
test_records = {
    # (record_path, true_label, description)
    'data/ptbxl/records100/00000/00001_lr': ('Normal',              'record_00001 - Healthy adult'),
    'data/ptbxl/records100/00000/00002_lr': ('Normal',              'record_00002 - Normal sinus rhythm'),
    'data/ptbxl/records100/00000/00003_lr': ('Normal',              'record_00003 - Normal ECG'),
    'data/ptbxl/records100/00000/00010_lr': ('Normal',              'record_00010 - Normal baseline'),
    'data/ptbxl/records100/00000/00050_lr': ('Normal',              'record_00050 - Normal ECG'),
}

print('Extracting 12-lead ECG test files from PTB-XL...\n')

for rec_path, (label, desc) in test_records.items():
    try:
        signal, fields = wfdb.rdsamp(rec_path)
        # signal shape: (n_samples, 12)
        n_samples, n_leads = signal.shape
        out_file = f'../test_ecg_files/ptbxl_{label.lower().replace(" ","_")}_{os.path.basename(rec_path)}.csv'

        # Save as 12-column CSV (rows=samples, cols=leads)
        np.savetxt(out_file, signal, delimiter=',', fmt='%.5f')
        print(f'[OK] {os.path.basename(out_file)}')
        print(f'     {desc} | {n_samples} samples x {n_leads} leads | fs={fields["fs"]}Hz')
        print(f'     Leads: {fields["sig_name"]}')
        print()
    except Exception as e:
        print(f'[FAIL] {rec_path}: {e}')

print('Done! Files saved to test_ecg_files/')
