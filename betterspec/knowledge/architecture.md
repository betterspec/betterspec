# Architecture

## Overview

betterspec is a spec-driven development tool delivered as a Turborepo monorepo with three publishable packages. It manages a project's spec lifecycle — from proposal through archive — and maintains a living knowledge base that accumulates project intelligence over time.

The system is intentionally **zero-AI** at the CLI layer. All intelligence lives in the connected AI tool (via MCP) or the future cloud portal. The CLI is a pure data tool.

## Packages

```
packages/
  core/     @betterspec/core   — Provider-agnostic spec engine (TypeScript library)
  cli/      @betterspec/cli    — CLI tool with animated terminal UI (INK/React)
  mcp/      @betterspec/mcp    — MCP server for AI tool integration
```

### @betterspec/core

Zero runtime dependencies. All filesystem operations use `node:fs/promises`. Contains:

- `types/` — All shared TypeScript types (`Change`, `Task`, `Capability`, `BetterspecConfig`, `ToolAdapter`, etc.)
- `config/` — Config read/write, path helpers (`getbetterspecDir`, `getChangesDir`, `getGlobalSkillsDir`, `getLocalSkillsDir`)
- `spec/` — Change CRUD (`createChange`, `readChange`, `listChanges`, `archiveChange`, `updateChangeStatus`, `updateTaskStatus`)
- `knowledge/` — Capability and decision CRUD
- `skills/` — `scaffoldSkills(projectRoot, mode)` — writes agentskills.io-compliant SKILL.md files
- `agents/` — `scaffoldAgents(targetDir, roles, format)` — writes agent role files per tool format
- `adapters/` — Tool adapter system: OpenCode, Claude Code, Gemini CLI, Cursor, Codex, Generic

### @betterspec/cli

INK/React terminal UI. Commander.js for command parsing. Renders React components to the terminal. All commands follow the same structure:

1. Resolve `projectRoot` from `options.cwd || process.cwd()`
2. Check `configExists()` — render `<ErrorView />` + exit if not initialized
3. Render an INK component that owns all UI and async work

Commands: `init`, `propose`, `clarify`, `design`, `plan`, `status`, `list`, `build`, `task`, `verify`, `archive`, `serve`, `doctor`, `impact`

UI components in `packages/cli/src/ui/ink/`: `<BetterspecBox>`, `<Section>`, `<Table>`, `<Spinner>`, `<Confirm>`, `<TextInput>`, `<Select>`, `<ErrorView>`, `<Logo>`

### @betterspec/mcp

MCP server using `@modelcontextprotocol/sdk`. Runs via `betterspec-mcp` binary over stdio. Auto-detects project root by walking up from `process.cwd()` looking for `betterspec/betterspec.json`.

5 tools: `betterspec_status`, `betterspec_search`, `betterspec_impact`, `betterspec_propose`, `betterspec_digest`

6 resources: `betterspec://architecture`, `betterspec://patterns`, `betterspec://glossary`, `betterspec://capabilities`, `betterspec://decisions`, `betterspec://changes`

## Directory Structure (user project)

```
<project>/
  betterspec/
    betterspec.json          # Config: mode, tool, skills, enforcement
    changes/
      <name>/
        .betterspec-meta.json  # Status, timestamps, task list (JSON)
        proposal.md
        specs/
          requirements.md
          scenarios.md
        design.md
        tasks.md
        outcome.md           # Written before archiving
      archive/
        <date>-<name>/       # Archived changes
    knowledge/
      architecture.md
      patterns.md
      glossary.md
      capabilities/          # <id>.json per capability
      decisions/             # adr-<n>.json per decision
  .agents/skills/          # Local agentskills.io SKILL.md files (optional)
  ~/.agents/skills/        # Global skills (optional)
```

## Technology Stack

| Layer            | Technology                  |
| ---------------- | --------------------------- |
| Runtime          | Bun 1.3.x                   |
| Language         | TypeScript (strict)         |
| Build            | tsup (ESM only)             |
| Monorepo         | Turborepo                   |
| CLI UI           | INK 6 (React for terminals) |
| Command parsing  | Commander.js                |
| MCP              | @modelcontextprotocol/sdk   |
| Input validation | Zod (MCP tools)             |
| Testing          | Vitest                      |

## Data Flow

```
User runs betterspec <command>
  → CLI resolves projectRoot
  → CLI reads betterspec.json via @betterspec/core config
  → INK component renders, runs async work
  → Core spec/knowledge functions read/write betterspec/ directory
  → Result rendered to terminal

AI tool connects via MCP
  → betterspec serve launches @betterspec/mcp
  → MCP server auto-detects projectRoot
  → AI tool calls betterspec_* tools or reads betterspec:// resources
  → Server reads betterspec/ directory via @betterspec/core
  → Returns structured data for AI to process
```

## Key Design Decisions

- **No LLM in CLI** (ADR-001): The CLI never makes LLM API calls. AI features live in the cloud portal or via MCP (where the connected tool provides the intelligence).
- **ESM only**: All packages build to ESM. No CJS output.
- **Zero runtime deps in core**: `@betterspec/core` has no runtime dependencies — only `node:` builtins.
- **INK for CLI UI**: React component model gives clean separation between rendering and data logic. Phase state machines drive async work.
- **Tool adapter pattern**: Adding support for a new AI coding tool requires only a new file in `packages/core/src/adapters/`.
