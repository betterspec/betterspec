# Outcome: mcp-server

## What Was Built

A new `@betterspec/mcp` package implementing a Model Context Protocol server that gives any MCP-compatible AI tool direct access to betterspec's knowledge base. The server runs via stdio, auto-detects the project root, and exposes 5 tools and 6 resources covering everything from project status to file impact analysis.

`betterspec serve` was added to the CLI as a thin launcher with copy-paste connection instructions for major tools.

All operations are **grep/read-based** — no LLM calls. The connected AI tool provides the intelligence; betterspec provides the structured data.

## Capabilities

- **MCP Server**: Full MCP server implementation using `@modelcontextprotocol/sdk`. Auto-detects project root by walking up from cwd. 5 tools + 6 resources. Runs via `betterspec-mcp` binary or `betterspec serve`.

- **betterspec_status tool**: Returns project summary — active changes, archived count, capability count, mode.

- **betterspec_search tool**: Grep-based text search across the entire knowledge base (architecture, patterns, glossary, capabilities, decisions).

- **betterspec_impact tool**: Grep-based file reference scanning — finds which specs, capabilities, and knowledge docs reference a given file path.

- **betterspec_propose tool**: Creates a new change proposal from the MCP context, writing proposal.md and meta JSON.

- **betterspec_digest tool**: Returns raw knowledge base content (capabilities, decisions, recent archived changes) for the connected AI to summarize.

- **MCP Resources**: Exposes `betterspec://architecture`, `betterspec://patterns`, `betterspec://glossary`, `betterspec://capabilities`, `betterspec://decisions`, `betterspec://changes` as readable resources.

- **betterspec serve command**: Spawns the MCP server with connection instructions for Claude Code, OpenCode, Gemini CLI, and Cursor.

## Lessons Learned

- The MCP pattern (raw data out, AI summarizes) is a cleaner architecture than embedding LLM calls. The AI tool already has a model; give it the data.
- Project root detection by walking up from cwd is the right approach for monorepos where `betterspec serve` might be run from a sub-package directory.
- The `@betterspec/mcp` package has no tests (--passWithNoTests). This is a gap to address before v1.

## Files Changed

**New package:**

- `packages/mcp/package.json`
- `packages/mcp/tsconfig.json`
- `packages/mcp/tsup.config.ts`
- `packages/mcp/src/index.ts` — server entry point, root detection, stdio transport
- `packages/mcp/src/tools.ts` — 5 tool registrations with zod schemas
- `packages/mcp/src/resources.ts` — 6 resource registrations

**Modified:**

- `packages/cli/src/index.tsx` — registered `serve` command
- `packages/cli/src/commands/serve.tsx` — new serve command (INK)
- `turbo.json` — added mcp to pipeline

## Metrics

- 1 new package, 6 source files
- 5 MCP tools, 6 MCP resources
- All tests pass (mcp has no test file — passes with --passWithNoTests)
