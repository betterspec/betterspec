# Tasks: Init Redesign

## Phase 1: Core Types & Config

### T1: Extend BetterspecConfig type

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/types/index.ts`
- **Details**: Add `ToolName` type alias (union of supported tools including `gemini-cli`), `SkillsConfig` type, `ToolCapabilities` type. Add `tool` and `skills` fields to `BetterspecConfig`.

### T2: Add path helpers and config defaults

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/config/index.ts`
- **Details**: Add `getGlobalSkillsDir()` → `~/.agents/skills/`, `getLocalSkillsDir(projectRoot)` → `<project>/.agents/skills/`. Update `createDefaultConfig()` to accept tool and skills mode.

## Phase 2: Skills Module

### T3: Create skill content strings with agentskills.io frontmatter

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/skills/content.ts` (new)
- **Details**: Define all 7 skill SKILL.md contents as exported template literal strings. Each includes YAML frontmatter with `name`, `description`, `metadata`. Body content migrated from existing `skills/forgelore-*/SKILL.md` files.

### T4: Create scaffoldSkills function

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/skills/index.ts` (new)
- **Details**: Export `scaffoldSkills(projectRoot, mode)` that writes skills to local, global, or both directories. Skips existing files. Returns list of created files.
- **Depends on**: T2, T3

### T5: Remove old scaffoldSkill from spec module

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/spec/index.ts`
- **Details**: Remove `scaffoldSkill()` and its hardcoded content. Update barrel export.
- **Depends on**: T4

## Phase 3: Agent Content

### T6: Create agent content strings

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/agents/content.ts` (new)
- **Details**: Define 4 agent role system prompts (planner, builder, validator, archivist) as template literal functions that accept model name. Content migrated from `opencode-betterspec/agents/`. Each role has: purpose, tool access, behavioral rules, output format. Validator enforces the Golden Rule.

### T7: Create agent scaffolding module

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/agents/index.ts` (new)
- **Details**: Export agent role metadata (name, description, default model per tool, tools, temperature). Export `scaffoldAgents(targetDir, roles, modelOverrides, format)` where format adapts frontmatter to the target tool (OpenCode vs Claude Code vs Gemini CLI).
- **Depends on**: T6

## Phase 4: Hook Scripts & Enforcement

### T8: Create portable hook scripts

- **Category**: core
- **Status**: cancelled
- **Files**: `packages/core/src/hooks/scripts/` (new directory)
- **Details**: Cancelled — hooks scaffolding deferred to a future change. The `hooks/` directory exists but is empty.

### T9: Create hooks scaffolding module

- **Category**: core
- **Status**: cancelled
- **File**: `packages/core/src/hooks/index.ts` (new)
- **Details**: Cancelled — deferred with T8.
- **Depends on**: T8

## Phase 5: Tool Adapters

### T10: Define adapter interface and registry

- **Category**: core
- **Status**: done
- **Files**: `packages/core/src/adapters/types.ts`, `packages/core/src/adapters/index.ts` (new)
- **Details**: Define `ToolAdapter` interface with `capabilities`, `promptConfig()`, and `scaffold()`. Define `ToolCapabilities` (agents, subagents, hooks, skills, memory). Create adapter registry. Export `getAdapter(toolName)` and `listAdapters()`.

### T11: Implement OpenCode adapter

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/adapters/opencode.ts` (new)
- **Depends on**: T7, T9, T10

### T12: Implement Claude Code adapter

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/adapters/claude-code.ts` (new)
- **Depends on**: T7, T9, T10

### T13: Implement Gemini CLI adapter

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/adapters/gemini-cli.ts` (new)
- **Depends on**: T7, T9, T10

### T14: Implement Cursor adapter

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/adapters/cursor.ts` (new)
- **Depends on**: T10

### T15: Implement Codex adapter

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/adapters/codex.ts` (new)
- **Depends on**: T10

### T16: Implement Generic adapter

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/adapters/generic.ts` (new)
- **Depends on**: T10

## Phase 6: CLI Init Redesign

### T17: Redesign init command

- **Category**: cli
- **Status**: done
- **File**: `packages/cli/src/commands/init.tsx`
- **Details**: Full rewrite — interactive wizard with tool selection, skills location, model selection. Non-interactive CI mode via flags. Grouped summary output.
- **Depends on**: T4, T5, T11-T16

### T18: Update barrel exports

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/index.ts`
- **Details**: Export new modules: `scaffoldSkills`, `scaffoldAgents`, adapter registry. Old `scaffoldSkill` removed.
- **Depends on**: T4, T7, T10

## Phase 7: Repo Cleanup & Tests

### T19: Rename repo skill directories and add frontmatter

- **Category**: repo
- **Status**: done
- **Files**: `skills/forgelore-*/` → `skills/betterspec-*/`
- **Details**: Renamed all 6 skill directories. Added YAML frontmatter to each SKILL.md.

### T20: Write tests for skills module

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/skills/skills.test.ts` (new)
- **Depends on**: T4

### T21: Write tests for adapter system

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/adapters/adapters.test.ts` (new)
- **Depends on**: T10-T16

### T22: Write tests for hooks module

- **Category**: core
- **Status**: cancelled
- **Details**: Cancelled — no hooks module was built (T8, T9 cancelled).
- **Depends on**: T9

### T23: Update existing spec tests

- **Category**: core
- **Status**: done
- **File**: `packages/core/src/spec/spec.test.ts`
- **Details**: Removed/updated tests referencing old `scaffoldSkill`.
- **Depends on**: T5

### T24: Build and verify

- **Category**: ci
- **Status**: done
- **Details**: Build passes, all tests pass.
- **Depends on**: T1-T23

### T25: Deprecate @betterspec/opencode setup

- **Category**: repo
- **Status**: done
- **Details**: `opencode-betterspec/` package has been removed from the repo entirely.
- **Depends on**: T17
