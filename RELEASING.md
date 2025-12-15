# Releasing

## Publish

```bash
# 1. Authenticate
npm login

# 2. Verify package contents
npm pack --dry-run

# 3. Publish
npm publish

# 4. Verify
npx multi-chain-balance-diff --version
```

## Release Candidates (future)

```bash
# Bump to RC version
npm version 0.2.0-rc.1

# Publish with rc tag (doesn't affect `latest`)
npm publish --tag rc

# Verify
npx multi-chain-balance-diff@0.2.0-rc.1 --version

# Promote to stable
npm version 0.2.0
npm publish
```

