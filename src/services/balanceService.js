/**
 * Balance fetching service for native coins and ERC-20 tokens.
 * 
 * Provides functions to:
 * - Fetch current native balance
 * - Fetch native balance at a specific block
 * - Compute balance diff over N blocks
 * - Fetch ERC-20 token balances
 */

const { ethers } = require('ethers');

// Minimal ERC-20 ABI for balanceOf
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

/**
 * Create an ethers provider for the given RPC URL.
 * @param {string} rpcUrl - JSON-RPC endpoint URL
 * @returns {ethers.JsonRpcProvider}
 */
function createProvider(rpcUrl) {
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Fetch native coin balance at a specific block.
 * @param {ethers.JsonRpcProvider} provider - Ethers provider
 * @param {string} address - Wallet address
 * @param {number|string} blockTag - Block number or 'latest'
 * @returns {Promise<bigint>} Balance in wei
 */
async function getNativeBalance(provider, address, blockTag = 'latest') {
  return provider.getBalance(address, blockTag);
}

/**
 * Fetch current block number.
 * @param {ethers.JsonRpcProvider} provider - Ethers provider
 * @returns {Promise<number>} Current block number
 */
async function getCurrentBlock(provider) {
  return provider.getBlockNumber();
}

/**
 * Compute native balance diff over the last N blocks.
 * @param {ethers.JsonRpcProvider} provider - Ethers provider
 * @param {string} address - Wallet address
 * @param {number} blocksBack - Number of blocks to look back
 * @returns {Promise<{current: bigint, previous: bigint, diff: bigint, currentBlock: number, previousBlock: number}>}
 */
async function getNativeBalanceDiff(provider, address, blocksBack) {
  const currentBlock = await getCurrentBlock(provider);
  const previousBlock = Math.max(0, currentBlock - blocksBack);

  const [currentBalance, previousBalance] = await Promise.all([
    getNativeBalance(provider, address, currentBlock),
    getNativeBalance(provider, address, previousBlock),
  ]);

  return {
    current: currentBalance,
    previous: previousBalance,
    diff: currentBalance - previousBalance,
    currentBlock,
    previousBlock,
  };
}

/**
 * Fetch ERC-20 token balance for a single token.
 * @param {ethers.JsonRpcProvider} provider - Ethers provider
 * @param {string} walletAddress - Wallet address
 * @param {object} tokenConfig - Token configuration {symbol, address, decimals}
 * @returns {Promise<{symbol: string, balance: string, rawBalance: bigint}|null>}
 */
async function getTokenBalance(provider, walletAddress, tokenConfig) {
  try {
    const contract = new ethers.Contract(tokenConfig.address, ERC20_ABI, provider);
    const rawBalance = await contract.balanceOf(walletAddress);
    const balance = ethers.formatUnits(rawBalance, tokenConfig.decimals);
    
    return {
      symbol: tokenConfig.symbol,
      balance,
      rawBalance,
    };
  } catch (error) {
    // Token contract might not exist or be accessible; return null
    return null;
  }
}

/**
 * Fetch balances for multiple ERC-20 tokens.
 * @param {ethers.JsonRpcProvider} provider - Ethers provider
 * @param {string} walletAddress - Wallet address
 * @param {object[]} tokens - Array of token configurations
 * @returns {Promise<object[]>} Array of token balances (non-zero only)
 */
async function getTokenBalances(provider, walletAddress, tokens) {
  const balancePromises = tokens.map(token => 
    getTokenBalance(provider, walletAddress, token)
  );
  
  const results = await Promise.all(balancePromises);
  
  // Filter out failed fetches and zero balances
  return results.filter(result => 
    result !== null && result.rawBalance > 0n
  );
}

/**
 * Format a wei value to a human-readable string with the given symbol.
 * @param {bigint} weiValue - Value in wei
 * @param {string} symbol - Currency symbol
 * @param {number} decimals - Number of decimals (default 18 for ETH)
 * @returns {string} Formatted string like "1.234 ETH"
 */
function formatBalance(weiValue, symbol, decimals = 18) {
  const formatted = ethers.formatUnits(weiValue, decimals);
  // Trim to reasonable precision (6 decimals)
  const trimmed = parseFloat(formatted).toFixed(6).replace(/\.?0+$/, '');
  return `${trimmed} ${symbol}`;
}

/**
 * Format a balance diff with +/- prefix.
 * @param {bigint} diffWei - Diff value in wei
 * @param {string} symbol - Currency symbol
 * @param {number} decimals - Number of decimals
 * @returns {string} Formatted diff like "+0.012 ETH" or "-0.005 ETH"
 */
function formatBalanceDiff(diffWei, symbol, decimals = 18) {
  const formatted = ethers.formatUnits(diffWei, decimals);
  const value = parseFloat(formatted);
  const prefix = value >= 0 ? '+' : '';
  const trimmed = value.toFixed(6).replace(/\.?0+$/, '');
  return `${prefix}${trimmed} ${symbol}`;
}

module.exports = {
  createProvider,
  getNativeBalance,
  getCurrentBlock,
  getNativeBalanceDiff,
  getTokenBalance,
  getTokenBalances,
  formatBalance,
  formatBalanceDiff,
};


