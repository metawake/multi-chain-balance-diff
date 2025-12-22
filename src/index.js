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

// Read version from package.json (single source of truth)
const pkg = require('../package.json');
const VERSION = pkg.version;
const SCHEMA_VERSION = '0.1.0';

// ==========================================================================
// Exit Codes (CI-friendly)
// ==========================================================================

const EXIT_OK = 0;           // No diff detected (or below threshold)
const EXIT_DIFF = 1;         // Diff detected (above threshold)
const EXIT_RPC_ERROR = 2;    // RPC/connection failure
const EXIT_SIGINT = 130;     // Interrupted by Ctrl+C

// ==========================================================================
// CLI Configuration
// ==========================================================================

program
  .name('multi-chain-balance-diff')
  .description('Fetch wallet balances and compute diffs across EVM and Solana chains')
  .version(VERSION)
  .option('-a, --address <address>', 'Wallet address to check')
  .option('-A, --addresses <addresses>', 'Multiple addresses (comma-separated or file path)')
  .option('-n, --network <network>', 'Network to query', 'mainnet')
  .option('-b, --blocks <number>', 'Number of blocks/slots to look back for diff', '50')
  .option('--no-tokens', 'Skip token balance checks')
  .option('--json', 'Output results as JSON')
  .option('--list-networks', 'List all supported networks')
  .option('-w, --watch', 'Watch mode: continuously monitor balance')
  .option('-i, --interval <seconds>', 'Watch interval in seconds', '30')
  .option('-c, --count <n>', 'Exit after N polls (watch mode only)')
  .option('--exit-on-error', 'Exit immediately on RPC failure (watch mode)')
  .option('--exit-on-diff', 'Exit immediately when threshold triggers (watch mode)')
  .option('-p, --profile <name>', 'Use saved profile from config file')
  .option('--config <path>', 'Path to config file')
  .option('--alert-if-diff <threshold>', 'Exit 1 if diff exceeds threshold (e.g., ">0.01", ">=1", "<-0.5")')
  .option('--alert-pct <threshold>', 'Exit 1 if diff exceeds % of balance (e.g., ">5", "<-10")')
  .option('--timeout <seconds>', 'RPC request timeout in seconds', '30')
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
// Threshold Parsing
// ==========================================================================

/**
 * Parse threshold string like ">0.01", ">=1", "<-0.5", "0.01" (defaults to >)
 * Returns { operator, value } or null if invalid
 */
function parseThreshold(thresholdStr) {
  if (!thresholdStr) return null;
  
  const match = thresholdStr.match(/^(>=?|<=?)?(-?\d+\.?\d*)$/);
  if (!match) {
    return null;
  }
  
  const operator = match[1] || '>';  // default to > if no operator
  const value = parseFloat(match[2]);
  
  if (isNaN(value)) return null;
  
  return { operator, value };
}

/**
 * Convert bigint to number for threshold comparisons.
 * @param {bigint} raw - The raw value
 * @param {number} decimals - Token decimals
 * @returns {number}
 */
function bigintToNumber(raw, decimals) {
  const divisor = BigInt(10 ** decimals);
  const whole = Number(raw / divisor);
  const fraction = Number(raw % divisor) / (10 ** decimals);
  return whole + fraction;
}

/**
 * Check if diff triggers alert based on threshold
 * @param {bigint} diffRaw - The raw diff value
 * @param {number} decimals - Token decimals for conversion
 * @param {object} threshold - Parsed threshold { operator, value }
 * @returns {boolean} - true if alert should trigger
 */
function checkThreshold(diffRaw, decimals, threshold) {
  if (!threshold) return false;
  
  const diffValue = bigintToNumber(diffRaw, decimals);
  
  switch (threshold.operator) {
    case '>':  return diffValue > threshold.value;
    case '>=': return diffValue >= threshold.value;
    case '<':  return diffValue < threshold.value;
    case '<=': return diffValue <= threshold.value;
    default:   return false;
  }
}

/**
 * Check if diff triggers alert based on percentage threshold.
 * @param {bigint} diffRaw - The raw diff value
 * @param {bigint} previousRaw - The previous balance for percentage calc
 * @param {number} decimals - Token decimals for conversion
 * @param {object} threshold - Parsed threshold { operator, value } where value is %
 * @returns {boolean} - true if alert should trigger
 */
function checkPercentageThreshold(diffRaw, previousRaw, decimals, threshold) {
  if (!threshold) return false;
  if (previousRaw === 0n) return false; // Avoid division by zero
  
  const diffValue = bigintToNumber(diffRaw, decimals);
  const previousValue = bigintToNumber(previousRaw, decimals);
  
  if (previousValue === 0) return false;
  
  const percentChange = (diffValue / previousValue) * 100;
  
  switch (threshold.operator) {
    case '>':  return percentChange > threshold.value;
    case '>=': return percentChange >= threshold.value;
    case '<':  return percentChange < threshold.value;
    case '<=': return percentChange <= threshold.value;
    default:   return false;
  }
}

// ==========================================================================
// Network List Command
// ==========================================================================

function listNetworks() {
  if (options.json) {
    const networks = {
      schemaVersion: SCHEMA_VERSION,
      evm: getNetworksByType('evm').map(key => {
        const net = getNetwork(key);
        return { key, name: net.name, symbol: net.nativeSymbol, chainId: net.chainId };
      }),
      solana: getNetworksByType('solana').map(key => {
        const net = getNetwork(key);
        return { key, name: net.name, symbol: net.nativeSymbol };
      }),
      ton: getNetworksByType('ton').map(key => {
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

  console.log('\n  TON Chains:');
  for (const key of getNetworksByType('ton')) {
    const net = getNetwork(key);
    console.log(`    ${c('cyan')}${key.padEnd(12)}${c('reset')} ${net.name} (${net.nativeSymbol})`);
  }
  
  console.log('\nUsage:');
  console.log('  mcbd --address <ADDR> --network mainnet');
  console.log('  mcbd --address <ADDR> --network base');
  console.log('  mcbd --address <ADDR> --network solana');
  console.log('  mcbd --address <ADDR> --network ton --json\n');
}

// ==========================================================================
// JSON Output Builder
// ==========================================================================

function buildJsonOutput(networkConfig, address, balanceDiff, tokenBalances, adapter) {
  const blockLabel = networkConfig.chainType === 'solana' ? 'slot' : 'block';
  
  return {
    schemaVersion: SCHEMA_VERSION,
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
    schemaVersion: SCHEMA_VERSION,
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

/**
 * Build a single poll result for JSON output.
 */
function buildPollResult(networkConfig, address, balanceDiff, alertTriggered, error = null) {
  if (error) {
    return {
      schemaVersion: SCHEMA_VERSION,
      timestamp: new Date().toISOString(),
      address,
      error: error.message || String(error),
      isRpcError: isRpcError(error),
    };
  }
  
  const blockLabel = networkConfig.chainType === 'solana' ? 'slot' : 'block';
  return {
    schemaVersion: SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    address,
    [blockLabel]: balanceDiff.currentBlock,
    balance: formatBigInt(balanceDiff.current.raw, networkConfig.nativeDecimals),
    balanceRaw: balanceDiff.current.raw.toString(),
    diff: formatBigInt(balanceDiff.diff < 0n ? -balanceDiff.diff : balanceDiff.diff, networkConfig.nativeDecimals),
    diffRaw: balanceDiff.diff.toString(),
    diffSign: balanceDiff.diff >= 0n ? 'positive' : 'negative',
    alert: alertTriggered,
  };
}

/**
 * Check if an error is RPC-related.
 */
function isRpcError(error) {
  return error.code === 'ENOTFOUND' || 
         error.code === 'ECONNREFUSED' ||
         error.code === 'ETIMEDOUT' ||
         error.message?.includes('429') ||
         error.message?.includes('rate') ||
         error.message?.includes('timeout');
}

/**
 * Watch mode: poll balances periodically with CI-friendly semantics.
 * 
 * Behavior:
 * - Polls at --interval seconds
 * - Exits after --count polls (if specified)
 * - Exits immediately on threshold breach (if --exit-on-diff)
 * - Exits immediately on RPC error (if --exit-on-error)
 * - JSON mode outputs newline-delimited JSON (one object per poll)
 * 
 * Exit codes:
 * - 0: Completed without threshold breach
 * - 1: Threshold breached
 * - 2: RPC error (with --exit-on-error)
 * - 130: SIGINT
 */
async function watchMode(adapter, networkConfig, address, blocksBack) {
  const intervalMs = parseInt(options.interval, 10) * 1000;
  const maxPolls = options.count ? parseInt(options.count, 10) : Infinity;
  const exitOnError = options.exitOnError;
  const exitOnDiff = options.exitOnDiff;
  const threshold = parseThreshold(options.alertIfDiff);
  const pctThreshold = parseThreshold(options.alertPct);
  
  let pollCount = 0;
  let lastBalance = null;
  let shouldExit = false;
  let exitCode = EXIT_OK;
  let intervalId = null;
  
  // JSON mode: output watch metadata at start
  if (options.json) {
    const meta = {
      schemaVersion: SCHEMA_VERSION,
      type: 'watch_start',
      timestamp: new Date().toISOString(),
      network: options.network,
      address,
      interval: parseInt(options.interval, 10),
      count: options.count ? parseInt(options.count, 10) : null,
      threshold: options.alertIfDiff || null,
      thresholdPct: options.alertPct || null,
    };
    console.log(JSON.stringify(meta));
  } else {
    console.log();
    console.log(`🔄 ${c('bright')}Watch mode${c('reset')} — monitoring ${address.slice(0, 8)}...${address.slice(-6)}`);
    console.log(`   Network: ${networkConfig.name}`);
    console.log(`   Interval: ${options.interval}s`);
    if (maxPolls !== Infinity) {
      console.log(`   Count: ${maxPolls} polls`);
    }
    if (threshold) {
      console.log(`   Threshold: ${options.alertIfDiff}`);
    }
    if (pctThreshold) {
      console.log(`   Threshold (%): ${options.alertPct}`);
    }
    console.log(`   Press Ctrl+C to exit`);
    console.log();
    printSeparator('─');
  }
  
  const tick = async () => {
    pollCount++;
    
    try {
      const balanceDiff = await adapter.getNativeBalanceDiff(address, blocksBack);
      
      // Check absolute threshold
      const absTriggered = checkThreshold(
        balanceDiff.diff, 
        networkConfig.nativeDecimals, 
        threshold
      );
      
      // Check percentage threshold
      const pctTriggered = checkPercentageThreshold(
        balanceDiff.diff,
        balanceDiff.previous.raw,
        networkConfig.nativeDecimals,
        pctThreshold
      );
      
      const alertTriggered = absTriggered || pctTriggered;
      
      if (options.json) {
        // Newline-delimited JSON for streaming
        const result = buildPollResult(networkConfig, address, balanceDiff, alertTriggered);
        result.poll = pollCount;
        console.log(JSON.stringify(result));
      } else {
        // Pretty output
        const currentBalance = formatBigInt(balanceDiff.current.raw, networkConfig.nativeDecimals);
        const diff = formatDiffColored(balanceDiff.diff, networkConfig.nativeSymbol, networkConfig.nativeDecimals);
        
        let changeIndicator = '';
        if (lastBalance !== null && balanceDiff.current.raw !== lastBalance) {
          const delta = balanceDiff.current.raw - lastBalance;
          const deltaFormatted = formatBigInt(delta < 0n ? -delta : delta, networkConfig.nativeDecimals);
          const sign = delta >= 0n ? '+' : '-';
          const color = delta >= 0n ? c('green') : c('red');
          changeIndicator = ` ${color}(${sign}${deltaFormatted} since last)${c('reset')}`;
        }
        
        const alertIndicator = alertTriggered ? ` ${c('yellow')}⚠ ALERT${c('reset')}` : '';
        console.log(`  [${formatTimestamp()}] ${currentBalance} ${networkConfig.nativeSymbol}  Δ${blocksBack}: ${diff}${changeIndicator}${alertIndicator}`);
      }
      
      lastBalance = balanceDiff.current.raw;
      
      // Exit on diff if threshold triggered
      if (alertTriggered && exitOnDiff) {
        shouldExit = true;
        exitCode = EXIT_DIFF;
      }
      
      // Track if any poll triggered threshold (for final exit code)
      if (alertTriggered) {
        exitCode = EXIT_DIFF;
      }
      
    } catch (error) {
      if (options.json) {
        const result = buildPollResult(networkConfig, address, null, false, error);
        result.poll = pollCount;
        console.log(JSON.stringify(result));
      } else {
        console.log(`  [${formatTimestamp()}] ${c('red')}Error: ${error.message}${c('reset')}`);
      }
      
      if (exitOnError && isRpcError(error)) {
        shouldExit = true;
        exitCode = EXIT_RPC_ERROR;
      }
    }
    
    // Check if we've reached max polls
    if (pollCount >= maxPolls) {
      shouldExit = true;
    }
    
    if (shouldExit) {
      if (intervalId) clearInterval(intervalId);
      if (options.json) {
        console.log(JSON.stringify({ 
          schemaVersion: SCHEMA_VERSION,
          type: 'watch_end', 
          timestamp: new Date().toISOString(),
          polls: pollCount, 
          exitCode 
        }));
      } else {
        console.log();
        console.log(`👋 Watch mode stopped. (${pollCount} polls, exit ${exitCode})`);
      }
      process.exit(exitCode);
    }
  };
  
  // Initial tick
  await tick();
  
  // Set up interval (only if not exiting)
  if (!shouldExit) {
    intervalId = setInterval(tick, intervalMs);
  }
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    if (intervalId) clearInterval(intervalId);
    if (options.json) {
      console.log(JSON.stringify({ 
        schemaVersion: SCHEMA_VERSION,
        type: 'watch_end', 
        timestamp: new Date().toISOString(),
        polls: pollCount, 
        exitCode: EXIT_SIGINT,
        reason: 'SIGINT'
      }));
    } else {
      console.log();
      console.log(`\n👋 Watch mode stopped. (interrupted)`);
    }
    process.exit(EXIT_SIGINT);
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
      console.log(JSON.stringify({ schemaVersion: SCHEMA_VERSION, error: `Unknown network: ${network}` }));
    } else {
      console.error(`\n❌ Unknown network: ${network}`);
      console.error(`   Run with --list-networks to see available options.\n`);
    }
    process.exit(1);
  }

  // Validate blocks parameter
  if (isNaN(blocksBack) || blocksBack < 1) {
    if (options.json) {
      console.log(JSON.stringify({ schemaVersion: SCHEMA_VERSION, error: `Invalid blocks value: ${blocks}` }));
    } else {
      console.error(`\n❌ Invalid blocks value: ${blocks}`);
      console.error('   Please provide a positive integer.\n');
    }
    process.exit(1);
  }

  // Parse timeout (convert seconds to milliseconds)
  const timeoutMs = parseInt(options.timeout, 10) * 1000;

  // Create the appropriate adapter for this chain
  const adapter = createAdapter(networkConfig, { timeoutMs });

  // Validate all addresses before connecting (fail fast)
  for (const addr of addresses) {
    if (!adapter.isValidAddress(addr)) {
      if (options.json) {
        console.log(JSON.stringify({ schemaVersion: SCHEMA_VERSION, error: `Invalid ${networkConfig.chainType.toUpperCase()} address: ${addr}` }));
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
      console.log(JSON.stringify({ schemaVersion: SCHEMA_VERSION, error: `Connection failed: ${error.message}`, exitCode: EXIT_RPC_ERROR }));
    } else {
      console.error(`\n❌ Could not connect to ${networkConfig.name}`);
      console.error(`   ${error.message}\n`);
    }
    process.exit(EXIT_RPC_ERROR);
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

    // Check threshold for any address
    const threshold = parseThreshold(options.alertIfDiff);
    const pctThreshold = parseThreshold(options.alertPct);
    let anyAlertTriggered = false;
    
    for (const r of results) {
      if (r.error) continue;
      
      const absTriggered = checkThreshold(r.balanceDiff.diff, networkConfig.nativeDecimals, threshold);
      const pctTriggered = checkPercentageThreshold(
        r.balanceDiff.diff,
        r.balanceDiff.previous.raw,
        networkConfig.nativeDecimals,
        pctThreshold
      );
      
      if (absTriggered || pctTriggered) {
        anyAlertTriggered = true;
        break;
      }
    }

    if (options.json) {
      const output = buildMultiAddressJsonOutput(networkConfig, results.map(r => {
        if (r.error) {
          return { address: r.address, error: r.error };
        }
        const item = buildJsonOutput(networkConfig, r.address, r.balanceDiff, r.tokenBalances, adapter);
        
        const absTriggered = checkThreshold(r.balanceDiff.diff, networkConfig.nativeDecimals, threshold);
        const pctTriggered = checkPercentageThreshold(
          r.balanceDiff.diff,
          r.balanceDiff.previous.raw,
          networkConfig.nativeDecimals,
          pctThreshold
        );
        
        if (threshold || pctThreshold) {
          item.alert = {
            threshold: options.alertIfDiff || null,
            thresholdPct: options.alertPct || null,
            triggered: absTriggered || pctTriggered,
          };
        }
        return item;
      }));
      if (threshold || pctThreshold) {
        output.alert = { 
          threshold: options.alertIfDiff || null, 
          thresholdPct: options.alertPct || null,
          triggered: anyAlertTriggered 
        };
      }
      console.log(JSON.stringify(output, null, 2));
    } else {
      printMultiAddressSummary(networkConfig, results, blocksBack);
      if (anyAlertTriggered) {
        const which = options.alertIfDiff || (options.alertPct + '%');
        console.log(`${c('yellow')}⚠️  Alert: threshold ${which} triggered${c('reset')}\n`);
      }
    }
    
    process.exit(anyAlertTriggered ? EXIT_DIFF : EXIT_OK);
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

    // Check thresholds if specified
    const threshold = parseThreshold(options.alertIfDiff);
    const pctThreshold = parseThreshold(options.alertPct);
    
    const absTriggered = checkThreshold(balanceDiff.diff, networkConfig.nativeDecimals, threshold);
    const pctTriggered = checkPercentageThreshold(
      balanceDiff.diff,
      balanceDiff.previous.raw,
      networkConfig.nativeDecimals,
      pctThreshold
    );
    const alertTriggered = absTriggered || pctTriggered;

    // Output results
    if (options.json) {
      const output = buildJsonOutput(networkConfig, address, balanceDiff, tokenBalances, adapter);
      if (threshold || pctThreshold) {
        output.alert = {
          threshold: options.alertIfDiff || null,
          thresholdPct: options.alertPct || null,
          triggered: alertTriggered,
          triggeredBy: absTriggered ? 'absolute' : pctTriggered ? 'percentage' : null,
        };
      }
      console.log(JSON.stringify(output, null, 2));
    } else {
      printPrettyOutput(networkConfig, address, balanceDiff, tokenBalances, adapter, blocksBack);
      
      if (alertTriggered) {
        const which = absTriggered ? options.alertIfDiff : options.alertPct + '%';
        console.log(`${c('yellow')}⚠️  Alert: threshold ${which} triggered${c('reset')}\n`);
      }
    }

    // Exit with appropriate code
    process.exit(alertTriggered ? EXIT_DIFF : EXIT_OK);

  } catch (error) {
    // Determine if this is an RPC error
    const isRpcError = error.code === 'ENOTFOUND' || 
                       error.code === 'ECONNREFUSED' ||
                       error.message?.includes('429') ||
                       error.message?.includes('rate') ||
                       error.message?.includes('timeout');

    if (options.json) {
      console.log(JSON.stringify({ 
        schemaVersion: SCHEMA_VERSION,
        error: error.message,
        code: error.code || null,
        exitCode: isRpcError ? EXIT_RPC_ERROR : EXIT_DIFF,
      }));
      process.exit(isRpcError ? EXIT_RPC_ERROR : EXIT_DIFF);
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
    process.exit(isRpcError ? EXIT_RPC_ERROR : EXIT_DIFF);
  }
}

// Run
main();
