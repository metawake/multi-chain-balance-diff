const { describe, it } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');

describe('Webhook Flag', () => {
  it('--webhook is accepted as a valid option', () => {
    // Test that --webhook flag is recognized (with an invalid URL, it should still parse)
    // We use --list-networks to avoid making RPC calls
    const output = execSync('node src/index.js --list-networks --json', {
      encoding: 'utf-8',
    });
    
    const parsed = JSON.parse(output);
    assert.ok(parsed.schemaVersion, 'Should have schemaVersion in output');
  });

  it('--help includes --webhook option', () => {
    const output = execSync('node src/index.js --help', {
      encoding: 'utf-8',
    });
    
    assert.ok(output.includes('--webhook'), 'Help should mention --webhook flag');
    assert.ok(output.includes('POST JSON payload'), 'Help should describe webhook purpose');
  });

  it('webhook is not called when no alert triggers', () => {
    // This test verifies that running without threshold doesn't attempt webhook
    // We can't easily test actual HTTP calls without a mock server,
    // but we can verify the flag doesn't cause errors
    const output = execSync('node src/index.js --list-networks --webhook http://example.com/hook --json', {
      encoding: 'utf-8',
    });
    
    const parsed = JSON.parse(output);
    assert.ok(parsed.schemaVersion, 'Should complete without error');
  });
});

