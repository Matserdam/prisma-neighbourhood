# Development Guide

## Setup

```bash
bun install
```

## Commands

```bash
# Run tests
bun test

# Type check
bun run typecheck

# Watch tests
bun test:watch
```

## Architecture

The tool is built with a pluggable renderer system:

```
┌─────────────┐     ┌────────────┐     ┌───────────────────┐
│ Schema File │ ──▶ │   Parser   │ ──▶ │   Model Traverser │
└─────────────┘     └────────────┘     └───────────────────┘
                                                │
                                                ▼
                    ┌────────────┐     ┌───────────────────┐
                    │   Output   │ ◀── │ Diagram Renderer  │
                    └────────────┘     └───────────────────┘
```

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| Parser | `src/parser/` | Parses Prisma schema files using `@prisma/internals` |
| Traverser | `src/traversal/` | BFS traversal with depth limiting and cycle detection |
| Renderer | `src/renderer/` | Pluggable diagram renderers (Mermaid, etc.) |
| CLI | `src/cli/` | Command-line interface using Commander |

## Adding a New Renderer

1. Implement the `DiagramRenderer` interface:

```typescript
import type { DiagramRenderer, ExportFormat } from "./renderer/types";
import type { TraversedModel } from "./traversal/types";

export class MyRenderer implements DiagramRenderer {
  readonly name = "myrenderer";
  readonly description = "My custom renderer";

  render(models: readonly TraversedModel[]): string {
    // Generate diagram syntax from models
    return "...";
  }

  supportsExport(): boolean {
    return false; // Set to true if you implement export()
  }

  // Optional: implement if supportsExport() returns true
  async export(content: string, outputPath: string, format: ExportFormat): Promise<void> {
    // Render content to PNG/PDF file
  }
}
```

2. Register it in `src/renderer/index.ts`:

```typescript
import { rendererRegistry } from "./registry";
import { MyRenderer } from "./my-renderer";

// Register alongside existing renderers
if (!rendererRegistry.has("myrenderer")) {
  rendererRegistry.register({
    renderer: new MyRenderer(),
  });
}
```

3. Add tests in `src/_tests_/renderer.test.ts`

## Testing

Tests are located in `src/_tests_/` and use Vitest.

```bash
# Run all tests
bun test

# Run specific test file
bun test src/_tests_/parser.test.ts

# Watch mode
bun test:watch
```

### Test Fixtures

Example Prisma schemas for testing are in `src/_tests_/fixtures/`.

