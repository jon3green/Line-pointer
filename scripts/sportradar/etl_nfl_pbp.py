#!/usr/bin/env python3
"""ETL pipeline to normalize Sportradar NFL play-by-play JSON into Parquet."""

import argparse
import json
import os
from pathlib import Path
from typing import List, Dict, Any

import polars as pl

RAW_COLUMNS = [
    "event_id",
    "game_id",
    "sequence",
    "period",
    "clock_seconds",
    "home_score",
    "away_score",
    "description",
    "play_type",
    "yards_gained",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Normalize Sportradar NFL PBP into Parquet")
    parser.add_argument("--input", "-i", required=True, help="Directory containing raw JSON files")
    parser.add_argument("--output", "-o", required=True, help="Directory for processed Parquet files")
    return parser.parse_args()


def load_json(file_path: Path) -> Dict[str, Any]:
    with file_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def flatten_game(game: Dict[str, Any]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []

    for drive in game.get("drives", []) or []:
        for play in drive.get("plays", []) or []:
            clock = play.get("clock") or {}
            minutes = clock.get("minutes", 0)
            seconds = clock.get("seconds", 0)
            clock_seconds = minutes * 60 + seconds

            rows.append(
                {
                    "event_id": play.get("id"),
                    "game_id": game.get("id"),
                    "sequence": play.get("sequence", 0),
                    "period": (play.get("period") or {}).get("number", 0),
                    "clock_seconds": clock_seconds,
                    "home_score": play.get("home_points", 0),
                    "away_score": play.get("away_points", 0),
                    "description": play.get("description", ""),
                    "play_type": play.get("type"),
                    "yards_gained": play.get("yards") or play.get("gain"),
                }
            )

    return rows


def build_dataframe(rows: List[Dict[str, Any]]) -> pl.DataFrame:
    if not rows:
        return pl.DataFrame(schema={column: pl.String for column in RAW_COLUMNS})

    return pl.DataFrame(rows, schema=[(column, pl.Float64) if column in {"clock_seconds", "yards_gained"} else (column, pl.Int64) if column in {"sequence", "period", "home_score", "away_score"} else (column, pl.Utf8) for column in RAW_COLUMNS])


def main():
    args = parse_args()
    input_dir = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    raw_files = sorted([path for path in input_dir.glob("*.json")])
    if not raw_files:
        raise RuntimeError(f"No JSON files found in {input_dir}")

    frames: List[pl.DataFrame] = []
    for index, raw_file in enumerate(raw_files, start=1):
        game_json = load_json(raw_file)
        rows = flatten_game(game_json)
        if not rows:
            continue
        frame = pl.DataFrame(rows)
        frames.append(frame)
        print(f"[{index}/{len(raw_files)}] {raw_file.name} → {frame.shape[0]} plays")

    if not frames:
        raise RuntimeError("No play data extracted from JSON files")

    combined = pl.concat(frames).sort(["game_id", "period", "sequence"])
    combined = combined.with_columns(
        [
            pl.col("clock_seconds").cast(pl.Float64),
            pl.col("yards_gained").cast(pl.Float64),
        ]
    )

    parquet_path = output_dir / "nfl_pbp_flat.parquet"
    combined.write_parquet(parquet_path)
    print(f"Written {combined.shape[0]} rows to {parquet_path}")


if __name__ == "__main__":
    main()
