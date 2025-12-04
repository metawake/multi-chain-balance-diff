/**
 * Network configuration for supported EVM chains.
 * 
 * Each network includes:
 * - name: Human-readable network name
 * - chainId: EVM chain ID
 * - rpcUrl: Default public RPC (can be overridden via env vars)
 * - nativeSymbol: Native currency symbol (ETH, MATIC, etc.)
 * - blockExplorer: Block explorer URL for reference
 * - tokens: Common ERC-20 tokens to check balances for
 */

require('dotenv').config();

const networks = {
  // ==========================================================================
  // EVM Networks (fully supported)
  // ==========================================================================
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: process.env.RPC_URL_ETH || 'https://eth.llamarpc.com',
    nativeSymbol: 'ETH',
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
    chainId: 137,
    rpcUrl: process.env.RPC_URL_POLYGON || 'https://polygon.llamarpc.com',
    nativeSymbol: 'MATIC',
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
    chainId: 11155111,
    rpcUrl: process.env.RPC_URL_SEPOLIA || 'https://rpc.sepolia.org',
    nativeSymbol: 'ETH',
    blockExplorer: 'https://sepolia.etherscan.io',
    tokens: [
      // Testnet tokens are less standardized; keeping minimal for demo
      { symbol: 'LINK', address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', decimals: 18 },
    ],
  },

  // ==========================================================================
  // Non-EVM Networks (planned support)
  // ==========================================================================
  
  /**
   * Helium Network
   * 
   * NOTE: Helium migrated from its own L1 to Solana in April 2023.
   * The HNT, MOBILE, and IOT tokens now live on Solana as SPL tokens.
   * 
   * To support Helium ecosystem tokens, we need to:
   * 1. Add Solana RPC support (using @solana/web3.js)
   * 2. Query SPL token balances for HNT, MOBILE, IOT
   * 3. Integrate with Helium-specific APIs for hotspot rewards tracking
   * 
   * Relevant addresses on Solana:
   * - HNT:    hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux
   * - MOBILE: mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6
   * - IOT:    iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns
   * 
   * For Nebra hotspot operators, this would enable:
   * - Tracking mining rewards over time
   * - Monitoring HNT/MOBILE/IOT earning rates
   * - Correlating rewards with network coverage data
   * 
   * @see https://docs.helium.com/solana/
   * @see https://github.com/helium/helium-program-library
   */
  helium: {
    name: 'Helium (Solana)',
    chainId: null, // Non-EVM; Solana-based
    rpcUrl: process.env.RPC_URL_SOLANA || 'https://api.mainnet-beta.solana.com',
    nativeSymbol: 'HNT',
    blockExplorer: 'https://explorer.solana.com',
    isEVM: false,
    supported: false, // Placeholder - requires Solana integration
    tokens: [
      { symbol: 'HNT', mint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', decimals: 8 },
      { symbol: 'MOBILE', mint: 'mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6', decimals: 6 },
      { symbol: 'IOT', mint: 'iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns', decimals: 6 },
    ],
  },
};

/**
 * Get network configuration by key.
 * @param {string} networkKey - Network identifier (mainnet, polygon, sepolia, helium)
 * @returns {object|null} Network config or null if not found
 */
function getNetwork(networkKey) {
  const key = networkKey.toLowerCase();
  return networks[key] || null;
}

/**
 * Check if a network is EVM-compatible and currently supported.
 * @param {object} networkConfig - Network configuration object
 * @returns {boolean} True if EVM and supported
 */
function isEVMSupported(networkConfig) {
  if (!networkConfig) return false;
  // If isEVM is explicitly false, it's not EVM
  if (networkConfig.isEVM === false) return false;
  // If supported is explicitly false, it's not ready yet
  if (networkConfig.supported === false) return false;
  return true;
}

/**
 * Get list of all supported network keys.
 * @returns {string[]} Array of network keys
 */
function getSupportedNetworks() {
  return Object.keys(networks);
}

/**
 * Get list of EVM-supported network keys only.
 * @returns {string[]} Array of supported EVM network keys
 */
function getEVMNetworks() {
  return Object.keys(networks).filter(key => isEVMSupported(networks[key]));
}

module.exports = {
  networks,
  getNetwork,
  getSupportedNetworks,
  getEVMNetworks,
  isEVMSupported,
};
