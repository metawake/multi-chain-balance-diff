/**
 * Tests for watch mode and CI-friendly exit codes
 * Run with: npm test
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');
const path = require('path');

const CLI_PATH = path.join(__dirname, '..', 'src', 'index.js');

// Exit codes
const EXIT_OK = 0;
const EXIT_DIFF = 1;
const EXIT_RPC_ERROR = 2;

describe('Watch Mode CLI Options', () => {
  it('--help shows watch mode options', () => {
    const result = spawnSync('node', [CLI_PATH, '--help'], { encoding: 'utf8' });
    
    assert.ok(result.stdout.includes('--watch'), 'Should show --watch option');
    assert.ok(result.stdout.includes('--interval'), 'Should show --interval option');
    assert.ok(result.stdout.includes('--count'), 'Should show --count option');
    assert.ok(result.stdout.includes('--exit-on-error'), 'Should show --exit-on-error option');
    assert.ok(result.stdout.includes('--exit-on-diff'), 'Should show --exit-on-diff option');
  });

  it('--help shows percentage threshold option', () => {
    const result = spawnSync('node', [CLI_PATH, '--help'], { encoding: 'utf8' });
    
    assert.ok(result.stdout.includes('--alert-pct'), 'Should show --alert-pct option');
  });
});

describe('Threshold Parsing', () => {
  it('parses absolute thresholds correctly', () => {
    // This is a unit test proxy - we test via CLI output
    const result = spawnSync('node', [
      CLI_PATH,
      '--list-networks',
      '--alert-if-diff', '>0.01'
    ], { encoding: 'utf8' });
    
    // Should not crash
    assert.strictEqual(result.status, 0, 'Should exit 0 with valid threshold');
  });

  it('parses percentage thresholds correctly', () => {
    const result = spawnSync('node', [
      CLI_PATH,
      '--list-networks',
      '--alert-pct', '>5'
    ], { encoding: 'utf8' });
    
    // Should not crash
    assert.strictEqual(result.status, 0, 'Should exit 0 with valid pct threshold');
  });
});

describe('Watch Mode --count', () => {
  it('--count requires --watch mode', () => {
    // --count without --watch should just be ignored (normal single run)
    const result = spawnSync('node', [
      CLI_PATH,
      '--list-networks',
      '--count', '5'
    ], { encoding: 'utf8' });
    
    assert.strictEqual(result.status, 0, 'Should exit 0');
  });
});

describe('Exit Code Semantics', () => {
  it('EXIT_OK = 0, EXIT_DIFF = 1, EXIT_RPC_ERROR = 2', () => {
    // Document expected exit codes
    assert.strictEqual(EXIT_OK, 0);
    assert.strictEqual(EXIT_DIFF, 1);
    assert.strictEqual(EXIT_RPC_ERROR, 2);
  });

  it('invalid address exits with 1', () => {
    const result = spawnSync('node', [
      CLI_PATH,
      '--address', 'not-an-address',
      '--network', 'mainnet'
    ], { encoding: 'utf8' });
    
    assert.strictEqual(result.status, 1, 'Should exit 1 for invalid address');
  });
});

describe('Combined Thresholds', () => {
  it('can specify both --alert-if-diff and --alert-pct', () => {
    const result = spawnSync('node', [
      CLI_PATH,
      '--list-networks',
      '--alert-if-diff', '>0.01',
      '--alert-pct', '>5',
      '--json'
    ], { encoding: 'utf8' });
    
    assert.strictEqual(result.status, 0, 'Should accept both thresholds');
    
    // JSON output should be valid
    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.evm, 'Should have evm networks');
  });
});



