"""Tests for training/split_by_signer.py — signer-independence guarantees."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "training"))

from split_by_signer import (  # noqa: E402
    assert_no_leakage,
    load_vocabulary,
    split_by_signer,
    validate_rows,
)


def make_rows(n_signers=6, clips_per_signer=4, gloss="GLOSS_HELLO"):
    return [
        {
            "clip_id": f"clip-{s}-{c}",
            "signer_id": f"signer-{s}",
            "gloss": gloss,
            "consent_id": f"consent-{s}",
            "notes": "",
        }
        for s in range(n_signers)
        for c in range(clips_per_signer)
    ]


class SplitTests(unittest.TestCase):
    def test_no_signer_appears_in_two_splits(self):
        splits = split_by_signer(make_rows(), (0.7, 0.15, 0.15), seed=42)
        assert_no_leakage(splits)  # raises on leakage
        all_signers = {r["signer_id"] for rows in splits.values() for r in rows}
        self.assertEqual(len(all_signers), 6)

    def test_all_clips_are_kept(self):
        rows = make_rows()
        splits = split_by_signer(rows, (0.7, 0.15, 0.15), seed=1)
        self.assertEqual(sum(len(v) for v in splits.values()), len(rows))

    def test_every_split_non_empty_with_many_signers(self):
        splits = split_by_signer(make_rows(n_signers=10), (0.7, 0.15, 0.15), seed=3)
        for name in ("train", "val", "test"):
            self.assertGreater(len(splits[name]), 0, name)

    def test_deterministic_for_same_seed(self):
        a = split_by_signer(make_rows(), (0.7, 0.15, 0.15), seed=7)
        b = split_by_signer(make_rows(), (0.7, 0.15, 0.15), seed=7)
        for name in a:
            self.assertEqual(
                [r["clip_id"] for r in a[name]], [r["clip_id"] for r in b[name]]
            )


class ValidationTests(unittest.TestCase):
    def test_valid_dataset_passes(self):
        vocab = {"GLOSS_HELLO"}
        self.assertEqual(validate_rows(make_rows(gloss="GLOSS_HELLO"), vocab), [])

    def test_too_few_signers_flagged(self):
        problems = validate_rows(make_rows(n_signers=2), None)
        self.assertTrue(any("signer" in p for p in problems))

    def test_unknown_gloss_flagged(self):
        problems = validate_rows(make_rows(gloss="NOT_IN_VOCAB"), {"GLOSS_HELLO"})
        self.assertTrue(any("vocabulary" in p for p in problems))

    def test_missing_consent_flagged(self):
        rows = make_rows()
        rows[0]["consent_id"] = "  "
        problems = validate_rows(rows, None)
        self.assertTrue(any("consent" in p for p in problems))

    def test_duplicate_clip_id_flagged(self):
        rows = make_rows(n_signers=4)
        rows[1]["clip_id"] = rows[0]["clip_id"]
        problems = validate_rows(rows, None)
        self.assertTrue(any("duplicate" in p for p in problems))


class VocabularyTests(unittest.TestCase):
    def test_template_vocabulary_ignores_comments(self):
        vocab = load_vocabulary(
            Path(__file__).resolve().parent.parent / "models" / "vocabulary.txt"
        )
        self.assertEqual(vocab, set())  # template ships without invented glosses


if __name__ == "__main__":
    unittest.main()
