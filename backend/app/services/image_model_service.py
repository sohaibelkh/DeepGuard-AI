from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Literal, Tuple

from PIL import Image
import torch
from torch import nn
from torchvision import models, transforms


Label = Literal["Real", "Fake"]


@dataclass
class ImagePrediction:
    label: Label
    confidence: float
    processing_time_ms: float


class ImageModelService:
    """
    Handles loading and running inference for the image deepfake classifier.

    The underlying ResNet50 model is loaded once at module import time and
    kept in memory for subsequent requests.
    """

    def __init__(self) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._load_model()
        self.transform = self._build_transform()
        self.class_names: Tuple[Label, Label] = ("Real", "Fake")

    def _load_model(self) -> nn.Module:
        # Use torchvision ResNet50 with ImageNet weights for transfer learning.
        try:
            weights = models.ResNet50_Weights.IMAGENET1K_V2  # type: ignore[attr-defined]
            base_model = models.resnet50(weights=weights)
        except AttributeError:
            # Fallback for older torchvision versions
            base_model = models.resnet50(pretrained=True)

        in_features = base_model.fc.in_features
        base_model.fc = nn.Linear(in_features, 2)
        base_model.eval()
        base_model.to(self.device)
        return base_model

    def _build_transform(self) -> transforms.Compose:
        # Standard ResNet preprocessing
        return transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
            ]
        )

    def predict_image(self, image: Image.Image) -> ImagePrediction:
        """
        Run inference on a single PIL image and return a structured prediction.
        """
        start = time.perf_counter()

        img = image.convert("RGB")
        tensor = self.transform(img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1)[0]

        confidence, idx = torch.max(probs, dim=0)
        label = self.class_names[int(idx)]
        elapsed_ms = (time.perf_counter() - start) * 1000.0

        return ImagePrediction(
            label=label,
            confidence=float(confidence.item()),
            processing_time_ms=elapsed_ms,
        )

    def predict_image_proba(self, image: Image.Image) -> Tuple[float, float]:
        """
        Return (p_real, p_fake) for the given image.
        """
        img = image.convert("RGB")
        tensor = self.transform(img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1)[0]

        p_real = float(probs[0].item())
        p_fake = float(probs[1].item())
        return p_real, p_fake


# Singleton instance loaded at import time so the model is created once per process.
image_model_service = ImageModelService()


__all__ = ["image_model_service", "ImageModelService", "ImagePrediction", "Label"]
