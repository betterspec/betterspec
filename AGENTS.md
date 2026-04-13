# AGENTS.md — betterspec

Instructions for AI agents working in this repository.

## Project Overview

betterspec is a spec-driven development tool consisting of three packages in a Turborepo monorepo:

- `packages/core` — `@betterspec/core`: Provider-agnostic spec engine (TypeScript library)
- `packages/cli` — `@betterspec/cli`: CLI tool with animated terminal UI
- `packages/mcp` — `@betterspec/mcp`: MCP server for AI tool integration

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **Build**: tsup (ESM only)
- **Monorepo**: Turborepo
- **CLI UI**: Commander.js, ink (React for terminals), react
- **Testing**: vitest

## Code Patterns

### Module structure

Each core module follows the pattern: `packages/core/src/<module>/index.ts` with a barrel export from `packages/core/src/index.ts`.

### File I/O

All filesystem operations use `node:fs/promises`. The helper `fileExists()` from `config/index.ts` wraps `access()`.

### CLI commands

Each command is a standalone async function in `packages/cli/src/commands/<name>.tsx` that:

1. Resolves `projectRoot` from `options.cwd` or `process.cwd()`
2. Checks `configExists()` and renders an `<ErrorView />` + exits if not initialized
3. Renders an INK React component to handle all UI and interaction

INK components use a phase state machine (e.g. `"creating" | "done" | "error"`) with async `useEffect` for work. The `ui/ink/` directory provides shared components: `<BetterspecBox>`, `<Section>`, `<Table>`, `<Spinner>`, `<Confirm>`, `<TextInput>`, `<Select>`.

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
bun run build   # builds all packages via turbo
bun run test    # runs tests across all packages
```

## Key files

- `packages/core/src/types/index.ts` — All shared types
- `packages/core/src/config/index.ts` — Config management, path helpers
- `packages/core/src/spec/index.ts` — Change CRUD operations
- `packages/cli/src/ui/ink/index.tsx` — INK component library and brand colors
- `packages/cli/src/index.tsx` — CLI entry point with all command registrations
