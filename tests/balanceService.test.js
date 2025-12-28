/**
 * Basic tests for balanceService
 * Run with: npm test
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { formatBalance, formatBalanceDiff } = require('../src/services/balanceService');

describe('formatBalance', () => {
  it('formats wei to ETH with symbol', () => {
    const result = formatBalance(1000000000000000000n, 'ETH');
    assert.strictEqual(result, '1 ETH');
  });

  it('formats small amounts correctly', () => {
    const result = formatBalance(1234567890000000n, 'ETH');
    assert.ok(result.includes('ETH'));
    // 1234567890000000 / 10^18 = 0.00123456789, rounds to 0.001235 with 6 decimals
    assert.ok(result.includes('0.001235'));
  });

  it('formats zero balance', () => {
    const result = formatBalance(0n, 'ETH');
    assert.strictEqual(result, '0 ETH');
  });
});

describe('formatBalanceDiff', () => {
  it('adds + prefix for positive diff', () => {
    const result = formatBalanceDiff(100000000000000000n, 'ETH');
    assert.ok(result.startsWith('+'));
    assert.ok(result.includes('0.1'));
  });

  it('shows - prefix for negative diff', () => {
    const result = formatBalanceDiff(-50000000000000000n, 'ETH');
    assert.ok(result.startsWith('-'));
  });

  it('handles zero diff', () => {
    const result = formatBalanceDiff(0n, 'ETH');
    assert.strictEqual(result, '+0 ETH');
  });
});



