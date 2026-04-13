# Outcome: init-redesign

## What Was Built

`betterspec init` was redesigned from a minimal spec-directory scaffolder into the **universal AI tool setup entry point**. Users now run one command to configure betterspec for their AI coding tool of choice — OpenCode, Claude Code, Gemini CLI, Cursor, Codex, or a generic fallback. The command is fully interactive on TTY and non-interactive in CI via flags.

Skills were migrated to the [agentskills.io](https://agentskills.io) specification with proper YAML frontmatter, and the tool adapter system makes it straightforward to add support for new tools without touching the CLI.

The `@betterspec/opencode` separate setup package was removed — all functionality now lives in `@betterspec/core` and `@betterspec/cli`.

## Capabilities

- **Tool Adapter System**: `getAdapter(toolName)` returns the correct adapter for scaffolding agent files, hooks config, and tool-specific context. Adapters: OpenCode, Claude Code, Gemini CLI, Cursor, Codex, Generic. Located in `packages/core/src/adapters/`.

- **Skills Scaffolding**: `scaffoldSkills(projectRoot, mode)` writes agentskills.io-compliant SKILL.md files to local (`.agents/skills/`), global (`~/.agents/skills/`), or both locations. Skips existing files. Located in `packages/core/src/skills/`.

- **Agent Content & Scaffolding**: `scaffoldAgents(targetDir, roles, modelOverrides, format)` writes agent role files (planner, builder, validator, archivist) with format-appropriate frontmatter per tool. Located in `packages/core/src/agents/`.

- **Interactive Init Wizard**: Guided `betterspec init` flow with tool selection, skills location, and model selection prompts. Non-interactive fallback via `--tool`, `--mode`, `--skills` flags. Located in `packages/cli/src/commands/init.tsx`.

- **agentskills.io-compliant Skills**: All 6 skills in `skills/betterspec-*/SKILL.md` include valid YAML frontmatter (`name`, `description`). Directories renamed from `forgelore-*` to `betterspec-*`.

## Lessons Learned

- Hook scaffolding (T8, T9) was deferred — the adapter interface includes a `hooks` capability flag so adapters can declare support without the module being built yet. This was the right call to keep scope tight.
- The adapter pattern cleanly separates tool-specific concerns from core logic. Adding a new tool requires only a new file in `adapters/`.
- YAML frontmatter in SKILL.md files is required by agentskills.io but was easy to miss — should be verified at scaffold time.

## Files Changed

**New:**

- `packages/core/src/skills/content.ts` — skill content as template literals
- `packages/core/src/skills/index.ts` — `scaffoldSkills()`
- `packages/core/src/skills/skills.test.ts`
- `packages/core/src/agents/content.ts` — agent role prompts
- `packages/core/src/agents/index.ts` — `scaffoldAgents()`
- `packages/core/src/agents/agents.test.ts`
- `packages/core/src/adapters/types.ts` — `ToolAdapter` interface
- `packages/core/src/adapters/index.ts` — adapter registry
- `packages/core/src/adapters/opencode.ts`
- `packages/core/src/adapters/claude-code.ts`
- `packages/core/src/adapters/gemini-cli.ts`
- `packages/core/src/adapters/cursor.ts`
- `packages/core/src/adapters/codex.ts`
- `packages/core/src/adapters/generic.ts`
- `packages/core/src/adapters/adapters.test.ts`
- `skills/betterspec-*/SKILL.md` (renamed from `forgelore-*`, frontmatter added)

**Modified:**

- `packages/core/src/types/index.ts` — added `ToolName`, `SkillsConfig`, `ToolCapabilities`
- `packages/core/src/config/index.ts` — added `getGlobalSkillsDir()`, `getLocalSkillsDir()`
- `packages/core/src/spec/index.ts` — removed old `scaffoldSkill()`
- `packages/core/src/index.ts` — updated barrel exports
- `packages/cli/src/commands/init.tsx` — full rewrite

**Removed:**

- `opencode-betterspec/` package (deprecated and deleted)

## Metrics

- 22 of 25 tasks completed (3 cancelled: T8, T9, T22 — hooks deferred)
- All tests pass: `bun run test`
- Build clean: `bun run build`
