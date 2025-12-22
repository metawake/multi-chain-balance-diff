/**
 * Network configuration for supported chains.
 * 
 * Each network includes:
 * - name: Human-readable network name
 * - chainType: 'evm' or 'solana' (determines which adapter to use)
 * - chainId: Chain ID (EVM) or null (Solana)
 * - rpcUrl: Default public RPC (can be overridden via env vars)
 * - nativeSymbol: Native currency symbol (ETH, SOL, etc.)
 * - nativeDecimals: Decimals for native currency
 * - blockExplorer: Block explorer URL for reference
 * - tokens: Tokens to check balances for
 */

require('dotenv').config();

const networks = {
  // ==========================================================================
  // EVM Networks
  // ==========================================================================
  mainnet: {
    name: 'Ethereum Mainnet',
    chainType: 'evm',
    chainId: 1,
    rpcUrl: process.env.RPC_URL_ETH || 'https://eth.llamarpc.com',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    blockExplorer: 'https://etherscan.io',
    tokens: [
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
      { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 },
      { symbol: 'LINK', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18 },
      { symbol: 'stETH', address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', decimals: 18 },
    ],
  },

  polygon: {
    name: 'Polygon Mainnet',
    chainType: 'evm',
    chainId: 137,
    rpcUrl: process.env.RPC_URL_POLYGON || 'https://polygon.llamarpc.com',
    nativeSymbol: 'MATIC',
    nativeDecimals: 18,
    blockExplorer: 'https://polygonscan.com',
    tokens: [
      { symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
      { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
      { symbol: 'WETH', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18 },
      { symbol: 'LINK', address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', decimals: 18 },
    ],
  },

  sepolia: {
    name: 'Sepolia Testnet',
    chainType: 'evm',
    chainId: 11155111,
    rpcUrl: process.env.RPC_URL_SEPOLIA || 'https://rpc.sepolia.org',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    blockExplorer: 'https://sepolia.etherscan.io',
    tokens: [
      { symbol: 'LINK', address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', decimals: 18 },
    ],
  },

  // ==========================================================================
  // Layer 2 Networks
  // ==========================================================================

  base: {
    name: 'Base',
    chainType: 'evm',
    chainId: 8453,
    rpcUrl: process.env.RPC_URL_BASE || 'https://mainnet.base.org',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    blockExplorer: 'https://basescan.org',
    tokens: [
      { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
      { symbol: 'USDbC', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', decimals: 6 },
      { symbol: 'cbETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', decimals: 18 },
      { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
    ],
  },

  arbitrum: {
    name: 'Arbitrum One',
    chainType: 'evm',
    chainId: 42161,
    rpcUrl: process.env.RPC_URL_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    blockExplorer: 'https://arbiscan.io',
    tokens: [
      { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
      { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
      { symbol: 'ARB', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 },
      { symbol: 'GMX', address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', decimals: 18 },
      { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
    ],
  },

  optimism: {
    name: 'Optimism',
    chainType: 'evm',
    chainId: 10,
    rpcUrl: process.env.RPC_URL_OPTIMISM || 'https://mainnet.optimism.io',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    blockExplorer: 'https://optimistic.etherscan.io',
    tokens: [
      { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
      { symbol: 'USDT', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 },
      { symbol: 'OP', address: '0x4200000000000000000000000000000000000042', decimals: 18 },
      { symbol: 'SNX', address: '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4', decimals: 18 },
      { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    ],
  },

  bnb: {
    name: 'BNB Chain',
    chainType: 'evm',
    chainId: 56,
    rpcUrl: process.env.RPC_URL_BNB || 'https://bsc-dataseed.binance.org',
    nativeSymbol: 'BNB',
    nativeDecimals: 18,
    blockExplorer: 'https://bscscan.com',
    tokens: [
      { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
      { symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
      { symbol: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
      { symbol: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18 },
    ],
  },

  avalanche: {
    name: 'Avalanche C-Chain',
    chainType: 'evm',
    chainId: 43114,
    rpcUrl: process.env.RPC_URL_AVAX || 'https://api.avax.network/ext/bc/C/rpc',
    nativeSymbol: 'AVAX',
    nativeDecimals: 18,
    blockExplorer: 'https://snowtrace.io',
    tokens: [
      { symbol: 'USDC', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6 },
      { symbol: 'USDT', address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6 },
      { symbol: 'WAVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', decimals: 18 },
    ],
  },

  fantom: {
    name: 'Fantom Opera',
    chainType: 'evm',
    chainId: 250,
    rpcUrl: process.env.RPC_URL_FTM || 'https://rpc.ftm.tools',
    nativeSymbol: 'FTM',
    nativeDecimals: 18,
    blockExplorer: 'https://ftmscan.com',
    tokens: [
      { symbol: 'USDC', address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', decimals: 6 },
      { symbol: 'USDT', address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A', decimals: 6 },
      { symbol: 'DAI', address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', decimals: 18 },
    ],
  },

  zksync: {
    name: 'zkSync Era',
    chainType: 'evm',
    chainId: 324,
    rpcUrl: process.env.RPC_URL_ZKSYNC || 'https://mainnet.era.zksync.io',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    blockExplorer: 'https://explorer.zksync.io',
    tokens: [
      { symbol: 'USDC', address: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4', decimals: 6 },
      { symbol: 'USDT', address: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C', decimals: 6 },
    ],
  },

  // ==========================================================================
  // Solana Networks
  // ==========================================================================

  solana: {
    name: 'Solana Mainnet',
    chainType: 'solana',
    chainId: null,
    rpcUrl: process.env.RPC_URL_SOLANA || 'https://api.mainnet-beta.solana.com',
    nativeSymbol: 'SOL',
    nativeDecimals: 9,
    blockExplorer: 'https://explorer.solana.com',
    tokens: [
      // Popular Solana SPL tokens
      { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
      { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5 },
      { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6 },
    ],
  },

  /**
   * Helium Network (on Solana)
   * 
   * Helium migrated from its own L1 to Solana in April 2023.
   * The HNT, MOBILE, and IOT tokens are now SPL tokens on Solana.
   * 
   * For Nebra hotspot operators, this enables:
   * - Tracking mining rewards over time
   * - Monitoring HNT/MOBILE/IOT earning rates
   * - Correlating rewards with network coverage data
   * 
   * @see https://docs.helium.com/solana/
   * @see https://github.com/helium/helium-program-library
   */
  helium: {
    name: 'Helium (Solana)',
    chainType: 'solana',
    chainId: null,
    rpcUrl: process.env.RPC_URL_SOLANA || 'https://api.mainnet-beta.solana.com',
    nativeSymbol: 'SOL',  // Native is still SOL, HNT is a token
    nativeDecimals: 9,
    blockExplorer: 'https://explorer.solana.com',
    // Helium ecosystem tokens
    tokens: [
      { symbol: 'HNT', mint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', decimals: 8 },
      { symbol: 'MOBILE', mint: 'mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6', decimals: 6 },
      { symbol: 'IOT', mint: 'iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns', decimals: 6 },
      { symbol: 'DC', mint: 'dcuc8Amr83Wz27ZkQ2K9NS6r8zRpf1J6cvArEBDZDmm', decimals: 0 }, // Data Credits
    ],
  },

  'solana-devnet': {
    name: 'Solana Devnet',
    chainType: 'solana',
    chainId: null,
    rpcUrl: process.env.RPC_URL_SOLANA_DEVNET || 'https://api.devnet.solana.com',
    nativeSymbol: 'SOL',
    nativeDecimals: 9,
    blockExplorer: 'https://explorer.solana.com',
    tokens: [],
  },

  // ==========================================================================
  // TON Networks
  // ==========================================================================

  ton: {
    name: 'TON Mainnet',
    chainType: 'ton',
    chainId: null,
    rpcUrl: process.env.RPC_URL_TON || 'https://toncenter.com/api/v2/jsonRPC',
    nativeSymbol: 'TON',
    nativeDecimals: 9,
    blockExplorer: 'https://tonscan.org',
    tokens: [
      // Jettons can be added here later
    ],
  },

  'ton-testnet': {
    name: 'TON Testnet',
    chainType: 'ton',
    chainId: null,
    rpcUrl: process.env.RPC_URL_TON_TESTNET || 'https://testnet.toncenter.com/api/v2/jsonRPC',
    nativeSymbol: 'TON',
    nativeDecimals: 9,
    blockExplorer: 'https://testnet.tonscan.org',
    tokens: [],
  },
};

// ==========================================================================
// Helper Functions
// ==========================================================================

/**
 * Get network configuration by key.
 * @param {string} networkKey - Network identifier
 * @returns {object|null} Network config or null if not found
 */
function getNetwork(networkKey) {
  const key = networkKey.toLowerCase();
  return networks[key] || null;
}

/**
 * Get list of all network keys.
 * @returns {string[]}
 */
function getSupportedNetworks() {
  return Object.keys(networks);
}

/**
 * Get networks filtered by chain type.
 * @param {string} chainType - 'evm' or 'solana'
 * @returns {string[]} Network keys matching the chain type
 */
function getNetworksByType(chainType) {
  return Object.keys(networks).filter(
    key => networks[key].chainType === chainType
  );
}

/**
 * Get chain type for a network.
 * @param {string} networkKey - Network key
 * @returns {string|null} Chain type or null
 */
function getChainType(networkKey) {
  const network = getNetwork(networkKey);
  return network?.chainType || null;
}

module.exports = {
  networks,
  getNetwork,
  getSupportedNetworks,
  getNetworksByType,
  getChainType,
};


