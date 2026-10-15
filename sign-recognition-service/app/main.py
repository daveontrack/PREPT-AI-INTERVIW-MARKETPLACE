"""Ethiopian Sign Language recognition service (FastAPI).

Run:
    SIGN_SESSION_SECRET=... uvicorn app.main:app --host 0.0.0.0 --port 8000

Security model:
  * The WebSocket handshake requires a scoped HMAC token minted by Next.js
    (actions/signLanguage.js) — validated against SIGN_SESSION_SECRET, with
    expiry, and the per-message sessionId must match the token.
  * Only landmark sequences are received; no video, no audio, nothing is
    persisted here.
  * Payload size, frame count and send rate are capped per connection.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time

from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect

from .inference import load_predictor
from .preprocessing import MAX_FRAMES, normalize_frames
from .token_utils import verify_token

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
log = logging.getLogger("ethsl")

app = FastAPI(title="InterviewLoop EthSL recognition service")

predictor = None


@app.on_event("startup")
async def _startup() -> None:
    global predictor
    predictor = load_predictor()
    log.info("Loaded predictor: %s", predictor.model_version)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "modelVersion": getattr(predictor, "model_version", None),
    }


# Per-connection anti-abuse limits.
MAX_MESSAGE_BYTES = 256 * 1024
MAX_FRAMES_PER_MESSAGE = MAX_FRAMES + 12
MIN_SEND_INTERVAL_MS = 700


def _valid_frame(frame) -> bool:
    if not isinstance(frame, dict):
        return False
    hands = frame.get("h")
    if hands is not None and (
        not isinstance(hands, list) or len(hands) > 2 or not all(isinstance(h, list) for h in hands)
    ):
        return False
    pose = frame.get("p")
    if pose is not None and (not isinstance(pose, list) or len(pose) > 13):
        return False
    return True


async def _send(ws: WebSocket, payload: dict) -> None:
    await ws.send_text(json.dumps(payload))


@app.websocket("/ws/recognize")
async def recognize(ws: WebSocket, token: str = Query(default="")) -> None:
    claims = verify_token(token)
    if claims is None:
        await ws.accept()
        await _send(ws, {"type": "error", "message": "Invalid or expired session token"})
        await ws.close(code=4401)
        return

    await ws.accept()
    session_id = claims["sid"]
    language = claims.get("lang", "EthSL")
    log.info("Session connected: %s (user %s, %s)", session_id, claims["uid"], language)

    last_send = 0.0

    try:
        while True:
            raw = await ws.receive_text()

            if len(raw.encode("utf-8", errors="ignore")) > MAX_MESSAGE_BYTES:
                await _send(ws, {"type": "error", "message": "Payload too large"})
                continue

            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await _send(ws, {"type": "error", "message": "Malformed JSON"})
                continue

            if msg.get("type") != "sequence":
                await _send(ws, {"type": "error", "message": "Unsupported message type"})
                continue

            if msg.get("sessionId") != session_id:
                await _send(ws, {"type": "error", "message": "Session mismatch"})
                continue

            if msg.get("language", language) != language:
                await _send(ws, {"type": "error", "message": "Unsupported language"})
                continue

            frames = msg.get("frames")
            if (
                not isinstance(frames, list)
                or len(frames) == 0
                or len(frames) > MAX_FRAMES_PER_MESSAGE
                or not all(_valid_frame(f) for f in frames)
            ):
                await _send(ws, {"type": "error", "message": "Invalid landmark sequence"})
                continue

            now = time.monotonic() * 1000
            if now - last_send < MIN_SEND_INTERVAL_MS:
                continue  # drop over-rate requests silently (client-paced)
            last_send = now

            seq = msg.get("seq")
            try:
                tensor = normalize_frames(frames)
                prediction, confidence = await asyncio.to_thread(
                    predictor.predict, tensor
                )
            except Exception as exc:  # noqa: BLE001 - report, don't kill the socket
                log.exception("Inference failed for session %s", session_id)
                await _send(
                    ws,
                    {
                        "type": "error",
                        "message": f"Inference failed: {type(exc).__name__}",
                        "seq": seq,
                    },
                )
                continue

            await _send(
                ws,
                {
                    "type": "prediction",
                    "seq": seq,
                    "language": language,
                    "prediction": str(prediction),
                    "confidence": max(0.0, min(1.0, float(confidence))),
                    "modelVersion": predictor.model_version,
                },
            )
    except WebSocketDisconnect:
        log.info("Session disconnected: %s", session_id)
