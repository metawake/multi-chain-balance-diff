# multi-chain-balance-diff

[![npm version](https://img.shields.io/npm/v/multi-chain-balance-diff)](https://www.npmjs.com/package/multi-chain-balance-diff)
[![Tests](https://github.com/metawake/multi-chain-balance-diff/actions/workflows/test.yml/badge.svg)](https://github.com/metawake/multi-chain-balance-diff/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> **`diff` for crypto balances. CLI-first, JSON-native, automation-ready.**

## Philosophy

```
┌──────────────────────────────────────────┐
│              Heavy Analytics             │
│  Nansen · Dune · Chainalysis             │
│  expensive · dashboards · slow           │
└──────────────────────────────────────────┘
                    ▲
┌──────────────────────────────────────────┐
│         Portfolio Aggregators            │
│  Zerion · DeBank · Zapper                │
│  UI-first · not scriptable               │
└──────────────────────────────────────────┘
                    ▲
┌──────────────────────────────────────────┐
│    ➤ Lightweight Dev Observability       │
│      multi-chain-balance-diff            │
│      CLI · JSON · automation-first       │
└──────────────────────────────────────────┘
                    ▲
┌──────────────────────────────────────────┐
│          Raw Infrastructure              │
│  RPCs · SDKs · Nodes · Indexers          │
└──────────────────────────────────────────┘
```

**This tool answers one question: "What changed?"**

Not *why* money moved. Just *what* changed. Like `diff`, `jq`, or `htop`—simple primitives that get reused everywhere.

### What this is NOT

- ❌ A portfolio tracker
- ❌ A dashboard product  
- ❌ A "smart money" analytics clone

## Quick Start

```bash
# No install required
npx multi-chain-balance-diff --address 0xYourAddress --network mainnet

# Or install globally
npm install -g multi-chain-balance-diff
mcbd --address 0xYourAddress
```

## Usage

```bash
# Check balance + diff over last 50 blocks
mcbd --address 0x... --network mainnet

# Multiple chains
mcbd --address 0x... --network base
mcbd --address 0x... --network arbitrum
mcbd --address <SOLANA_ADDR> --network solana

# JSON output (pipe to jq, use in CI)
mcbd --address 0x... --json

# Watch mode
mcbd --address 0x... --watch --interval 30

# Multiple addresses
mcbd --addresses 0xAAA...,0xBBB... --network mainnet
```

## Supported Networks

| Network | Type | Native | Tokens |
|---------|------|--------|--------|
| `mainnet` | EVM | ETH | USDC, USDT, stETH, ... |
| `polygon` | EVM | MATIC | USDC, USDT, WETH, ... |
| `base` | EVM | ETH | USDC, cbETH, DAI |
| `arbitrum` | EVM | ETH | USDC, ARB, GMX |
| `optimism` | EVM | ETH | USDC, OP, SNX |
| `solana` | Solana | SOL | USDC, BONK, JUP |
| `helium` | Solana | SOL | HNT, MOBILE, IOT, DC |

## CLI Options

| Option | Description |
|--------|-------------|
| `-a, --address` | Wallet address |
| `-A, --addresses` | Multiple addresses (comma-sep or file) |
| `-n, --network` | Network (default: `mainnet`) |
| `-b, --blocks` | Lookback range (default: `50`) |
| `-w, --watch` | Real-time monitoring |
| `-i, --interval` | Watch interval in seconds |
| `--json` | Machine-readable output |
| `--no-tokens` | Skip token checks |

## Architecture

```
src/
├── index.js              # CLI entry
├── config/networks.js    # Chain configs
├── adapters/
│   ├── baseAdapter.js    # Interface
│   ├── evmAdapter.js     # Ethereum/L2s
│   └── solanaAdapter.js  # Solana/Helium
└── services/
    └── balanceService.js
```

Adding a chain: extend `BaseAdapter`, add config to `networks.js`, register in `adapters/index.js`.

## License

MIT
