/**
 * Chain Adapter Factory
 * 
 * Returns the appropriate adapter based on network configuration.
 * This is the main entry point for multi-chain support.
 * 
 * Usage:
 *   const adapter = createAdapter(networkConfig);
 *   await adapter.connect();
 *   const balance = await adapter.getNativeBalance(address);
 */

const EVMAdapter = require('./evmAdapter');
const SolanaAdapter = require('./solanaAdapter');

/**
 * Chain type to adapter class mapping.
 */
const ADAPTER_MAP = {
  evm: EVMAdapter,
  solana: SolanaAdapter,
};

/**
 * Create an adapter for the given network configuration.
 * 
 * @param {object} networkConfig - Network configuration from networks.js
 * @param {object} options - Adapter options
 * @param {number} options.timeoutMs - RPC timeout in milliseconds (default: 30000)
 * @returns {BaseAdapter} Chain-specific adapter instance
 * @throws {Error} If chain type is not supported
 */
function createAdapter(networkConfig, options = {}) {
  // Determine chain type (default to 'evm' for backwards compatibility)
  const chainType = networkConfig.chainType || 'evm';
  
  const AdapterClass = ADAPTER_MAP[chainType];
  
  if (!AdapterClass) {
    throw new Error(
      `Unsupported chain type: ${chainType}. ` +
      `Supported types: ${Object.keys(ADAPTER_MAP).join(', ')}`
    );
  }
  
  return new AdapterClass(networkConfig, options);
}

/**
 * Get list of supported chain types.
 * @returns {string[]}
 */
function getSupportedChainTypes() {
  return Object.keys(ADAPTER_MAP);
}

/**
 * Check if a chain type is supported.
 * @param {string} chainType 
 * @returns {boolean}
 */
function isChainTypeSupported(chainType) {
  return chainType in ADAPTER_MAP;
}

module.exports = {
  createAdapter,
  getSupportedChainTypes,
  isChainTypeSupported,
  EVMAdapter,
  SolanaAdapter,
};


