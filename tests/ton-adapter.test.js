/**
 * Tests for TON Adapter
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Test that the adapter can be loaded
describe('TON Adapter', () => {
  it('can be required without errors', () => {
    const TonAdapter = require('../src/adapters/tonAdapter');
    assert.ok(TonAdapter, 'TonAdapter should be defined');
  });

  it('is registered in adapter factory', () => {
    const { getSupportedChainTypes, TonAdapter } = require('../src/adapters');
    const types = getSupportedChainTypes();
    assert.ok(types.includes('ton'), 'ton should be in supported chain types');
    assert.ok(TonAdapter, 'TonAdapter should be exported');
  });

  it('validates TON addresses correctly', () => {
    const TonAdapter = require('../src/adapters/tonAdapter');
    const adapter = new TonAdapter({ rpcUrl: 'https://toncenter.com/api/v2/jsonRPC' });
    
    // Valid TON addresses (EQ format - base64url encoded)
    assert.ok(
      adapter.isValidAddress('EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2'),
      'Should accept valid EQ address'
    );
    
    // Invalid addresses
    assert.ok(!adapter.isValidAddress('invalid'), 'Should reject invalid address');
    assert.ok(!adapter.isValidAddress('0x1234'), 'Should reject EVM address');
    assert.ok(!adapter.isValidAddress(''), 'Should reject empty string');
  });

  it('returns correct chain type', () => {
    const TonAdapter = require('../src/adapters/tonAdapter');
    const adapter = new TonAdapter({ rpcUrl: 'https://toncenter.com/api/v2/jsonRPC' });
    assert.strictEqual(adapter.getChainType(), 'ton');
  });

  it('formats balance correctly', () => {
    const TonAdapter = require('../src/adapters/tonAdapter');
    const adapter = new TonAdapter({ rpcUrl: 'https://toncenter.com/api/v2/jsonRPC' });
    
    // 1 TON = 1_000_000_000 nanoTON
    const oneNanoTon = 1n;
    const oneTon = 1_000_000_000n;
    
    // fromNano should convert properly
    const formatted = adapter.formatBalance(oneTon, 9);
    assert.ok(formatted.includes('1'), 'Should format 1 TON correctly');
  });

  it('generates correct explorer URL', () => {
    const TonAdapter = require('../src/adapters/tonAdapter');
    
    const mainnetAdapter = new TonAdapter({ 
      rpcUrl: 'https://toncenter.com/api/v2/jsonRPC' 
    });
    const url = mainnetAdapter.getExplorerUrl('EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2');
    assert.ok(url.includes('tonscan.org'), 'Should use tonscan.org');
    assert.ok(url.includes('EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2'), 'Should include address');
    
    const testnetAdapter = new TonAdapter({ 
      rpcUrl: 'https://testnet.toncenter.com/api/v2/jsonRPC' 
    });
    const testnetUrl = testnetAdapter.getExplorerUrl('EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2');
    assert.ok(testnetUrl.includes('testnet'), 'Should use testnet explorer');
  });
});

describe('TON Network Config', () => {
  it('TON network is configured', () => {
    const { getNetwork } = require('../src/config/networks');
    
    const ton = getNetwork('ton');
    assert.ok(ton, 'TON network should exist');
    assert.strictEqual(ton.chainType, 'ton');
    assert.strictEqual(ton.nativeSymbol, 'TON');
    assert.strictEqual(ton.nativeDecimals, 9);
  });

  it('TON testnet is configured', () => {
    const { getNetwork } = require('../src/config/networks');
    
    const tonTestnet = getNetwork('ton-testnet');
    assert.ok(tonTestnet, 'TON testnet should exist');
    assert.strictEqual(tonTestnet.chainType, 'ton');
    assert.ok(tonTestnet.rpcUrl.includes('testnet'), 'Should use testnet RPC');
  });
});


