"""
Training Pipeline for DeepGuard-AI
==================================
1. Downloads PTB-XL dataset if not present.
2. Maps PTB-XL hierarchical labels to 6 target classes.
3. Implements 12-lead data loading and preprocessing.
4. Trains an advanced CNN model with Residual Blocks and Attention.
"""

import os
import shutil
from pathlib import Path
import pandas as pd
import numpy as np
import wfdb
import torch
from torch.utils.data import Dataset, DataLoader
import ast
from tqdm import tqdm

from config import settings
from ml.preprocessing import preprocess_ecg
from ml.models.cnn_model import CNNModel

# Define paths (relative to backend root)
DATA_DIR = Path("data/ptbxl")
METADATA_FILE = DATA_DIR / "ptbxl_database.csv"
SCP_FILE = DATA_DIR / "scp_statements.csv"

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

def train(epochs=50, batch_size=32, lr=0.001):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on {device}")
    
    # Load metadata
    df = load_dataset()
    
    # Split (Standard PTB-XL split: 1-8 train, 9 val, 10 test)
    train_df = df[df.strat_fold <= 8]
    val_df = df[df.strat_fold == 9]
    
    train_ds = PTBXLDataset(train_df, DATA_DIR, transform=True)
    val_ds = PTBXLDataset(val_df, DATA_DIR, transform=False)
    
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    
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
        
        val_acc = val_correct / len(val_ds)
        print(f"Epoch {epoch+1}: Loss={train_loss/len(train_loader):.4f}, Val Acc={val_acc:.4f}")
        
        if val_acc > best_acc:
            best_acc = val_acc
            model_wrapper.save()
            print("Model saved.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--fast", action="store_true", help="Run in fast mode with synthetic data")
    args = parser.parse_args()

    download_ptbxl(fast_mode=args.fast)
    if METADATA_FILE.exists():
        epochs = 2 if args.fast else 10
        train(epochs=epochs)
    else:
        print("Dataset missing. Run download logic first.")
