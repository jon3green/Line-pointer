#!/usr/bin/env python3
"""
Play-by-Play Data Collector using nflfastR
Collects NFL play-by-play data and stores it for ML training
"""

import os
import sys
import json
import argparse
from datetime import datetime
from typing import Dict, List, Optional
import psycopg2
from psycopg2.extras import execute_batch

# Check if pandas is available (install with: pip install pandas)
try:
    import pandas as pd
    import numpy as np
except ImportError:
    print("ERROR: pandas and numpy are required. Install with: pip install pandas numpy")
    sys.exit(1)

# Check if nfl_data_py is available (install with: pip install nfl_data_py)
try:
    import nfl_data_py as nfl
except ImportError:
    print("ERROR: nfl_data_py is required. Install with: pip install nfl_data_py")
    sys.exit(1)


class NFLDataCollector:
    """Collects and processes NFL play-by-play data"""

    def __init__(self, db_url: Optional[str] = None):
        """Initialize with database connection"""
        self.db_url = db_url or os.getenv('POSTGRES_PRISMA_URL')
        self.conn = None

    def connect_db(self):
        """Connect to PostgreSQL database"""
        if not self.db_url:
            print("WARNING: No database URL provided, data will not be stored")
            return

        try:
            self.conn = psycopg2.connect(self.db_url)
            print("✓ Connected to database")
        except Exception as e:
            print(f"ERROR connecting to database: {e}")
            self.conn = None

    def fetch_play_by_play(self, years: List[int]) -> pd.DataFrame:
        """
        Fetch play-by-play data from nflfastR

        Args:
            years: List of years to fetch (e.g., [2020, 2021, 2022])

        Returns:
            DataFrame with play-by-play data
        """
        print(f"Fetching play-by-play data for years: {years}")

        try:
            # Import play-by-play data
            pbp_data = nfl.import_pbp_data(years, downcast=True, cache=True)
            print(f"✓ Fetched {len(pbp_data)} plays")
            return pbp_data
        except Exception as e:
            print(f"ERROR fetching play-by-play data: {e}")
            return pd.DataFrame()

    def fetch_team_stats(self, years: List[int]) -> pd.DataFrame:
        """
        Fetch team-level statistics

        Args:
            years: List of years to fetch

        Returns:
            DataFrame with team stats
        """
        print(f"Fetching team stats for years: {years}")

        try:
            weekly_data = nfl.import_weekly_data(years)

            # Aggregate by team and season
            team_stats = weekly_data.groupby(['season', 'recent_team']).agg({
                'passing_yards': 'sum',
                'rushing_yards': 'sum',
                'receiving_yards': 'sum',
                'completions': 'sum',
                'attempts': 'sum',
                'interceptions': 'sum',
                'sacks': 'sum',
                'sack_fumbles': 'sum',
                'rushing_tds': 'sum',
                'receiving_tds': 'sum',
                'passing_tds': 'sum',
            }).reset_index()

            print(f"✓ Aggregated stats for {len(team_stats)} team-seasons")
            return team_stats
        except Exception as e:
            print(f"ERROR fetching team stats: {e}")
            return pd.DataFrame()

    def calculate_team_features(self, pbp_data: pd.DataFrame) -> Dict[str, Dict]:
        """
        Calculate advanced team features from play-by-play data

        Features include:
        - Offensive/Defensive efficiency
        - Success rate
        - Explosive play rate
        - Red zone efficiency
        - Third down conversion rate
        - Time of possession
        - Play calling tendencies
        """
        features = {}

        try:
            # Group by team and game
            for team in pbp_data['posteam'].dropna().unique():
                team_plays = pbp_data[pbp_data['posteam'] == team]

                # Offensive features
                total_plays = len(team_plays)
                if total_plays == 0:
                    continue

                features[team] = {
                    # Efficiency metrics
                    'yards_per_play': team_plays['yards_gained'].mean(),
                    'success_rate': (team_plays['epa'] > 0).mean(),
                    'explosive_play_rate': (team_plays['yards_gained'] >= 15).mean(),

                    # Red zone (inside 20 yard line)
                    'redzone_td_rate': team_plays[team_plays['yardline_100'] <= 20]['touchdown'].mean(),

                    # Third down
                    'third_down_conv': team_plays[team_plays['down'] == 3]['first_down'].mean(),

                    # Play calling
                    'pass_rate': (team_plays['play_type'] == 'pass').mean(),
                    'run_rate': (team_plays['play_type'] == 'run').mean(),

                    # Advanced EPA metrics
                    'epa_per_play': team_plays['epa'].mean(),
                    'pass_epa': team_plays[team_plays['play_type'] == 'pass']['epa'].mean(),
                    'run_epa': team_plays[team_plays['play_type'] == 'run']['epa'].mean(),
                }

            print(f"✓ Calculated features for {len(features)} teams")
        except Exception as e:
            print(f"ERROR calculating team features: {e}")

        return features

    def store_training_data(self, features: Dict, output_file: str = 'training_data.json'):
        """
        Store training data to JSON file

        Args:
            features: Dictionary of team features
            output_file: Output filename
        """
        try:
            output_path = os.path.join(os.path.dirname(__file__), '..', '..', 'ml-service', 'data', output_file)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            with open(output_path, 'w') as f:
                json.dump(features, f, indent=2)

            print(f"✓ Saved training data to {output_path}")
        except Exception as e:
            print(f"ERROR saving training data: {e}")

    def export_to_csv(self, pbp_data: pd.DataFrame, team_stats: pd.DataFrame):
        """
        Export data to CSV for external analysis
        """
        try:
            data_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'ml-service', 'data')
            os.makedirs(data_dir, exist_ok=True)

            # Export play-by-play
            pbp_file = os.path.join(data_dir, 'nfl_pbp.csv')
            pbp_data.to_csv(pbp_file, index=False)
            print(f"✓ Exported play-by-play to {pbp_file}")

            # Export team stats
            stats_file = os.path.join(data_dir, 'nfl_team_stats.csv')
            team_stats.to_csv(stats_file, index=False)
            print(f"✓ Exported team stats to {stats_file}")
        except Exception as e:
            print(f"ERROR exporting to CSV: {e}")

    def run(self, years: List[int], export_csv: bool = True):
        """
        Main execution function

        Args:
            years: List of years to collect data for
            export_csv: Whether to export to CSV files
        """
        print(f"\n{'='*60}")
        print(f"NFL Data Collection - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}\n")

        # Connect to database
        self.connect_db()

        # Fetch data
        pbp_data = self.fetch_play_by_play(years)
        team_stats = self.fetch_team_stats(years)

        if pbp_data.empty:
            print("ERROR: No play-by-play data fetched")
            return

        # Calculate features
        features = self.calculate_team_features(pbp_data)

        # Store training data
        self.store_training_data(features)

        # Export to CSV if requested
        if export_csv:
            self.export_to_csv(pbp_data, team_stats)

        print(f"\n{'='*60}")
        print(f"✓ Data collection completed successfully")
        print(f"{'='*60}\n")

        if self.conn:
            self.conn.close()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Collect NFL play-by-play data using nflfastR')
    parser.add_argument(
        '--years',
        type=int,
        nargs='+',
        default=[2020, 2021, 2022, 2023, 2024],
        help='Years to collect data for (default: 2020-2024)'
    )
    parser.add_argument(
        '--no-csv',
        action='store_true',
        help='Skip CSV export'
    )
    parser.add_argument(
        '--db-url',
        type=str,
        help='Database connection URL (default: POSTGRES_PRISMA_URL env var)'
    )

    args = parser.parse_args()

    collector = NFLDataCollector(db_url=args.db_url)
    collector.run(years=args.years, export_csv=not args.no_csv)


if __name__ == '__main__':
    main()
