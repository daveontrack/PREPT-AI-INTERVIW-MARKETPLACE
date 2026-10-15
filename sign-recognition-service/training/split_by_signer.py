"""Signer-independent train/val/test split for the EthSL dataset.

The single most important evaluation rule from the dataset strategy: **split
by signer, never by clip**. A signer seen during training must never appear in
validation or test — random clip splits inflate accuracy massively (the ~94%
vs ~73% gap in the published EthSL research is exactly this effect).

Usage (from sign-recognition-service/):

    python training/split_by_signer.py \
        --annotations data/annotations/annotations.csv \
        --out data/splits \
        --ratios 0.7,0.15,0.15 \
        --seed 42 \
        [--vocabulary models/vocabulary.txt]

Input CSV columns: clip_id, signer_id, gloss [, consent_id, notes]
Output: {out}/train.csv, val.csv, test.csv + split_report.json
Exit code 2 when the input is invalid (missing consent ids, unknown glosses,
too few signers, empty splits).
"""

from __future__ import annotations

import argparse
import csv
import json
import random
import sys
from collections import defaultdict
from pathlib import Path

REQUIRED_COLUMNS = ("clip_id", "signer_id", "gloss")
MIN_SIGNERS = 3  # below this, signer-independent evaluation is meaningless


def load_annotations(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        cols = set(reader.fieldnames or [])
        missing = [c for c in REQUIRED_COLUMNS if c not in cols]
        if missing:
            raise ValueError(f"annotations CSV missing columns: {missing}")
        rows = [row for row in reader if any(row.values())]
    if not rows:
        raise ValueError("annotations CSV is empty")
    return rows


def load_vocabulary(path: Path) -> set[str]:
    return {
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    }


def validate_rows(rows: list[dict], vocabulary: set[str] | None) -> list[str]:
    """Returns a list of human-readable problems (empty == valid)."""
    problems: list[str] = []

    clip_ids = [r["clip_id"].strip() for r in rows]
    dupes = {c for c in clip_ids if clip_ids.count(c) > 1}
    if dupes:
        problems.append(f"duplicate clip_id values: {sorted(dupes)[:5]}")

    for r in rows:
        if "consent_id" in r and not (r.get("consent_id") or "").strip():
            problems.append(f"clip {r['clip_id']}: missing consent_id")
        if vocabulary is not None and r["gloss"].strip() not in vocabulary:
            problems.append(
                f"clip {r['clip_id']}: gloss {r['gloss']!r} not in vocabulary"
            )

    signers = {r["signer_id"].strip() for r in rows}
    if len(signers) < MIN_SIGNERS:
        problems.append(
            f"only {len(signers)} signer(s) present — need >= {MIN_SIGNERS} "
            "for a signer-independent split"
        )

    return problems


def split_by_signer(
    rows: list[dict], ratios: tuple[float, float, float], seed: int
) -> dict[str, list[dict]]:
    """Assigns whole signers to splits. No signer can appear in two splits."""
    by_signer: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_signer[r["signer_id"].strip()].append(r)

    signers = sorted(by_signer)
    random.Random(seed).shuffle(signers)

    total = len(signers)
    n_train = max(1, round(total * ratios[0]))
    n_val = max(1, round(total * ratios[1]))
    if n_train + n_val >= total:  # keep at least one signer for test
        n_val = max(1, total - n_train - 1)
    n_test = total - n_train - n_val

    groups = {
        "train": signers[:n_train],
        "val": signers[n_train : n_train + n_val],
        "test": signers[n_train + n_val : n_train + n_val + n_test],
    }
    return {
        name: [r for s in group for r in by_signer[s]]
        for name, group in groups.items()
    }


def assert_no_leakage(splits: dict[str, list[dict]]) -> None:
    seen: dict[str, str] = {}
    for split, rows in splits.items():
        for r in rows:
            signer = r["signer_id"].strip()
            prev = seen.get(signer)
            if prev is not None and prev != split:
                raise AssertionError(
                    f"signer leakage: {signer} appears in both {prev} and {split}"
                )
            seen[signer] = split


def write_splits(out_dir: Path, splits: dict[str, list[dict]]) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    fieldnames = ["clip_id", "signer_id", "gloss", "consent_id", "notes"]
    for name, rows in splits.items():
        with (out_dir / f"{name}.csv").open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(rows)

    report = {
        name: {
            "clips": len(rows),
            "signers": sorted({r["signer_id"].strip() for r in rows}),
            "glosses": sorted({r["gloss"].strip() for r in rows}),
        }
        for name, rows in splits.items()
    }
    (out_dir / "split_report.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--annotations", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--ratios", default="0.7,0.15,0.15")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--vocabulary", type=Path, default=None)
    args = parser.parse_args(argv)

    try:
        ratios = tuple(float(x) for x in args.ratios.split(","))
        if len(ratios) != 3 or any(r < 0 for r in ratios) or sum(ratios) <= 0:
            raise ValueError("--ratios must be three non-negative numbers")
        ratios = tuple(r / sum(ratios) for r in ratios)

        rows = load_annotations(args.annotations)
        vocabulary = load_vocabulary(args.vocabulary) if args.vocabulary else None

        problems = validate_rows(rows, vocabulary)
        if problems:
            print("Dataset validation failed:", file=sys.stderr)
            for p in problems[:20]:
                print(f"  - {p}", file=sys.stderr)
            if len(problems) > 20:
                print(f"  … and {len(problems) - 20} more", file=sys.stderr)
            return 2

        splits = split_by_signer(rows, ratios, args.seed)  # type: ignore[arg-type]
        assert_no_leakage(splits)
        write_splits(args.out, splits)

        for name, split_rows in splits.items():
            signers = {r["signer_id"].strip() for r in split_rows}
            print(f"{name}: {len(split_rows)} clips / {len(signers)} signers")
        print(f"Wrote {args.out}/train.csv, val.csv, test.csv, split_report.json")
        return 0
    except (ValueError, OSError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
