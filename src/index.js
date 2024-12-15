#!/usr/bin/env node

/**
 * multi-chain-balance-diff
 * 
 * CLI tool to fetch and compare wallet balances across multiple blockchains.
 * Supports EVM chains (Ethereum, Polygon, Base, Arbitrum, Optimism) and Solana.
 * 
 * Useful for:
 * - Tracking staking rewards over time
 * - Monitoring LST/LRT positions
 * - Helium hotspot reward tracking (HNT, MOBILE, IOT)
 * - Multi-chain portfolio analysis
 */

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getNetwork, getSupportedNetworks, getNetworksByType } = require('./config/networks');
const { createAdapter } = require('./adapters');

// ==========================================================================
// CLI Configuration
// ==========================================================================

program
  .name('multi-chain-balance-diff')
  .description('Fetch wallet balances and compute diffs across EVM and Solana chains')
  .version('0.4.0')
  .option('-a, --address <address>', 'Wallet address to check')
  .option('-A, --addresses <addresses>', 'Multiple addresses (comma-separated or file path)')
  .option('-n, --network <network>', 'Network to query', 'mainnet')
  .option('-b, --blocks <number>', 'Number of blocks/slots to look back for diff', '50')
  .option('--no-tokens', 'Skip token balance checks')
  .option('--json', 'Output results as JSON')
  .option('--list-networks', 'List all supported networks')
  .option('-w, --watch', 'Watch mode: continuously monitor balance')
  .option('-i, --interval <seconds>', 'Watch interval in seconds', '30')
  .option('-p, --profile <name>', 'Use saved profile from config file')
  .option('--config <path>', 'Path to config file')
  .parse(process.argv);

const options = program.opts();

// ==========================================================================
// Config File Support
// ==========================================================================

const CONFIG_LOCATIONS = [
  '.balancediffrc.json',
  '.balancediffrc',
  path.join(os.homedir(), '.balancediffrc.json'),
  path.join(os.homedir(), '.config', 'balancediff', 'config.json'),
];

function loadConfig() {
  // Use explicit config path if provided
  if (options.config) {
    try {
      const content = fs.readFileSync(options.config, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Could not load config from ${options.config}: ${error.message}`);
      process.exit(1);
    }
  }

  // Search default locations
  for (const loc of CONFIG_LOCATIONS) {
    try {
      const content = fs.readFileSync(loc, 'utf8');
      return JSON.parse(content);
    } catch {
      // Continue to next location
    }
  }

  return null;
}

function getProfileConfig(profileName) {
  const config = loadConfig();
  if (!config) {
    console.error(`❌ No config file found. Create .balancediffrc.json with your profiles.`);
    process.exit(1);
  }

  const profile = config.profiles?.[profileName];
  if (!profile) {
    console.error(`❌ Profile "${profileName}" not found in config.`);
    console.error(`   Available profiles: ${Object.keys(config.profiles || {}).join(', ')}`);
    process.exit(1);
  }

  return profile;
}

// ==========================================================================
// Address Resolution
// ==========================================================================

function resolveAddresses() {
  // If using a profile, get address from there
  if (options.profile) {
    const profile = getProfileConfig(options.profile);
    // Override network from profile if not explicitly set
    if (profile.network && options.network === 'mainnet') {
      options.network = profile.network;
    }
    return Array.isArray(profile.address) ? profile.address : [profile.address];
  }

  // Single address
  if (options.address) {
    return [options.address];
  }

  // Multiple addresses
  if (options.addresses) {
    // Check if it's a file path
    if (fs.existsSync(options.addresses)) {
      const content = fs.readFileSync(options.addresses, 'utf8');
      return content.split('\n').map(a => a.trim()).filter(a => a && !a.startsWith('#'));
    }
    // Comma-separated
    return options.addresses.split(',').map(a => a.trim());
  }

  return [];
}

// Check for required address unless listing networks
const addresses = resolveAddresses();
if (!options.listNetworks && addresses.length === 0) {
  console.error("\nerror: required option '-a, --address <address>' not specified\n");
  console.error("You can also use:");
  console.error("  -A, --addresses <addresses>  Multiple addresses (comma-separated or file)");
  console.error("  -p, --profile <name>         Use saved profile from config file\n");
  process.exit(1);
}

// ==========================================================================
// Display Helpers
// ==========================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

// Disable colors for JSON output
const useColors = !options.json;
const c = (color) => useColors ? COLORS[color] : '';

function printSeparator(char = '─', length = 65) {
  console.log(c('dim') + char.repeat(length) + c('reset'));
}

function printHeader(text) {
  console.log(`${c('bright')}${text}${c('reset')}`);
}

function printKeyValue(key, value, indent = 2) {
  const spaces = ' '.repeat(indent);
  console.log(`${spaces}${c('cyan')}${key}:${c('reset')} ${value}`);
}

function formatDiffColored(diff, symbol, decimals) {
  const absValue = diff < 0n ? -diff : diff;
  const formatted = formatBigInt(absValue, decimals);
  const isPositive = diff >= 0n;
  const prefix = isPositive ? '+' : '-';
  const color = isPositive ? c('green') : c('red');
  
  return `${color}${prefix}${formatted} ${symbol}${c('reset')}`;
}

function formatBigInt(value, decimals) {
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  
  if (fraction === 0n) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmed = fractionStr.replace(/0+$/, '').slice(0, 6);
  
  return `${whole}.${trimmed}`;
}

function clearLine() {
  process.stdout.write('\x1b[2K\x1b[0G');
}

function formatTimestamp() {
  return new Date().toLocaleTimeString();
}

// ==========================================================================
// Network List Command
// ==========================================================================

function listNetworks() {
  if (options.json) {
    const networks = {
      evm: getNetworksByType('evm').map(key => {
        const net = getNetwork(key);
        return { key, name: net.name, symbol: net.nativeSymbol, chainId: net.chainId };
      }),
      solana: getNetworksByType('solana').map(key => {
        const net = getNetwork(key);
        return { key, name: net.name, symbol: net.nativeSymbol };
      }),
    };
    console.log(JSON.stringify(networks, null, 2));
    return;
  }

  console.log('\n📡 Supported Networks:\n');
  
  console.log('  EVM Chains:');
  for (const key of getNetworksByType('evm')) {
    const net = getNetwork(key);
    console.log(`    ${c('cyan')}${key.padEnd(12)}${c('reset')} ${net.name} (${net.nativeSymbol})`);
  }
  
  console.log('\n  Solana Chains:');
  for (const key of getNetworksByType('solana')) {
    const net = getNetwork(key);
    console.log(`    ${c('cyan')}${key.padEnd(12)}${c('reset')} ${net.name} (${net.nativeSymbol})`);
  }
  
  console.log('\nUsage:');
  console.log('  mcbd --address <ADDR> --network mainnet');
  console.log('  mcbd --address <ADDR> --network base');
  console.log('  mcbd --address <ADDR> --network solana');
  console.log('  mcbd --address <ADDR> --network helium --json\n');
}

// ==========================================================================
// JSON Output Builder
// ==========================================================================

function buildJsonOutput(networkConfig, address, balanceDiff, tokenBalances, adapter) {
  const blockLabel = networkConfig.chainType === 'solana' ? 'slot' : 'block';
  
  return {
    network: {
      key: options.network,
      name: networkConfig.name,
      chainType: networkConfig.chainType,
      chainId: networkConfig.chainId,
    },
    address,
    explorer: adapter.getExplorerUrl(address),
    [blockLabel]: {
      current: balanceDiff.currentBlock,
      previous: balanceDiff.previousBlock,
    },
    native: {
      symbol: networkConfig.nativeSymbol,
      decimals: networkConfig.nativeDecimals,
      balance: formatBigInt(balanceDiff.current.raw, networkConfig.nativeDecimals),
      balanceRaw: balanceDiff.current.raw.toString(),
      diff: formatBigInt(balanceDiff.diff < 0n ? -balanceDiff.diff : balanceDiff.diff, networkConfig.nativeDecimals),
      diffRaw: balanceDiff.diff.toString(),
      diffSign: balanceDiff.diff >= 0n ? 'positive' : 'negative',
    },
    tokens: tokenBalances.map(token => ({
      symbol: token.symbol,
      address: token.address || token.mint,
      decimals: token.decimals,
      balance: token.formatted,
      balanceRaw: token.raw.toString(),
    })),
    timestamp: new Date().toISOString(),
  };
}

function buildMultiAddressJsonOutput(networkConfig, results) {
  return {
    network: {
      key: options.network,
      name: networkConfig.name,
      chainType: networkConfig.chainType,
      chainId: networkConfig.chainId,
    },
    addresses: results,
    summary: {
      totalAddresses: results.length,
      successCount: results.filter(r => !r.error).length,
      errorCount: results.filter(r => r.error).length,
    },
    timestamp: new Date().toISOString(),
  };
}

// ==========================================================================
// Pretty Print Output
// ==========================================================================

function printPrettyOutput(networkConfig, address, balanceDiff, tokenBalances, adapter, blocksBack, isMulti = false) {
  if (!isMulti) {
    console.log();
    printSeparator('═');
  }
  printHeader(`  ${isMulti ? address : networkConfig.name}`);
  printSeparator('─');
  
  if (!isMulti) {
    const blockLabel = networkConfig.chainType === 'solana' ? 'Current slot' : 'Current block';
    printKeyValue(blockLabel, balanceDiff.currentBlock.toLocaleString());
    printKeyValue('Address', address);
  }
  printKeyValue('Explorer', adapter.getExplorerUrl(address));
  
  printSeparator('─');
  
  // Native balance
  const nativeFormatted = `${formatBigInt(balanceDiff.current.raw, networkConfig.nativeDecimals)} ${networkConfig.nativeSymbol}`;
  printKeyValue('Native balance', nativeFormatted);
  
  // Diff
  const diffColored = formatDiffColored(
    balanceDiff.diff,
    networkConfig.nativeSymbol,
    networkConfig.nativeDecimals
  );
  const rangeLabel = networkConfig.chainType === 'solana' ? 'slots' : 'blocks';
  console.log(`  ${c('cyan')}Δ over ${blocksBack} ${rangeLabel}:${c('reset')} ${diffColored}`);
  
  if (!isMulti) {
    console.log(`    ${c('dim')}(${balanceDiff.previousBlock.toLocaleString()} → ${balanceDiff.currentBlock.toLocaleString()})${c('reset')}`);
  }

  // Token balances
  if (tokenBalances.length > 0) {
    printSeparator('─');
    console.log(`  ${c('bright')}Tokens:${c('reset')}`);
    
    for (const token of tokenBalances) {
      const amount = parseFloat(token.formatted).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });
      console.log(`    ${c('cyan')}${token.symbol.padEnd(10)}${c('reset')} ${amount}`);
    }
  } else if (options.tokens && networkConfig.tokens.length > 0) {
    printSeparator('─');
    console.log(`  ${c('dim')}Tokens: (no balances found)${c('reset')}`);
  }

  if (!isMulti) {
    printSeparator('═');
    console.log();
  }
}

function printMultiAddressSummary(networkConfig, results, blocksBack) {
  console.log();
  printSeparator('═');
  printHeader(`  ${networkConfig.name} — ${results.length} addresses`);
  printSeparator('═');
  
  let totalNative = 0n;
  let totalDiff = 0n;
  
  for (const result of results) {
    if (result.error) {
      console.log(`  ${c('red')}✗${c('reset')} ${result.address}: ${result.error}`);
    } else {
      const shortAddr = `${result.address.slice(0, 8)}...${result.address.slice(-6)}`;
      const balance = formatBigInt(result.balanceDiff.current.raw, networkConfig.nativeDecimals);
      const diff = formatDiffColored(result.balanceDiff.diff, networkConfig.nativeSymbol, networkConfig.nativeDecimals);
      
      console.log(`  ${c('green')}✓${c('reset')} ${shortAddr}  ${balance.padStart(12)} ${networkConfig.nativeSymbol}  ${diff}`);
      
      totalNative += result.balanceDiff.current.raw;
      totalDiff += result.balanceDiff.diff;
    }
  }
  
  printSeparator('─');
  const totalFormatted = formatBigInt(totalNative, networkConfig.nativeDecimals);
  const totalDiffColored = formatDiffColored(totalDiff, networkConfig.nativeSymbol, networkConfig.nativeDecimals);
  console.log(`  ${c('bright')}Total:${c('reset')}      ${totalFormatted.padStart(12)} ${networkConfig.nativeSymbol}  ${totalDiffColored}`);
  printSeparator('═');
  console.log();
}

// ==========================================================================
// Watch Mode
// ==========================================================================

async function watchMode(adapter, networkConfig, address, blocksBack) {
  const intervalMs = parseInt(options.interval, 10) * 1000;
  
  console.log();
  console.log(`🔄 ${c('bright')}Watch mode${c('reset')} — monitoring ${address.slice(0, 8)}...${address.slice(-6)}`);
  console.log(`   Network: ${networkConfig.name}`);
  console.log(`   Interval: ${options.interval}s`);
  console.log(`   Press Ctrl+C to exit`);
  console.log();
  printSeparator('─');
  
  let lastBalance = null;
  
  const tick = async () => {
    try {
      const balanceDiff = await adapter.getNativeBalanceDiff(address, blocksBack);
      const currentBalance = formatBigInt(balanceDiff.current.raw, networkConfig.nativeDecimals);
      const diff = formatDiffColored(balanceDiff.diff, networkConfig.nativeSymbol, networkConfig.nativeDecimals);
      
      let changeIndicator = '';
      if (lastBalance !== null && balanceDiff.current.raw !== lastBalance) {
        const delta = balanceDiff.current.raw - lastBalance;
        const deltaFormatted = formatBigInt(delta < 0n ? -delta : delta, networkConfig.nativeDecimals);
        const sign = delta >= 0n ? '+' : '-';
        const color = delta >= 0n ? c('green') : c('red');
        changeIndicator = ` ${color}(${sign}${deltaFormatted} since last check)${c('reset')}`;
      }
      lastBalance = balanceDiff.current.raw;
      
      console.log(`  [${formatTimestamp()}] ${currentBalance} ${networkConfig.nativeSymbol}  Δ${blocksBack}: ${diff}${changeIndicator}`);
    } catch (error) {
      console.log(`  [${formatTimestamp()}] ${c('red')}Error: ${error.message}${c('reset')}`);
    }
  };
  
  // Initial tick
  await tick();
  
  // Set up interval
  const intervalId = setInterval(tick, intervalMs);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(intervalId);
    console.log();
    console.log(`\n👋 Watch mode stopped.`);
    process.exit(0);
  });
  
  // Keep process alive
  await new Promise(() => {});
}

// ==========================================================================
// Fetch Single Address
// ==========================================================================

async function fetchAddressData(adapter, networkConfig, address, blocksBack, checkTokens) {
  try {
    // Validate address format for this chain type
    if (!adapter.isValidAddress(address)) {
      return { address, error: `Invalid ${networkConfig.chainType.toUpperCase()} address` };
    }

    // Fetch native balance diff
    const balanceDiff = await adapter.getNativeBalanceDiff(address, blocksBack);

    // Fetch token balances
    let tokenBalances = [];
    if (checkTokens && networkConfig.tokens.length > 0) {
      tokenBalances = await adapter.getTokenBalances(address, networkConfig.tokens);
    }

    return { address, balanceDiff, tokenBalances };
  } catch (error) {
    return { address, error: error.message };
  }
}

// ==========================================================================
// Main Execution
// ==========================================================================

async function main() {
  // Handle --list-networks flag
  if (options.listNetworks) {
    listNetworks();
    process.exit(0);
  }

  const { network, blocks, tokens: checkTokens } = options;
  const blocksBack = parseInt(blocks, 10);

  // Get network configuration
  const networkConfig = getNetwork(network);
  if (!networkConfig) {
    if (options.json) {
      console.log(JSON.stringify({ error: `Unknown network: ${network}` }));
    } else {
      console.error(`\n❌ Unknown network: ${network}`);
      console.error(`   Run with --list-networks to see available options.\n`);
    }
    process.exit(1);
  }

  // Validate blocks parameter
  if (isNaN(blocksBack) || blocksBack < 1) {
    if (options.json) {
      console.log(JSON.stringify({ error: `Invalid blocks value: ${blocks}` }));
    } else {
      console.error(`\n❌ Invalid blocks value: ${blocks}`);
      console.error('   Please provide a positive integer.\n');
    }
    process.exit(1);
  }

  // Create the appropriate adapter for this chain
  const adapter = createAdapter(networkConfig);

  // Validate all addresses before connecting (fail fast)
  for (const addr of addresses) {
    if (!adapter.isValidAddress(addr)) {
      if (options.json) {
        console.log(JSON.stringify({ error: `Invalid ${networkConfig.chainType.toUpperCase()} address: ${addr}` }));
      } else {
        console.error(`\n❌ Invalid ${networkConfig.chainType.toUpperCase()} address: ${addr}`);
        if (networkConfig.chainType === 'evm') {
          console.error('   Expected format: 0x followed by 40 hex characters');
        } else if (networkConfig.chainType === 'solana') {
          console.error('   Expected format: Base58 encoded public key');
        }
        console.error('');
      }
      process.exit(1);
    }
  }

  // Connect
  if (!options.json) {
    console.log();
    console.log(`🔗 Connecting to ${c('bright')}${networkConfig.name}${c('reset')}...`);
  }

  try {
    await adapter.connect();
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({ error: `Connection failed: ${error.message}` }));
    } else {
      console.error(`\n❌ Could not connect to ${networkConfig.name}`);
      console.error(`   ${error.message}\n`);
    }
    process.exit(1);
  }

  // Watch mode (single address only)
  if (options.watch) {
    if (addresses.length > 1) {
      console.error(`\n❌ Watch mode only supports a single address.\n`);
      process.exit(1);
    }
    
    await watchMode(adapter, networkConfig, addresses[0], blocksBack);
    return;
  }

  // Multi-address mode
  if (addresses.length > 1) {
    if (!options.json) {
      console.log(`📊 Fetching data for ${addresses.length} addresses...`);
    }

    const results = await Promise.all(
      addresses.map(addr => fetchAddressData(adapter, networkConfig, addr, blocksBack, checkTokens))
    );

    if (options.json) {
      const output = buildMultiAddressJsonOutput(networkConfig, results.map(r => {
        if (r.error) {
          return { address: r.address, error: r.error };
        }
        return buildJsonOutput(networkConfig, r.address, r.balanceDiff, r.tokenBalances, adapter);
      }));
      console.log(JSON.stringify(output, null, 2));
    } else {
      printMultiAddressSummary(networkConfig, results, blocksBack);
    }
    return;
  }

  // Single address mode
  const address = addresses[0];

  if (!options.json) {
    const shortAddr = networkConfig.chainType === 'evm'
      ? `${address.slice(0, 8)}...${address.slice(-6)}`
      : `${address.slice(0, 6)}...${address.slice(-6)}`;
    console.log(`📊 Fetching balance data for ${shortAddr}`);
  }

  try {
    // Fetch native balance diff
    const balanceDiff = await adapter.getNativeBalanceDiff(address, blocksBack);

    // Fetch token balances
    let tokenBalances = [];
    if (checkTokens && networkConfig.tokens.length > 0) {
      if (!options.json) {
        console.log(`🪙  Checking ${networkConfig.tokens.length} tokens...`);
      }
      tokenBalances = await adapter.getTokenBalances(address, networkConfig.tokens);
    }

    // Output results
    if (options.json) {
      const output = buildJsonOutput(networkConfig, address, balanceDiff, tokenBalances, adapter);
      console.log(JSON.stringify(output, null, 2));
    } else {
      printPrettyOutput(networkConfig, address, balanceDiff, tokenBalances, adapter, blocksBack);
    }

  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({ 
        error: error.message,
        code: error.code || null,
      }));
      process.exit(1);
    }

    console.error();
    
    if (error.message?.includes('Invalid public key')) {
      console.error(`❌ Invalid Solana address format`);
      console.error(`   Address: ${address}`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error(`❌ Network error: Could not connect to ${networkConfig.name}`);
      console.error(`   RPC: ${networkConfig.rpcUrl}`);
      console.error('   Please check your internet connection or try a different RPC.');
    } else if (error.message?.includes('429') || error.message?.includes('rate')) {
      console.error(`❌ Rate limited by RPC endpoint`);
      console.error('   Try using a private RPC URL in your .env file.');
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
    
    console.error();
    process.exit(1);
  }
}

// Run
main();
