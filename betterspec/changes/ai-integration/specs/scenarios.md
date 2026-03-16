# Scenarios: AI Integration

## Scenario 1: User runs `betterspec digest` with OpenCode configured
1. User has `"tool": "opencode"` in betterspec.json
2. Runs `betterspec digest`
3. betterspec checks `which opencode` — found
4. Assembles context: last 5 archived changes + knowledge base
5. Calls `opencode run --format json "<digest prompt>"`
6. Parses JSON response
7. Displays formatted markdown digest with sections: What Changed, Decisions Made, Patterns, Metrics
8. Shows token usage

## Scenario 2: User runs `betterspec search` with Claude Code
1. User has `"tool": "claude-code"` in config
2. Runs `betterspec search "authentication"`
3. betterspec checks `which claude` — found
4. Assembles knowledge base context
5. Calls `claude --print --output-format json "<search prompt with query>"`
6. Parses and displays ranked results with relevance snippets

## Scenario 3: Configured tool not installed, API key available
1. User has `"tool": "opencode"` but OpenCode is not installed
2. `ANTHROPIC_API_KEY` is set in environment
3. Runs `betterspec digest`
4. betterspec checks `which opencode` — not found
5. Falls back to Anthropic API with Haiku model
6. Generates digest via API
7. Shows: "Note: Using Anthropic API (opencode not found). Estimated cost: $0.002"

## Scenario 4: No tool, no API key
1. User has `"tool": "cursor"` (no subprocess support)
2. No API keys set
3. Runs `betterspec search "auth"`
4. betterspec outputs: "AI features require an API key or a compatible tool. Set ANTHROPIC_API_KEY or OPENAI_API_KEY, or configure a tool with headless support (OpenCode, Claude Code, Gemini CLI)."
5. Non-AI commands (`status`, `list`, `diff`) continue working normally

## Scenario 5: MCP server with Claude Code
1. User adds to `.claude/settings.json`: `{ "mcpServers": { "betterspec": { "command": "npx", "args": ["@betterspec/mcp"] } } }`
2. Starts Claude Code session
3. Claude Code discovers betterspec MCP tools and resources
4. User asks: "What's the architecture of this project?"
5. Claude Code calls `betterspec://knowledge/architecture` resource
6. Returns architecture.md content as context
7. Claude synthesizes answer from betterspec knowledge

## Scenario 6: MCP server tool invocation
1. MCP server is connected
2. User asks: "What would be affected if I refactor the auth module?"
3. Claude Code calls `betterspec_impact` tool with path `src/auth/`
4. betterspec scans capabilities, specs, and patterns for references
5. Returns structured impact analysis
6. Claude presents findings to user

## Scenario 7: Auto-digest after archive
1. User has `"ai": { "autoDigest": true }` in config
2. Runs `betterspec archive my-change`
3. Archive completes normally
4. betterspec automatically runs digest generation for this change
5. Saves digest to `betterspec/knowledge/digests/2026-03-14-my-change.md`
6. Shows: "Digest generated and saved."

## Scenario 8: Auto-digest disabled (default)
1. User has default config (autoDigest: false)
2. Runs `betterspec archive my-change`
3. Archive completes, no digest generated
4. User can manually run `betterspec digest` later

## Scenario 9: `betterspec onboard` for new team member
1. New developer joins the project
2. Runs `betterspec onboard`
3. betterspec assembles: architecture + top 10 capabilities + key patterns + recent decisions
4. AI generates a narrative walkthrough: "This project is a..., The architecture consists of..., Key capabilities include..., Patterns to follow..."
5. Output is markdown, suitable for pasting into docs or reading

## Scenario 10: `betterspec impact` before refactoring
1. Developer wants to refactor `src/api/routes.ts`
2. Runs `betterspec impact src/api/routes.ts`
3. betterspec finds: 3 capabilities reference this file, 1 active spec lists it in design.md, patterns.md describes the routing pattern
4. AI analyzes indirect references and regression risks
5. Output: "Direct: 3 capabilities, 1 spec. Inferred: auth middleware pattern depends on route structure. Risk: medium — update routing pattern in patterns.md after refactoring."

## Scenario 11: `betterspec explain` on archived change
1. Runs `betterspec explain init-redesign`
2. betterspec reads: proposal.md, specs/, design.md, tasks.md, outcome.md (if archived)
3. AI synthesizes: "The init-redesign change was proposed to make betterspec init the single setup entry point. It introduced a tool adapter pattern supporting 6 tools. Key decisions: hooks as a core pillar, inline plugins instead of separate repos. Outcome: 3,270 lines added, 6 adapters, 28 tests."

## Scenario 12: Gemini CLI subprocess (free tier)
1. User has `"tool": "gemini-cli"` in config
2. User authenticated with Google account (free tier)
3. Runs `betterspec digest`
4. betterspec calls `gemini -p "<prompt>" --output-format json`
5. Parses Gemini response
6. Displays digest — zero cost to user

## Scenario 13: CI pipeline with API key
1. GitHub Action runs `betterspec digest --output digests/latest.md`
2. `ANTHROPIC_API_KEY` is set as GitHub secret
3. betterspec detects no tool available, uses Anthropic API
4. Generates digest, writes to file
5. Action commits the digest to the repo
