# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Stability & Compatibility

- **JSON schema changes are versioned.** The `schemaVersion` field in JSON output indicates the schema version.
- **Breaking changes to JSON output structure will increment the major version.**
- Adapter interface is stable; new chains can be added without breaking existing integrations.

---

## [Unreleased]

---

## [0.1.2] - 2025-12-22

### Added
- Fantom Opera support
- zkSync Era support
- TON blockchain support (new adapter)
- TON testnet support

---

## [0.1.1] - 2025-12-21

### Added
- BNB Chain (BSC) support
- Avalanche C-Chain support
- `--timeout` flag for configurable RPC request timeout (default: 30s)
- Documentation for custom RPC environment variables

---

## [0.1.0] - 2025-01-15

### Added
- Multi-chain balance fetching (Ethereum, Polygon, Base, Arbitrum, Optimism, Solana, Helium)
- Balance diff computation over configurable block range
- JSON output mode (`--json`) with `schemaVersion` field
- Watch mode for continuous monitoring (`--watch`)
- Threshold alerting (`--alert-if-diff`, `--alert-pct`)
- Multi-address batch queries (`--addresses`)
- Profile support via config file
- CI-friendly exit codes (0: OK, 1: diff triggered, 2: RPC error, 130: SIGINT)
- Token balance checking for major tokens per network
- JSON schema documentation (`schema/mcbd-output.schema.json`)
- Example integration files (GitHub Actions, cron, Slack webhook)
- `RELEASING.md` with publish checklist

### Notes
- Initial npm release
- JSON output schema: `0.1.0`

[Unreleased]: https://github.com/metawake/multi-chain-balance-diff/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/metawake/multi-chain-balance-diff/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/metawake/multi-chain-balance-diff/releases/tag/v0.1.0

