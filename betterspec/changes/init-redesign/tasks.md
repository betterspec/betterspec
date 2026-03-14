# Tasks: Init Redesign

## Phase 1: Core Types & Config

### T1: Extend BetterspecConfig type
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/types/index.ts`
- **Details**: Add `ToolName` type alias (union of supported tools including `gemini-cli`), `SkillsConfig` type, `ToolCapabilities` type. Add `tool` and `skills` fields to `BetterspecConfig`.

### T2: Add path helpers and config defaults
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/config/index.ts`
- **Details**: Add `getGlobalSkillsDir()` → `~/.betterspec/skills/`, `getLocalSkillsDir(projectRoot)` → `<project>/skills/`. Update `createDefaultConfig()` to accept tool and skills mode.

## Phase 2: Skills Module

### T3: Create skill content strings with agentskills.io frontmatter
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/skills/content.ts` (new)
- **Details**: Define all 7 skill SKILL.md contents as exported template literal strings. Each includes YAML frontmatter with `name`, `description`, `metadata`. Body content migrated from existing `skills/forgelore-*/SKILL.md` files.

### T4: Create scaffoldSkills function
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/skills/index.ts` (new)
- **Details**: Export `scaffoldSkills(projectRoot, mode)` that writes skills to local, global, or both directories. Skips existing files. Returns list of created files.
- **Depends on**: T2, T3

### T5: Remove old scaffoldSkill from spec module
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/spec/index.ts`
- **Details**: Remove `scaffoldSkill()` and its hardcoded content. Update barrel export.
- **Depends on**: T4

## Phase 3: Agent Content

### T6: Create agent content strings
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/agents/content.ts` (new)
- **Details**: Define 4 agent role system prompts (planner, builder, validator, archivist) as template literal functions that accept model name. Content migrated from `opencode-betterspec/agents/`. Each role has: purpose, tool access, behavioral rules, output format. Validator enforces the Golden Rule.

### T7: Create agent scaffolding module
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/agents/index.ts` (new)
- **Details**: Export agent role metadata (name, description, default model per tool, tools, temperature). Export `scaffoldAgents(targetDir, roles, modelOverrides, format)` where format adapts frontmatter to the target tool (OpenCode vs Claude Code vs Gemini CLI).
- **Depends on**: T6

## Phase 4: Hook Scripts & Enforcement

### T8: Create portable hook scripts
- **Category**: core
- **Status**: pending
- **Files**: `packages/core/src/hooks/scripts/` (new directory)
- **Details**: Write portable shell scripts that implement betterspec enforcement:
  - `check-unspecced-edit.sh` — reads JSON from stdin, extracts file path, checks against active spec design.md files via `betterspec` CLI, outputs warning in tool-expected format
  - `session-context.sh` — runs `betterspec status --json`, outputs spec context (active changes, task progress, enforcement rules) for system prompt injection
  - `pre-archive-drift.sh` — runs `betterspec diff` to check drift before allowing archive
  Scripts are tool-agnostic in logic; adapters place them in tool-specific locations and adapt I/O format.

### T9: Create hooks scaffolding module
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/hooks/index.ts` (new)
- **Details**: Export `scaffoldHooks(projectRoot, toolName)` that copies hook scripts to the tool's expected location and generates the tool's hook configuration. Returns list of created files.
  - Claude Code: `.claude/hooks/betterspec-*.sh` + entries in `.claude/settings.json`
  - Gemini CLI: `.gemini/hooks/betterspec-*.sh` + entries in `.gemini/settings.json`
  - OpenCode: hooks via plugin API (no scripts, just plugin export)
  - Cursor/Codex/Generic: no hooks scaffolded
- **Depends on**: T8

## Phase 5: Tool Adapters

### T10: Define adapter interface and registry
- **Category**: core
- **Status**: pending
- **Files**: `packages/core/src/adapters/types.ts`, `packages/core/src/adapters/index.ts` (new)
- **Details**: Define `ToolAdapter` interface with `capabilities`, `promptConfig()`, and `scaffold()`. Define `ToolCapabilities` (agents, subagents, hooks, skills, memory). Create adapter registry. Export `getAdapter(toolName)` and `listAdapters()`.

### T11: Implement OpenCode adapter
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/adapters/opencode.ts` (new)
- **Details**: 
  - Capabilities: agents ✓, subagents ✓, hooks ✓ (plugin), skills ✓
  - `promptConfig()`: query models via `opencode models`, prompt per role
  - `scaffold()`: write 4 agent files to `.opencode/agents/`, add plugin to opencode.json, hooks via plugin export
- **Depends on**: T7, T9, T10

### T12: Implement Claude Code adapter
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/adapters/claude-code.ts` (new)
- **Details**:
  - Capabilities: agents ✓, subagents ✓, hooks ✓, skills ✓
  - `promptConfig()`: optional model selection per role (default: `inherit`)
  - `scaffold()`:
    - 4 subagent files → `.claude/agents/betterspec-{planner,builder,validator,archivist}.md` with Claude Code frontmatter (name, description, tools, model, permissionMode, skills preloading, hooks)
    - Hook config → `.claude/settings.json` (PostToolUse for unspecced edits, SessionStart for context injection, Stop for task reminders)
    - Hook scripts → `.claude/hooks/betterspec-*.sh`
    - Context → append betterspec section to `CLAUDE.md`
- **Depends on**: T7, T9, T10

### T13: Implement Gemini CLI adapter
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/adapters/gemini-cli.ts` (new)
- **Details**:
  - Capabilities: agents ✓, subagents ✓, hooks ✓, skills ✓
  - `scaffold()`:
    - Subagent files in Gemini CLI format
    - Hook config in `.gemini/settings.json`
    - Hook scripts → `.gemini/hooks/betterspec-*.sh`
    - Context → append betterspec section to `GEMINI.md`
    - Skills symlink: if user chose local skills, ensure `.agents/skills/` links to `skills/`
- **Depends on**: T7, T9, T10

### T14: Implement Cursor adapter
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/adapters/cursor.ts` (new)
- **Details**:
  - Capabilities: agents ✗, subagents ✗, hooks ✗, skills ✓
  - `scaffold()`: creates `.cursor/rules/betterspec.mdc` with comprehensive rules covering workflow, all agent role context inline, validation checklist, knowledge base references. No hooks or agents (Cursor doesn't support them).
- **Depends on**: T10

### T15: Implement Codex adapter
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/adapters/codex.ts` (new)
- **Details**:
  - Capabilities: agents ✓, subagents ✓, hooks ✗, skills ✓
  - `scaffold()`: creates `AGENTS.md` with betterspec context and agent role definitions in Codex format
- **Depends on**: T10

### T16: Implement Generic adapter
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/adapters/generic.ts` (new)
- **Details**: No-op adapter. All capabilities false except skills. `scaffold()` returns empty. Skills alone handle discovery for any agentskills.io-compatible tool.
- **Depends on**: T10

## Phase 6: CLI Init Redesign

### T17: Redesign init command
- **Category**: cli
- **Status**: pending
- **File**: `packages/cli/src/commands/init.ts`
- **Details**: Full rewrite of init flow:
  1. Check if already initialized
  2. Prompt spec mode (existing)
  3. Prompt tool selection (new) — show adapter display names
  4. Prompt skills location (new)
  5. Run `adapter.promptConfig()` for tool-specific prompts (model selection etc.)
  6. Scaffold spec dirs + knowledge (existing)
  7. `scaffoldSkills(projectRoot, skillsMode)`
  8. `adapter.scaffold(projectRoot, toolConfig)` — agents, hooks, config
  9. Write betterspec.json with tool + skills mode
  10. Print grouped summary (specs, skills, agents, hooks, config)
  Handle non-TTY with sensible defaults (local, generic, local skills).
- **Depends on**: T4, T5, T11-T16

### T18: Update barrel exports
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/index.ts`
- **Details**: Export new modules: `scaffoldSkills`, `scaffoldAgents`, `scaffoldHooks`, adapter registry. Remove old `scaffoldSkill` export.
- **Depends on**: T4, T7, T9, T10

## Phase 7: Repo Cleanup & Tests

### T19: Rename repo skill directories and add frontmatter
- **Category**: repo
- **Status**: pending
- **Files**: `skills/forgelore-*/` → `skills/betterspec-*/`
- **Details**: Rename all 6 skill directories. Add YAML frontmatter to each SKILL.md. These serve as the reference copies in the repo root.

### T20: Write tests for skills module
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/skills/skills.test.ts` (new)
- **Details**: Test `scaffoldSkills` for local, global, both modes. Verify frontmatter present. Verify no-overwrite behavior.
- **Depends on**: T4

### T21: Write tests for adapter system
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/adapters/adapters.test.ts` (new)
- **Details**: Test adapter registry, generic adapter (no-op), each adapter's scaffold output (correct files in correct locations). Mock filesystem. Verify Claude Code adapter creates hooks + subagents + CLAUDE.md.
- **Depends on**: T10-T16

### T22: Write tests for hooks module
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/hooks/hooks.test.ts` (new)
- **Details**: Test `scaffoldHooks` creates correct scripts and config for each tool. Verify hook scripts are executable. Test portable scripts with mock JSON input.
- **Depends on**: T9

### T23: Update existing spec tests
- **Category**: core
- **Status**: pending
- **File**: `packages/core/src/spec/spec.test.ts`
- **Details**: Remove/update tests that reference old `scaffoldSkill` function.
- **Depends on**: T5

### T24: Build and verify
- **Category**: ci
- **Status**: pending
- **Details**: Run `bun run build` and `bun run test`. Verify clean build, all tests pass, no type errors.
- **Depends on**: T1-T23

### T25: Deprecate @betterspec/opencode setup
- **Category**: repo
- **Status**: pending
- **File**: `opencode-betterspec/src/setup.ts`
- **Details**: Update the setup script to print deprecation notice: "This package is deprecated. Use `betterspec init` and select OpenCode as your tool." Keep runtime plugin functional.
- **Depends on**: T17
