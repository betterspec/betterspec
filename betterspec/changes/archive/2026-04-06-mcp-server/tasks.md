# Tasks: MCP Server

### T1: Create @betterspec/mcp package scaffold

- **Category**: mcp
- **Status**: done
- **Files**: `packages/mcp/package.json`, `packages/mcp/tsconfig.json`, `packages/mcp/tsup.config.ts`

### T2: Implement MCP tools

- **Category**: mcp
- **Status**: done
- **File**: `packages/mcp/src/tools.ts`
- **Details**: 5 tools: `betterspec_status`, `betterspec_search`, `betterspec_impact`, `betterspec_propose`, `betterspec_digest`

### T3: Implement MCP resources

- **Category**: mcp
- **Status**: done
- **File**: `packages/mcp/src/resources.ts`
- **Details**: 6 resources: architecture, patterns, glossary, capabilities, decisions, active changes

### T4: Implement MCP server entry point

- **Category**: mcp
- **Status**: done
- **File**: `packages/mcp/src/index.ts`
- **Details**: McpServer + StdioServerTransport, project root detection by walking up from cwd

### T5: Implement `betterspec serve` command

- **Category**: cli
- **Status**: done
- **File**: `packages/cli/src/commands/serve.tsx`

### T6: Build and verify

- **Category**: ci
- **Status**: done
- **Details**: `bun run build` and `bun run test` pass
