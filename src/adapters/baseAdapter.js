/**
 * Base Chain Adapter Interface
 * 
 * Defines the contract that all chain adapters must implement.
 * This enables the balance service to work with any blockchain
 * without knowing the underlying implementation details.
 * 
 * Supported chain types:
 * - EVM (Ethereum, Polygon, Arbitrum, etc.) via ethers.js
 * - Solana (including Helium tokens) via @solana/web3.js
 * 
 * Future: Cosmos, Bitcoin, etc.
 */

class BaseAdapter {
  constructor(networkConfig) {
    if (new.target === BaseAdapter) {
      throw new Error('BaseAdapter is abstract and cannot be instantiated directly');
    }
    this.networkConfig = networkConfig;
    this.connection = null;
  }

  /**
   * Get the chain type identifier.
   * @returns {string} Chain type ('evm', 'solana', etc.)
   */
  getChainType() {
    throw new Error('getChainType() must be implemented');
  }

  /**
   * Connect to the network RPC.
   * @returns {Promise<void>}
   */
  async connect() {
    throw new Error('connect() must be implemented');
  }

  /**
   * Get current block/slot number.
   * @returns {Promise<number>}
   */
  async getCurrentBlock() {
    throw new Error('getCurrentBlock() must be implemented');
  }

  /**
   * Get native balance for an address.
   * @param {string} address - Wallet address
   * @param {number|string} blockTag - Block number or 'latest'
   * @returns {Promise<{raw: bigint, formatted: string, decimals: number}>}
   */
  async getNativeBalance(address, blockTag = 'latest') {
    throw new Error('getNativeBalance() must be implemented');
  }

  /**
   * Get native balance diff over N blocks/slots.
   * @param {string} address - Wallet address
   * @param {number} blocksBack - Number of blocks to look back
   * @returns {Promise<{current: object, previous: object, diff: bigint, currentBlock: number, previousBlock: number}>}
   */
  async getNativeBalanceDiff(address, blocksBack) {
    const currentBlock = await this.getCurrentBlock();
    const previousBlock = Math.max(0, currentBlock - blocksBack);

    const [current, previous] = await Promise.all([
      this.getNativeBalance(address, currentBlock),
      this.getNativeBalance(address, previousBlock),
    ]);

    return {
      current,
      previous,
      diff: current.raw - previous.raw,
      currentBlock,
      previousBlock,
    };
  }

  /**
   * Get token balances for an address.
   * @param {string} address - Wallet address
   * @param {object[]} tokens - Token configurations
   * @returns {Promise<object[]>} Array of token balances
   */
  async getTokenBalances(address, tokens) {
    throw new Error('getTokenBalances() must be implemented');
  }

  /**
   * Validate an address format.
   * @param {string} address - Address to validate
   * @returns {boolean} True if valid
   */
  isValidAddress(address) {
    throw new Error('isValidAddress() must be implemented');
  }

  /**
   * Format a raw balance to human-readable string.
   * @param {bigint} raw - Raw balance
   * @param {number} decimals - Token decimals
   * @returns {string} Formatted balance
   */
  formatBalance(raw, decimals) {
    throw new Error('formatBalance() must be implemented');
  }

  /**
   * Get explorer URL for an address.
   * @param {string} address - Wallet address
   * @returns {string} Block explorer URL
   */
  getExplorerUrl(address) {
    return `${this.networkConfig.blockExplorer}/address/${address}`;
  }
}

module.exports = BaseAdapter;


