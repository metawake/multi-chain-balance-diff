/**
 * Tests for JSON output mode
 * Run with: npm test
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const path = require('path');

const CLI_PATH = path.join(__dirname, '..', 'src', 'index.js');

describe('JSON Output Mode', () => {
  it('--list-networks --json returns valid JSON', () => {
    const output = execSync(`node ${CLI_PATH} --list-networks --json`, { encoding: 'utf8' });
    const parsed = JSON.parse(output);
    
    assert.ok(parsed.evm, 'Should have evm networks');
    assert.ok(parsed.solana, 'Should have solana networks');
    assert.ok(Array.isArray(parsed.evm), 'evm should be an array');
    assert.ok(Array.isArray(parsed.solana), 'solana should be an array');
  });

  it('--list-networks --json includes network details', () => {
    const output = execSync(`node ${CLI_PATH} --list-networks --json`, { encoding: 'utf8' });
    const parsed = JSON.parse(output);
    
    const mainnet = parsed.evm.find(n => n.key === 'mainnet');
    assert.ok(mainnet, 'Should include mainnet');
    assert.strictEqual(mainnet.name, 'Ethereum Mainnet');
    assert.strictEqual(mainnet.symbol, 'ETH');
    assert.strictEqual(mainnet.chainId, 1);
  });

  it('invalid address returns JSON error', () => {
    try {
      execSync(`node ${CLI_PATH} --address invalid --network mainnet --json`, { encoding: 'utf8' });
      assert.fail('Should have thrown');
    } catch (error) {
      const output = error.stdout;
      const parsed = JSON.parse(output);
      assert.ok(parsed.error, 'Should have error field');
      assert.ok(parsed.error.includes('Invalid'), 'Error should mention invalid');
    }
  });

  it('unknown network returns JSON error', () => {
    try {
      execSync(`node ${CLI_PATH} --address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 --network fake --json`, { encoding: 'utf8' });
      assert.fail('Should have thrown');
    } catch (error) {
      const output = error.stdout;
      const parsed = JSON.parse(output);
      assert.ok(parsed.error, 'Should have error field');
      assert.ok(parsed.error.includes('Unknown network'), 'Error should mention unknown network');
    }
  });
});

describe('CLI Validation', () => {
  it('requires address option', () => {
    try {
      execSync(`node ${CLI_PATH}`, { encoding: 'utf8', stdio: 'pipe' });
      assert.fail('Should have thrown');
    } catch (error) {
      assert.ok(error.stderr.includes('address') || error.message.includes('address'), 
        'Should mention missing address');
    }
  });

  it('--version shows version', () => {
    const output = execSync(`node ${CLI_PATH} --version`, { encoding: 'utf8' });
    assert.match(output.trim(), /^\d+\.\d+\.\d+(-[\w.]+)?$/, 'Should be semver format');
  });

  it('--help shows help', () => {
    const output = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf8' });
    assert.ok(output.includes('--address'), 'Should show address option');
    assert.ok(output.includes('--network'), 'Should show network option');
    assert.ok(output.includes('--json'), 'Should show json option');
  });

  it('--help shows timeout option', () => {
    const output = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf8' });
    assert.ok(output.includes('--timeout'), 'Should show timeout option');
    assert.ok(output.includes('30'), 'Should show default timeout value');
  });
});

