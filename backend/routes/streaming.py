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
        signal_data: list[float] = []

        if record_id:
            # Load signal from database
            async with async_session() as db:
                result = await db.execute(
                    select(ECGRecord).where(ECGRecord.id == record_id)
                )
                record = result.scalar_one_or_none()
                if record and record.raw_signal:
                    signal_data = json.loads(record.raw_signal)

        if not signal_data:
            # Generate a synthetic ECG-like signal for demo
            import numpy as np
            t = np.linspace(0, 10, 3600)  # 10 seconds at 360Hz
            # Simulate P-QRS-T morphology
            signal = (
                0.15 * np.sin(2 * np.pi * 1.2 * t)       # P wave
                + 1.0 * np.exp(-((t % 0.833 - 0.2) ** 2) / 0.002)  # QRS peak
                - 0.3 * np.exp(-((t % 0.833 - 0.18) ** 2) / 0.001)  # Q wave
                + 0.2 * np.sin(2 * np.pi * 0.6 * t + 1.5)   # T wave
                + np.random.normal(0, 0.02, len(t))           # noise
            )
            signal_data = signal.tolist()

        # Stream chunks
        total = len(signal_data)
        index = 0
        heart_rate_base = 72.0  # BPM

        while index < total:
            chunk = signal_data[index : index + CHUNK_SIZE]
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
