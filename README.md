# multi-chain-balance-diff

[![Tests](https://github.com/metawake/multi-chain-balance-diff/actions/workflows/test.yml/badge.svg)](https://github.com/metawake/multi-chain-balance-diff/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Compare wallet balances across EVM and Solana chains. Returns structured diffs.**

```bash
mcbd --address 0x... --network mainnet --json | jq '.native.diff'
```

## What

CLI that fetches balance at block N and block N-50, computes the difference, outputs JSON or pretty-prints. Supports Ethereum, Polygon, Base, Arbitrum, Optimism, BNB Chain, Avalanche, Fantom, zkSync Era, Scroll, Solana, Helium, and TON.

## Who

Infrastructure engineers, protocol developers, and operators who need scriptable balance checks without spinning up dashboards or paying for analytics platforms.

## Why

Portfolio trackers are UI-only. Analytics platforms are expensive and slow. Raw RPC calls require boilerplate. This fills the gap: a `diff`-like primitive for on-chain balances that fits into shell scripts, cron jobs, and CI pipelines.

---

## Use Cases

### 1. Operations: Treasury monitoring

```bash
# Cron job: alert ops channel if treasury balance drops
mcbd --address 0xTreasury --network mainnet --json \
  | jq -e '.native.diffSign == "negative"' \
  && curl -X POST $SLACK_WEBHOOK -d '{"text":"Treasury balance decreased"}'
```

### 2. CI/Monitoring: Post-deployment sanity check

```bash
# GitHub Actions: fail pipeline if fee wallet drained unexpectedly
mcbd --address $FEE_WALLET --network base --alert-if-diff "<-0.1"
# exit 0 = OK, exit 1 = threshold breached, exit 2 = RPC error
```

> 📁 See [`.github/examples/`](./.github/examples/) for ready-to-use GitHub Actions workflows.

### 3. DeFi/Rewards: Staking reward accrual verification

```bash
# Verify staking rewards are accruing over 1000 blocks
mcbd --address $STAKER --network mainnet --blocks 1000 --json \
  | jq '.native.diff' 
# Expected: positive value if rewards distributed
```

---

## Install

```bash
npm install -g multi-chain-balance-diff
```

**One-shot (no install):**

```bash
npx multi-chain-balance-diff -a 0x... -n mainnet --json
```

---

## Quickstart (60 seconds)

```bash
# 1. Check a wallet balance diff (uses public RPC)
mcbd --address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 --network mainnet

# 2. Get JSON output, extract the diff
mcbd -a 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 -n mainnet --json | jq '.native.diff'

# 3. CI check: exit 1 if balance dropped more than 0.1 ETH
mcbd -a 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 -n mainnet --alert-if-diff "<-0.1"
echo "Exit code: $?"
# 0 = OK, 1 = threshold triggered, 2 = RPC error
```

**One-liner for npx (no install):**

```bash
npx multi-chain-balance-diff -a 0x... -n mainnet --json
```

---

## Usage

```bash
mcbd --address 0x... --network mainnet          # pretty output
mcbd --address 0x... --json                     # structured output
mcbd --address 0x... --blocks 1000              # custom lookback
mcbd --address 0x... --watch --interval 30      # continuous monitoring
mcbd --addresses 0xA,0xB,0xC --network base     # batch
mcbd --address 0x... --alert-if-diff ">0.01"   # CI threshold
```

## Networks

| Key | Type | Native | Tokens |
|-----|------|--------|--------|
| `mainnet` | EVM | ETH | USDC, USDT, stETH |
| `polygon` | EVM | MATIC | USDC, USDT, WETH |
| `base` | EVM | ETH | USDC, cbETH, DAI |
| `arbitrum` | EVM | ETH | USDC, ARB, GMX |
| `optimism` | EVM | ETH | USDC, OP, SNX |
| `bnb` | EVM | BNB | USDT, USDC, BUSD |
| `avalanche` | EVM | AVAX | USDC, USDT |
| `fantom` | EVM | FTM | USDC, USDT, DAI |
| `zksync` | EVM | ETH | USDC, USDT |
| `scroll` | EVM | ETH | USDC, USDT, WETH |
| `solana` | Solana | SOL | USDC, BONK, JUP |
| `helium` | Solana | SOL | HNT, MOBILE, IOT, DC |
| `ton` | TON | TON | — |

## Options

| Flag | Description |
|------|-------------|
| `-a, --address` | Wallet address |
| `-A, --addresses` | Multiple addresses (comma-sep or file path) |
| `-n, --network` | Target network (default: `mainnet`) |
| `-b, --blocks` | Lookback depth (default: `50`) |
| `-w, --watch` | Continuous monitoring mode |
| `-i, --interval` | Watch interval in seconds (default: `30`) |
| `-c, --count` | Exit after N polls (watch mode) |
| `--exit-on-error` | Exit immediately on RPC failure (watch mode) |
| `--exit-on-diff` | Exit immediately when threshold triggers (watch mode) |
| `--json` | JSON output |
| `--no-tokens` | Skip ERC-20/SPL token checks |
| `--alert-if-diff` | Exit 1 if diff matches condition (e.g., `">0.01"`, `"<-1"`) |
| `--alert-pct` | Exit 1 if diff exceeds % of balance (e.g., `">5"`, `"<-10"`) |
| `--timeout` | RPC request timeout in seconds (default: `30`) |
| `--webhook` | POST JSON payload to URL when alert triggers |

**Exit codes:** `0` OK · `1` diff triggered · `2` RPC failure/timeout · `130` SIGINT

---

## Exit Codes & Batch Semantics

| Code | Meaning | When |
|------|---------|------|
| `0` | OK | No threshold triggered, all queries succeeded |
| `1` | Diff triggered | Threshold condition matched (any address) |
| `2` | RPC error | Network/connection failure |
| `130` | SIGINT | User interrupted (Ctrl+C) |

**Batch mode (`--addresses`)**: Returns exit `1` if *any* address triggers the threshold. Partial failures are included in JSON output with `error` field per address; successful queries still return data.

---

## Configuration

### Custom RPC Endpoints

Override default public RPCs with environment variables:

| Variable | Network |
|----------|---------|
| `RPC_URL_ETH` | Ethereum Mainnet |
| `RPC_URL_POLYGON` | Polygon |
| `RPC_URL_BASE` | Base |
| `RPC_URL_ARBITRUM` | Arbitrum |
| `RPC_URL_OPTIMISM` | Optimism |
| `RPC_URL_SOLANA` | Solana / Helium |
| `RPC_URL_SEPOLIA` | Sepolia testnet |

```bash
# Use private RPC for reliability
export RPC_URL_ETH=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
mcbd -a 0x... -n mainnet --json
```

### Timeout

Default timeout is 30 seconds. Adjust for slow or unreliable RPCs:

```bash
mcbd -a 0x... -n mainnet --timeout 60    # 60 seconds
mcbd -a 0x... -n solana --timeout 10     # 10 seconds (fast-fail)
```

### Webhooks

POST JSON payload to a URL when an alert triggers:

```bash
# Slack webhook
mcbd -a 0xTreasury -n mainnet --alert-if-diff "<-1" \
  --webhook https://hooks.slack.com/services/XXX/YYY/ZZZ --json

# Discord webhook
mcbd -a 0xTreasury -n base --alert-pct "<-5" \
  --webhook https://discord.com/api/webhooks/XXX/YYY --json

# Custom endpoint
mcbd -a 0xTreasury -n polygon --alert-if-diff ">0.1" \
  --webhook https://your-server.com/balance-alert --json
```

The webhook payload includes the full JSON output plus a `webhook.sentAt` timestamp.

---

## Common Failure Modes

### RPC Rate Limits

Public RPCs have strict rate limits. Symptoms: `429 Too Many Requests` or slow responses.

```bash
# Solution: Use a private RPC
export RPC_URL_ETH=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### Timeout / Slow RPC

```bash
# Increase timeout for slow networks
mcbd -a 0x... -n mainnet --timeout 60
```

### Unavailable Chain / RPC Down

```json
{"schemaVersion":"0.1.0","error":"connect ECONNREFUSED","code":"ECONNREFUSED","exitCode":2}
```

Exit code `2` indicates RPC failure. Check network connectivity and RPC URL.

### Invalid Address Format

```bash
$ mcbd --address invalid --network mainnet --json
{"schemaVersion":"0.1.0","error":"Invalid EVM address: invalid"}
```

EVM addresses must be `0x` + 40 hex chars. Solana addresses are base58 encoded.

---

## Watch Mode for CI/Cron

Watch mode is designed for long-running monitoring, cron jobs, and CI pipelines.

### Patterns

```bash
# One-shot: poll once, exit on threshold
mcbd -a $ADDR -n base --count 1 --alert-if-diff ">0.01" --json

# CI health check: 5 polls, fail fast on error or diff
mcbd -a $ADDR -n mainnet --watch --count 5 \
  --exit-on-error --exit-on-diff --alert-pct ">10" --json

# Cron monitor: 10 polls over 5 minutes, log NDJSON
mcbd -a $ADDR -n solana --watch --interval 30 --count 10 --json >> /var/log/balance.ndjson

# Infinite watch with alerts (SIGINT to stop)
mcbd -a $ADDR -n polygon --watch --interval 60 --alert-if-diff "<-1"
```

### Example Output

**Normal operation (no diff):**

```json
{
  "schemaVersion": "0.1.0",
  "network": { "key": "mainnet", "name": "Ethereum Mainnet", "chainType": "evm", "chainId": 1 },
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "explorer": "https://etherscan.io/address/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "block": { "current": 19234567, "previous": 19234517 },
  "native": {
    "symbol": "ETH",
    "decimals": 18,
    "balance": "1.234567",
    "balanceRaw": "1234567000000000000",
    "diff": "0",
    "diffRaw": "0",
    "diffSign": "positive"
  },
  "tokens": [],
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

Exit: `0`

**Diff detected (threshold triggered):**

```json
{
  "schemaVersion": "0.1.0",
  "network": { "key": "base", "name": "Base", "chainType": "evm", "chainId": 8453 },
  "address": "0xTreasury...",
  "block": { "current": 8765432, "previous": 8765382 },
  "native": {
    "symbol": "ETH",
    "balance": "10.5",
    "diff": "0.05",
    "diffRaw": "50000000000000000",
    "diffSign": "positive"
  },
  "alert": {
    "threshold": ">0.01",
    "thresholdPct": null,
    "triggered": true,
    "triggeredBy": "absolute"
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

Exit: `1`

**Error state (RPC unavailable):**

```json
{
  "schemaVersion": "0.1.0",
  "error": "connect ECONNREFUSED 127.0.0.1:8545",
  "code": "ECONNREFUSED",
  "exitCode": 2
}
```

Exit: `2`

**Watch mode NDJSON stream:**

```json
{"schemaVersion":"0.1.0","type":"watch_start","timestamp":"2025-01-15T10:30:00.000Z","network":"mainnet","address":"0x...","interval":30,"count":3}
{"schemaVersion":"0.1.0","timestamp":"2025-01-15T10:30:00.500Z","address":"0x...","block":19234567,"balance":"1.234","diff":"0","alert":false,"poll":1}
{"schemaVersion":"0.1.0","timestamp":"2025-01-15T10:30:30.500Z","address":"0x...","block":19234569,"balance":"1.234","diff":"0","alert":false,"poll":2}
{"schemaVersion":"0.1.0","timestamp":"2025-01-15T10:31:00.500Z","address":"0x...","block":19234571,"balance":"1.235","diff":"0.001","alert":true,"poll":3}
{"schemaVersion":"0.1.0","type":"watch_end","timestamp":"2025-01-15T10:31:00.600Z","polls":3,"exitCode":1}
```

---

## Extending

```
src/
├── index.js              # CLI
├── config/networks.js    # Chain definitions
├── adapters/
│   ├── baseAdapter.js    # Interface
│   ├── evmAdapter.js     # ethers.js
│   └── solanaAdapter.js  # @solana/web3.js
```

Add a chain: implement `BaseAdapter`, add to `networks.js`, register in `adapters/index.js`.

## JSON Schema

JSON output includes a `schemaVersion` field (e.g., `"0.1.0"`). Schema changes are versioned:

- **Patch**: Documentation, new optional fields
- **Minor**: New output types, additive changes  
- **Major**: Breaking changes to existing fields

See [`schema/mcbd-output.schema.json`](./schema/mcbd-output.schema.json) for the full specification.

## Stability

- JSON schema is versioned. Breaking changes = major version bump.
- Adapter interface is stable. New chains can be added without breaking existing integrations.
- See [CHANGELOG.md](./CHANGELOG.md) for release history.

## License

MIT

---

## Author

Built by [Alex Alexapolsky](https://www.linkedin.com/in/alexey-a-181a614/) ([@metawake](https://github.com/metawake)). Available for Web3 infra consulting and contract work.

If this tool saves you time: [GitHub Sponsors](https://github.com/sponsors/metawake) · Tips: `0x0a542565b3615e8fc934cc3cc4921a0c22e5dc5e`

---

<!--
GitHub repo description (1 sentence):
CLI tool to fetch and diff wallet balances across EVM and Solana chains. JSON output, CI-friendly exit codes.

GitHub topics:
ethereum, solana, blockchain, cli, devops, monitoring, web3, defi
-->
