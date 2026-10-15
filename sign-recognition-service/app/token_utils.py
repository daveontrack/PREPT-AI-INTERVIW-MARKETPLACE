"""Verification for the scoped session tokens minted by Next.js.

Token format (issued in actions/signLanguage.js):

    base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, secret))

Payload: { sid, uid, lang, exp } (exp in epoch milliseconds). The service
shares SIGN_SESSION_SECRET with the Next.js app and never needs database or
Clerk credentials.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def verify_token(token: str) -> dict[str, Any] | None:
    """Returns the payload when the signature is valid and unexpired."""
    secret = os.getenv("SIGN_SESSION_SECRET")
    if not secret or not token or "." not in token:
        return None

    try:
        payload_b64, sig = token.rsplit(".", 1)
        expected = hmac.new(
            secret.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256
        ).digest()
        expected_sig = base64.urlsafe_b64encode(expected).rstrip(b"=").decode("ascii")
        if not hmac.compare_digest(expected_sig, sig):
            return None

        payload = json.loads(_b64url_decode(payload_b64))
    except Exception:  # noqa: BLE001 - any parsing failure == invalid token
        return None

    exp = payload.get("exp")
    if not isinstance(exp, (int, float)) or exp < time.time() * 1000:
        return None  # expired
    if not payload.get("sid") or not payload.get("uid"):
        return None

    return payload
