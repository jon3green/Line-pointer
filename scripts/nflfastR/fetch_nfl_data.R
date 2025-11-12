#!/usr/bin/env Rscript

# Fetch NFL play-by-play data using nflfastR
# Provides 20+ years of FREE NFL data for ML training

library(nflfastR)
library(dplyr)
library(jsonlite)
library(lubridate)

cat("🏈 Fetching NFL data using nflfastR...\n\n")

# Define seasons to download (last 10 years for training)
SEASONS <- 2014:2024
OUTPUT_DIR <- "data/nflfastR"

# Create output directory if it doesn't exist
dir.create(OUTPUT_DIR, recursive = TRUE, showWarnings = FALSE)

# ===== 1. LOAD PLAY-BY-PLAY DATA =====
cat("📥 Loading play-by-play data for seasons", min(SEASONS), "-", max(SEASONS), "...\n")

pbp_data <- load_pbp(SEASONS)

cat("✅ Loaded", nrow(pbp_data), "plays\n\n")

# ===== 2. AGGREGATE TO GAME LEVEL =====
cat("🔄 Aggregating to game-level statistics...\n")

game_stats <- pbp_data %>%
  filter(!is.na(posteam), !is.na(defteam)) %>%
  group_by(game_id, season, week, home_team, away_team) %>%
  summarise(
    game_date = first(game_date),

    # Home team stats
    home_score = first(home_score),
    home_total_yards = sum(yards_gained[posteam == home_team], na.rm = TRUE),
    home_passing_yards = sum(passing_yards[posteam == home_team], na.rm = TRUE),
    home_rushing_yards = sum(rushing_yards[posteam == home_team], na.rm = TRUE),
    home_turnovers = sum(interception[posteam == home_team] | fumble_lost[posteam == home_team], na.rm = TRUE),
    home_third_down_pct = mean(third_down_converted[posteam == home_team], na.rm = TRUE) * 100,
    home_red_zone_pct = mean(
      touchdown[posteam == home_team & yardline_100 <= 20],
      na.rm = TRUE
    ) * 100,
    home_time_of_possession = sum(as.numeric(game_seconds_remaining[posteam == home_team]), na.rm = TRUE) / 60,
    home_sacks_taken = sum(sack[posteam == home_team], na.rm = TRUE),
    home_penalties = sum(penalty[penalty_team == home_team], na.rm = TRUE),
    home_penalty_yards = sum(penalty_yards[penalty_team == home_team], na.rm = TRUE),

    # Away team stats
    away_score = first(away_score),
    away_total_yards = sum(yards_gained[posteam == away_team], na.rm = TRUE),
    away_passing_yards = sum(passing_yards[posteam == away_team], na.rm = TRUE),
    away_rushing_yards = sum(rushing_yards[posteam == away_team], na.rm = TRUE),
    away_turnovers = sum(interception[posteam == away_team] | fumble_lost[posteam == away_team], na.rm = TRUE),
    away_third_down_pct = mean(third_down_converted[posteam == away_team], na.rm = TRUE) * 100,
    away_red_zone_pct = mean(
      touchdown[posteam == away_team & yardline_100 <= 20],
      na.rm = TRUE
    ) * 100,
    away_time_of_possession = sum(as.numeric(game_seconds_remaining[posteam == away_team]), na.rm = TRUE) / 60,
    away_sacks_taken = sum(sack[posteam == away_team], na.rm = TRUE),
    away_penalties = sum(penalty[penalty_team == away_team], na.rm = TRUE),
    away_penalty_yards = sum(penalty_yards[penalty_team == away_team], na.rm = TRUE),

    # Game totals
    total_points = first(home_score) + first(away_score),
    point_differential = abs(first(home_score) - first(away_score)),

    .groups = "drop"
  )

cat("✅ Aggregated to", nrow(game_stats), "games\n\n")

# ===== 3. ADD TEAM SEASON STATS =====
cat("📊 Calculating team season statistics...\n")

team_season_stats <- pbp_data %>%
  filter(!is.na(posteam)) %>%
  group_by(season, posteam) %>%
  summarise(
    total_plays = n(),
    total_yards = sum(yards_gained, na.rm = TRUE),
    yards_per_play = mean(yards_gained, na.rm = TRUE),
    passing_yards = sum(passing_yards, na.rm = TRUE),
    rushing_yards = sum(rushing_yards, na.rm = TRUE),
    turnovers = sum(interception | fumble_lost, na.rm = TRUE),
    sacks_taken = sum(sack, na.rm = TRUE),
    third_down_conversion_pct = mean(third_down_converted, na.rm = TRUE) * 100,
    red_zone_touchdown_pct = mean(touchdown[yardline_100 <= 20], na.rm = TRUE) * 100,
    .groups = "drop"
  )

cat("✅ Calculated stats for", nrow(team_season_stats), "team-seasons\n\n")

# ===== 4. SAVE TO JSON =====
cat("💾 Saving data to JSON files...\n")

# Save game stats
game_stats_json <- toJSON(game_stats, pretty = TRUE, auto_unbox = TRUE)
write(game_stats_json, file.path(OUTPUT_DIR, "game_stats.json"))
cat("  ✓ Saved", file.path(OUTPUT_DIR, "game_stats.json"), "\n")

# Save team season stats
team_stats_json <- toJSON(team_season_stats, pretty = TRUE, auto_unbox = TRUE)
write(team_stats_json, file.path(OUTPUT_DIR, "team_season_stats.json"))
cat("  ✓ Saved", file.path(OUTPUT_DIR, "team_season_stats.json"), "\n")

# ===== 5. EXPORT SUMMARY STATS =====
summary_stats <- list(
  total_seasons = length(SEASONS),
  seasons_range = paste(min(SEASONS), "-", max(SEASONS)),
  total_games = nrow(game_stats),
  total_plays = nrow(pbp_data),
  total_teams = length(unique(c(game_stats$home_team, game_stats$away_team))),
  avg_points_per_game = mean(game_stats$total_points, na.rm = TRUE),
  avg_yards_per_play = mean(team_season_stats$yards_per_play, na.rm = TRUE),
  data_generated_at = format(Sys.time(), "%Y-%m-%d %H:%M:%S UTC")
)

summary_json <- toJSON(summary_stats, pretty = TRUE, auto_unbox = TRUE)
write(summary_json, file.path(OUTPUT_DIR, "summary.json"))
cat("  ✓ Saved", file.path(OUTPUT_DIR, "summary.json"), "\n\n")

# ===== 6. PRINT SUMMARY =====
cat("✅ nflfastR data fetch complete!\n\n")
cat("📊 Summary:\n")
cat("  - Seasons:", summary_stats$seasons_range, "\n")
cat("  - Total games:", summary_stats$total_games, "\n")
cat("  - Total plays:", summary_stats$total_plays, "\n")
cat("  - Avg points/game:", round(summary_stats$avg_points_per_game, 1), "\n")
cat("  - Avg yards/play:", round(summary_stats$avg_yards_per_play, 2), "\n")
cat("\n📁 Data saved to:", OUTPUT_DIR, "\n")
cat("\n🎯 Next step: Run backfill script to import into database\n")
cat("   npm run backfill:nfl\n")
