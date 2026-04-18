"""
WebSocket ECG Streaming Route
================================
Simulated real-time ECG streaming. Takes a record ID, splits the stored
signal into chunks, and sends them progressively via WebSocket to mimic
real-time monitoring from a physical sensor.
"""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import async_session
from models.ecg_record import ECGRecord
from config import settings
from ml.model_registry import model_registry
import numpy as np

router = APIRouter(tags=["streaming"])

CHUNK_SIZE = 50  # samples per message
DELAY_MS = 100   # milliseconds between chunks (simulates real-time at ~500 Hz display)


@router.websocket("/api/ws/ecg-stream")
async def ecg_stream(websocket: WebSocket, record_id: int = Query(None)):
    """
    WebSocket endpoint for simulated real-time ECG streaming.

    Client connects and optionally provides record_id to stream an
    existing ECG recording. If no record_id, streams a generated demo signal.
    """
    await websocket.accept()

    try:
        stream_data: list[float] = []
        full_matrix: np.ndarray | None = None

        if record_id:
            # Load signal from database
            async with async_session() as db:
                result = await db.execute(select(ECGRecord).where(ECGRecord.id == record_id))
                record = result.scalar_one_or_none()
                if record and record.raw_signal:
                    raw_signal = json.loads(record.raw_signal)
                    if len(raw_signal) > 2 and raw_signal[0] == -999.0:
                        n_cols = int(raw_signal[1])
                        data = raw_signal[2:]
                        n_samples = len(data) // n_cols
                        full_matrix = np.array(data[: n_samples * n_cols]).reshape(n_samples, n_cols).T
                        stream_data = full_matrix[0].tolist()  # Lead I for visual streaming
                    else:
                        stream_data = raw_signal
                        full_matrix = np.array(stream_data).reshape(1, -1)

        if not stream_data:
            # Generate a synthetic ECG-like signal for demo
            t = np.linspace(0, 10, 3600)  # 10 seconds at 360Hz
            signal = (
                0.15 * np.sin(2 * np.pi * 1.2 * t)
                + 1.0 * np.exp(-((t % 0.833 - 0.2) ** 2) / 0.002)
                - 0.3 * np.exp(-((t % 0.833 - 0.18) ** 2) / 0.001)
                + 0.2 * np.sin(2 * np.pi * 0.6 * t + 1.5)
                + np.random.normal(0, 0.02, len(t))
            )
            stream_data = signal.tolist()
            full_matrix = signal.reshape(1, -1)

        # Stream chunks
        total = len(stream_data)
        index = 0
        heart_rate_base = 72.0

        ai_window_size = 1000
        last_ai_index = 0

        while index < total:
            chunk = stream_data[index : index + CHUNK_SIZE]
            message = {
                "type": "ecg_data",
                "data": [round(v, 4) for v in chunk],
                "index": index,
                "total": total,
                "progress": round(index / total * 100, 1),
                "heart_rate": round(heart_rate_base + (index / total) * 5 - 2.5, 1),
                "timestamp_ms": index * (1000 / settings.ECG_SAMPLE_RATE),
            }
            await websocket.send_json(message)
            index += CHUNK_SIZE
            
            # Perform Live AI Inference every window chunk
            if index - last_ai_index >= ai_window_size and full_matrix is not None:
                # Extract sliding window
                end_idx = min(index, full_matrix.shape[1])
                start_idx = max(0, end_idx - ai_window_size)
                window_matrix = full_matrix[:, start_idx:end_idx]
                
                # Perform AI inference asynchronously to not block the socket
                # We use hybrid_cnn_lstm as our prime model for streaming
                try:
                    pred_res = await asyncio.to_thread(
                        model_registry.predict, "hybrid_cnn_lstm", window_matrix
                    )
                    await websocket.send_json({
                        "type": "ai_analysis",
                        "prediction": pred_res["prediction"],
                        "confidence": float(pred_res["confidence"]),
                        "index": index
                    })
                except Exception as ai_e:
                    print(f"Streaming AI Inference error: {ai_e}")
                
                last_ai_index = index

            await asyncio.sleep(DELAY_MS / 1000.0)

        # Signal end of stream
        await websocket.send_json({
            "type": "stream_end",
            "message": "ECG streaming complete.",
            "total_samples": total,
        })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
