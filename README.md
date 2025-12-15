# multi-chain-balance-diff

[![npm version](https://img.shields.io/npm/v/multi-chain-balance-diff)](https://www.npmjs.com/package/multi-chain-balance-diff)
[![Tests](https://github.com/metawake/multi-chain-balance-diff/actions/workflows/test.yml/badge.svg)](https://github.com/metawake/multi-chain-balance-diff/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Compare wallet balances across EVM and Solana chains. Returns structured diffs.**

```bash
mcbd --address 0x... --network mainnet --json | jq '.native.diff'
```

## What

CLI that fetches balance at block N and block N-50, computes the difference, outputs JSON or pretty-prints. Supports Ethereum, Polygon, Base, Arbitrum, Optimism, Solana, Helium.

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
npx multi-chain-balance-diff --address 0x... --network mainnet

# or globally
npm install -g multi-chain-balance-diff
mcbd --address 0x...
```

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
| `solana` | Solana | SOL | USDC, BONK, JUP |
| `helium` | Solana | SOL | HNT, MOBILE, IOT, DC |

## Options

| Flag | Description |
|------|-------------|
| `-a, --address` | Wallet address |
| `-A, --addresses` | Multiple addresses (comma-sep or file path) |
| `-n, --network` | Target network (default: `mainnet`) |
| `-b, --blocks` | Lookback depth (default: `50`) |
| `-w, --watch` | Continuous monitoring mode |
| `-i, --interval` | Watch interval in seconds (default: `30`) |
| `--json` | JSON output |
| `--no-tokens` | Skip ERC-20/SPL token checks |
| `--alert-if-diff` | Exit 1 if diff matches condition (e.g., `">0.01"`, `"<-1"`) |

**Exit codes:** `0` OK · `1` diff triggered · `2` RPC failure

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

## Stability

- JSON schema is versioned. Breaking changes = major version bump.
- Adapter interface is stable.

## License

MIT

---

<!--
GitHub repo description (1 sentence):
CLI tool to fetch and diff wallet balances across EVM and Solana chains. JSON output, CI-friendly exit codes.

GitHub topics:
ethereum, solana, blockchain, cli, devops, monitoring, web3, defi
-->
