# Design: Init Redesign

## Architecture Overview

The init redesign introduces a **tool adapter pattern** where each supported tool gets a comprehensive adapter that scaffolds **three pillars**: skills (knowledge), agents/subagents (execution), and hooks (enforcement). The init command orchestrates the flow; adapters handle tool-native details.

```
betterspec init
  │
  ├── 1. Prompt: spec mode (local / local+global / global)
  ├── 2. Prompt: tool (opencode / claude-code / gemini-cli / cursor / codex / generic)
  ├── 3. Prompt: skills location (local / global / both)
  ├── 4. Tool-specific prompts (e.g. model selection)
  │
  ├── 5. Scaffold spec directory (betterspec/, knowledge/, changes/)
  ├── 6. Scaffold skills (to chosen location(s), agentskills.io compliant)
  ├── 7. Run tool adapter:
  │     ├── Agents/subagents — planner, builder, validator, archivist
  │     ├── Hooks — system prompt injection, unspecced edit warnings, drift checks
  │     └── Config — tool-specific configuration files
  └── 8. Write config (betterspec.json with tool + skills mode)
```

## The Three Pillars

Every tool adapter scaffolds these three concerns. The adapter translates betterspec's concepts into the tool's native format.

### 1. Skills (Knowledge Layer)
Agent skills are the portable, tool-agnostic knowledge format. They follow the [agentskills.io spec](https://agentskills.io/specification) and work across all compatible tools without adaptation. Skills are scaffolded by the init command directly, not by adapters.

Seven betterspec skills:
- `betterspec/` — generic entry-point (CLI commands, workflow overview)
- `betterspec-workflow/` — full workflow rules and directory structure
- `betterspec-propose/` — how to create good proposals
- `betterspec-validate/` — validation process and output format
- `betterspec-archive/` — archiving and knowledge extraction
- `betterspec-drift/` — drift detection categories and process
- `betterspec-knowledge/` — knowledge base management

### 2. Agents/Subagents (Execution Layer)
Specialized AI roles with focused system prompts. Each tool has its own agent format:

| Role | Purpose | Default Model |
|------|---------|---------------|
| **Planner** | Transforms proposals into specs, requirements, task breakdowns | Opus/deep reasoning |
| **Builder** | Implements tasks following specs and patterns | Sonnet/fast |
| **Validator** | Independent verification — clean context, no build history | Sonnet/different provider |
| **Archivist** | Archives completed changes, extracts capabilities | Sonnet |

The **Golden Rule** is enforced across all tools: the agent that builds NEVER validates its own work.

### 3. Hooks (Enforcement Layer)
Hooks ensure specs stay alive and drift doesn't go unnoticed. Each tool has its own hook system, but betterspec needs the same behaviors everywhere:

| Hook Behavior | When | Purpose |
|---|---|---|
| **Spec context injection** | Before every LLM call / session start | Injects active changes, task progress, knowledge context into the system prompt |
| **Unspecced edit warning** | After file write/edit | Warns when editing files not referenced in any active spec's design.md |
| **Drift check on archive** | Before archiving | Blocks archive if specs have drifted from implementation |
| **Session start context** | On session start | Loads project status, active changes, enforcement rules |

## Module Structure

### New modules in `@betterspec/core`

```
packages/core/src/
  skills/
    index.ts          — scaffoldSkills()
    content.ts        — 7 skill SKILL.md content strings with agentskills.io frontmatter
  adapters/
    types.ts          — ToolAdapter interface, ScaffoldResult, ToolCapabilities
    index.ts          — adapter registry, getAdapter(), listAdapters()
    opencode.ts       — OpenCode adapter
    claude-code.ts    — Claude Code adapter
    gemini-cli.ts     — Gemini CLI adapter
    cursor.ts         — Cursor adapter
    codex.ts          — Codex adapter
    generic.ts        — Generic adapter (skills-only, no agents/hooks)
  agents/
    index.ts          — scaffoldAgents(), agent role metadata
    content.ts        — planner, builder, validator, archivist system prompts
  hooks/
    index.ts          — scaffoldHooks(), hook behavior definitions
    scripts/          — portable hook scripts (shell scripts for enforcement)
      check-unspecced-edit.sh   — checks if edited file is in any spec's design.md
      inject-spec-context.sh   — generates spec context for system prompt injection
      pre-archive-drift.sh     — runs drift check before allowing archive
```

### ToolAdapter Interface

```typescript
interface ToolCapabilities {
  agents: boolean;      // can define specialized agent roles
  subagents: boolean;   // can spawn subagents with separate context
  hooks: boolean;       // has lifecycle hook system
  skills: boolean;      // supports agentskills.io discovery
  memory: boolean;      // supports persistent agent memory
}

interface ToolAdapter {
  name: string;
  displayName: string;
  capabilities: ToolCapabilities;

  /**
   * Tool-specific prompts during init (e.g. model selection).
   */
  promptConfig?(projectRoot: string): Promise<Record<string, unknown>>;

  /**
   * Scaffold tool-specific files: agents, hooks, config.
   * Skills are handled separately by the init command.
   */
  scaffold(projectRoot: string, config: Record<string, unknown>): Promise<ScaffoldResult>;
}

interface ScaffoldResult {
  filesCreated: string[];
  configChanges: string[];   // human-readable descriptions of what was configured
}
```

## Adapter Details

### OpenCode Adapter (`adapters/opencode.ts`)

**Capabilities**: agents ✓, subagents ✓ (via `opencode run`), hooks ✓ (plugin API), skills ✓

**promptConfig()**:
- Queries available models via `opencode models`
- Prompts for model per agent role (planner, builder, validator, archivist)

**scaffold()**:

Agents → `.opencode/agents/betterspec-{planner,builder,validator,archivist}.md`
- YAML frontmatter: `name`, `description`, `model`, `tools`, `temperature`
- System prompt body with role-specific instructions

Hooks → Plugin hooks in `@betterspec/cli` (registered via opencode.json):
- `experimental.chat.system.transform` — injects spec context (active changes, task progress, enforcement rules, idle suggestions)
- `tool.execute.after` — warns on unspecced file edits by checking active spec design.md files

Config:
- Adds `@betterspec/cli` to `~/.config/opencode/opencode.json` plugin array
- The `@betterspec/cli` package exports OpenCode plugin hooks directly

### Claude Code Adapter (`adapters/claude-code.ts`)

**Capabilities**: agents ✓ (subagents), subagents ✓, hooks ✓ (lifecycle hooks), skills ✓

**promptConfig()**:
- Prompts for model per agent role (optional, Claude Code can use `inherit`)

**scaffold()**:

Agents → `.claude/agents/betterspec-{planner,builder,validator,archivist}.md`
- Claude Code subagent format: YAML frontmatter with `name`, `description`, `tools`, `model`, `permissionMode`, `skills` (preloads betterspec skills), `hooks`
- Builder gets: Read, Write, Edit, Bash, Glob, Grep
- Validator gets: Read, Glob, Grep, Bash (no Write/Edit — read-only verification)
- Archivist gets: Read, Write, Glob
- Planner gets: Read, Write, Glob, Grep

Hooks → `.claude/settings.json` (project-level hooks):
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/betterspec-check-unspecced.sh"
      }]
    }],
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/betterspec-session-context.sh"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "prompt",
        "prompt": "Check if any betterspec tasks were completed during this session. If so, remind the user to update task status with `betterspec status`."
      }]
    }]
  }
}
```

Hook scripts → `.claude/hooks/betterspec-*.sh`:
- `betterspec-check-unspecced.sh` — reads PostToolUse JSON from stdin, extracts file path, runs `betterspec diff` logic to check if file is referenced in any active spec
- `betterspec-session-context.sh` — runs `betterspec status --json`, outputs spec context as additionalContext for system prompt injection

Config:
- Appends betterspec workflow section to `CLAUDE.md` (if exists, otherwise creates)
- CLAUDE.md section includes: project uses betterspec, link to knowledge base, spec-first rule

### Gemini CLI Adapter (`adapters/gemini-cli.ts`)

**Capabilities**: agents ✓ (subagents), subagents ✓, hooks ✓, skills ✓

**promptConfig()**:
- Prompts for model per agent role (optional, uses Gemini model names)

**scaffold()**:

Skills are already handled by the init command via agentskills.io format. Gemini CLI discovers them from `.gemini/skills/` or `.agents/skills/`. The adapter symlinks or copies the project `skills/` into `.agents/skills/` if the user used local skills.

Agents → `.gemini/agents/betterspec-{planner,builder,validator,archivist}.md` or equivalent subagent format
- Gemini CLI subagent format with YAML frontmatter

Hooks → `.gemini/settings.json` (Gemini CLI hook format):
- `PostToolUse` hooks for unspecced edit detection
- Session hooks for spec context injection

Config:
- Creates or updates `GEMINI.md` with betterspec workflow context

### Cursor Adapter (`adapters/cursor.ts`)

**Capabilities**: agents ✗ (no subagent system), subagents ✗, hooks ✗, skills ✓ (via agentskills.io)

**promptConfig()**: No prompts needed

**scaffold()**:

Rules → `.cursor/rules/betterspec.mdc`:
- Comprehensive rules file with betterspec workflow, spec-first enforcement, knowledge base references
- Includes all agent role context inline (since Cursor can't spawn subagents)
- Includes validation checklist and archive process

No hooks or subagents — Cursor relies on rules for context and skills for discovery. The `.mdc` rules file does the heavy lifting.

### Codex Adapter (`adapters/codex.ts`)

**Capabilities**: agents ✓, subagents ✓, hooks ✗, skills ✓

**promptConfig()**: No prompts needed

**scaffold()**:
- Creates or appends to `AGENTS.md` / `codex.md` with betterspec context
- Agent definitions in Codex's expected format

### Generic Adapter (`adapters/generic.ts`)

**Capabilities**: agents ✗, subagents ✗, hooks ✗, skills ✓

**scaffold()**: No-op. Skills alone provide discovery for any agentskills.io-compatible tool. This is the fallback for tools that haven't gotten a dedicated adapter yet.

## Hook Scripts Architecture

Hook scripts are **portable shell scripts** that call the `betterspec` CLI. They are tool-agnostic in logic but placed in tool-specific locations by each adapter.

```
.claude/hooks/betterspec-check-unspecced.sh     # Claude Code placement
.opencode/hooks/betterspec-check-unspecced.sh   # OpenCode placement (if supported)
.gemini/hooks/betterspec-check-unspecced.sh     # Gemini CLI placement
```

Each script:
1. Reads JSON input from stdin (tool-specific format)
2. Extracts the relevant data (file path, command, etc.)
3. Calls `betterspec` CLI commands for the actual logic
4. Returns results in the tool's expected output format

This keeps enforcement logic in one place (the CLI) while adapting I/O to each tool.

## Config Changes

`BetterspecConfig` type gains fields:

```typescript
type ToolName = "opencode" | "claude-code" | "gemini-cli" | "cursor" | "codex" | "generic";

interface SkillsConfig {
  mode: "local" | "global" | "both";
}

interface BetterspecConfig {
  mode: "local" | "local+global" | "global";
  tool?: ToolName;
  skills?: SkillsConfig;
  enforcement: {
    requireSpecForChanges: boolean;
    warnOnUnspeccedEdits: boolean;
    blockArchiveOnDrift: boolean;
    autoInjectContext: boolean;
  };
  orchestration: { /* existing */ };
}
```

## Init Command Flow

```
1. Check if already initialized (existing)
2. Prompt spec mode (existing)
3. Prompt tool selection → load adapter
4. Prompt skills location
5. Run adapter.promptConfig() for tool-specific prompts
6. Scaffold spec dirs (existing)
7. Scaffold knowledge (existing)
8. Scaffold skills via scaffoldSkills(projectRoot, skillsMode)
9. Run adapter.scaffold(projectRoot, toolConfig)
   ├── Write agent/subagent definitions
   ├── Write hook configurations and scripts
   └── Write tool-specific config
10. Write betterspec.json with tool + skills mode
11. Print summary showing all created files grouped by category
```

## What Happens to `@betterspec/opencode`

1. Setup script prints deprecation: "Use `betterspec init` and select OpenCode"
2. Runtime plugin stays functional (imports from `@betterspec/core`)
3. Over time, the plugin becomes a thin re-export since hooks/tools logic lives in core

## File Summary

| File | Change |
|------|--------|
| **Types & Config** | |
| `packages/core/src/types/index.ts` | Add `ToolName`, `SkillsConfig`, `ToolCapabilities` |
| `packages/core/src/config/index.ts` | Add `getGlobalSkillsDir()`, `getLocalSkillsDir()`, update defaults |
| **Skills** | |
| `packages/core/src/skills/index.ts` | **New** — `scaffoldSkills()` |
| `packages/core/src/skills/content.ts` | **New** — 7 skill content strings with frontmatter |
| **Agents** | |
| `packages/core/src/agents/index.ts` | **New** — `scaffoldAgents()`, role metadata |
| `packages/core/src/agents/content.ts` | **New** — 4 agent system prompt strings |
| **Hooks** | |
| `packages/core/src/hooks/index.ts` | **New** — `scaffoldHooks()`, hook behavior definitions |
| `packages/core/src/hooks/scripts/` | **New** — portable shell scripts for enforcement |
| **Adapters** | |
| `packages/core/src/adapters/types.ts` | **New** — `ToolAdapter`, `ToolCapabilities`, `ScaffoldResult` |
| `packages/core/src/adapters/index.ts` | **New** — registry + `getAdapter()` |
| `packages/core/src/adapters/opencode.ts` | **New** — agents + plugin config |
| `packages/core/src/adapters/claude-code.ts` | **New** — subagents + hooks + CLAUDE.md |
| `packages/core/src/adapters/gemini-cli.ts` | **New** — subagents + hooks + GEMINI.md |
| `packages/core/src/adapters/cursor.ts` | **New** — .cursor/rules/ |
| `packages/core/src/adapters/codex.ts` | **New** — AGENTS.md |
| `packages/core/src/adapters/generic.ts` | **New** — no-op |
| **CLI** | |
| `packages/cli/src/commands/init.ts` | Redesigned init flow |
| **Cleanup** | |
| `packages/core/src/spec/index.ts` | Remove old `scaffoldSkill()` |
| `packages/core/src/index.ts` | Export new modules |
| `skills/betterspec-*/SKILL.md` | Rename dirs, add frontmatter |
