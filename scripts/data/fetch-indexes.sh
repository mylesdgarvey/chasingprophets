#!/usr/bin/env bash
set -euo pipefail

# Download DJIA and SPX daily CSVs from Stooq (fallback provider)
# Outputs to data/raw/{DJIA,SPX}.csv

mkdir -p data/raw

DJIA_URL="https://stooq.com/q/d/l/?s=%5Edji&i=d"
SPX_URL="https://stooq.com/q/d/l/?s=%5Espx&i=d"

echo "Fetching DJIA CSV..."
curl -fsSL "$DJIA_URL" -o data/raw/DJIA.csv

echo "Fetching SPX CSV..."
curl -fsSL "$SPX_URL" -o data/raw/SPX.csv

echo "Done: data/raw/DJIA.csv, data/raw/SPX.csv"