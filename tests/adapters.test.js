/**
 * Tests for chain adapters
 * Run with: npm test
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createAdapter, getSupportedChainTypes } = require('../src/adapters');
const { getNetwork } = require('../src/config/networks');

describe('Adapter Factory', () => {
  it('creates EVM adapter for mainnet', () => {
    const config = getNetwork('mainnet');
    const adapter = createAdapter(config);
    assert.strictEqual(adapter.getChainType(), 'evm');
  });

  it('creates Solana adapter for helium', () => {
    const config = getNetwork('helium');
    const adapter = createAdapter(config);
    assert.strictEqual(adapter.getChainType(), 'solana');
  });

  it('lists supported chain types', () => {
    const types = getSupportedChainTypes();
    assert.ok(types.includes('evm'));
    assert.ok(types.includes('solana'));
  });
});

describe('EVM Adapter', () => {
  it('validates EVM addresses correctly', () => {
    const config = getNetwork('mainnet');
    const adapter = createAdapter(config);
    
    assert.strictEqual(adapter.isValidAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'), true);
    assert.strictEqual(adapter.isValidAddress('0xinvalid'), false);
    assert.strictEqual(adapter.isValidAddress('not-an-address'), false);
  });

  it('formats balance correctly', () => {
    const config = getNetwork('mainnet');
    const adapter = createAdapter(config);
    
    // 1 ETH = 10^18 wei
    const oneEth = 1000000000000000000n;
    assert.strictEqual(adapter.formatBalance(oneEth, 18), '1');
    
    // 0.5 ETH
    const halfEth = 500000000000000000n;
    assert.strictEqual(adapter.formatBalance(halfEth, 18), '0.5');
  });

  it('formats balance with symbol', () => {
    const config = getNetwork('mainnet');
    const adapter = createAdapter(config);
    
    const oneEth = 1000000000000000000n;
    assert.strictEqual(adapter.formatBalanceWithSymbol(oneEth, 'ETH', 18), '1 ETH');
  });
});

describe('Solana Adapter', () => {
  it('validates Solana addresses correctly', () => {
    const config = getNetwork('solana');
    const adapter = createAdapter(config);
    
    // Valid Solana address (base58)
    assert.strictEqual(adapter.isValidAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'), true);
    
    // Invalid addresses
    assert.strictEqual(adapter.isValidAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'), false);
    assert.strictEqual(adapter.isValidAddress('not-an-address'), false);
  });

  it('formats SOL balance correctly', () => {
    const config = getNetwork('solana');
    const adapter = createAdapter(config);
    
    // 1 SOL = 10^9 lamports
    const oneSol = 1000000000n;
    assert.strictEqual(adapter.formatBalance(oneSol, 9), '1');
    
    // 0.5 SOL
    const halfSol = 500000000n;
    assert.strictEqual(adapter.formatBalance(halfSol, 9), '0.5');
  });
});

describe('Network Config', () => {
  it('returns null for unknown network', () => {
    const config = getNetwork('unknown-network');
    assert.strictEqual(config, null);
  });

  it('has correct chain types', () => {
    assert.strictEqual(getNetwork('mainnet').chainType, 'evm');
    assert.strictEqual(getNetwork('polygon').chainType, 'evm');
    assert.strictEqual(getNetwork('solana').chainType, 'solana');
    assert.strictEqual(getNetwork('helium').chainType, 'solana');
  });

  it('helium has HNT, MOBILE, IOT tokens', () => {
    const helium = getNetwork('helium');
    const symbols = helium.tokens.map(t => t.symbol);
    
    assert.ok(symbols.includes('HNT'));
    assert.ok(symbols.includes('MOBILE'));
    assert.ok(symbols.includes('IOT'));
  });
});

