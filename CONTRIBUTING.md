# Contributing to prisma-neighbourhood

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### Fork the Repository

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/erd-cli.git
cd erd-cli
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/erd-cli.git
```

### Set Up Development Environment

This project uses [Bun](https://bun.sh/) as the JavaScript runtime.

```bash
# Install Bun if you haven't already
curl -fsSL https://bun.sh/install | bash

# Navigate to the package directory
cd sources/prisma-neighbourhood

# Install dependencies
bun install
```

## Development Workflow

### Running the CLI Locally

```bash
# Run directly from source
bun run dev -- -s ./examples/blog.prisma -m User

# Or build first
bun run build
./dist/cli.js -s ./examples/blog.prisma -m User
```

### Running Tests

```bash
# Run all tests once
bun run test

# Run tests in watch mode during development
bun run test:watch
```

Tests are located in `src/_tests_/` and use [Vitest](https://vitest.dev/).

### Type Checking

```bash
bun run typecheck
```

### Linting

```bash
bun run lint
```

This project uses [Biome](https://biomejs.dev/) for linting and formatting.

### Building

```bash
bun run build
```

This generates:
- `dist/cli.js` — CLI entry point with shebang
- `dist/index.js` — Library entry point
- `dist/*.d.ts` — TypeScript declarations

## Code Style

### General Rules

- **TypeScript** — All code must be written in TypeScript
- **ESM** — Use ES modules (`import`/`export`), not CommonJS
- **No file extensions in imports** — Use `import { foo } from "./bar"` not `"./bar.js"`
- **Readonly by default** — Prefer `readonly` properties and `ReadonlyArray`

### Documentation

- **TSDoc comments** — All exported functions must have TSDoc comments
- **Step comments** — Complex logic should have inline comments explaining each step

```typescript
/**
 * Parses a Prisma schema file and extracts model information.
 *
 * @param options - Parser configuration options
 * @returns Parse result with schema or error
 */
export async function parseSchema(options: ParserOptions): Promise<ParseResult> {
  // Step 1: Read the schema file
  const content = await readFile(options.schemaPath, "utf-8");

  // Step 2: Parse using Prisma internals
  const dmmf = await getDMMF({ datamodel: content });

  // Step 3: Transform to our internal representation
  return transformDMMF(dmmf);
}
```

### File Organization

```
src/
├── _tests_/          # Test files
│   └── fixtures/     # Test fixtures (Prisma schemas)
├── cli/              # CLI-specific code
├── parser/           # Schema parsing
├── renderer/         # Diagram rendering
└── traversal/        # Model traversal
```

### Naming Conventions

- **Files** — kebab-case (`schema-parser.ts`)
- **Types/Interfaces** — PascalCase (`ParsedSchema`, `DiagramRenderer`)
- **Functions/Variables** — camelCase (`parseSchema`, `maxDepth`)
- **Constants** — SCREAMING_SNAKE_CASE (`DEFAULT_DEPTH`)

## Submitting Pull Requests

### Before Submitting

1. **Sync with upstream**:

```bash
git fetch upstream
git rebase upstream/main
```

2. **Create a feature branch**:

```bash
git checkout -b feature/your-feature-name
```

3. **Make your changes** and ensure:
   - All tests pass: `bun run test`
   - Types check: `bun run typecheck`
   - Lint passes: `bun run lint`
   - Build succeeds: `bun run build`

4. **Write tests** for new functionality

5. **Commit with clear messages**:

```bash
git commit -m "feat: add support for custom renderers"
git commit -m "fix: handle self-referential relations"
git commit -m "docs: update README with new options"
```

### PR Guidelines

- **One feature per PR** — Keep PRs focused and reviewable
- **Describe the change** — Explain what and why in the PR description
- **Reference issues** — Link related issues with `Fixes #123` or `Closes #456`
- **Update documentation** — If adding features, update relevant docs

### PR Checklist

- [ ] Tests added/updated
- [ ] Types check passes
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Documentation updated (if applicable)

## Getting Help

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas

Thank you for contributing!

