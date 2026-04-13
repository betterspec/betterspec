# Outcome: ai-integration

## What Was Built

This change was partially executed and partially cancelled. The **AI runner abstraction** (phases 1–3, 5–6 of the original plan) was never built and is now permanently cancelled — the decision was made that **no LLM API calls belong in the CLI**. The CLI is and remains a pure data tool. AI-powered features (digest, search, onboard, explain) will be delivered exclusively via the future paid cloud portal.

What **was** shipped from this change: the **MCP server** (`@betterspec/mcp`) and the `betterspec serve` command, which expose betterspec's knowledge base and operations to connected AI tools via the Model Context Protocol.

The MCP tools use **grep-based analysis only** — no LLM calls. `betterspec_digest` returns raw knowledge data for the _connected AI_ to summarize; `betterspec_impact` does grep-based file reference scanning; `betterspec_search` does text matching against the knowledge base.

## Capabilities

- **MCP Server**: `@betterspec/mcp` package — McpServer with StdioServerTransport, 5 tools, 6 resources, project root auto-detection. Located in `packages/mcp/`.

- **betterspec serve command**: `betterspec serve` spawns the MCP server and displays connection instructions per tool. Located in `packages/cli/src/commands/serve.tsx`.

## Decision

**No LLM in CLI.** Any AI-powered features (natural language search, digest summaries, onboarding narratives, change explanations) are deferred to the cloud tier. The MCP server is the bridge — it gives connected AI tools direct access to the knowledge base so they can perform these tasks themselves, without betterspec ever making LLM calls.

This is documented as ADR-001.

## Lessons Learned

- The MCP server cleanly separates concerns: betterspec manages knowledge structure, the connected AI tool provides intelligence. This is the right architecture for an OSS tool.
- `betterspec_digest` returning raw knowledge data (rather than calling an LLM) is a feature, not a limitation — it lets the AI tool apply its own summarization style.
- The `--passWithNoTests` in the MCP package is a gap — MCP tests should be written before v1 release.

## Files Changed

**New:**

- `packages/mcp/` — entire new package
  - `packages/mcp/src/index.ts` — server entry point
  - `packages/mcp/src/tools.ts` — 5 MCP tools
  - `packages/mcp/src/resources.ts` — 6 MCP resources
  - `packages/mcp/package.json`, `tsconfig.json`, `tsup.config.ts`
- `packages/cli/src/commands/serve.tsx` — betterspec serve command

## Metrics

- 5 of 29 tasks completed (T18–T22)
- 24 tasks cancelled (T1–T17, T23–T28 — AI runner and all AI-powered CLI commands)
- T29 (build+test) done — all pass
