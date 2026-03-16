# Tasks: AI Integration

## Phase 1: AI Runner Foundation

### T1: Add AI types
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/ai/types.ts` (new)
- **Details**: Define AIRunner interface, AIResponse, AIRunOptions, AIConfig, AINotAvailableError. Add AIConfig to betterspecConfig type in `types/index.ts`.

### T2: Build context assembly module
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/ai/context.ts` (new)
- **Details**: `assembleContext(projectRoot, scope, options)` reads knowledge base, filters by scope (full/digest/search/impact), truncates to token budget. Token estimation at ~4 chars/token. Keeps first and last paragraphs when truncating.

### T3: Build subprocess runner
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/ai/runners/subprocess.ts` (new)
- **Details**: SubprocessRunner with `available()` (checks `which <binary>`, caches result) and `run()` (invokes tool headlessly, parses JSON response). Map tool names to binaries: opencode→opencode, claude-code→claude, gemini-cli→gemini. Handle stderr, timeouts, and non-zero exit codes.
- **Depends on**: T1

### T4: Build Anthropic API runner
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/ai/runners/anthropic.ts` (new)
- **Details**: Lazy-loads `@anthropic-ai/sdk` via dynamic import. Uses ANTHROPIC_API_KEY from env. Default model: claude-haiku-4-20250514. Returns normalized AIResponse with usage stats and estimated cost.
- **Depends on**: T1

### T5: Build OpenAI API runner
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/ai/runners/openai.ts` (new)
- **Details**: Lazy-loads `openai` via dynamic import. Uses OPENAI_API_KEY from env. Default model: gpt-4.1-mini. Returns normalized AIResponse.
- **Depends on**: T1

### T6: Build runner registry and runAI()
- **Category**: core
- **Status**: pending
- **Files**: `packages/core/src/ai/runners/index.ts`, `packages/core/src/ai/index.ts` (new)
- **Details**: Runner registry maps provider names to runner factories. `runAI()` reads config, detects provider, assembles context, tries runners in fallback order (subprocess → anthropic → openai), throws AINotAvailableError if all fail. `detectProvider()` exported separately for CLI display.
- **Depends on**: T2, T3, T4, T5

## Phase 2: Prompt Templates

### T7: Create digest prompt template
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/ai/prompts/digest.ts` (new)
- **Details**: Template function takes archived changes content + knowledge base context. Returns system prompt + user prompt. Instructs AI to produce markdown with sections: What Changed, Decisions Made, Patterns Established, Knowledge Shifts, Metrics.

### T8: Create search prompt template
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/ai/prompts/search.ts` (new)
- **Details**: Template takes query string + knowledge base context. Instructs AI to return ranked JSON results with source type, title, relevance snippet, and confidence score.

### T9: Create impact prompt template
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/ai/prompts/impact.ts` (new)
- **Details**: Template takes file path + filtered capabilities + active specs + patterns. Instructs AI to identify: direct references, inferred references, regression risk level, and recommended actions.

### T10: Create onboard prompt template
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/ai/prompts/onboard.ts` (new)
- **Details**: Template takes full knowledge base context. Instructs AI to produce a 2-3 page narrative walkthrough covering: project overview, architecture, key capabilities, patterns to follow, recent decisions, getting started guide.

### T11: Create explain prompt template
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/ai/prompts/explain.ts` (new)
- **Details**: Template takes all files for a change (proposal, requirements, scenarios, design, tasks, outcome). Instructs AI to trace the full lifecycle narrative: motivation → decisions → implementation → knowledge captured.

## Phase 3: CLI Commands

### T12: Implement `betterspec digest` command
- **Category**: cli
- **Status**: pending
- **File**: `packages/cli/src/commands/digest.ts` (new)
- **Details**: Reads last N archived changes (default 5, `--count` flag). Calls `runAI` with digest prompt. Formats and displays markdown. `--output <file>` flag to write to file. Shows token usage and estimated cost.
- **Depends on**: T6, T7

### T13: Implement `betterspec search` command
- **Category**: cli
- **Status**: pending
- **File**: `packages/cli/src/commands/search.ts` (new)
- **Details**: Takes query as positional argument. Calls `runAI` with search prompt + full knowledge context. Displays ranked results with source type, title, and relevance snippet.
- **Depends on**: T6, T8

### T14: Implement `betterspec impact` command
- **Category**: cli
- **Status**: pending
- **File**: `packages/cli/src/commands/impact.ts` (new)
- **Details**: Takes path as positional argument. Does grep-based direct matching first (fast, no AI), then calls `runAI` for indirect/inferred references and risk assessment. Displays combined results.
- **Depends on**: T6, T9

### T15: Implement `betterspec onboard` command
- **Category**: cli
- **Status**: pending
- **File**: `packages/cli/src/commands/onboard.ts` (new)
- **Details**: Assembles full knowledge context. Calls `runAI` with onboard prompt. Displays narrative markdown. `--output <file>` flag for export.
- **Depends on**: T6, T10

### T16: Implement `betterspec explain` command
- **Category**: cli
- **Status**: pending
- **File**: `packages/cli/src/commands/explain.ts` (new)
- **Details**: Takes change name as positional argument. Reads all change files (works for both active and archived). Calls `runAI` with explain prompt. Displays lifecycle narrative.
- **Depends on**: T6, T11

### T17: Register new commands in CLI entry point
- **Category**: cli
- **Status**: pending
- **File**: `packages/cli/src/index.ts`
- **Details**: Import and register all 6 new commands: digest, search, impact, onboard, explain, serve. Add appropriate options and aliases.
- **Depends on**: T12-T16, T22

## Phase 4: MCP Server Package

### T18: Create @betterspec/mcp package scaffold
- **Category**: mcp
- **Status**: pending
- **Files**: `packages/mcp/package.json`, `packages/mcp/tsconfig.json`, `packages/mcp/tsup.config.ts`
- **Details**: New package in the monorepo. Dependencies: `@betterspec/core` (workspace), `@modelcontextprotocol/sdk`, `zod`. bin entry: `betterspec-mcp` → `dist/index.js`. ESM only. Add to turbo pipeline.

### T19: Implement MCP tools
- **Category**: mcp
- **Status**: pending
- **File**: `packages/mcp/src/tools.ts` (new)
- **Details**: Register 5 MCP tools: `betterspec_status` (project summary), `betterspec_search` (grep-based knowledge search), `betterspec_impact` (file reference analysis), `betterspec_propose` (create change), `betterspec_digest` (generate digest — returns raw knowledge for the connected LLM to summarize). Each uses zod schemas for input validation.
- **Depends on**: T18

### T20: Implement MCP resources
- **Category**: mcp
- **Status**: pending
- **File**: `packages/mcp/src/resources.ts` (new)
- **Details**: Register 6 MCP resources: architecture.md, patterns.md, glossary.md, capabilities (all as JSON), decisions (all as JSON), active changes (metadata as JSON). Each reads from the knowledge base on demand.
- **Depends on**: T18

### T21: Implement MCP server entry point
- **Category**: mcp
- **Status**: pending
- **File**: `packages/mcp/src/index.ts` (new)
- **Details**: Creates McpServer, registers tools and resources, starts StdioServerTransport. Detects projectRoot by walking up from cwd looking for `betterspec/betterspec.json`. Exits with clear error if not found.
- **Depends on**: T19, T20

### T22: Implement `betterspec serve` command
- **Category**: cli
- **Status**: pending
- **File**: `packages/cli/src/commands/serve.ts` (new)
- **Details**: Thin wrapper that spawns `npx @betterspec/mcp` as a child process (or imports directly if `@betterspec/mcp` is installed). Displays connection instructions for each tool (Claude Code, OpenCode, Gemini CLI, Cursor).
- **Depends on**: T21

## Phase 5: Auto-Digest Integration

### T23: Add digest storage functions
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/knowledge/index.ts`
- **Details**: Add `saveDigest(projectRoot, changeName, content)` — writes to `betterspec/knowledge/digests/<date>-<changeName>.md`, creating the directory if needed. Add `listDigests(projectRoot)` — returns sorted list of digest files. Add `readDigest(projectRoot, filename)`.

### T24: Add auto-digest to archive command
- **Category**: cli
- **Status**: pending
- **File**: `packages/cli/src/commands/archive.ts`
- **Details**: After successful archive, check `config.ai?.autoDigest`. If true, run digest generation via `runAI`. Save to digests directory. Non-fatal on failure — warn but don't fail the archive.
- **Depends on**: T6, T7, T23

## Phase 6: Config & Init Updates

### T25: Update config types and defaults
- **Category**: core
- **Status**: pending
- **Files**: `packages/core/src/types/index.ts`, `packages/core/src/config/index.ts`
- **Details**: Add AIConfig interface to types. Update DEFAULT_CONFIG with ai defaults. Update `createDefaultConfig()` signature. Update init command to optionally show AI provider info in summary.
- **Depends on**: T1

### T26: Update barrel exports
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/index.ts`
- **Details**: Export `runAI`, `assembleContext`, `detectProvider`, AI types, `saveDigest`, `listDigests`, `readDigest`.
- **Depends on**: T6, T23

## Phase 7: Tests

### T27: Write tests for AI runner
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/ai/ai.test.ts` (new)
- **Details**: Test provider detection logic, context assembly (scope filtering, token truncation), subprocess command building per tool, response normalization. Mock subprocess execution and API calls. Test fallback chain: subprocess fails → API key → error.
- **Depends on**: T6

### T28: Write tests for MCP server
- **Category**: mcp
- **Status**: pending
- **File**: `packages/mcp/src/mcp.test.ts` (new)
- **Details**: Test tool registration (correct names and schemas), resource registration (correct URIs and content), project root detection. Mock filesystem reads.
- **Depends on**: T21

### T29: Build and verify
- **Category**: ci
- **Status**: pending
- **Details**: `bun run build` and `bun run test` across all 3 packages (core, cli, mcp). Verify clean build, all tests pass, no type errors.
- **Depends on**: T1-T28
