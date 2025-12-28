/**
 * Tests for JSON schema conformance
 * 
 * Lightweight validation that JSON output includes schemaVersion
 * and matches the expected shape. No heavy JSON Schema validator dependency.
 * 
 * Run with: npm test
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CLI_PATH = path.join(__dirname, '..', 'src', 'index.js');
const SCHEMA_PATH = path.join(__dirname, '..', 'schema', 'mcbd-output.schema.json');

// Expected schema version
const EXPECTED_SCHEMA_VERSION = '0.1.0';

describe('Schema Validation', () => {
  it('schema file exists and is valid JSON', () => {
    const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf8');
    const schema = JSON.parse(schemaContent);
    
    assert.ok(schema.$schema, 'Should have $schema field');
    assert.ok(schema.definitions, 'Should have definitions');
    assert.ok(schema.definitions.BalanceResult, 'Should define BalanceResult');
    assert.ok(schema.definitions.ErrorResult, 'Should define ErrorResult');
  });

  it('--list-networks --json includes schemaVersion', () => {
    const output = execSync(`node ${CLI_PATH} --list-networks --json`, { encoding: 'utf8' });
    const parsed = JSON.parse(output);
    
    assert.strictEqual(parsed.schemaVersion, EXPECTED_SCHEMA_VERSION, 
      'schemaVersion should match expected version');
  });

  it('error output includes schemaVersion', () => {
    try {
      execSync(`node ${CLI_PATH} --address invalid --network mainnet --json`, { encoding: 'utf8' });
      assert.fail('Should have thrown');
    } catch (error) {
      const output = error.stdout;
      const parsed = JSON.parse(output);
      
      assert.strictEqual(parsed.schemaVersion, EXPECTED_SCHEMA_VERSION,
        'Error output should include schemaVersion');
      assert.ok(parsed.error, 'Should have error field');
    }
  });

  it('unknown network error includes schemaVersion', () => {
    try {
      execSync(`node ${CLI_PATH} --address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 --network fake --json`, { encoding: 'utf8' });
      assert.fail('Should have thrown');
    } catch (error) {
      const output = error.stdout;
      const parsed = JSON.parse(output);
      
      assert.strictEqual(parsed.schemaVersion, EXPECTED_SCHEMA_VERSION,
        'Error output should include schemaVersion');
    }
  });
});

describe('Schema Shape Validation', () => {
  it('--list-networks --json has expected shape', () => {
    const output = execSync(`node ${CLI_PATH} --list-networks --json`, { encoding: 'utf8' });
    const parsed = JSON.parse(output);
    
    // Required fields
    assert.ok(parsed.schemaVersion, 'Should have schemaVersion');
    assert.ok(Array.isArray(parsed.evm), 'Should have evm array');
    assert.ok(Array.isArray(parsed.solana), 'Should have solana array');
    
    // EVM network shape
    const mainnet = parsed.evm.find(n => n.key === 'mainnet');
    assert.ok(mainnet, 'Should include mainnet');
    assert.ok(mainnet.key, 'Network should have key');
    assert.ok(mainnet.name, 'Network should have name');
    assert.ok(mainnet.symbol, 'Network should have symbol');
    assert.ok(typeof mainnet.chainId === 'number', 'Network should have numeric chainId');
  });

  it('error output has expected shape', () => {
    try {
      execSync(`node ${CLI_PATH} --address 0x123 --network mainnet --json`, { encoding: 'utf8' });
      assert.fail('Should have thrown');
    } catch (error) {
      const output = error.stdout;
      const parsed = JSON.parse(output);
      
      // Required fields for error
      assert.ok(parsed.schemaVersion, 'Should have schemaVersion');
      assert.ok(typeof parsed.error === 'string', 'Should have error string');
    }
  });
});



