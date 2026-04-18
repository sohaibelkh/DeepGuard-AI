import os
import numpy as np
import wfdb
from ml.models.cnn_model import CNNModel
from ml.preprocessing import preprocess_and_segment, resample_signal

# تهيئة النموذج
model = CNNModel()

# مسار مجلد MIT-BIH
mitdb_path = "data/mitdb"

# جلب جميع ملفات .dat (كل سجل)
dat_files = [f for f in os.listdir(mitdb_path) if f.endswith(".dat")]

for dat_file in dat_files:
    record_name = os.path.splitext(dat_file)[0]  # بدون الامتداد
    dat_path = os.path.join(mitdb_path, record_name)
    
    try:
        # قراءة السجل والإشارات
        record = wfdb.rdrecord(dat_path)
        signals = record.p_signal.T  # تحويل إلى شكل (leads, length)
        
        # Resample to 100Hz (the frequency the CNN was trained on)
        signals = resample_signal(signals, current_fs=record.fs, target_fs=100)
        
        # Preprocess signature and break down into CNN-sized chunks
        segments = preprocess_and_segment(signals, fs=100)
        # Grab only the very first chunk (1000 length) as our test window
        first_segment = segments[0] if segments else signals
        
        print(f"Record: {record_name}")
        print(f"Original shape: {signals.shape}")
        print(f"Input shape fed: {first_segment.shape}")
        print(f"Min value: {np.min(first_segment):.4f}, Max value: {np.max(first_segment):.4f}")
        
        # تطبيق النموذج
        prediction, confidence, probs, reliability = model.predict(first_segment)
        
        print("Prediction:", prediction)
        print("Confidence:", confidence)
        print("Reliability:", reliability)
        print("Class probabilities:")
        for cls_name, p_val in probs.items():
            print(f"  - {cls_name}: {p_val:.4f}")
        print("-" * 50)
        
    except Exception as e:
        print(f"Erreur pour le fichier {record_name}: {e}")