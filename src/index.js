#!/usr/bin/env node

/**
 * multi-chain-balance-diff
 * 
 * CLI tool to fetch and compare wallet balances across EVM chains.
 * Useful for tracking staking rewards, monitoring LST/LRT positions,
 * and building multi-chain analytics tooling.
 */

const { program } = require('commander');
const { ethers } = require('ethers');
const { getNetwork, getSupportedNetworks, getEVMNetworks, isEVMSupported } = require('./config/networks');
const {
  createProvider,
  getNativeBalanceDiff,
  getTokenBalances,
  formatBalance,
  formatBalanceDiff,
} = require('./services/balanceService');

// CLI configuration
program
  .name('multi-chain-balance-diff')
  .description('Fetch wallet balances and compute diffs across EVM chains')
  .version('0.1.0')
  .requiredOption('-a, --address <address>', 'Wallet address to check')
  .option('-n, --network <network>', 'Network to query (mainnet, polygon, sepolia)', 'mainnet')
  .option('-b, --blocks <number>', 'Number of blocks to look back for diff', '50')
  .option('--no-tokens', 'Skip ERC-20 token balance checks')
  .parse(process.argv);

const options = program.opts();

/**
 * Validate Ethereum address format.
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
function isValidAddress(address) {
  try {
    ethers.getAddress(address); // Throws if invalid
    return true;
  } catch {
    return false;
  }
}

/**
 * Print a horizontal separator line.
 */
function printSeparator() {
  console.log('─'.repeat(60));
}

/**
 * Main execution function.
 */
async function main() {
  const { address, network, blocks, tokens: checkTokens } = options;
  const blocksBack = parseInt(blocks, 10);

  // Validate address
  if (!isValidAddress(address)) {
    console.error(`❌ Invalid address: ${address}`);
    console.error('   Please provide a valid Ethereum address (0x...)');
    process.exit(1);
  }

  // Validate network
  const networkConfig = getNetwork(network);
  if (!networkConfig) {
    console.error(`❌ Unknown network: ${network}`);
    console.error(`   Supported networks: ${getSupportedNetworks().join(', ')}`);
    process.exit(1);
  }

  // Check if network is EVM-supported
  if (!isEVMSupported(networkConfig)) {
    console.error(`⚠️  Network "${network}" is not yet fully supported.`);
    if (networkConfig.isEVM === false) {
      console.error(`   ${networkConfig.name} is a non-EVM chain.`);
      console.error(`   Solana/Helium support is planned for a future release.`);
      console.error(`   See: https://docs.helium.com/solana/`);
    }
    console.error(`\n   Currently supported EVM networks: ${getEVMNetworks().join(', ')}`);
    process.exit(1);
  }

  // Validate blocks parameter
  if (isNaN(blocksBack) || blocksBack < 1) {
    console.error(`❌ Invalid blocks value: ${blocks}`);
    console.error('   Please provide a positive integer');
    process.exit(1);
  }

  console.log();
  console.log(`🔗 Connecting to ${networkConfig.name}...`);

  try {
    const provider = createProvider(networkConfig.rpcUrl);

    // Fetch native balance diff
    console.log(`📊 Fetching balance data for ${address.slice(0, 8)}...${address.slice(-6)}`);
    
    const balanceDiff = await getNativeBalanceDiff(provider, address, blocksBack);
    
    // Fetch token balances (current only for alpha)
    let tokenBalances = [];
    if (checkTokens && networkConfig.tokens.length > 0) {
      console.log(`🪙  Checking ${networkConfig.tokens.length} ERC-20 tokens...`);
      tokenBalances = await getTokenBalances(provider, address, networkConfig.tokens);
    }

    // Print results
    console.log();
    printSeparator();
    console.log(`  Chain:         ${networkConfig.name}`);
    console.log(`  Current block: ${balanceDiff.currentBlock}`);
    console.log(`  Address:       ${address}`);
    printSeparator();
    
    // Native balance with diff
    const currentFormatted = formatBalance(balanceDiff.current, networkConfig.nativeSymbol);
    const diffFormatted = formatBalanceDiff(balanceDiff.diff, networkConfig.nativeSymbol);
    console.log(`  Native balance: ${currentFormatted}`);
    console.log(`  Δ over ${blocksBack} blocks: ${diffFormatted}`);
    console.log(`    (block ${balanceDiff.previousBlock} → ${balanceDiff.currentBlock})`);

    // Token balances
    if (tokenBalances.length > 0) {
      printSeparator();
      console.log('  ERC-20 Tokens:');
      for (const token of tokenBalances) {
        const formatted = parseFloat(token.balance).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        });
        console.log(`    ${token.symbol.padEnd(8)} ${formatted}`);
      }
    } else if (checkTokens) {
      printSeparator();
      console.log('  ERC-20 Tokens: (no balances found)');
    }

    printSeparator();
    console.log();

  } catch (error) {
    // Handle common errors gracefully
    if (error.code === 'NETWORK_ERROR' || error.code === 'SERVER_ERROR') {
      console.error(`❌ Network error: Could not connect to ${networkConfig.name}`);
      console.error(`   RPC URL: ${networkConfig.rpcUrl}`);
      console.error('   Please check your internet connection or try a different RPC.');
    } else if (error.message?.includes('could not coalesce')) {
      console.error(`❌ RPC error: The RPC endpoint returned unexpected data.`);
      console.error('   Try using a different RPC URL in your .env file.');
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run
main();
