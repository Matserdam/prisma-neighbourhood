# AGENT Instructions

## Project Overview

**Goal:** Build a CLI tool that generates Entity-Relationship Diagrams from Prisma schemas, starting from a specified model and traversing relationships to a configurable depth N. Output formats include Mermaid syntax with optional rendering to PNG/PDF.

---

## Project Structure

All source code lives in:

```
sources/prisma-subgraph-cli/
```

```
sources/
└── prisma-subgraph-cli/  # CLI application (schema parsing, traversal, rendering)
    ├── src/
    │   ├── _tests_/      # Test files
    │   ├── index.ts      # Entry point
    │   └── ...
    ├── package.json
    └── tsconfig.json
```

Documentation lives in:
```
docs/
├── specs/                # Specifications and requirements
├── adr/                  # Architecture Decision Records
└── guides/               # Usage guides and tutorials
```

---

## Development Approach

### Test-Driven Development (TDD)

1. **Write tests first** before implementing features
2. Tests live in `_tests_/` folders adjacent to source files
3. Follow the Red-Green-Refactor cycle:
   - 🔴 Write a failing test
   - 🟢 Write minimal code to pass
   - 🔄 Refactor while keeping tests green

### Code Quality Standards

- **TSDoc comments** required for all exported functions and types
- **Step-by-step comments** explaining what and why
- **No file extensions** in TypeScript imports (no `.js` or `.ts`)
- **Imports at the top** of each file, never interspersed

---

## Commit Conventions

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type       | Description                                         |
|------------|-----------------------------------------------------|
| `feat`     | New feature                                         |
| `fix`      | Bug fix                                             |
| `docs`     | Documentation changes                               |
| `style`    | Formatting, no code change                          |
| `refactor` | Code restructuring without behavior change          |
| `test`     | Adding or updating tests                            |
| `chore`    | Build, tooling, or maintenance                      |
| `perf`     | Performance improvement                             |
| `ci`       | CI/CD configuration changes                         |

### Scope Examples

- `parser` - Schema parsing logic
- `traversal` - Model relationship traversal
- `mermaid` - Mermaid output generation
- `render` - PNG/PDF rendering
- `cli` - CLI interface and commands
- `deps` - Dependency updates

### Examples

```
feat(traversal): add depth-limited model traversal

Implements BFS traversal from a starting model with configurable
max depth. Tracks visited models to prevent cycles.

Closes #12
```

```
test(mermaid): add output format integration tests

Covers Mermaid syntax generation for various relation types.
Part of epic: CLI-MVP
```

### Rules

1. **One logical change per commit**
2. **Reference epic/story** in commit body when applicable
3. **Never commit** unless explicitly requested by user
4. **Stage changes only** (`git add`) and show status, await commit instruction

---

## Roles & Quality Assurance

When working on this project, assume these roles to ensure high-quality output:

### 🏗️ Architect Role

**When to assume:** Making structural decisions, designing APIs, planning features

**Responsibilities:**
- Evaluate trade-offs using internal debate process
- Create ADRs for significant decisions
- Design for extensibility without over-engineering
- Ensure clean separation of concerns

**Checklist:**
- [ ] Does this follow SOLID principles?
- [ ] Is the API intuitive and consistent?
- [ ] Are there clear boundaries between modules?

---

### 🧪 QA Engineer Role

**When to assume:** Writing tests, reviewing implementations

**Responsibilities:**
- Write comprehensive test cases (happy path + edge cases)
- Ensure error conditions are properly handled
- Validate output formats meet specifications

**Checklist:**
- [ ] Are all public functions tested?
- [ ] Are edge cases covered (empty input, max depth, cycles)?
- [ ] Do tests clearly describe expected behavior?

---

### 📖 Technical Writer Role

**When to assume:** Writing documentation, comments, error messages

**Responsibilities:**
- Write clear, actionable error messages
- Document public APIs with examples
- Keep README and guides up to date

**Checklist:**
- [ ] Would a new developer understand this code?
- [ ] Are examples provided for complex functionality?
- [ ] Are error messages helpful for debugging?

---

### 🔍 Code Reviewer Role

**When to assume:** Before finalizing any implementation

**Responsibilities:**
- Check for code smells and anti-patterns
- Verify naming conventions and consistency
- Ensure no unnecessary complexity

**Checklist:**
- [ ] Is there any dead code?
- [ ] Are names descriptive and consistent?
- [ ] Could this be simpler?

---

## Architectural Decisions

For significant decisions, conduct an **internal debate**:

1. **State the problem** clearly
2. **Propose options** (at least 2-3)
3. **Argue for each** assuming advocate roles
4. **Identify trade-offs** objectively
5. **Recommend** with clear reasoning
6. **Document** in `docs/adr/` if decision is structural

---

## Technology Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict mode)
- **Testing:** Vitest
- **Schema Parsing:** @prisma/internals or custom parser
- **Diagram Output:** Mermaid syntax
- **Rendering:** mermaid-cli or similar for PNG/PDF

---

## Quick Reference

| Task | Command |
|------|---------|
| Run tests | `bun test` |
| Type check | `bun run typecheck` |
| Build | `bun run build` |
| Lint | `bun run lint` |

---

## Constraints

- **No over-engineering** - Only build what's needed now
- **No hacky fixes** - Robust implementations in core libraries
- **Follow web standards** - Use standard APIs and patterns
- **Keep it simple** - Minimum complexity for current requirements

