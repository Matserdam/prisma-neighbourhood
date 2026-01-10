# prisma-neighbourhood

Generate focused ERD diagrams from a Prisma schema by starting from any entity (model, view, or enum) and traversing relationships up to a configurable depth.

The npm package is **`@matserdam/prisma-neighborhood`** and it exposes two CLI commands:

- **`prisma-hood`** (short alias)
- **`prisma-neighborhood`** (full name)

## Run with Bun (recommended)

```bash
# Mermaid ERD to stdout
bunx @matserdam/prisma-neighborhood -s ./prisma/schema.prisma -m User
```

## Common examples

```bash
# Limit to direct relationships only (depth 1)
bunx @matserdam/prisma-neighborhood -s ./prisma/schema.prisma -m User -d 1

# Start from a view (shows view + related enums/models)
bunx @matserdam/prisma-neighborhood -s ./prisma/schema.prisma -m UserSummary -d 2

# Start from an enum (shows enum + all models/views using it)
bunx @matserdam/prisma-neighborhood -s ./prisma/schema.prisma -m UserRole -d 2

# Write Mermaid to a file (use .mmd or .md)
bunx @matserdam/prisma-neighborhood -s ./prisma/schema.prisma -m User -o erd.mmd

# Export to PNG
bunx @matserdam/prisma-neighborhood -s ./prisma/schema.prisma -m User -o erd.png

# Export to SVG (recommended for very large diagrams)
bunx @matserdam/prisma-neighborhood -s ./prisma/schema.prisma -m User -o erd.svg

# Export to PDF
bunx @matserdam/prisma-neighborhood -s ./prisma/schema.prisma -m User -o erd.pdf

# List renderers (and see which ones support PNG/PDF export)
bunx @matserdam/prisma-neighborhood --list-renderers
```

## Install globally (optional)

```bash
npm install -g @matserdam/prisma-neighborhood

# Then you can run:
prisma-hood -s ./prisma/schema.prisma -m User
```

## CLI options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--schema <path>` | `-s` | Path to the Prisma schema file | required |
| `--model <name>` | `-m` | Entity to start traversal from (model, view, or enum) | required |
| `--depth <n>` | `-d` | Relationship levels to traverse | `3` |
| `--renderer <name>` | `-r` | Renderer to use | `vector` |
| `--output <file>` | `-o` | Write to a file instead of stdout | stdout |
| `--list-renderers` |  | Show available renderers |  |
| `--help` | `-h` | Show help |  |
| `--version` | `-V` | Show version |  |

## Output formats

The output format is determined by the file extension:

| Extension | Output |
|-----------|--------|
| `.mmd` / `.md` | Mermaid ERD text |
| `.svg` | SVG |
| `.png` | PNG image |
| `.pdf` | PDF |

## Entity types

### Models
Standard Prisma models are rendered as plain ERD entities.

### Views
Views (requires `previewFeatures = ["views"]`) are rendered with a `[view]` prefix:
```
"[view] UserSummary" {
  Int id UK
  String email
}
```

### Enums
Enums are rendered with an `[enum]` prefix, with the enum name as the type for each value:
```
"[enum] UserRole" {
  UserRole ADMIN
  UserRole USER
  UserRole GUEST
}
```

## Traversal behavior

- **From a model**: Traverses relations to other models/views, and enum fields to enums
- **From a view**: Traverses relations to models/views, and enum fields to enums
- **From an enum**: Finds all models/views using this enum, then traverses their relations

## No Puppeteer / Chromium

SVG/PNG/PDF export is implemented without headless Chromium, so you no longer need to install OS-level Chromium dependencies.
