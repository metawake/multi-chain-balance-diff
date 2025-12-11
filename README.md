# multi-chain-balance-diff

A minimal CLI tool to fetch and compare wallet balances across EVM chains. Built for developers working on multi-chain staking infrastructure, LST/LRT protocols, and DeFi analytics.

## Why This Tool?

When building staking or restaking infrastructure, you often need to:
- **Track balance changes** over time to verify reward accrual
- **Monitor multiple chains** from a single interface
- **Debug transactions** by comparing before/after states
- **Validate indexer data** against on-chain state

This tool provides a quick, scriptable way to fetch this data without spinning up a full indexing stack.

## Features

- ✅ Native balance fetching (ETH, MATIC, etc.)
- ✅ Balance diff over N blocks (see how balance changed)
- ✅ ERC-20 token balance checking (configurable token list)
- ✅ Multi-network support (Ethereum, Polygon, Sepolia)
- 🔜 Helium/Solana support (HNT, MOBILE, IOT tokens)
- 🔜 Historical balance tracking with Postgres

## Prerequisites

- **Node.js** v18+ (uses native fetch)
- **npm** v8+

## Installation

```bash
git clone https://github.com/yourusername/multi-chain-balance-diff.git
cd multi-chain-balance-diff
npm install
```

## Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` to add your own RPC URLs (optional - public RPCs work by default):

```env
RPC_URL_ETH=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_URL_POLYGON=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
```

## Usage

### Basic usage (Ethereum mainnet)

```bash
node src/index.js --address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

### Check a different network

```bash
# Polygon
node src/index.js --address 0x... --network polygon

# Sepolia testnet
node src/index.js --address 0x... --network sepolia
```

### Change the block range for diff calculation

```bash
# Compare current balance vs 100 blocks ago
node src/index.js --address 0x... --blocks 100
```

### Skip ERC-20 token checks

```bash
node src/index.js --address 0x... --no-tokens
```

### Example output

```
🔗 Connecting to Ethereum Mainnet...
📊 Fetching balance data for 0xd8dA6B...96045
🪙  Checking 5 ERC-20 tokens...

────────────────────────────────────────────────────────────
  Chain:         Ethereum Mainnet
  Current block: 19234567
  Address:       0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
────────────────────────────────────────────────────────────
  Native balance: 1234.567891 ETH
  Δ over 50 blocks: +0.001234 ETH
    (block 19234517 → 19234567)
────────────────────────────────────────────────────────────
  ERC-20 Tokens:
    USDC     1,203.11
    stETH    45.678901
────────────────────────────────────────────────────────────
```

## Supported Networks

| Network | Native Token | Status |
|---------|--------------|--------|
| Ethereum Mainnet | ETH | ✅ Supported |
| Polygon Mainnet | MATIC | ✅ Supported |
| Sepolia Testnet | ETH | ✅ Supported |
| Helium (Solana) | HNT | 🔜 Planned |

## Project Structure

```
multi-chain-balance-diff/
├── src/
│   ├── index.js              # CLI entry point
│   ├── config/
│   │   └── networks.js       # Network configs (RPCs, tokens, chain IDs)
│   └── services/
│       └── balanceService.js # Balance fetching logic
├── .env.example              # Environment template
├── package.json
└── README.md
```

## Future Extensions

### Short-term
- [ ] ERC-20 balance diff over time
- [ ] Support for Arbitrum, Base, Optimism
- [ ] JSON output mode for scripting
- [ ] Helium/Solana support (HNT, MOBILE, IOT tokens)

### Medium-term
- [ ] REST API wrapper (Express/Fastify)
- [ ] WebSocket subscriptions for real-time balance updates
- [ ] Postgres integration for historical tracking

### Long-term (LST/LRT focused)
- [ ] Staking contract event indexing
- [ ] Reward calculation engine
- [ ] Integration with liquid staking protocols (Lido, Rocket Pool, EigenLayer)
- [ ] Multi-chain position aggregation

## Extending for LST/LRT Use Cases

This tool is designed as a foundation for more complex staking infrastructure. Here's how it maps to common LST/LRT backend needs:

### Event Ingestion
The `balanceService.js` pattern can be extended to subscribe to contract events:

```javascript
// Future: src/services/eventService.js
async function subscribeToStakingEvents(provider, contractAddress) {
  const contract = new ethers.Contract(contractAddress, STAKING_ABI, provider);
  contract.on('Staked', (user, amount, event) => {
    // Ingest into Postgres, update balances, trigger notifications
  });
}
```

### Reward Calculations
The block-based diff logic demonstrates the pattern for tracking rewards:

```javascript
// Current balance at block N minus balance at block M
// = rewards accrued (for simple staking)
// For rebasing tokens (stETH), track share balance instead
```

### Multi-chain Aggregation
The network config structure supports adding new chains easily:

```javascript
// Add to networks.js
arbitrum: {
  name: 'Arbitrum One',
  chainId: 42161,
  rpcUrl: process.env.RPC_URL_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
  // ...
}
```

## License

MIT
