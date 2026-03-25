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
        Run the full pipeline: preprocess → extract features / segment → predict.

        Returns:
            {
                "prediction": str,
                "confidence": float,
                "class_probabilities": dict,
                "model_used": str,
                "processing_time_ms": float,
            }
        """
        if model_name not in self.models:
            raise ValueError(f"Unknown model: {model_name}. Available: {list(self.models.keys())}")

        start = time.perf_counter()
        model = self.models[model_name]

        # Preprocess the signal
        clean_signal = preprocess_ecg(raw_signal, fs=fs)

        # Segment to fixed length
        segments = segment_signal(clean_signal)
        if not segments:
            raise ValueError("Signal too short to process.")

        # Use the first segment (main heartbeat window)
        segment = segments[0]

        # Route to appropriate prediction method
        if model_name in ["svm", "random_forest", "knn"]:
            # Classical models need hand-crafted features
            features = extract_features(segment, fs=fs)
            prediction, confidence, class_probs = model.predict(features)
        else:
            # Deep learning models work on raw signal segments
            prediction, confidence, class_probs = model.predict(segment)

        elapsed = (time.perf_counter() - start) * 1000.0

        return {
            "prediction": prediction,
            "confidence": round(confidence, 4),
            "class_probabilities": class_probs,
            "model_used": model_name,
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
