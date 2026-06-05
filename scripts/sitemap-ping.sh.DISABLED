#!/bin/bash
# Daily Sitemap Ping — Notifies Google of updated sitemaps
# Run daily at 4:00 AM to align with Google's crawl schedule
set -euo pipefail

BASE="https://www.qfinhub.com"
SITEMAPS=(
  "${BASE}/sitemap.xml"
  "${BASE}/scenario/sitemap.xml"  
  "${BASE}/news-sitemap.xml"
)

LOG_DIR="/home/admin1/qfinhub/.indexing-data"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/ping-$(date +%Y%m%d).log"

echo "=== Sitemap Ping $(date) ===" > "$LOG_FILE"

for sm in "${SITEMAPS[@]}"; do
  echo "Pinging: ${sm}" | tee -a "$LOG_FILE"
  response=$(curl -s -o /dev/null -w "%{http_code}" "https://www.google.com/ping?sitemap=${sm}")
  echo "  Response: ${response}" | tee -a "$LOG_FILE"
  sleep 2
done

echo "Done. $(date)" | tee -a "$LOG_FILE"
