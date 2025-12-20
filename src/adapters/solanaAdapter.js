/**
 * Solana Chain Adapter
 * 
 * Handles Solana blockchain and SPL tokens, including:
 * - Native SOL balance
 * - SPL token balances (HNT, MOBILE, IOT for Helium ecosystem)
 * 
 * Uses @solana/web3.js for RPC communication.
 */

const { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const BaseAdapter = require('./baseAdapter');

// SPL Token Program ID
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// Default timeout: 30 seconds
const DEFAULT_TIMEOUT_MS = 30000;

class SolanaAdapter extends BaseAdapter {
  constructor(networkConfig, options = {}) {
    super(networkConfig);
    this.conn = null;
    this.timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  }

  getChainType() {
    return 'solana';
  }

  /**
   * Create a fetch function with timeout support.
   */
  _createFetchWithTimeout() {
    const timeoutMs = this.timeoutMs;
    return async (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    };
  }

  async connect() {
    this.conn = new Connection(
      this.networkConfig.rpcUrl,
      { 
        commitment: 'confirmed',
        fetch: this._createFetchWithTimeout(),
      }
    );
    // Verify connection
    await this.conn.getSlot();
    this.connection = this.conn;
  }

  async getCurrentBlock() {
    // Solana uses "slots" instead of blocks
    return this.conn.getSlot();
  }

  async getNativeBalance(address, slotTag = 'latest') {
    const pubkey = new PublicKey(address);
    
    let raw;
    if (slotTag === 'latest') {
      raw = await this.conn.getBalance(pubkey);
    } else {
      // Historical balance query with specific slot
      // Note: Many RPC nodes don't support historical queries
      // We use getBalanceAndContext for better reliability
      try {
        const result = await this.conn.getBalance(pubkey, {
          minContextSlot: slotTag,
        });
        raw = result;
      } catch (error) {
        // Fallback to current if historical not supported
        raw = await this.conn.getBalance(pubkey);
      }
    }

    return {
      raw: BigInt(raw),
      formatted: this.formatBalance(BigInt(raw), 9), // SOL has 9 decimals
      decimals: 9,
    };
  }

  async getTokenBalances(address, tokens) {
    const pubkey = new PublicKey(address);
    
    try {
      // Fetch all token accounts for this wallet
      const tokenAccounts = await this.conn.getParsedTokenAccountsByOwner(
        pubkey,
        { programId: TOKEN_PROGRAM_ID }
      );

      // Build lookup map from mint address to our token config
      const tokenLookup = new Map();
      for (const token of tokens) {
        // Solana tokens use 'mint' instead of 'address'
        const mintAddress = token.mint || token.address;
        if (mintAddress) {
          tokenLookup.set(mintAddress, token);
        }
      }

      // Process token accounts
      const results = [];
      for (const { account } of tokenAccounts.value) {
        const parsed = account.data.parsed?.info;
        if (!parsed) continue;

        const mint = parsed.mint;
        const tokenConfig = tokenLookup.get(mint);
        
        if (tokenConfig) {
          const amount = parsed.tokenAmount;
          const raw = BigInt(amount.amount);
          
          if (raw > 0n) {
            results.push({
              symbol: tokenConfig.symbol,
              mint: mint,
              raw,
              formatted: amount.uiAmountString || this.formatBalance(raw, amount.decimals),
              decimals: amount.decimals,
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.warn(`Warning: Could not fetch SPL tokens: ${error.message}`);
      return [];
    }
  }

  isValidAddress(address) {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  formatBalance(raw, decimals = 9) {
    const divisor = BigInt(10 ** decimals);
    const whole = raw / divisor;
    const fraction = raw % divisor;
    
    if (fraction === 0n) {
      return whole.toString();
    }
    
    // Format fraction with proper padding
    const fractionStr = fraction.toString().padStart(decimals, '0');
    // Trim trailing zeros
    const trimmed = fractionStr.replace(/0+$/, '');
    
    return `${whole}.${trimmed}`;
  }

  /**
   * Format balance with symbol for display.
   */
  formatBalanceWithSymbol(raw, symbol, decimals = 9) {
    return `${this.formatBalance(raw, decimals)} ${symbol}`;
  }

  /**
   * Format balance diff with +/- prefix.
   */
  formatDiff(diff, symbol, decimals = 9) {
    const formatted = this.formatBalance(diff < 0n ? -diff : diff, decimals);
    const prefix = diff >= 0n ? '+' : '-';
    return `${prefix}${formatted} ${symbol}`;
  }

  /**
   * Get Solana-specific explorer URL.
   */
  getExplorerUrl(address) {
    // Determine if mainnet or devnet based on RPC
    const isDevnet = this.networkConfig.rpcUrl.includes('devnet');
    const cluster = isDevnet ? '?cluster=devnet' : '';
    return `https://explorer.solana.com/address/${address}${cluster}`;
  }
}

module.exports = SolanaAdapter;


