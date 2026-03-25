"""
ECG Signal Preprocessing Module
================================
Provides functions for cleaning and preparing raw ECG signals:
  1. Bandpass filtering (0.5–40 Hz) to remove baseline wander and high-freq noise
  2. Baseline wander removal via median filtering
  3. Z-score normalization
  4. Fixed-length segmentation
"""

from __future__ import annotations

from typing import Optional, List
import numpy as np
from scipy import signal as sp_signal

from config import settings


def bandpass_filter(
    ecg_signal: np.ndarray,
    lowcut: float = 0.5,
    highcut: float = 40.0,
    fs: Optional[int] = None,
    order: int = 4,
) -> np.ndarray:
    """
    Apply a Butterworth bandpass filter to remove noise outside the
    clinical ECG frequency range.
    """
    fs = fs or settings.ECG_SAMPLE_RATE
    nyquist = 0.5 * fs
    low = lowcut / nyquist
    high = highcut / nyquist
    # Clamp to valid Butterworth range
    low = max(low, 0.001)
    high = min(high, 0.999)
    b, a = sp_signal.butter(order, [low, high], btype="band")
    filtered = sp_signal.filtfilt(b, a, ecg_signal, padlen=min(3 * max(len(b), len(a)), len(ecg_signal) - 1))
    return filtered.astype(np.float32)


def remove_baseline_wander(ecg_signal: np.ndarray, window_size: int = 201) -> np.ndarray:
    """
    Remove baseline drift using a median filter.
    The window_size should be odd and roughly span one cardiac cycle.
    """
    if window_size % 2 == 0:
        window_size += 1
    # Two-pass median filter for robust baseline estimation
    baseline = sp_signal.medfilt(ecg_signal, kernel_size=window_size)
    baseline = sp_signal.medfilt(baseline, kernel_size=window_size)
    return (ecg_signal - baseline).astype(np.float32)


def normalize(ecg_signal: np.ndarray) -> np.ndarray:
    """Z-score normalization (zero mean, unit variance)."""
    mean = np.mean(ecg_signal)
    std = np.std(ecg_signal)
    if std < 1e-8:
        return ecg_signal - mean
    return ((ecg_signal - mean) / std).astype(np.float32)


def segment_signal(
    ecg_signal: np.ndarray,
    segment_length: Optional[int] = None,
    overlap: int = 0,
) -> list[np.ndarray]:
    """
    Split a long ECG signal into fixed-length segments.
    Segments shorter than `segment_length` are zero-padded.
    """
    segment_length = segment_length or settings.ECG_SEGMENT_LENGTH
    step = segment_length - overlap
    segments: list[np.ndarray] = []
    for start in range(0, len(ecg_signal), step):
        chunk = ecg_signal[start : start + segment_length]
        if len(chunk) < segment_length:
            # Zero-pad the last segment
            padded = np.zeros(segment_length, dtype=np.float32)
            padded[: len(chunk)] = chunk
            chunk = padded
        segments.append(chunk.astype(np.float32))
    return segments


def preprocess_ecg(
    raw_signal: np.ndarray,
    fs: Optional[int] = None,
) -> np.ndarray:
    """
    Full preprocessing pipeline:
      raw → bandpass filter → baseline removal → normalization.
    Returns a clean 1-D NumPy array.
    """
    signal = raw_signal.astype(np.float64)
    signal = bandpass_filter(signal, fs=fs)
    signal = remove_baseline_wander(signal)
    signal = normalize(signal)
    return signal


def preprocess_and_segment(
    raw_signal: np.ndarray,
    fs: Optional[int] = None,
    segment_length: Optional[int] = None,
) -> list[np.ndarray]:
    """
    End-to-end: preprocess then segment into fixed-length chunks.
    """
    clean = preprocess_ecg(raw_signal, fs=fs)
    return segment_signal(clean, segment_length=segment_length)
