"""
Training Pipeline for DeepGuard-AI
==================================
1. Downloads PTB-XL dataset if not present.
2. Maps PTB-XL hierarchical labels to 6 target classes.
3. Implements 12-lead data loading and preprocessing.
4. Trains an advanced CNN model with Residual Blocks and Attention.
"""

import os
import sys
import shutil
from pathlib import Path

# Add the backend root to sys.path to allow importing from 'config', 'database', etc.
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.append(str(backend_root))

import pandas as pd
import numpy as np
import wfdb
import torch
from torch.utils.data import Dataset, DataLoader
import ast
from tqdm import tqdm

from config import settings
from ml.preprocessing import preprocess_ecg, resample_signal
from ml.models.cnn_model import CNNModel

# Define paths (relative to backend root)
DATA_DIR = Path("data/ptbxl")
METADATA_FILE = DATA_DIR / "ptbxl_database.csv"
SCP_FILE = DATA_DIR / "scp_statements.csv"
MITBIH_DIR = Path("data/mitdb")

def generate_synthetic_data(num_samples=100):
    """Generate mock PTB-XL metadata and signals for quick testing."""
    print(f"Generating {num_samples} synthetic ECG samples for fast-track testing...")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create mock metadata CSV
    df = pd.DataFrame({
        'ecg_id': range(1, num_samples + 1),
        'filename_lr': [f"records100/tiny_{i:05d}" for i in range(1, num_samples + 1)],
        'scp_codes': ["{'NORM': 100}" for _ in range(num_samples)],
        'strat_fold': np.random.randint(1, 11, num_samples)
    })
    df.set_index('ecg_id', inplace=True)
    df.to_csv(METADATA_FILE)
    
    # Create mock SCP statements
    scp_df = pd.DataFrame({
        'diagnostic': [1],
        'diagnostic_class': ['NORM']
    }, index=['NORM'])
    scp_df.to_csv(SCP_FILE)
    
    # Create mock signal files (wfdb format)
    records_dir = DATA_DIR / "records100"
    records_dir.mkdir(exist_ok=True)
    for i in range(1, num_samples + 1):
        file_name = f"tiny_{i:05d}"
        signal = np.random.normal(0, 1, (1000, 12))
        wfdb.wrsamp(str(records_dir / file_name), fs=100, units=['mV']*12, 
                    sig_name=[f'Lead {j}' for j in range(12)], p_signal=signal, fmt=['16']*12)
    
    print("Synthetic dataset ready.")

def download_ptbxl(fast_mode=False):
    """Download PTB-XL dataset using curl and Python zipfile (cross-platform)."""
    if not METADATA_FILE.exists():
        if fast_mode:
            generate_synthetic_data()
            return

        print("Downloading PTB-XL dataset (approx. 2GB)...")
        DATA_DIR.mkdir(parents=True, exist_ok=True)

        url = "https://physionet.org/content/ptb-xl/get-zip/1.0.3/"
        zip_path = DATA_DIR / "ptbxl.zip"

        import subprocess
        import zipfile
        try:
            # Download (curl with resume support)
            if not zip_path.exists():
                print(f"Fetching from {url}...")
                subprocess.run(["curl", "-L", "-C", "-", "-o", str(zip_path), url], check=True)
            else:
                print(f"ZIP already present at {zip_path}, skipping download.")

            print("Extracting dataset (this may take a few minutes)...")
            # Use Python's built-in zipfile — works on Windows, Mac, Linux
            with zipfile.ZipFile(str(zip_path), "r") as zf:
                zf.extractall(str(DATA_DIR))

            # The zip usually extracts into a long subfolder name starting with 'ptb-xl'
            # Move its contents up one level into DATA_DIR
            extracted_dirs = [d for d in DATA_DIR.iterdir() if d.is_dir() and d.name.startswith("ptb-xl")]
            if extracted_dirs:
                source_dir = extracted_dirs[0]
                for item in source_dir.iterdir():
                    target = DATA_DIR / item.name
                    if target.exists():
                        if target.is_dir():
                            shutil.rmtree(target)
                        else:
                            target.unlink()
                    shutil.move(str(item), str(DATA_DIR / item.name))
                source_dir.rmdir()

            zip_path.unlink()
            print("Dataset ready.")
        except Exception as e:
            print(f"Error during download/extraction: {e}")
            # Keep the zip file to allow resume on next run
    else:
        print("PTB-XL dataset already present.")

def load_dataset():
    """Load and prepare PTB-XL metadata and labels."""
    df = pd.read_csv(METADATA_FILE, index_col='ecg_id')
    df.scp_codes = df.scp_codes.apply(lambda x: ast.literal_eval(x))
    
    agg_df = pd.read_csv(SCP_FILE, index_col=0)
    agg_df = agg_df[agg_df.diagnostic == 1]
    
    def aggregate_diagnostic(y_dic):
        tmp = []
        for key in y_dic.keys():
            if key in agg_df.index:
                tmp.append(agg_df.loc[key].diagnostic_class)
        return list(set(tmp))
    
    df['diagnostic_superclass'] = df.scp_codes.apply(aggregate_diagnostic)
    return df

class PTBXLDataset(Dataset):
    def __init__(self, df, base_path, sampling_rate=100, transform=None):
        self.df = df
        self.base_path = base_path
        self.sampling_rate = sampling_rate
        self.transform = transform
        
        # Filter for the 6 target classes
        # Mapping: 
        # NORM -> Normal
        # MI -> Myocardial Infarction
        # CD -> Arrhythmia
        # AFIB (from scp_codes) -> Atrial Fibrillation
        # Brady/Tachy from scp_codes
        
    def __len__(self):
        return len(self.df)
    
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        file_path = str(self.base_path / (row.filename_lr if self.sampling_rate == 100 else row.filename_hr))
        
        # Load 12-lead signal
        try:
            signal, _ = wfdb.rdsamp(file_path)
            signal = signal.T # (12, samples)
        except Exception:
            # Fallback for missing/corrupt files
            signal = np.zeros((12, 1000 if self.sampling_rate == 100 else 5000))

        # Ensure fixed length
        target_len = 1000 if self.sampling_rate == 100 else 5000
        if signal.shape[1] < target_len:
            pad = np.zeros((12, target_len - signal.shape[1]))
            signal = np.concatenate([signal, pad], axis=1)
        else:
            signal = signal[:, :target_len]
            
        # Preprocess
        signal = preprocess_ecg(signal, fs=self.sampling_rate)
        
        # Get label (hierarchy mapping)
        labels = row.diagnostic_superclass
        target_label = "Normal"
        if "NORM" in labels: target_label = "Normal"
        elif "MI" in labels: target_label = "Myocardial Infarction"
        elif "CD" in labels: target_label = "Arrhythmia"
        
        # Specific rhythm checks
        if "AFIB" in row.scp_codes: target_label = "Atrial Fibrillation"
        if "SBRAD" in row.scp_codes: target_label = "Bradycardia"
        if "STACH" in row.scp_codes: target_label = "Tachycardia"
            
        label_idx = settings.ECG_CLASSES.index(target_label)
        
        # Data Augmentation (Simple Gaussian Noise & Scaling)
        if self.transform:
            signal = signal + np.random.normal(0, 0.01, signal.shape)
            signal = signal * np.random.uniform(0.9, 1.1)
            
        return torch.tensor(signal, dtype=torch.float32), torch.tensor(label_idx, dtype=torch.long)

class MITBIHDataset(Dataset):
    """MIT-BIH Arrhythmia Database dataset loader."""
    def __init__(self, data_dir, segment_length=1000, target_fs=100, transform=None):
        self.data_dir = Path(data_dir)
        self.segment_length = segment_length
        self.target_fs = target_fs
        self.transform = transform
        self.samples = [] # (record_name, start_sample, label_idx)
        
        # Check if records file exists
        records_file = self.data_dir / "RECORDS"
        if records_file.exists():
            with open(records_file, 'r') as f:
                record_names = [line.strip() for line in f if line.strip()]
        else:
            # Fallback to listing .hea files
            record_names = [f.stem for f in self.data_dir.glob("*.hea")]
            
        print(f"Loading MIT-BIH records from {self.data_dir}...")
        for r_name in record_names:
            try:
                # Load annotations
                ann = wfdb.rdann(str(self.data_dir / r_name), 'atr')
                # Use a subset of annotations to avoid excessive overlap
                for i, (sample, symbol) in enumerate(zip(ann.sample, ann.symbol)):
                    label_idx = self._map_symbol(symbol)
                    if label_idx is not None:
                        # Create segment centered at the beat (approx. 2.7s window at 360Hz)
                        # We need segment_length samples at target_fs
                        # So we need segment_length * (360 / target_fs) samples at 360Hz
                        num_orig_samples = int(self.segment_length * 360 / self.target_fs)
                        start = max(0, sample - num_orig_samples // 2)
                        self.samples.append((r_name, start, label_idx))
            except Exception as e:
                print(f"Warning: Could not load record {r_name}: {e}")
        
        print(f"MIT-BIH loaded: {len(self.samples)} samples found.")

    def _map_symbol(self, symbol):
        """Map MIT-BIH symbols to 6 target classes."""
        # Normal
        if symbol in ['N', 'L', 'R', 'e', 'j']: return settings.ECG_CLASSES.index("Normal")
        # Atrial Fibrillation / Atrial Premature Beats
        if symbol in ['A', 'a', 'J', 'S']: return settings.ECG_CLASSES.index("Atrial Fibrillation")
        # Ventricular / Fusion / Flutter / Fibrillation (Arrhythmia)
        if symbol in ['V', 'E', 'F', '!', '[', ']', 'x', '(', ')', 'p', 't', 'u', '`', '\'', '^', '|', '~', '+', 's', 'T', '*', 'D', '=', '"', '@']: 
            return settings.ECG_CLASSES.index("Arrhythmia")
        return None

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        r_name, start, label_idx = self.samples[idx]
        num_orig_samples = int(self.segment_length * 360 / self.target_fs)
        
        # Load 2-lead signal
        try:
            signal, _ = wfdb.rdsamp(str(self.data_dir / r_name), sampfrom=start, sampto=start + num_orig_samples)
            signal = signal.T # (2, samples)
        except Exception:
            signal = np.zeros((2, num_orig_samples))

        # Resample to target_fs
        signal = resample_signal(signal, 360, self.target_fs)
        
        # Fixed length padding
        if signal.shape[1] < self.segment_length:
            pad = np.zeros((2, self.segment_length - signal.shape[1]))
            signal = np.concatenate([signal, pad], axis=1)
        else:
            signal = signal[:, :self.segment_length]
            
        # Broadcast 2 leads to 12 leads for model compatibility
        full_signal = np.zeros((12, self.segment_length))
        for i in range(12):
            full_signal[i] = signal[i % 2]
            
        # Preprocess
        full_signal = preprocess_ecg(full_signal, fs=self.target_fs)
        
        # Augmentation
        if self.transform:
            full_signal = full_signal + np.random.normal(0, 0.01, full_signal.shape)
            full_signal = full_signal * np.random.uniform(0.9, 1.1)
            
        return torch.tensor(full_signal, dtype=torch.float32), torch.tensor(label_idx, dtype=torch.long)

def train(epochs=100, batch_size=64, lr=0.001, use_mitbih=False):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on {device}")
    
    # PTB-XL
    df = load_dataset()
    train_df = df[df.strat_fold <= 8]
    val_df = df[df.strat_fold == 9]
    
    train_ds = [PTBXLDataset(train_df, DATA_DIR, transform=True)]
    val_ds = [PTBXLDataset(val_df, DATA_DIR, transform=False)]
    
    # MIT-BIH (Optional)
    if use_mitbih and MITBIH_DIR.exists():
        mit_ds = MITBIHDataset(MITBIH_DIR, transform=True)
        # Split MIT-BIH 80/20
        mit_len = len(mit_ds)
        mit_train_len = int(0.8 * mit_len)
        mit_val_len = mit_len - mit_train_len
        mit_train, mit_val = torch.utils.data.random_split(mit_ds, [mit_train_len, mit_val_len])
        train_ds.append(mit_train)
        val_ds.append(mit_val)
    
    # Combine datasets
    full_train_ds = torch.utils.data.ConcatDataset(train_ds)
    full_val_ds = torch.utils.data.ConcatDataset(val_ds)
    
    train_loader = DataLoader(full_train_ds, batch_size=batch_size, shuffle=True, num_workers=2 if os.name != 'nt' else 0)
    val_loader = DataLoader(full_val_ds, batch_size=batch_size, shuffle=False)
    
    print(f"Dataset sizes: Train={len(full_train_ds)}, Val={len(full_val_ds)}")
    
    model_wrapper = CNNModel()
    model = model_wrapper.model
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = torch.nn.CrossEntropyLoss()
    
    best_acc = 0.0
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        for signals, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs}"):
            signals, labels = signals.to(device), labels.to(device)
            
            optimizer.zero_grad()
            logits, _ = model(signals)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            
        # Validation
        model.eval()
        val_correct = 0
        with torch.no_grad():
            for signals, labels in val_loader:
                signals, labels = signals.to(device), labels.to(device)
                logits, _ = model(signals)
                preds = torch.argmax(logits, dim=1)
                val_correct += (preds == labels).sum().item()
        
        val_acc = val_correct / len(full_val_ds)
        print(f"Epoch {epoch+1}: Loss={train_loss/len(train_loader):.4f}, Val Acc={val_acc:.4f}")
        
        if val_acc > best_acc:
            best_acc = val_acc
            model_wrapper.save()
            print(f"Model saved with Accuracy: {val_acc:.4f}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--fast", action="store_true", help="Run in fast mode with synthetic data")
    parser.add_argument("--mitbih", action="store_true", help="Include MIT-BIH dataset for training")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch-size", type=int, default=64)
    args = parser.parse_args()

    download_ptbxl(fast_mode=args.fast)
    if METADATA_FILE.exists():
        train(epochs=args.epochs, use_mitbih=args.mitbih)
    else:
        print("Training skipped: PTB-XL metadata not found.")
