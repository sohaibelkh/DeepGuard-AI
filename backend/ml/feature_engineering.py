"""
ECG Feature Engineering Module
================================
Extracts hand-crafted features from preprocessed ECG segments for
use with classical ML models (SVM, RF, KNN).

Features extracted (~20 total):
  - Time-domain: mean, std, min, max, median, RMS, skewness, kurtosis
  - RR interval statistics (estimated via peak detection)
  - Heart rate (mean, std)
  - Energy and zero-crossing rate
  - Spectral features: dominant frequency, spectral entropy
"""

from __future__ import annotations

from typing import Optional, Dict, List
import numpy as np
from scipy import signal as sp_signal
from scipy.stats import skew, kurtosis

from config import settings


def detect_r_peaks(ecg_segment: np.ndarray, fs: Optional[int] = None) -> np.ndarray:
    """
    Simple R-peak detection using scipy find_peaks.
    Returns array of peak indices.
    """
    fs = fs or settings.ECG_SAMPLE_RATE
    # Minimum distance between peaks: ~200ms (max heart rate ~300bpm)
    min_distance = int(0.2 * fs)
    # Peak height threshold: 60% of max
    height_threshold = 0.6 * np.max(ecg_segment) if np.max(ecg_segment) > 0 else 0.0
    peaks, _ = sp_signal.find_peaks(
        ecg_segment, distance=min_distance, height=height_threshold
    )
    return peaks


def compute_rr_features(ecg_segment: np.ndarray, fs: Optional[int] = None) -> dict[str, float]:
    """
    Compute RR-interval features from detected R-peaks.
    """
    fs = fs or settings.ECG_SAMPLE_RATE
    peaks = detect_r_peaks(ecg_segment, fs)

    if len(peaks) < 2:
        return {
            "rr_mean": 0.0,
            "rr_std": 0.0,
            "rr_min": 0.0,
            "rr_max": 0.0,
            "heart_rate_mean": 0.0,
            "heart_rate_std": 0.0,
            "num_peaks": float(len(peaks)),
        }

    rr_intervals = np.diff(peaks) / fs  # in seconds
    heart_rates = 60.0 / rr_intervals  # in bpm

    return {
        "rr_mean": float(np.mean(rr_intervals)),
        "rr_std": float(np.std(rr_intervals)),
        "rr_min": float(np.min(rr_intervals)),
        "rr_max": float(np.max(rr_intervals)),
        "heart_rate_mean": float(np.mean(heart_rates)),
        "heart_rate_std": float(np.std(heart_rates)),
        "num_peaks": float(len(peaks)),
    }


def compute_time_domain_features(ecg_segment: np.ndarray) -> dict[str, float]:
    """
    Basic time-domain statistical features.
    """
    return {
        "signal_mean": float(np.mean(ecg_segment)),
        "signal_std": float(np.std(ecg_segment)),
        "signal_min": float(np.min(ecg_segment)),
        "signal_max": float(np.max(ecg_segment)),
        "signal_median": float(np.median(ecg_segment)),
        "signal_rms": float(np.sqrt(np.mean(ecg_segment ** 2))),
        "signal_skewness": float(skew(ecg_segment)),
        "signal_kurtosis": float(kurtosis(ecg_segment)),
    }


def compute_energy_features(ecg_segment: np.ndarray) -> dict[str, float]:
    """
    Energy and zero-crossing rate.
    """
    energy = float(np.sum(ecg_segment ** 2))
    # Zero-crossing rate
    zero_crossings = int(np.sum(np.abs(np.diff(np.sign(ecg_segment))) > 0))
    zcr = zero_crossings / len(ecg_segment) if len(ecg_segment) > 0 else 0.0

    return {
        "signal_energy": energy,
        "zero_crossing_rate": zcr,
    }


def compute_spectral_features(ecg_segment: np.ndarray, fs: Optional[int] = None) -> dict[str, float]:
    """
    Spectral features: dominant frequency and spectral entropy.
    """
    fs = fs or settings.ECG_SAMPLE_RATE
    freqs, psd = sp_signal.welch(ecg_segment, fs=fs, nperseg=min(256, len(ecg_segment)))

    # Dominant frequency
    dominant_freq = float(freqs[np.argmax(psd)]) if len(psd) > 0 else 0.0

    # Spectral entropy
    psd_norm = psd / (np.sum(psd) + 1e-12)
    spectral_entropy = float(-np.sum(psd_norm * np.log2(psd_norm + 1e-12)))

    return {
        "dominant_frequency": dominant_freq,
        "spectral_entropy": spectral_entropy,
    }


def extract_features(
    ecg_segment: np.ndarray,
    fs: Optional[int] = None,
) -> np.ndarray:
    """
    Extract all features from a single ECG segment.
    Returns a 1-D feature vector (NumPy array) of ~20 features.
    """
    features = {}
    features.update(compute_time_domain_features(ecg_segment))
    features.update(compute_rr_features(ecg_segment, fs))
    features.update(compute_energy_features(ecg_segment))
    features.update(compute_spectral_features(ecg_segment, fs))

    return np.array(list(features.values()), dtype=np.float32)


def extract_feature_names() -> list[str]:
    """Return the ordered list of feature names matching extract_features output."""
    names: list[str] = []
    # Time-domain
    names.extend([
        "signal_mean", "signal_std", "signal_min", "signal_max",
        "signal_median", "signal_rms", "signal_skewness", "signal_kurtosis",
    ])
    # RR features
    names.extend([
        "rr_mean", "rr_std", "rr_min", "rr_max",
        "heart_rate_mean", "heart_rate_std", "num_peaks",
    ])
    # Energy
    names.extend(["signal_energy", "zero_crossing_rate"])
    # Spectral
    names.extend(["dominant_frequency", "spectral_entropy"])
    return names
