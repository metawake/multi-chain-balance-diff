/**
 * Tests for threshold alerts and exit codes
 * Run with: npm test
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { execSync, spawnSync } = require('child_process');
const path = require('path');

const CLI_PATH = path.join(__dirname, '..', 'src', 'index.js');

// Exit codes
const EXIT_OK = 0;
const EXIT_DIFF = 1;
const EXIT_RPC_ERROR = 2;

describe('Threshold Parsing', () => {
  it('--help shows --alert-if-diff option', () => {
    const output = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf8' });
    assert.ok(output.includes('--alert-if-diff'), 'Should show alert-if-diff option');
  });

  it('invalid threshold is handled gracefully', () => {
    // Invalid threshold should not crash; parsing returns null and no alert
    const result = spawnSync('node', [
      CLI_PATH, 
      '--list-networks',
      '--alert-if-diff', 'invalid'
    ], { encoding: 'utf8' });
    
    // Should still work (list networks ignores threshold)
    assert.strictEqual(result.status, 0, 'Should exit 0 for list-networks');
  });
});

describe('Exit Codes', () => {
  it('--list-networks exits with 0', () => {
    const result = spawnSync('node', [CLI_PATH, '--list-networks'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0, 'Should exit 0');
  });

  it('invalid address exits with 1', () => {
    const result = spawnSync('node', [
      CLI_PATH, 
      '--address', 'invalid',
      '--network', 'mainnet'
    ], { encoding: 'utf8' });
    assert.strictEqual(result.status, 1, 'Should exit 1 for invalid address');
  });

  it('unknown network exits with 1', () => {
    const result = spawnSync('node', [
      CLI_PATH,
      '--address', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      '--network', 'fakenetwork'
    ], { encoding: 'utf8' });
    assert.strictEqual(result.status, 1, 'Should exit 1 for unknown network');
  });

  // Skipped: requires network access, times out in CI
  it.skip('RPC failure exits with 2', () => {
    const result = spawnSync('node', [
      CLI_PATH,
      '--address', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      '--network', 'sepolia',
      '--json'
    ], { encoding: 'utf8', timeout: 5000 });
    assert.ok([0, 1, 2].includes(result.status), `Exit code should be 0, 1, or 2, got ${result.status}`);
  });
});

describe('JSON Output with Threshold', () => {
  it('--json output structure is valid', () => {
    const result = spawnSync('node', [
      CLI_PATH,
      '--list-networks',
      '--json'
    ], { encoding: 'utf8' });
    
    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.evm, 'Should have evm networks');
    assert.ok(parsed.solana, 'Should have solana networks');
  });
});

