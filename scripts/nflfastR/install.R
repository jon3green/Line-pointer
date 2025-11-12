#!/usr/bin/env Rscript

# Install nflfastR and dependencies
# This script installs all required R packages for NFL data analysis

cat("Installing nflfastR and dependencies...\n")

# Install from CRAN
install.packages("nflfastR", repos = "https://cloud.r-project.org/")
install.packages("dplyr", repos = "https://cloud.r-project.org/")
install.packages("jsonlite", repos = "https://cloud.r-project.org/")
install.packages("lubridate", repos = "https://cloud.r-project.org/")

cat("\n✅ Installation complete!\n")
cat("Run ./fetch_nfl_data.R to download historical NFL data\n")
