# Design: AI Integration

## Architecture Overview

Three layers, each independently useful:

```
┌─────────────────────────────────────────────┐
│  Layer 3: MCP Server (@betterspec/mcp)      │
│  Exposes knowledge as tools + resources     │
│  Any MCP client can connect                 │
├─────────────────────────────────────────────┤
│  Layer 2: AI Commands (CLI)                 │
│  digest, search, impact, onboard, explain   │
│  Uses Layer 1 for LLM access               │
├─────────────────────────────────────────────┤
│  Layer 1: AI Runner (@betterspec/core)      │
│  runAI() → subprocess / API / error         │
│  Context assembly, prompt templates         │
└─────────────────────────────────────────────┘
```

## Package Structure

### `@betterspec/core` — AI runner + prompts

```
packages/core/src/
  ai/
    types.ts              — AIProvider, AIResponse, AIOptions, RunnerConfig
    index.ts              — runAI(), detectProvider()
    context.ts            — assembleContext(), truncateToTokenBudget()
    runners/
      index.ts            — runner registry, getRunner()
      subprocess.ts       — SubprocessRunner for opencode/claude/gemini
      anthropic.ts        — AnthropicRunner (direct API, lazy-loaded)
      openai.ts           — OpenAIRunner (direct API, lazy-loaded)
    prompts/
      digest.ts           — digest prompt template
      search.ts           — search prompt template
      impact.ts           — impact prompt template
      onboard.ts          — onboard prompt template
      explain.ts          — explain prompt template
```

### `@betterspec/cli` — AI commands

```
packages/cli/src/commands/
  digest.ts               — betterspec digest
  search.ts               — betterspec search <query>
  impact.ts               — betterspec impact <path>
  onboard.ts              — betterspec onboard
  explain.ts              — betterspec explain <change>
  serve.ts                — betterspec serve (thin wrapper, delegates to @betterspec/mcp)
```

### `@betterspec/mcp` — MCP server (NEW PACKAGE)

```
packages/mcp/
  package.json            — depends on @betterspec/core, @modelcontextprotocol/sdk
  src/
    index.ts              — MCP server entry point
    tools.ts              — MCP tool definitions
    resources.ts          — MCP resource definitions
  tsup.config.ts
  tsconfig.json
```

## AI Runner Design

### `runAI(prompt, options): Promise<AIResponse>`

The core function. Sequence:

```
1. Read config → determine provider preference
2. Assemble context (knowledge base, filtered by command needs)
3. Build full prompt = system context + user prompt
4. Try preferred runner:
   a. If "tool" or "auto": check if tool binary exists (which <tool>)
      - Found: invoke subprocess, parse response
      - Not found: fall through
   b. If "anthropic" or fallback: check ANTHROPIC_API_KEY
      - Found: lazy-load @anthropic-ai/sdk, call API
      - Not found: fall through
   c. If "openai" or fallback: check OPENAI_API_KEY
      - Found: lazy-load openai, call API
      - Not found: fall through
5. If nothing works: throw AINotAvailableError with setup instructions
```

### Runner Interface

```typescript
interface AIRunner {
  name: string;
  available(): Promise<boolean>;
  run(prompt: string, options: AIRunOptions): Promise<AIResponse>;
}

interface AIResponse {
  text: string;
  model?: string;
  usage?: { inputTokens: number; outputTokens: number };
  cost?: number; // estimated USD
}

interface AIRunOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  format?: "text" | "json";
}
```

### Subprocess Runner

One runner per tool, with tool-specific binary name and command format:

```typescript
const TOOL_BINARIES: Partial<Record<ToolName, string>> = {
  opencode: "opencode",
  "claude-code": "claude",
  "gemini-cli": "gemini",
};

const TOOL_COMMANDS: Partial<Record<ToolName, (prompt: string) => string>> = {
  opencode: (p) => `opencode run --format json ${shellQuote(p)}`,
  "claude-code": (p) => `claude --print --output-format json ${shellQuote(p)}`,
  "gemini-cli": (p) => `gemini -p ${shellQuote(p)} --output-format json`,
};
```

`available()` runs `which <binary>` and caches the result.

### Direct API Runners

Lazy-loaded via dynamic `import()` to avoid bundling SDK code for users who don't need it:

```typescript
async run(prompt: string, options: AIRunOptions): Promise<AIResponse> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  const message = await client.messages.create({
    model: this.model,
    max_tokens: options.maxTokens ?? 4096,
    system: options.systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });
  return this.normalize(message);
}
```

### Context Assembly

```typescript
async function assembleContext(
  projectRoot: string,
  scope: "full" | "digest" | "search" | "impact",
  options?: { targetPath?: string; tokenBudget?: number }
): Promise<string>
```

Scope determines what's included:

| Scope | Architecture | Patterns | Capabilities | Active Changes | Decisions | Digests |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|
| full | ✓ | ✓ | ✓ (all) | ✓ | ✓ | ✓ |
| digest | ✓ (summary) | - | ✓ (recent) | - | ✓ (recent) | - |
| search | ✓ | ✓ | ✓ (all) | ✓ | ✓ | - |
| impact | - | ✓ | ✓ (filtered by path) | ✓ (filtered) | - | - |

Token budget truncation: if assembled context exceeds budget, truncate the longest section first, keeping the first and last paragraphs of each document.

## MCP Server Design

### Entry point

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "betterspec", version: "0.4.0" });
registerTools(server, projectRoot);
registerResources(server, projectRoot);

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Tools

Each tool calls the corresponding core function and returns structured text:

```typescript
server.registerTool("betterspec_status", {
  description: "Get project status — active changes, capabilities, drift score",
  inputSchema: {},
}, async () => {
  const summary = await getProjectSummary(projectRoot);
  return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
});

server.registerTool("betterspec_search", {
  description: "Search the project knowledge base for capabilities, decisions, patterns, and specs",
  inputSchema: { query: z.string().describe("Search query") },
}, async ({ query }) => {
  const results = await grepKnowledge(projectRoot, query);
  return { content: [{ type: "text", text: formatSearchResults(results) }] };
});

server.registerTool("betterspec_impact", {
  description: "Show what specs, capabilities, and patterns reference a file or directory",
  inputSchema: { path: z.string().describe("File or directory path to analyze") },
}, async ({ path }) => {
  const impact = await analyzeImpact(projectRoot, path);
  return { content: [{ type: "text", text: formatImpact(impact) }] };
});
```

### Resources

Each resource reads the corresponding knowledge base file:

```typescript
server.registerResource("betterspec://knowledge/architecture", {
  name: "Architecture",
  description: "Project architecture documentation",
  mimeType: "text/markdown",
}, async () => {
  const content = await readKnowledgeFile(projectRoot, "architecture.md");
  return {
    contents: [{
      uri: "betterspec://knowledge/architecture",
      text: content,
      mimeType: "text/markdown",
    }],
  };
});
```

## Config Changes

```typescript
interface AIConfig {
  provider: "auto" | "tool" | "anthropic" | "openai";
  model: string; // "auto" or specific model ID
  autoDigest: boolean;
  contextBudget: number; // estimated tokens
}

// Added to betterspecConfig:
interface betterspecConfig {
  // ... existing fields
  ai?: AIConfig;
}
```

Default values:
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

## Auto-Digest Integration

In `archiveCommand()`, after successful archive:

```typescript
const config = await readConfig(projectRoot);
if (config.ai?.autoDigest) {
  spinner.text = "Generating digest...";
  try {
    const digest = await generateDigest(projectRoot, changeName);
    await saveDigest(projectRoot, changeName, digest);
    spinner.succeed("Digest generated");
  } catch (err) {
    // Non-fatal: warn but don't fail the archive
    spinner.warn("Digest generation failed (AI unavailable). Run `betterspec digest` manually.");
  }
}
```

Digest storage:
- Directory: `betterspec/knowledge/digests/`
- Filename: `<YYYY-MM-DD>-<change-name>.md`
- Content: AI-generated markdown summary

## File Summary

| File | Package | Change |
|------|---------|--------|
| **AI Runner** | | |
| `src/ai/types.ts` | core | **New** — AIRunner, AIResponse, AIOptions types |
| `src/ai/index.ts` | core | **New** — runAI(), detectProvider() |
| `src/ai/context.ts` | core | **New** — assembleContext(), truncateToTokenBudget() |
| `src/ai/runners/index.ts` | core | **New** — runner registry |
| `src/ai/runners/subprocess.ts` | core | **New** — tool subprocess runner |
| `src/ai/runners/anthropic.ts` | core | **New** — Anthropic SDK runner (optional) |
| `src/ai/runners/openai.ts` | core | **New** — OpenAI SDK runner (optional) |
| **Prompts** | | |
| `src/ai/prompts/digest.ts` | core | **New** — digest prompt template |
| `src/ai/prompts/search.ts` | core | **New** — search prompt template |
| `src/ai/prompts/impact.ts` | core | **New** — impact prompt template |
| `src/ai/prompts/onboard.ts` | core | **New** — onboard prompt template |
| `src/ai/prompts/explain.ts` | core | **New** — explain prompt template |
| **Config** | | |
| `src/types/index.ts` | core | Add AIConfig to betterspecConfig |
| `src/config/index.ts` | core | Update createDefaultConfig |
| **CLI Commands** | | |
| `src/commands/digest.ts` | cli | **New** — digest command |
| `src/commands/search.ts` | cli | **New** — search command |
| `src/commands/impact.ts` | cli | **New** — impact command |
| `src/commands/onboard.ts` | cli | **New** — onboard command |
| `src/commands/explain.ts` | cli | **New** — explain command |
| `src/commands/serve.ts` | cli | **New** — serve command (delegates to @betterspec/mcp) |
| `src/commands/archive.ts` | cli | Update — add auto-digest step |
| `src/index.ts` | cli | Register 6 new commands |
| **MCP Server** | | |
| `packages/mcp/package.json` | mcp | **New package** |
| `packages/mcp/src/index.ts` | mcp | **New** — MCP server entry point |
| `packages/mcp/src/tools.ts` | mcp | **New** — MCP tool definitions |
| `packages/mcp/src/resources.ts` | mcp | **New** — MCP resource definitions |
| **Knowledge** | | |
| `src/knowledge/index.ts` | core | Add saveDigest(), listDigests() |
