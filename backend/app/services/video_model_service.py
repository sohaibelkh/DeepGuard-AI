from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Literal, Tuple

import cv2
from PIL import Image

from .image_model_service import image_model_service, Label


@dataclass
class VideoPrediction:
    label: Label
    confidence: float
    frames_analyzed: int
    processing_time_ms: float


class VideoModelService:
    """
    Frame-based deepfake detection for videos using the image CNN model.
    """

    def __init__(
        self,
        max_duration_seconds: int = 300,
        max_file_size_mb: int = 200,
        frame_stride: int = 10,
    ) -> None:
        self.max_duration_seconds = max_duration_seconds
        self.max_file_size_bytes = max_file_size_mb * 1024 * 1024
        self.frame_stride = frame_stride

    def analyze_video(self, video_path: str) -> VideoPrediction:
        """
        Analyze a video file by sampling frames and aggregating predictions.
        """
        start = time.perf_counter()

        self._validate_file_size(video_path)

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Unable to open video file for analysis.")

        try:
            fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

            duration = frame_count / fps if fps > 0 else 0.0
            if duration > self.max_duration_seconds:
                raise ValueError("Video duration exceeds allowed limit.")

            frame_index = 0
            frames_analyzed = 0
            real_confidences = []
            fake_confidences = []
            fake_frames = 0

            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_index % self.frame_stride != 0:
                    frame_index += 1
                    continue

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(rgb)

                p_real, p_fake = image_model_service.predict_image_proba(pil_image)
                real_confidences.append(p_real)
                fake_confidences.append(p_fake)
                if p_fake >= p_real:
                    fake_frames += 1

                frames_analyzed += 1
                frame_index += 1

            if frames_analyzed == 0:
                raise ValueError("No frames could be analyzed from the provided video.")

            majority_fake = fake_frames > frames_analyzed / 2
            if majority_fake:
                label: Label = "Fake"
                confidence = sum(fake_confidences) / len(fake_confidences)
            else:
                label = "Real"
                confidence = sum(real_confidences) / len(real_confidences)

            elapsed_ms = (time.perf_counter() - start) * 1000.0

            return VideoPrediction(
                label=label,
                confidence=float(confidence),
                frames_analyzed=frames_analyzed,
                processing_time_ms=elapsed_ms,
            )
        finally:
            cap.release()

    def _validate_file_size(self, video_path: str) -> None:
        size = os.path.getsize(video_path)
        if size > self.max_file_size_bytes:
            raise ValueError("Video file size exceeds allowed limit.")


video_model_service = VideoModelService()


__all__ = ["video_model_service", "VideoModelService", "VideoPrediction"]

