"""
Model Registry
================
Central registry that initializes all ML models at startup and provides
a unified inference interface. Supports switching between models by name.
"""

from __future__ import annotations

import time
from typing import Any, Optional

import numpy as np

from config import settings
from ml.preprocessing import preprocess_ecg, segment_signal
from ml.feature_engineering import extract_features
from ml.models.classical import ClassicalModel
from ml.models.cnn_model import CNNModel
from ml.models.lstm_model import LSTMModel
from ml.models.hybrid_model import HybridModel


class ModelRegistry:
    """
    Loads and manages all available ML models.
    Provides a single `predict()` method that routes to the right model.
    """

    def __init__(self):
        self.models: dict[str, Any] = {}
        self.model_info: dict[str, dict[str, str]] = {}
        self._initialize_models()

    def _initialize_models(self):
        """Initialize all models. Tries to load saved weights."""
        # Classical models
        for name in ["svm", "random_forest", "knn"]:
            model = ClassicalModel(name)
            model.load()  # Attempt to load from disk
            self.models[name] = model
            display_names = {
                "svm": "Support Vector Machine",
                "random_forest": "Random Forest",
                "knn": "K-Nearest Neighbors",
            }
            self.model_info[name] = {
                "display_name": display_names[name],
                "type": "classical",
                "description": f"{display_names[name]} classifier using hand-crafted ECG features.",
            }

        # Deep learning models
        cnn = CNNModel()
        cnn.load()
        self.models["cnn"] = cnn
        self.model_info["cnn"] = {
            "display_name": "1D CNN",
            "type": "deep_learning",
            "description": "1D Convolutional Neural Network for automatic feature extraction from raw ECG signals.",
        }

        lstm = LSTMModel()
        lstm.load()
        self.models["lstm"] = lstm
        self.model_info["lstm"] = {
            "display_name": "BiLSTM",
            "type": "deep_learning",
            "description": "Bidirectional LSTM for capturing temporal dependencies in ECG time-series.",
        }

        hybrid = HybridModel()
        hybrid.load()
        self.models["hybrid_cnn_lstm"] = hybrid
        self.model_info["hybrid_cnn_lstm"] = {
            "display_name": "CNN + LSTM (Hybrid)",
            "type": "deep_learning",
            "description": "Hybrid CNN+LSTM combining local feature extraction with temporal modeling. Recommended model.",
        }

    def predict(
        self,
        model_name: str,
        raw_signal: np.ndarray,
        fs: Optional[int] = None,
    ) -> dict:
        """
        Inference with sliding window aggregation for better robustness.
        """
        if model_name not in self.models:
            raise ValueError(f"Unknown model: {model_name}")

        start = time.perf_counter()
        model = self.models[model_name]

        # ── Detect and decode multi-lead sentinel encoding ────────────────
        # _parse_ecg_file encodes multi-column CSVs as [-999.0, n_cols, data...]
        if len(raw_signal) > 2 and raw_signal[0] == -999.0:
            n_cols = int(raw_signal[1])
            data = raw_signal[2:]
            n_samples = len(data) // n_cols
            # Reshape to (n_samples, n_cols) then transpose to (n_cols, n_samples)
            matrix = np.array(data[: n_samples * n_cols]).reshape(n_samples, n_cols).T
            raw_signal = matrix  # shape: (leads, samples)

        # Use the upgraded preprocessing (handles 12-lead)

        # Note: preprocess_and_segment returns a list of segments
        from ml.preprocessing import preprocess_and_segment
        segments = preprocess_and_segment(raw_signal, fs=fs)
        
        if not segments:
            raise ValueError("Signal too short.")

        # Aggregate predictions across segments
        all_probs = []
        all_reliabilities = []
        for segment in segments:
            if model_name in ["svm", "random_forest", "knn"]:
                features = extract_features(segment, fs=fs)
                _, _, class_probs, reliability = model.predict(features)
            else:
                _, _, class_probs, reliability = model.predict(segment)
            all_probs.append(list(class_probs.values()))
            all_reliabilities.append(reliability)

        # Soft voting (mean probability per class)
        mean_probs = np.mean(all_probs, axis=0)
        idx = int(np.argmax(mean_probs))
        prediction = settings.ECG_CLASSES[idx]
        confidence = float(mean_probs[idx])
        
        # Aggregate reliability
        mean_reliability = float(np.mean(all_reliabilities))
        is_reliable = mean_reliability > 0.7  # Threshold for clinical reliability
        
        final_probs = {c: round(float(p), 4) for c, p in zip(settings.ECG_CLASSES, mean_probs)}
        elapsed = (time.perf_counter() - start) * 1000.0

        return {
            "prediction": prediction,
            "confidence": round(confidence, 4),
            "class_probabilities": final_probs,
            "reliability_score": round(mean_reliability, 4),
            "is_reliable": is_reliable,
            "model_used": model_name,
            "total_segments": len(segments),
            "processing_time_ms": round(elapsed, 2),
        }

    def list_models(self) -> list[dict]:
        """Return list of available models with their info."""
        return [
            {"name": name, **info}
            for name, info in self.model_info.items()
        ]

    def get_model(self, name: str) -> Any:
        """Get a model instance by name."""
        return self.models.get(name)


# Singleton instance
model_registry = ModelRegistry()
