"""Landmark normalization for the temporal model.

Input frames come from the browser (MediaPipe hand + pose landmarks, already
image-normalized 0..1). This module:

  * pads every frame to a fixed shape (2 hands x 21 points + 13 pose points),
  * re-centres on the dominant (right-hand, else left-hand) wrist,
  * scales by hand size so distance from the camera doesn't change features,
  * truncates / zero-pads the sequence to a fixed length.

Everything here is deliberately simple and dependency-light (numpy only) so a
trained model's preprocessing contract stays explicit. If your trained model
expects different normalization, change it HERE and keep the model card in
sync — never silently diverge between training and serving code.
"""

from __future__ import annotations

import numpy as np

HAND_POINTS = 21
POSE_INDICES = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24]  # see hook
MAX_FRAMES = 48
FEATURE_DIM = 2 * HAND_POINTS * 3 + len(POSE_INDICES) * 3  # 165

# MediaPipe hand landmark indices
WRIST = 0
MIDDLE_FINGER_MCP = 9


def _pad_hand(hand: list | None) -> np.ndarray:
    arr = np.zeros((HAND_POINTS, 3), dtype=np.float32)
    if hand:
        n = min(len(hand), HAND_POINTS)
        for i in range(n):
            p = hand[i]
            arr[i] = (float(p[0]), float(p[1]), float(p[2]) if len(p) > 2 else 0.0)
    return arr


def normalize_frames(frames: list[dict]) -> np.ndarray:
    """Browser frames -> (MAX_FRAMES, FEATURE_DIM) float32 tensor."""
    seq = np.zeros((MAX_FRAMES, FEATURE_DIM), dtype=np.float32)

    for t, frame in enumerate(frames[:MAX_FRAMES]):
        hands_raw = frame.get("h") or []
        right_present = len(hands_raw) > 0
        left_present = len(hands_raw) > 1
        right = _pad_hand(hands_raw[0] if right_present else None)
        left = _pad_hand(hands_raw[1] if left_present else None)

        pose_raw = frame.get("p") or []
        pose = np.zeros((len(POSE_INDICES), 3), dtype=np.float32)
        for i in range(min(len(pose_raw), len(POSE_INDICES))):
            p = pose_raw[i]
            pose[i] = (float(p[0]), float(p[1]), float(p[2]) if len(p) > 2 else 0.0)

        # Re-centre on the dominant wrist; fall back to the other hand.
        centre = None
        for hand in (right, left):
            if hand[WRIST].any():
                centre = hand[WRIST].copy()
                break
        if centre is None and pose[5].any():  # pose index 5 == right wrist
            centre = pose[5].copy()
        if centre is None:
            centre = np.zeros(3, dtype=np.float32)

        # Absent hands must stay all-zero (they mark "no hand here").
        if right_present:
            right -= centre
        if left_present:
            left -= centre
        pose -= centre

        # Scale by hand size (wrist -> middle-finger MCP); 1.0 if unknown.
        scale = 1.0
        for hand, present in ((right, right_present), (left, left_present)):
            if not present:
                continue
            span = np.linalg.norm(hand[MIDDLE_FINGER_MCP] - hand[WRIST])
            if span > 1e-6:
                scale = span
                break

        seq[t] = np.concatenate(
            [(right / scale).ravel(), (left / scale).ravel(), (pose / scale).ravel()]
        )

    return seq
