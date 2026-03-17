#!/bin/bash
# Cron wrapper for offer-automator
# Runs a single batch and exits

export PATH="/Users/caiosantos/.local/share/fnm/node-versions/v24.14.0/installation/bin:$PATH"

PROJECT_DIR="/Users/caiosantos/Projects/offer-automator"
LOG_FILE="$PROJECT_DIR/logs/cron-$(date +%Y-%m-%d).log"

mkdir -p "$PROJECT_DIR/logs"

echo "=== Batch started at $(date) ===" >> "$LOG_FILE"
cd "$PROJECT_DIR" && npm run run-now >> "$LOG_FILE" 2>&1
echo "=== Batch finished at $(date) ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
