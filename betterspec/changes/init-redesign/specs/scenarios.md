# Scenarios: Init Redesign

## Scenario 1: Fresh project with OpenCode
1. User runs `betterspec init` in a new project
2. Prompted for spec mode → selects "local"
3. Prompted for tool → selects "OpenCode"
4. Prompted for skills location → selects "local"
5. Prompted for models per agent role (planner, builder, validator, archivist) with defaults
6. betterspec scaffolds:
   - `betterspec/` directory with config, knowledge files
   - `skills/` with all 7 betterspec skills (agentskills.io compliant)
   - `.opencode/agents/betterspec-{planner,builder,validator,archivist}.md` with chosen models
   - Adds `@betterspec/cli` to OpenCode plugin config
7. Config saved with `"tool": "opencode"`, `"skills": { "mode": "local" }`

## Scenario 2: Fresh project with Cursor
1. User runs `betterspec init`
2. Selects spec mode, then "Cursor" as tool, then skills location
3. betterspec scaffolds:
   - `betterspec/` directory
   - `skills/` with all betterspec skills
   - `.cursor/rules/betterspec.mdc` with workflow rules, agent roles, and knowledge context
4. No model selection prompt (Cursor manages its own models)

## Scenario 3: Fresh project with Claude Code
1. User runs `betterspec init`
2. Selects spec mode, then "Claude Code" as tool
3. betterspec scaffolds:
   - `betterspec/` directory and skills
   - Appends betterspec workflow instructions to `CLAUDE.md`
   - Creates `.claude/commands/` with betterspec slash commands if applicable

## Scenario 4: Generic setup (no specific tool)
1. User runs `betterspec init`
2. Selects "Generic" as tool
3. betterspec scaffolds:
   - `betterspec/` directory
   - `skills/` with all betterspec skills
   - No agent files, no tool-specific config
4. Skills alone are enough for any agentskills.io-compatible tool to discover

## Scenario 5: Global skills only
1. User runs `betterspec init`
2. Selects skills location → "Global"
3. Skills installed to `~/.betterspec/skills/` only
4. No `skills/` directory created in project
5. Config saved with `"skills": { "mode": "global" }`

## Scenario 6: Both local and global skills
1. User runs `betterspec init`
2. Selects skills location → "Both"
3. Skills installed to both `~/.betterspec/skills/` and `<project>/skills/`
4. Config saved with `"skills": { "mode": "both" }`

## Scenario 7: Non-interactive (CI/pipe)
1. `betterspec init` runs in non-TTY
2. All defaults applied silently: spec mode=local, tool=generic, skills=local
3. Spec directory and local skills scaffolded
4. No agent files (generic tool)
5. Command completes without hanging

## Scenario 8: Re-running init
1. Project already has `betterspec/betterspec.json`
2. User runs `betterspec init`
3. Init detects existing config, prints "already initialized" message, exits
4. No files modified

## Scenario 9: Partial existing setup
1. User has run init before with generic, now wants OpenCode setup
2. User runs `betterspec init --tool opencode` (or a future `betterspec setup` command)
3. Adds OpenCode agent files and plugin config without touching existing specs/skills
4. Note: this scenario may be deferred to a follow-up `betterspec setup` command

## Scenario 10: agentskills.io validation
1. After init, user runs `skills-ref validate ./skills/betterspec-workflow`
2. Validation passes: frontmatter has valid `name`, `description`
3. Directory name matches `name` field
4. All 7 skills pass validation

## Scenario 11: Existing user migrating from bunx @betterspec/opencode
1. User has run the old `bunx @betterspec/opencode` setup previously
2. User runs `betterspec init` — detects existing config, exits (already initialized)
3. Existing `.opencode/agents/` files continue working
4. User can optionally re-run with `--force` to update skills to agentskills.io format
