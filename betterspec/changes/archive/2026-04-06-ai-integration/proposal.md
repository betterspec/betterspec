# AI-Powered Knowledge Commands & MCP Server

## Motivation

betterspec captures rich project knowledge — architecture docs, patterns, capabilities, decisions, change history — but currently only stores and displays it structurally. The knowledge base is useful for AI agents that already have betterspec skills loaded, but it's opaque to humans browsing the repo and inaccessible to AI tools that don't have betterspec set up.

Three problems:
1. **Humans can't consume the knowledge easily** — there's no synthesized view of "what happened recently" or "what does this project do"
2. **AI tools without betterspec skills can't access the knowledge** — it's locked in files with no discovery mechanism
3. **The CLI is passive** — it stores and retrieves but doesn't analyze or reason about the knowledge

## Scope

### In Scope
- AI runner abstraction that routes LLM calls through the user's configured tool (subprocess), with graceful fallback to direct API if available
- 5 new AI-powered CLI commands: `digest`, `search`, `impact`, `onboard`, `explain`
- MCP server as a **separate package** (`@betterspec/mcp`) exposing the knowledge base to any MCP-compatible tool
- Auto-digest option after `betterspec archive` (configurable)
- Config extension for AI provider settings

### Out of Scope
- Building a custom embedding/vector database for search (use LLM-powered search for v1)
- Real-time file watching or continuous drift analysis
- Web UI or dashboard (CLI and MCP only)

## Success Criteria
1. `betterspec digest` produces a human-readable summary using the user's existing AI tool with zero additional setup
2. `betterspec serve` starts an MCP server that Claude Code, OpenCode, Gemini CLI, and Cursor can connect to
3. If the configured tool isn't installed, betterspec falls back to direct API (if key available) or errors with clear instructions
4. `betterspec archive` optionally auto-generates a digest (configurable via `ai.autoDigest`)
5. All AI commands work in CI with `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
