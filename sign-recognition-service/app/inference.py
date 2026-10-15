"""Model inference interface.

The trained Ethiopian Sign Language model is NOT bundled: credible EthSL
models require consented datasets and signer-independent evaluation (see the
project README). This module loads a predictor in one of two ways:

  1. PREDICTOR_PATH (default ``models/predictor.py``) — a Python file that
     defines a ``Predictor`` class:

         class Predictor:
             model_version = "ethsl-v1"
             def predict(self, frames: np.ndarray) -> tuple[str, float]:
                 ...  # returns (recognized_text, confidence 0..1)

     Drop your exported BiLSTM/GRU/CTC model behind this interface (load it
     lazily inside ``__init__``; torch/onnxruntime are YOUR dependencies).

  2. ALLOW_STUB=true — a clearly-labeled stub so the WebSocket pipeline can be
     exercised end-to-end in development. NEVER enable in production: its
     output is not EthSL recognition.
"""

from __future__ import annotations

import importlib.util
import os
from typing import Protocol

import numpy as np


class Predictor(Protocol):
    model_version: str

    def predict(self, frames: np.ndarray) -> tuple[str, float]:  # pragma: no cover
        ...


class StubPredictor:
    """Development-only placeholder — explicitly NOT recognition output."""

    model_version = "stub"

    def predict(self, frames: np.ndarray) -> tuple[str, float]:
        return "[stub prediction — configure a trained EthSL model]", 0.0


def load_predictor() -> Predictor:
    allow_stub = os.getenv("ALLOW_STUB", "false").lower() in ("1", "true", "yes")

    path = os.getenv("PREDICTOR_PATH", "models/predictor.py")
    if os.path.exists(path):
        spec = importlib.util.spec_from_file_location("ethsl_predictor", path)
        if spec and spec.loader:
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            predictor = module.Predictor()
            if not getattr(predictor, "model_version", None):
                raise RuntimeError("Predictor must define model_version")
            if not callable(getattr(predictor, "predict", None)):
                raise RuntimeError("Predictor must define predict(frames)")
            return predictor

    if allow_stub:
        return StubPredictor()

    raise RuntimeError(
        f"No predictor found at {path!r}. Export your trained EthSL model behind "
        "the Predictor interface (see inference.py) or set ALLOW_STUB=true for "
        "development-only pipeline testing."
    )
