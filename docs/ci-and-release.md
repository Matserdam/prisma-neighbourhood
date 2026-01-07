# CI/CD and Release Process

This document describes the continuous integration, packaging, and release workflows for the npm package `@matserdam/prisma-neighborhood`.

## Project Structure

```
erd-cli/
├── .github/workflows/
│   ├── ci.yml          # Continuous integration
│   └── release.yml     # Automated releases
├── docs/
└── sources/
    └── prisma-neighbourhood/   # The npm package
        ├── src/
        ├── dist/              # Built output (gitignored)
        ├── package.json
        └── ...
```

---

## Continuous Integration (CI)

**File:** `.github/workflows/ci.yml`

### Triggers

- Push to `main` branch
- Pull requests targeting `main`

### What It Does

1. **Checkout** the repository
2. **Setup Node.js 20** and **Bun**
3. **Detect package manager** (pnpm → bun → npm fallback)
4. **Install dependencies** with frozen lockfile
5. **Build** the project
6. **Run tests** (if `test` script exists in package.json)
7. **Run lint** (if `lint` script exists in package.json)

### Package Manager Detection

The workflow automatically detects which package manager to use:

| Lock File | Package Manager |
|-----------|-----------------|
| `pnpm-lock.yaml` | pnpm |
| `bun.lockb` | bun |
| _(none)_ | npm |

---

## Release Workflow

**File:** `.github/workflows/release.yml`

### Trigger

Push a semantic version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

### What It Does

The workflow runs the build pipeline and then fans out into two parallel jobs:

1. **`github_release`**:
   - Creates the npm tarball via `npm pack`
   - Zips `dist/` and the generated examples output
   - Creates a GitHub Release and uploads the artifacts
2. **`npm_publish`**:
   - Creates the npm tarball via `npm pack`
   - (Bootstrap phase) does **not** publish to npm yet

During bootstrap (first publish), npm publishing is intentionally disabled so we can publish `0.0.1` manually, then enable Trusted Publishing for `0.0.2+`.

### Publishing Authentication

For `0.0.2+`, publishing is expected to use **npm Trusted Publishing (GitHub Actions OIDC)** instead of a long-lived npm token.

---

## Package Configuration

**File:** `sources/prisma-neighbourhood/package.json`

### Entry Points

| Field | Path | Purpose |
|-------|------|---------|
| `main` | `./dist/index.js` | Library entry (ESM) |
| `types` | `./dist/index.d.ts` | TypeScript declarations |
| `bin.prisma-neighborhood` | `./dist/cli.js` | CLI command |
| `bin.prisma-hood` | `./dist/cli.js` | CLI alias |

### Build Output

The `build` script:

```bash
tsc --emitDeclarationOnly && \
bun build src/cli.ts --outfile dist/cli.js --target node && \
bun build src/index.ts --outfile dist/index.js --target node
```

- **TypeScript declarations** via `tsc --emitDeclarationOnly`
- **CLI bundle** with shebang preserved (`dist/cli.js`)
- **Library bundle** for programmatic use (`dist/index.js`)

### Published Files

Only these are included in the npm package:

```json
"files": ["dist", "README.md", "LICENSE"]
```

### Prepack Hook

The `prepack` script runs automatically before `npm pack` or `npm publish`:

```json
"prepack": "bun run build"
```

---

## Local Development

### Build

```bash
cd sources/prisma-neighbourhood
bun install
bun run build
```

### Test the CLI locally

```bash
# Run directly
bun run dev -- --schema ./examples/blog.prisma --model Post --depth 2

# Or after build
./dist/cli.js --schema ./examples/blog.prisma --model Post --depth 2
```

### Test the package

```bash
bun run test
```

### Create a local package

```bash
npm pack
# Creates matserdam-prisma-neighborhood-x.x.x.tgz
```

---

## Releasing a New Version

1. **Update version** in `package.json`

2. **Commit changes**
   ```bash
   git add .
   git commit -m "chore: bump version to x.x.x"
   ```

3. **Create and push tag**
   ```bash
   git tag vX.X.X
   git push origin main --tags
   ```

4. The release workflow automatically:
   - Builds the package
   - Creates a GitHub release with notes + artifacts
   - (When enabled) publishes to npm via Trusted Publishing

---

## Troubleshooting

### Build fails with shebang issues

The CLI entry (`dist/cli.js`) must start with `#!/usr/bin/env node`. Bun preserves this from the source file. Verify:

```bash
head -1 dist/cli.js
# Should output: #!/usr/bin/env node
```

### npm publish fails

- Ensure `NPM_TOKEN` secret is set
- Token must have publish permissions
- Package name must be available or you must own it

### Tests pass but workflow fails

Check for cleanup issues with vitest/tinypool. The tests themselves passing is what matters; exit code issues during cleanup can sometimes be ignored.

