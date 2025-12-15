#!/usr/bin/env bash
#
# Slack webhook notification for balance threshold alerts
#
# Usage:
#   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... \
#   WALLET_ADDRESS=0x... \
#   ./slack-webhook.sh
#
# Sends a Slack message when balance diff exceeds threshold.
# Requires: curl, jq, mcbd

set -euo pipefail

# Configuration
WALLET_ADDRESS="${WALLET_ADDRESS:?WALLET_ADDRESS required}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:?SLACK_WEBHOOK_URL required}"
NETWORK="${NETWORK:-mainnet}"
THRESHOLD="${THRESHOLD:-<-0.1}"

# Run balance check, capture output
RESULT=$(mcbd \
  --address "$WALLET_ADDRESS" \
  --network "$NETWORK" \
  --alert-if-diff "$THRESHOLD" \
  --json 2>&1) || EXIT_CODE=$?

EXIT_CODE=${EXIT_CODE:-0}

# Parse result
BALANCE=$(echo "$RESULT" | jq -r '.native.balance // "unknown"')
DIFF=$(echo "$RESULT" | jq -r '.native.diff // "unknown"')
DIFF_SIGN=$(echo "$RESULT" | jq -r '.native.diffSign // "unknown"')
SYMBOL=$(echo "$RESULT" | jq -r '.native.symbol // "ETH"')
ALERT_TRIGGERED=$(echo "$RESULT" | jq -r '.alert.triggered // false')
ERROR=$(echo "$RESULT" | jq -r '.error // empty')

# Only notify on threshold breach or error
if [ $EXIT_CODE -eq 0 ]; then
  echo "No alert triggered. Balance: $BALANCE $SYMBOL, Diff: $DIFF_SIGN$DIFF"
  exit 0
fi

# Build Slack message
if [ -n "$ERROR" ]; then
  # Error notification
  MESSAGE=":warning: *Balance Check Error*\n\nAddress: \`${WALLET_ADDRESS:0:10}...${WALLET_ADDRESS: -6}\`\nNetwork: $NETWORK\nError: $ERROR"
  COLOR="warning"
else
  # Threshold notification
  SIGN_EMOJI=$([ "$DIFF_SIGN" = "positive" ] && echo ":chart_with_upwards_trend:" || echo ":chart_with_downwards_trend:")
  MESSAGE="$SIGN_EMOJI *Balance Threshold Alert*\n\nAddress: \`${WALLET_ADDRESS:0:10}...${WALLET_ADDRESS: -6}\`\nNetwork: $NETWORK\nBalance: $BALANCE $SYMBOL\nDiff: $DIFF_SIGN $DIFF $SYMBOL\nThreshold: \`$THRESHOLD\`"
  COLOR="danger"
fi

# Send to Slack
curl -s -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{
    \"attachments\": [{
      \"color\": \"$COLOR\",
      \"text\": \"$MESSAGE\",
      \"mrkdwn_in\": [\"text\"]
    }]
  }" > /dev/null

echo "Slack notification sent (exit code: $EXIT_CODE)"
exit $EXIT_CODE

