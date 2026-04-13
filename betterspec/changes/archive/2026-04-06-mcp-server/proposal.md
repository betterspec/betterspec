# Proposal: MCP Server for betterspec Knowledge Access

## Motivation

betterspec's knowledge base is only useful if AI tools can read it. Today there's no standard way for an AI coding tool to access betterspec specs, capabilities, or project state during a session. The Model Context Protocol (MCP) provides exactly this bridge — a standard stdio-based server that any MCP-compatible tool can connect to.

## Scope

### In Scope

- A new `@betterspec/mcp` package implementing an MCP server
- Tools: status, search, impact, propose, digest (all grep/read-based, no LLM)
- Resources: architecture.md, patterns.md, glossary.md, capabilities, decisions, active changes
- `betterspec serve` CLI command to launch the server with connection instructions

### Out of Scope

- LLM calls inside the MCP server — raw data only
- Authentication or remote server mode
- Tool-specific MCP configuration (each tool's docs cover this)

## Success Criteria

1. Any MCP-compatible AI tool can connect to betterspec and read the full knowledge base
2. The MCP server discovers the project root automatically
3. `betterspec serve` provides copy-paste connection config for major tools
4. No LLM API keys required
