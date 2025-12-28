/**
 * Tests for network configurations
 * Run with: npm test
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { getNetwork, getNetworksByType, getSupportedNetworks } = require('../src/config/networks');

describe('L2 Networks', () => {
  it('includes Base network', () => {
    const base = getNetwork('base');
    assert.ok(base, 'Base network should exist');
    assert.strictEqual(base.name, 'Base');
    assert.strictEqual(base.chainType, 'evm');
    assert.strictEqual(base.chainId, 8453);
    assert.strictEqual(base.nativeSymbol, 'ETH');
  });

  it('includes Arbitrum network', () => {
    const arb = getNetwork('arbitrum');
    assert.ok(arb, 'Arbitrum network should exist');
    assert.strictEqual(arb.name, 'Arbitrum One');
    assert.strictEqual(arb.chainType, 'evm');
    assert.strictEqual(arb.chainId, 42161);
    assert.strictEqual(arb.nativeSymbol, 'ETH');
  });

  it('includes Optimism network', () => {
    const op = getNetwork('optimism');
    assert.ok(op, 'Optimism network should exist');
    assert.strictEqual(op.name, 'Optimism');
    assert.strictEqual(op.chainType, 'evm');
    assert.strictEqual(op.chainId, 10);
    assert.strictEqual(op.nativeSymbol, 'ETH');
  });

  it('Base has correct tokens', () => {
    const base = getNetwork('base');
    const symbols = base.tokens.map(t => t.symbol);
    assert.ok(symbols.includes('USDC'), 'Should have USDC');
    assert.ok(symbols.includes('cbETH'), 'Should have cbETH');
  });

  it('Arbitrum has ARB token', () => {
    const arb = getNetwork('arbitrum');
    const symbols = arb.tokens.map(t => t.symbol);
    assert.ok(symbols.includes('ARB'), 'Should have ARB token');
    assert.ok(symbols.includes('GMX'), 'Should have GMX token');
  });

  it('Optimism has OP token', () => {
    const op = getNetwork('optimism');
    const symbols = op.tokens.map(t => t.symbol);
    assert.ok(symbols.includes('OP'), 'Should have OP token');
    assert.ok(symbols.includes('SNX'), 'Should have SNX token');
  });

  it('Scroll network is configured', () => {
    const scroll = getNetwork('scroll');
    assert.ok(scroll, 'Scroll network should exist');
    assert.strictEqual(scroll.chainId, 534352, 'Scroll chainId should be 534352');
    assert.strictEqual(scroll.nativeSymbol, 'ETH', 'Scroll native symbol should be ETH');
    const symbols = scroll.tokens.map(t => t.symbol);
    assert.ok(symbols.includes('USDC'), 'Should have USDC token');
  });
});

describe('Network Discovery', () => {
  it('getNetworksByType includes L2s in EVM', () => {
    const evmNetworks = getNetworksByType('evm');
    assert.ok(evmNetworks.includes('base'), 'Should include Base');
    assert.ok(evmNetworks.includes('arbitrum'), 'Should include Arbitrum');
    assert.ok(evmNetworks.includes('optimism'), 'Should include Optimism');
  });

  it('getSupportedNetworks includes all networks', () => {
    const all = getSupportedNetworks();
    assert.ok(all.includes('mainnet'));
    assert.ok(all.includes('polygon'));
    assert.ok(all.includes('base'));
    assert.ok(all.includes('arbitrum'));
    assert.ok(all.includes('optimism'));
    assert.ok(all.includes('solana'));
    assert.ok(all.includes('helium'));
  });
});



