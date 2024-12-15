# multi-chain-balance-diff

[![npm version](https://img.shields.io/npm/v/multi-chain-balance-diff)](https://www.npmjs.com/package/multi-chain-balance-diff)
[![Tests](https://github.com/metawake/multi-chain-balance-diff/actions/workflows/test.yml/badge.svg)](https://github.com/metawake/multi-chain-balance-diff/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

> **One command to track your crypto across every chain.**

A CLI tool to fetch and compare wallet balances across **multiple blockchains**. Supports EVM chains (Ethereum, Polygon, Base, Arbitrum, Optimism) and Solana (including Helium ecosystem tokens).

Built for developers working on multi-chain staking infrastructure, LST/LRT protocols, and DeFi analytics.

## Demo

```bash
$ mcbd --address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 --network mainnet

🔗 Connecting to Ethereum Mainnet...
📊 Fetching balance data for 0xd8dA6B...96045
🪙  Checking 5 tokens...

═════════════════════════════════════════════════════════════════
  Ethereum Mainnet
─────────────────────────────────────────────────────────────────
  Current block: 21,234,567
  Address: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
  Explorer: https://etherscan.io/address/0xd8dA6BF26964aF9...
─────────────────────────────────────────────────────────────────
  Native balance: 1,234.567891 ETH
  Δ over 50 blocks: +0.02 ETH
    (21,234,517 → 21,234,567)
─────────────────────────────────────────────────────────────────
  Tokens:
    USDC       50,000.00
    stETH      100.5
═════════════════════════════════════════════════════════════════
```

## Features

- ✅ **Multi-chain support** — EVM (Ethereum, Polygon, Base, Arbitrum, Optimism) and Solana
- ✅ **Native balance diff** — Track balance changes over N blocks/slots
- ✅ **Token balances** — ERC-20 (EVM) and SPL tokens (Solana)
- ✅ **Helium ecosystem** — HNT, MOBILE, IOT, DC token tracking
- ✅ **JSON output** — Pipe to `jq`, use in scripts and CI/CD
- ✅ **Multi-address** — Check multiple wallets in one command
- ✅ **Watch mode** — Real-time balance monitoring
- ✅ **Config profiles** — Save addresses for quick access
- ✅ **Adapter pattern** — Easy to add new chains

## Why This Tool?

When building staking or restaking infrastructure, you often need to:
- **Track balance changes** over time to verify reward accrual
- **Monitor multiple chains** from a single interface  
- **Debug transactions** by comparing before/after states
- **Track Helium hotspot rewards** (HNT, MOBILE, IOT)
- **Automate monitoring** with JSON output for scripts/webhooks

## Quick Start

### Using npx (no install required)

```bash
npx multi-chain-balance-diff --address 0xYourAddress --network mainnet
```

### Global Installation

```bash
npm install -g multi-chain-balance-diff

# Now you can use any of these commands:
mcbd --address 0xYourAddress
balance-diff --address 0xYourAddress
multi-chain-balance-diff --address 0xYourAddress
```

### From Source

```bash
git clone https://github.com/metawake/multi-chain-balance-diff.git
cd multi-chain-balance-diff
npm install
node src/index.js --address 0xYourAddress
```

## Usage

### List supported networks

```bash
mcbd --list-networks
```

### Ethereum balance

```bash
mcbd --address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

### L2 Networks

```bash
mcbd --address 0x... --network base
mcbd --address 0x... --network arbitrum
mcbd --address 0x... --network optimism
```

### Solana balance

```bash
mcbd --address 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM --network solana
```

### Helium tokens (HNT, MOBILE, IOT)

```bash
mcbd --address <SOLANA_ADDRESS> --network helium
```

### Multiple addresses

```bash
# Comma-separated
mcbd --addresses 0xAAA...,0xBBB...,0xCCC... --network mainnet

# From file (one address per line)
mcbd --addresses addresses.txt --network mainnet
```

Output for multiple addresses:
```
═════════════════════════════════════════════════════════════════
  Ethereum Mainnet — 3 addresses
═════════════════════════════════════════════════════════════════
  ✓ 0xAAA...AAA      12.5 ETH  +0.02 ETH
  ✓ 0xBBB...BBB       3.2 ETH  +0 ETH
  ✓ 0xCCC...CCC      45.1 ETH  -2.00 ETH
─────────────────────────────────────────────────────────────────
  Total:             60.8 ETH  -1.98 ETH
═════════════════════════════════════════════════════════════════
```

### Watch mode

Real-time balance monitoring with configurable interval:

```bash
# Watch balance every 30 seconds (default)
mcbd --address 0x... --watch

# Custom interval (10 seconds)
mcbd --address 0x... --watch --interval 10

# Watch Helium rewards
mcbd --address <SOLANA_ADDRESS> --network helium --watch --interval 60
```

Output:
```
🔄 Watch mode — monitoring 0xd8dA6B...96045
   Network: Ethereum Mainnet
   Interval: 30s
   Press Ctrl+C to exit

─────────────────────────────────────────────────────────────────
  [14:32:01] 1234.56 ETH  Δ50: +0.02 ETH
  [14:32:31] 1234.58 ETH  Δ50: +0.02 ETH (+0.02 since last check)
  [14:33:01] 1234.58 ETH  Δ50: +0.02 ETH
```

### Config profiles

Create a `.balancediffrc.json` file in your project or home directory:

```json
{
  "profiles": {
    "vitalik": {
      "network": "mainnet",
      "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    },
    "my-hotspot": {
      "network": "helium",
      "address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
    },
    "treasury": {
      "network": "base",
      "address": ["0xAAA...", "0xBBB...", "0xCCC..."]
    }
  }
}
```

Then use profiles:

```bash
mcbd --profile vitalik
mcbd --profile my-hotspot --watch
mcbd --profile treasury
```

Config file locations (searched in order):
1. `.balancediffrc.json` (current directory)
2. `.balancediffrc` (current directory)
3. `~/.balancediffrc.json`
4. `~/.config/balancediff/config.json`

### Change diff range

```bash
# Compare balance now vs 1000 blocks ago
mcbd --address 0x... --blocks 1000
```

### Skip token checks

```bash
mcbd --address 0x... --no-tokens
```

### JSON output

```bash
# Get structured output for scripting
mcbd --address 0x... --json

# Pipe to jq for filtering
mcbd --address 0x... --json | jq '.tokens[] | select(.symbol == "USDC")'

# Use in shell scripts
BALANCE=$(mcbd --address 0x... --json | jq -r '.native.balance')
echo "Current balance: $BALANCE ETH"
```

## Example JSON Output

```json
{
  "network": {
    "key": "mainnet",
    "name": "Ethereum Mainnet",
    "chainType": "evm",
    "chainId": 1
  },
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "explorer": "https://etherscan.io/address/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "block": {
    "current": 21234567,
    "previous": 21234517
  },
  "native": {
    "symbol": "ETH",
    "decimals": 18,
    "balance": "1234.567891",
    "balanceRaw": "1234567891000000000000",
    "diff": "0.02",
    "diffRaw": "20000000000000000",
    "diffSign": "positive"
  },
  "tokens": [
    {
      "symbol": "USDC",
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "decimals": 6,
      "balance": "50000.00",
      "balanceRaw": "50000000000"
    }
  ],
  "timestamp": "2024-12-15T10:30:00.000Z"
}
```

## Supported Networks

| Network | Chain Type | Chain ID | Native Token | Tokens |
|---------|------------|----------|--------------|--------|
| `mainnet` | EVM | 1 | ETH | USDC, USDT, UNI, LINK, stETH |
| `polygon` | EVM | 137 | MATIC | USDC, USDT, WETH, LINK |
| `base` | EVM | 8453 | ETH | USDC, USDbC, cbETH, DAI |
| `arbitrum` | EVM | 42161 | ETH | USDC, USDT, ARB, GMX, WETH |
| `optimism` | EVM | 10 | ETH | USDC, USDT, OP, SNX, WETH |
| `sepolia` | EVM | 11155111 | ETH | LINK |
| `solana` | Solana | - | SOL | USDC, BONK, JUP |
| `helium` | Solana | - | SOL | HNT, MOBILE, IOT, DC |
| `solana-devnet` | Solana | - | SOL | - |

## Configuration

```bash
cp .env.example .env
```

Optional: Add your own RPC URLs for better rate limits:

```env
RPC_URL_ETH=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_URL_POLYGON=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_URL_BASE=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_URL_ARBITRUM=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_URL_OPTIMISM=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_URL_SOLANA=https://api.mainnet-beta.solana.com
```

## Architecture

```
src/
├── index.js                 # CLI entry point
├── config/
│   └── networks.js          # Chain configurations (RPC, tokens)
├── adapters/
│   ├── index.js             # Adapter factory
│   ├── baseAdapter.js       # Abstract interface
│   ├── evmAdapter.js        # Ethereum/Polygon/L2s (ethers.js)
│   └── solanaAdapter.js     # Solana/Helium (@solana/web3.js)
└── services/
    └── balanceService.js    # Legacy (kept for reference)
```

### Adding a New Chain

1. Create `src/adapters/newChainAdapter.js` extending `BaseAdapter`
2. Implement required methods: `connect()`, `getNativeBalance()`, `getTokenBalances()`, etc.
3. Add chain config to `src/config/networks.js` with `chainType: 'newchain'`
4. Register in `src/adapters/index.js` ADAPTER_MAP

## Prerequisites

- **Node.js** v18+
- **npm** v8+

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-a, --address <addr>` | Wallet address to check | - |
| `-A, --addresses <addrs>` | Multiple addresses (comma-separated or file) | - |
| `-n, --network <net>` | Network to query | `mainnet` |
| `-b, --blocks <num>` | Blocks/slots to look back | `50` |
| `-w, --watch` | Enable watch mode | `false` |
| `-i, --interval <sec>` | Watch interval in seconds | `30` |
| `-p, --profile <name>` | Use saved profile | - |
| `--config <path>` | Path to config file | - |
| `--no-tokens` | Skip token balance checks | - |
| `--json` | Output as JSON | `false` |
| `--list-networks` | List supported networks | - |

## Future Extensions

### Short-term
- [x] JSON output mode (`--json`)
- [x] Multi-address support
- [x] Watch mode (`--watch`)
- [x] Config file support
- [x] L2 chains (Base, Arbitrum, Optimism)
- [ ] Balance diff for tokens (not just native)
- [ ] USD value display via CoinGecko

### Medium-term
- [ ] REST API wrapper (Express/Fastify)
- [ ] WebSocket subscriptions for real-time updates
- [ ] Postgres integration for historical tracking
- [ ] ENS/SNS name resolution

### Long-term (LST/LRT focused)
- [ ] Staking contract event indexing
- [ ] Reward calculation engine
- [ ] Integration with Lido, Rocket Pool, EigenLayer
- [ ] Helium hotspot reward analytics

## Extending for Staking Use Cases

The adapter pattern makes it easy to add staking-specific functionality:

```javascript
// Example: Add to EVMAdapter for staking event tracking
async subscribeToStakingEvents(contractAddress, callback) {
  const contract = new ethers.Contract(contractAddress, STAKING_ABI, this.provider);
  contract.on('Staked', (user, amount, event) => {
    callback({ type: 'stake', user, amount, block: event.blockNumber });
  });
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
