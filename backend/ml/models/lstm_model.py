"""
LSTM Model for ECG Classification
====================================
Bidirectional LSTM model that captures temporal dependencies in ECG signals.
The LSTM learns sequential patterns (rhythm, RR intervals) that are critical
for distinguishing cardiac conditions.

Architecture:
  Input (batch, seq_len, 1) → BiLSTM(2 layers) → Dropout → Dense → Softmax
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional, Tuple, Dict

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from config import settings


class ECG_LSTM(nn.Module):
    """Bidirectional LSTM for ECG time-series classification."""

    def __init__(
        self,
        input_size: int = 1,
        hidden_size: int = 128,
        num_layers: int = 2,
        num_classes: int = 6,
        dropout: float = 0.3,
    ):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_size * 2, num_classes)  # *2 for bidirectional

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch, seq_len, 1)
        lstm_out, _ = self.lstm(x)  # (batch, seq_len, hidden*2)
        # Take last time step output
        last_output = lstm_out[:, -1, :]  # (batch, hidden*2)
        out = self.dropout(last_output)
        out = self.fc(out)
        return out


class LSTMModel:
    """Wrapper around ECG_LSTM providing a unified predict/load/save interface."""

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.num_classes = len(settings.ECG_CLASSES)
        self.model = ECG_LSTM(num_classes=self.num_classes).to(self.device)
        self.model.eval()
        self.classes = settings.ECG_CLASSES
        self.is_loaded = False

    def predict(self, signal: np.ndarray) -> tuple[str, float, dict[str, float]]:
        """
        Predict from a preprocessed ECG segment.
        signal shape: (segment_length,)
        """
        if not self.is_loaded:
            return self._simulate_prediction()

        tensor = (
            torch.tensor(signal, dtype=torch.float32)
            .unsqueeze(0)  # batch dim
            .unsqueeze(-1)  # feature dim
            .to(self.device)
        )
        with torch.no_grad():
            logits = self.model(tensor)
            probs = F.softmax(logits, dim=1)[0].cpu().numpy()

        idx = int(np.argmax(probs))
        class_probs = {c: round(float(p), 4) for c, p in zip(self.classes, probs)}
        return self.classes[idx], float(probs[idx]), class_probs

    def save(self, path: Optional[str] = None) -> str:
        if path is None:
            path = str(Path(settings.MODEL_WEIGHTS_DIR) / "lstm.pt")
        torch.save(self.model.state_dict(), path)
        return path

    def load(self, path: Optional[str] = None) -> bool:
        if path is None:
            path = str(Path(settings.MODEL_WEIGHTS_DIR) / "lstm.pt")
        try:
            self.model.load_state_dict(torch.load(path, map_location=self.device, weights_only=True))
            self.model.eval()
            self.is_loaded = True
            return True
        except FileNotFoundError:
            return False

    def _simulate_prediction(self) -> tuple[str, float, dict[str, float]]:
        rng = np.random.default_rng()
        proba = rng.dirichlet(np.ones(self.num_classes) * 0.4)
        dominant = rng.integers(0, self.num_classes)
        proba[dominant] += 0.35
        proba /= proba.sum()
        idx = int(np.argmax(proba))
        class_probs = {c: round(float(p), 4) for c, p in zip(self.classes, proba)}
        return self.classes[idx], float(proba[idx]), class_probs
