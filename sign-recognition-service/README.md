# EthSL Sign Recognition Service

Experimental **Ethiopian Sign Language → text** recognition used by the
Interview Loop call room ("Sign" tab). FastAPI + WebSocket; landmarks are
extracted **in the browser** (MediaPipe) and streamed here — no video ever
reaches this service, and nothing is persisted.

## Run

```bash
cd sign-recognition-service
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

SIGN_SESSION_SECRET=<same value as the Next.js app> \
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Development-only pipeline test without a trained model:

```bash
ALLOW_STUB=true SIGN_SESSION_SECRET=dev uvicorn app.main:app --port 8000
```

The stub returns a clearly-labeled placeholder — **never enable `ALLOW_STUB`
in production**.

## Plugging in a trained model

Create `models/predictor.py`:

```python
import numpy as np

class Predictor:
    model_version = "ethsl-v1"   # recorded on transcript entries

    def __init__(self):
        # load your exported BiLSTM / GRU / CTC model here
        ...

    def predict(self, frames: np.ndarray) -> tuple[str, float]:
        # frames: (MAX_FRAMES, 165) normalized landmark tensor
        # return (recognized_text, confidence 0..1)
        ...
```

Input contract: see `app/preprocessing.py` — 2 hands × 21 landmarks + 13 pose
points per frame, wrist-centred, hand-size scaled, fixed 48-frame window. If
your model needs different normalization, change it there and keep the model
card in sync.

## Data & model guidance (important)

Full, operational version of this guidance — dataset references, access
checklist, consent/annotation protocol, pilot-collection matrix and the
signer-independent evaluation tooling — lives in [DATASET.md](./DATASET.md)
with the split tool in `training/split_by_signer.py`.

- Do **not** assume an ASL-trained model recognizes EthSL. Published EthSL
  research reports ~94% signer-dependent vs ~73% signer-independent accuracy
  on isolated signs (Sci. Reports 2025, s41598-025-19937-0) — generalization
  to unseen signers is the real challenge.
- Existing EthSL datasets (e.g. the 5,600-video isolated-sign corpus, the
  CESLR continuous corpus) are largely restricted; plan for consented data
  collection with EthSL users and qualified annotators.
- Split evaluation **by signer**, report WER for continuous signing, and
  calibrate the confidence threshold on held-out signers (the app currently
  flags anything below 0.55 for review).
- Labels must be verified with EthSL users — never machine-translate glosses.

## Protocol

`WS /ws/recognize?token=<hmac-token>` (token minted by Next.js):

```jsonc
// client → service
{ "type": "sequence", "sessionId": "…", "seq": 12, "language": "EthSL",
  "frames": [ { "h": [[x,y,z] ×21, …], "p": [[x,y,z] ×13] }, … ] }

// service → client
{ "type": "prediction", "seq": 12, "language": "EthSL",
  "prediction": "recognized sign label", "confidence": 0.91,
  "modelVersion": "ethsl-v1" }

// errors
{ "type": "error", "message": "…" }
```

Limits enforced per connection: 256 KB messages, ≤60 frames per sequence,
≥700 ms between inferences, token expiry (4 h), session-id match.

## Tests

```bash
python -m unittest discover -s tests
```
