"""
Model Evaluation Module
=========================
Provides functions to compute accuracy, precision, recall, F1-score,
confusion matrix, and ROC data across all ECG classes.
"""

from __future__ import annotations

import json
from typing import Any, Optional, Union, List, Dict

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_curve,
    auc,
)
from sklearn.preprocessing import label_binarize

from config import settings


def compute_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_proba: Optional[np.ndarray] = None,
) -> dict[str, Any]:
    """
    Compute comprehensive evaluation metrics.

    Args:
        y_true:  True labels (integer-encoded).
        y_pred:  Predicted labels (integer-encoded).
        y_proba: Probability matrix (n_samples, n_classes), optional.

    Returns:
        Dict with accuracy, precision, recall, f1, confusion_matrix,
        per_class_metrics, and optionally roc_data.
    """
    classes = settings.ECG_CLASSES
    n_classes = len(classes)

    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, average="weighted", zero_division=0))
    rec = float(recall_score(y_true, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

    cm = confusion_matrix(y_true, y_pred, labels=list(range(n_classes)))

    # Per-class metrics
    report = classification_report(
        y_true, y_pred,
        target_names=classes,
        labels=list(range(n_classes)),
        output_dict=True,
        zero_division=0,
    )
    per_class = []
    for cls_name in classes:
        if cls_name in report:
            per_class.append({
                "class": cls_name,
                "precision": round(report[cls_name]["precision"], 4),
                "recall": round(report[cls_name]["recall"], 4),
                "f1_score": round(report[cls_name]["f1-score"], 4),
                "support": int(report[cls_name]["support"]),
            })

    result = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm.tolist(),
        "per_class_metrics": per_class,
    }

    # ROC data (macro-averaged OvR)
    if y_proba is not None:
        roc_data = compute_roc_data(y_true, y_proba, n_classes)
        result["roc_data"] = roc_data

    return result


def compute_roc_data(
    y_true: np.ndarray,
    y_proba: np.ndarray,
    n_classes: int,
) -> list[dict[str, float]]:
    """Compute macro-averaged ROC curve data."""
    y_bin = label_binarize(y_true, classes=list(range(n_classes)))

    # Compute micro-average ROC
    fpr_all, tpr_all, _ = roc_curve(y_bin.ravel(), y_proba.ravel())

    # Downsample to reasonable number of points
    if len(fpr_all) > 100:
        indices = np.linspace(0, len(fpr_all) - 1, 100, dtype=int)
        fpr_all = fpr_all[indices]
        tpr_all = tpr_all[indices]

    roc_points = [
        {"fpr": round(float(fpr), 4), "tpr": round(float(tpr), 4)}
        for fpr, tpr in zip(fpr_all, tpr_all)
    ]
    return roc_points


def generate_demo_metrics() -> dict[str, dict[str, Any]]:
    """
    Generate realistic demo metrics for all models when no real training
    has been performed. Used for initial dashboard display.
    """
    models_config = {
        "svm": {"display": "Support Vector Machine", "type": "classical", "acc": 0.891},
        "random_forest": {"display": "Random Forest", "type": "classical", "acc": 0.912},
        "knn": {"display": "K-Nearest Neighbors", "type": "classical", "acc": 0.867},
        "cnn": {"display": "1D CNN", "type": "deep_learning", "acc": 0.934},
        "lstm": {"display": "BiLSTM", "type": "deep_learning", "acc": 0.928},
        "hybrid_cnn_lstm": {"display": "CNN + LSTM (Hybrid)", "type": "deep_learning", "acc": 0.952},
    }

    rng = np.random.default_rng(42)
    results = {}

    for name, cfg in models_config.items():
        base_acc = cfg["acc"]
        n_classes = len(settings.ECG_CLASSES)

        # Generate realistic confusion matrix
        n_samples = 200
        cm = np.zeros((n_classes, n_classes), dtype=int)
        for i in range(n_classes):
            total = n_samples // n_classes
            correct = int(total * base_acc * (0.9 + rng.random() * 0.1))
            cm[i, i] = correct
            remaining = total - correct
            for j in range(n_classes):
                if j != i and remaining > 0:
                    wrong = rng.integers(0, max(remaining // (n_classes - 1) + 1, 1))
                    cm[i, j] = wrong
                    remaining -= wrong

        # Generate ROC data
        roc_points = []
        for t in np.linspace(0, 1, 50):
            tpr = min(1.0, t * (1.2 + base_acc - 0.85))
            roc_points.append({"fpr": round(t, 3), "tpr": round(min(tpr, 1.0), 3)})

        # Per-class metrics
        per_class = []
        for cls_name in settings.ECG_CLASSES:
            p = base_acc * (0.92 + rng.random() * 0.08)
            r = base_acc * (0.90 + rng.random() * 0.10)
            f = 2 * p * r / (p + r + 1e-8)
            per_class.append({
                "class": cls_name,
                "precision": round(p, 4),
                "recall": round(r, 4),
                "f1_score": round(f, 4),
                "support": n_samples // n_classes,
            })

        prec = base_acc * (0.94 + rng.random() * 0.04)
        rec = base_acc * (0.92 + rng.random() * 0.06)

        results[name] = {
            "model_name": name,
            "display_name": cfg["display"],
            "model_type": cfg["type"],
            "accuracy": round(base_acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(2 * prec * rec / (prec + rec + 1e-8), 4),
            "confusion_matrix": json.dumps(cm.tolist()),
            "roc_data": json.dumps(roc_points),
            "per_class_metrics": json.dumps(per_class),
            "training_samples": 8000,
            "test_samples": 2000,
        }

    return results
