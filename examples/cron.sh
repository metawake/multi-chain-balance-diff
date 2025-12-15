#!/usr/bin/env bash
#
# Cron script for hourly balance monitoring
#
# Setup:
#   1. chmod +x cron.sh
#   2. Edit WALLET_ADDRESS and LOG_DIR below
#   3. Add to crontab: 0 * * * * /path/to/cron.sh
#
# Logs JSON output to daily rotating files.
# Exit code 1 triggers alert (can be extended to notify).

set -euo pipefail

# Configuration
WALLET_ADDRESS="${WALLET_ADDRESS:-0xYourWalletAddress}"
NETWORK="${NETWORK:-mainnet}"
THRESHOLD="${THRESHOLD:-<-0.1}"
LOG_DIR="${LOG_DIR:-/var/log/mcbd}"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Log file (daily rotation)
LOG_FILE="$LOG_DIR/balance-$(date +%Y-%m-%d).ndjson"

# Run balance check
# Exit 0 = OK, Exit 1 = threshold triggered, Exit 2 = RPC error
mcbd \
  --address "$WALLET_ADDRESS" \
  --network "$NETWORK" \
  --alert-if-diff "$THRESHOLD" \
  --json >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

# Log exit code for monitoring
echo "{\"type\":\"cron_exit\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"exitCode\":$EXIT_CODE}" >> "$LOG_FILE"

# Optional: Alert on threshold breach
if [ $EXIT_CODE -eq 1 ]; then
  echo "Alert: Balance threshold triggered for $WALLET_ADDRESS on $NETWORK" >&2
  # Extend here: send email, Slack webhook, PagerDuty, etc.
fi

exit $EXIT_CODE

