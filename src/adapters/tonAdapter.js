/**
 * TON (The Open Network) Adapter
 * 
 * Handles TON blockchain balance queries.
 * Uses @ton/ton SDK for RPC communication.
 */

const { TonClient, Address, fromNano } = require('@ton/ton');
const BaseAdapter = require('./baseAdapter');

// Default timeout: 30 seconds
const DEFAULT_TIMEOUT_MS = 30000;

class TonAdapter extends BaseAdapter {
  constructor(networkConfig, options = {}) {
    super(networkConfig);
    this.client = null;
    this.timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  }

  getChainType() {
    return 'ton';
  }

  async connect() {
    this.client = new TonClient({
      endpoint: this.networkConfig.rpcUrl,
      timeout: this.timeoutMs,
    });
    // Verify connection by getting masterchain info
    await this.client.getMasterchainInfo();
    this.connection = this.client;
  }

  async getCurrentBlock() {
    const info = await this.client.getMasterchainInfo();
    return info.last.seqno;
  }

  async getNativeBalance(address, blockTag = 'latest') {
    const addr = Address.parse(address);
    
    // TON doesn't easily support historical balance queries via standard API
    // We fetch current balance
    const balance = await this.client.getBalance(addr);
    
    return {
      raw: balance,
      formatted: this.formatBalance(balance, 9), // TON has 9 decimals
      decimals: 9,
    };
  }

  async getTokenBalances(address, tokens) {
    // TON Jettons (tokens) require parsing wallet contract state
    // This is more complex than EVM - simplified implementation
    // Returns empty for now, can be extended later
    return [];
  }

  isValidAddress(address) {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  formatBalance(raw, decimals = 9) {
    // fromNano converts from nanoTON to TON
    return fromNano(raw);
  }

  formatBalanceWithSymbol(raw, symbol, decimals = 9) {
    return `${this.formatBalance(raw, decimals)} ${symbol}`;
  }

  formatDiff(diff, symbol, decimals = 9) {
    const formatted = this.formatBalance(diff < 0n ? -diff : diff, decimals);
    const prefix = diff >= 0n ? '+' : '-';
    return `${prefix}${formatted} ${symbol}`;
  }

  getExplorerUrl(address) {
    const isTestnet = this.networkConfig.rpcUrl.includes('testnet');
    const baseUrl = isTestnet 
      ? 'https://testnet.tonscan.org' 
      : 'https://tonscan.org';
    return `${baseUrl}/address/${address}`;
  }
}

module.exports = TonAdapter;

