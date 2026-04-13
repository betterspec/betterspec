# Tasks: AI Integration

## Phase 1: AI Runner Foundation

### T1: Add AI types

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI. AI lives only in the future paid cloud portal.

### T2: Build context assembly module

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

### T3: Build subprocess runner

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

### T4: Build Anthropic API runner

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

### T5: Build OpenAI API runner

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

### T6: Build runner registry and runAI()

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

## Phase 2: Prompt Templates

### T7: Create digest prompt template

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

### T8: Create search prompt template

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

### T9: Create impact prompt template

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

### T10: Create onboard prompt template

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

### T11: Create explain prompt template

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

## Phase 3: CLI Commands (AI-powered)

### T12: Implement `betterspec digest` command

- **Category**: cli
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

### T13: Implement `betterspec search` command

- **Category**: cli
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

### T14: Implement `betterspec impact` command

- **Category**: cli
- **Status**: cancelled
- **Details**: Cancelled — AI-powered impact analysis not built. A grep-based `betterspec impact` was shipped as part of the MCP server instead.

### T15: Implement `betterspec onboard` command

- **Category**: cli
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

### T16: Implement `betterspec explain` command

- **Category**: cli
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI.

### T17: Register new commands in CLI entry point

- **Category**: cli
- **Status**: cancelled
- **Details**: Cancelled — AI commands not built. `betterspec serve` was registered separately.

## Phase 4: MCP Server Package

### T18: Create @betterspec/mcp package scaffold

- **Category**: mcp
- **Status**: done
- **Files**: `packages/mcp/package.json`, `packages/mcp/tsconfig.json`, `packages/mcp/tsup.config.ts`

### T19: Implement MCP tools

- **Category**: mcp
- **Status**: done
- **File**: `packages/mcp/src/tools.ts`
- **Details**: 5 tools: `betterspec_status`, `betterspec_search` (grep-based), `betterspec_impact` (grep-based), `betterspec_propose`, `betterspec_digest` (raw knowledge dump — no LLM, returns data for the connected AI to process).

### T20: Implement MCP resources

- **Category**: mcp
- **Status**: done
- **File**: `packages/mcp/src/resources.ts`

### T21: Implement MCP server entry point

- **Category**: mcp
- **Status**: done
- **File**: `packages/mcp/src/index.ts`

### T22: Implement `betterspec serve` command

- **Category**: cli
- **Status**: done
- **File**: `packages/cli/src/commands/serve.tsx`

## Phase 5: Auto-Digest Integration

### T23: Add digest storage functions

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no LLM runner in CLI. Raw `betterspec_digest` MCP tool returns knowledge data for the connected AI to summarize itself.

### T24: Add auto-digest to archive command

- **Category**: cli
- **Status**: cancelled
- **Details**: Cancelled with T23.

## Phase 6: Config & Init Updates

### T25: Update config types and defaults

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no AIConfig needed without the runner.

### T26: Update barrel exports

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no AI modules to export.

## Phase 7: Tests

### T27: Write tests for AI runner

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no AI runner built.

### T28: Write tests for MCP server

- **Category**: mcp
- **Status**: cancelled
- **Details**: MCP package ships with `--passWithNoTests`. Tests deferred.

### T29: Build and verify

- **Category**: ci
- **Status**: done
- **Details**: `bun run build` and `bun run test` pass across all 3 packages.
