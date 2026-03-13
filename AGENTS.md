# AGENTS.md — betterspec

Instructions for AI agents working in this repository.

## Project Overview

betterspec is a spec-driven development tool consisting of two packages in a Turborepo monorepo:

- `packages/core` — `@betterspec/core`: Provider-agnostic spec engine (TypeScript library)
- `packages/cli` — `@betterspec/cli`: CLI tool with animated terminal UI

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **Build**: tsup (ESM only)
- **Monorepo**: Turborepo
- **CLI UI**: Commander.js, chalk, gradient-string, ora, boxen, @clack/prompts, cli-table3
- **Testing**: vitest

## Code Patterns

### Module structure
Each core module follows the pattern: `packages/core/src/<module>/index.ts` with a barrel export from `packages/core/src/index.ts`.

### File I/O
All filesystem operations use `node:fs/promises`. The helper `fileExists()` from `config/index.ts` wraps `access()`.

### CLI commands
Each command is a standalone async function in `packages/cli/src/commands/<name>.ts` that:
1. Resolves `projectRoot` from `options.cwd` or `process.cwd()`
2. Checks `configExists()` and shows a boxed error if not initialized
3. Uses `@clack/prompts` for interactive input
4. Uses `ora` for spinners
5. Uses `renderBox()` and `renderSection()` for output

### Naming conventions
- Types: PascalCase (`betterspecConfig`, `Change`, `TaskSummary`)
- Functions: camelCase (`getbetterspecDir`, `readConfig`, `listChanges`)
- Constants: UPPER_SNAKE_CASE (`betterspec_DIR`, `CONFIG_FILENAME`)
- Files: kebab-case (`dispatch-build.ts`, `on-session-created.ts`)

### Internal metadata
Change metadata is stored in `.betterspec-meta.json` inside each change directory.

### Directory convention
The spec directory in user projects is `betterspec/` with config at `betterspec/betterspec.json`.

## Building

```bash
bun install
bun run build   # builds both packages via turbo
```

## Key files

- `packages/core/src/types/index.ts` — All shared types
- `packages/core/src/config/index.ts` — Config management, path helpers
- `packages/core/src/spec/index.ts` — Change CRUD operations
- `packages/cli/src/ui/banner.ts` — Animated brand banner
- `packages/cli/src/ui/theme.ts` — Brand colors and gradients
- `packages/cli/src/index.ts` — CLI entry point with all command registrations
