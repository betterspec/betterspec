# Requirements: AI Integration

## AI Runner Abstraction

**FR-1: Provider Detection**
`runAI(prompt, options)` MUST detect the AI provider in this order:
1. If `ai.provider` is set in config, use that
2. If `ai.provider` is `"auto"` or unset, try subprocess first (based on `tool` config), fall back to API key
3. If no provider works, error with clear setup instructions

**FR-2: Subprocess Runners**
For each tool, betterspec MUST invoke the tool's headless/non-interactive mode:
- OpenCode: `opencode run --format json "<prompt>"`
- Claude Code: `claude --print --output-format json "<prompt>"`
- Gemini CLI: `gemini -p "<prompt>" --output-format json`
- Cursor/Codex/Generic: no subprocess runner available

**FR-3: Tool Availability Detection**
Before invoking a subprocess, betterspec MUST check if the tool binary is available (`which <tool>`). If not found, fall back to direct API. If no API key either, error with: "Install <tool> or set ANTHROPIC_API_KEY/OPENAI_API_KEY to use AI features."

**FR-4: Subprocess Response Parsing**
Each subprocess runner MUST parse the tool's JSON output format and return a normalized `AIResponse` object with at minimum `{ text: string, model?: string, usage?: { inputTokens: number, outputTokens: number } }`.

**FR-5: Direct API — Anthropic**
If `ANTHROPIC_API_KEY` is set (env var) or `ai.provider` is `"anthropic"`, use the `@anthropic-ai/sdk` package. Default model: `claude-haiku-4-20250514` (cheapest). The SDK MUST be an optional peer dependency — not bundled for users who don't need it.

**FR-6: Direct API — OpenAI**
If `OPENAI_API_KEY` is set or `ai.provider` is `"openai"`, use the `openai` package. Default model: `gpt-4.1-mini`. Optional peer dependency.

**FR-7: Context Assembly**
Before every AI call, betterspec MUST assemble a context window containing:
- Project architecture (`architecture.md`, truncated if needed)
- Active patterns (`patterns.md`)
- Active changes with status
- Relevant capabilities (filtered by command, e.g. `impact` only includes capabilities touching the target path)

Context MUST be kept under a configurable token budget (default: 8000 tokens estimated at ~4 chars/token).

## MCP Server

**FR-8: Separate Package**
The MCP server MUST be a separate package: `@betterspec/mcp`. It depends on `@betterspec/core` and `@modelcontextprotocol/sdk`.

**FR-9: Stdio Transport**
`betterspec serve` (or `npx @betterspec/mcp`) MUST start an MCP server on stdio transport, compatible with all major MCP clients.

**FR-10: MCP Tools**
The server MUST expose these tools:
- `betterspec_status` — project status (active changes, capabilities count, drift score)
- `betterspec_search` — search knowledge base by query
- `betterspec_impact` — show what references a given file/path
- `betterspec_propose` — create a new change proposal
- `betterspec_digest` — generate a knowledge digest

**FR-11: MCP Resources**
The server MUST expose these resources:
- `betterspec://knowledge/architecture` — architecture.md content
- `betterspec://knowledge/patterns` — patterns.md content
- `betterspec://knowledge/glossary` — glossary.md content
- `betterspec://capabilities` — all capabilities as JSON
- `betterspec://decisions` — all decisions as JSON
- `betterspec://changes/active` — active changes with metadata

## AI-Powered Commands

**FR-12: `betterspec digest`**
Generate a human-readable summary of recent changes. Inputs: archived changes from the last N archives (default: 5, configurable via `--count`). Output: markdown with sections: What Changed, Decisions Made, Patterns Established, Knowledge Shifts, Metrics.

**FR-13: `betterspec search <query>`**
Semantic search across the knowledge base. The AI receives the query + full knowledge base context and returns ranked results with relevance explanation. Each result shows: source (capability/decision/pattern/spec), title, relevance snippet.

**FR-14: `betterspec impact <path>`**
Show what specs, capabilities, patterns, and decisions reference a file or directory. Combines grep-based file matching (fast) with AI analysis of indirect references (e.g. a pattern that describes a module's behavior without naming specific files). Output: direct references, inferred references, regression risk assessment.

**FR-15: `betterspec onboard`**
Generate a narrative project walkthrough. Synthesizes architecture + top capabilities + key patterns + recent decisions into a 2-3 page guided tour. Output is markdown suitable for pasting into a README or sending to a new team member.

**FR-16: `betterspec explain <change>`**
Trace a change's full lifecycle: proposal motivation → requirements → design decisions → implementation outcome → knowledge captured. Works for both active and archived changes.

## Auto-Digest

**FR-17: Configurable Auto-Digest**
After `betterspec archive` completes, optionally run digest generation. Controlled by `ai.autoDigest` config (default: `false`). When enabled, appends a digest entry to `betterspec/knowledge/digests/` with timestamp.

**FR-18: Digest Storage**
Digests are stored as markdown files in `betterspec/knowledge/digests/<date>-<change-name>.md`. They persist as part of the knowledge base and are included in `betterspec onboard` output.

## Config

**FR-19: AI Config Section**
```json
{
  "ai": {
    "provider": "auto",
    "model": "auto",
    "autoDigest": false,
    "contextBudget": 8000
  }
}
```
- `provider`: `"auto"` | `"tool"` | `"anthropic"` | `"openai"`
- `model`: `"auto"` | specific model ID
- `autoDigest`: whether to generate digest on archive
- `contextBudget`: max estimated tokens for knowledge context
- API keys MUST only come from env vars, never stored in config

## Non-Functional Requirements

**NFR-1: Graceful Degradation**
All AI commands MUST work without AI by showing a helpful message: "AI features require <tool> or an API key. Run `betterspec config ai.provider` to configure."

**NFR-2: Cost Awareness**
AI commands MUST display estimated token usage after completion (if available from the response).

**NFR-3: Offline Operation**
Non-AI commands MUST continue working without internet. AI commands that can't reach a provider MUST fail fast with a clear error.

**NFR-4: Optional Dependencies**
`@anthropic-ai/sdk` and `openai` MUST be optional peer dependencies, not bundled. The MCP server package (`@betterspec/mcp`) is separate from the CLI.
