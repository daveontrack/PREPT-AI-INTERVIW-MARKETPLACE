"""Unit tests for token verification and landmark preprocessing.

Run from sign-recognition-service/:  python -m unittest discover -s tests
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import unittest

os.environ.setdefault("SIGN_SESSION_SECRET", "test-secret")

from app.preprocessing import FEATURE_DIM, MAX_FRAMES, normalize_frames  # noqa: E402
from app.token_utils import verify_token  # noqa: E402


def mint_token(payload: dict, secret: str = "test-secret") -> str:
    payload_b64 = (
        base64.urlsafe_b64encode(json.dumps(payload).encode())
        .rstrip(b"=")
        .decode()
    )
    sig = (
        base64.urlsafe_b64encode(
            hmac.new(secret.encode(), payload_b64.encode(), hashlib.sha256).digest()
        )
        .rstrip(b"=")
        .decode()
    )
    return f"{payload_b64}.{sig}"


def valid_payload(**overrides) -> dict:
    payload = {
        "sid": "session-1",
        "uid": "user-1",
        "lang": "EthSL",
        "exp": time.time() * 1000 + 60_000,
    }
    payload.update(overrides)
    return payload


class TokenTests(unittest.TestCase):
    def test_valid_token_accepted(self):
        claims = verify_token(mint_token(valid_payload()))
        self.assertIsNotNone(claims)
        self.assertEqual(claims["sid"], "session-1")
        self.assertEqual(claims["lang"], "EthSL")

    def test_expired_token_rejected(self):
        self.assertIsNone(verify_token(mint_token(valid_payload(exp=time.time() * 1000 - 1))))

    def test_tampered_payload_rejected(self):
        token = mint_token(valid_payload())
        payload_b64, sig = token.split(".")
        tampered = base64.urlsafe_b64encode(
            json.dumps(valid_payload(uid="attacker")).encode()
        ).rstrip(b"=").decode()
        self.assertIsNone(verify_token(f"{tampered}.{sig}"))

    def test_wrong_signature_rejected(self):
        self.assertIsNone(verify_token(mint_token(valid_payload(), secret="other")))

    def test_garbage_rejected(self):
        self.assertIsNone(verify_token("not-a-token"))
        self.assertIsNone(verify_token(""))


class PreprocessingTests(unittest.TestCase):
    def _frame(self, hand_present=True):
        hand = [[0.5, 0.5, 0.0]] * 21 if hand_present else None
        pose = [[0.4, 0.3, 0.0]] * 13
        return {"h": [hand] if hand_present else [], "p": pose}

    def test_shape_and_dtype(self):
        tensor = normalize_frames([self._frame()] * 3)
        self.assertEqual(tensor.shape, (MAX_FRAMES, FEATURE_DIM))
        self.assertEqual(tensor.dtype.name, "float32")

    def test_absent_hand_stays_zero(self):
        tensor = normalize_frames([self._frame(hand_present=False)] * 3)
        # first 21*3 features = right hand must remain all-zero padding
        self.assertTrue((tensor[0, : 21 * 3] == 0).all())

    def test_centering_removes_translation(self):
        import numpy as np

        a = normalize_frames([{"h": [[[0.2, 0.2, 0.0]] * 21], "p": [[0.1, 0.1, 0.0]] * 13}])
        b = normalize_frames([{"h": [[[0.7, 0.6, 0.0]] * 21], "p": [[0.6, 0.5, 0.0]] * 13}])
        # identical hand shape at a different position -> identical features
        # (approximate: float32 subtraction differs in the last ulps)
        np.testing.assert_allclose(a[0], b[0], atol=1e-6)


if __name__ == "__main__":
    unittest.main()
