/**
 * EVM Chain Adapter
 * 
 * Handles all EVM-compatible chains (Ethereum, Polygon, Arbitrum, etc.)
 * using ethers.js. The EVM standard ensures consistent behavior across
 * all compatible networks.
 */

const { ethers, FetchRequest } = require('ethers');
const BaseAdapter = require('./baseAdapter');

// Minimal ERC-20 ABI for balance queries
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

// Default timeout: 30 seconds
const DEFAULT_TIMEOUT_MS = 30000;

class EVMAdapter extends BaseAdapter {
  constructor(networkConfig, options = {}) {
    super(networkConfig);
    this.provider = null;
    this.timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  }

  getChainType() {
    return 'evm';
  }

  async connect() {
    // Create FetchRequest with timeout
    const fetchRequest = new FetchRequest(this.networkConfig.rpcUrl);
    fetchRequest.timeout = this.timeoutMs;
    
    this.provider = new ethers.JsonRpcProvider(fetchRequest);
    // Verify connection by fetching network
    await this.provider.getNetwork();
    this.connection = this.provider;
  }

  async getCurrentBlock() {
    return this.provider.getBlockNumber();
  }

  async getNativeBalance(address, blockTag = 'latest') {
    const raw = await this.provider.getBalance(address, blockTag);
    return {
      raw,
      formatted: this.formatBalance(raw, 18),
      decimals: 18,
    };
  }

  async getTokenBalances(address, tokens) {
    const results = await Promise.all(
      tokens.map(token => this._getTokenBalance(address, token))
    );
    
    // Filter out failed fetches and zero balances
    return results.filter(result => 
      result !== null && result.raw > 0n
    );
  }

  async _getTokenBalance(address, tokenConfig) {
    try {
      const contract = new ethers.Contract(
        tokenConfig.address,
        ERC20_ABI,
        this.provider
      );
      
      const raw = await contract.balanceOf(address);
      
      return {
        symbol: tokenConfig.symbol,
        address: tokenConfig.address,
        raw,
        formatted: this.formatBalance(raw, tokenConfig.decimals),
        decimals: tokenConfig.decimals,
      };
    } catch (error) {
      // Token contract might not exist or be inaccessible
      return null;
    }
  }

  isValidAddress(address) {
    try {
      ethers.getAddress(address);
      return true;
    } catch {
      return false;
    }
  }

  formatBalance(raw, decimals = 18) {
    const formatted = ethers.formatUnits(raw, decimals);
    // Trim trailing zeros but keep reasonable precision
    return parseFloat(formatted).toString();
  }

  /**
   * Format balance with symbol for display.
   * @param {bigint} raw - Raw balance in wei
   * @param {string} symbol - Currency symbol
   * @param {number} decimals - Decimals
   * @returns {string} e.g., "1.234 ETH"
   */
  formatBalanceWithSymbol(raw, symbol, decimals = 18) {
    const value = parseFloat(ethers.formatUnits(raw, decimals));
    const display = value.toFixed(6).replace(/\.?0+$/, '');
    return `${display} ${symbol}`;
  }

  /**
   * Format balance diff with +/- prefix.
   * @param {bigint} diff - Diff in wei
   * @param {string} symbol - Currency symbol
   * @param {number} decimals - Decimals
   * @returns {string} e.g., "+0.01 ETH"
   */
  formatDiff(diff, symbol, decimals = 18) {
    const value = parseFloat(ethers.formatUnits(diff, decimals));
    const prefix = value >= 0 ? '+' : '';
    const display = value.toFixed(6).replace(/\.?0+$/, '');
    return `${prefix}${display} ${symbol}`;
  }
}

module.exports = EVMAdapter;



