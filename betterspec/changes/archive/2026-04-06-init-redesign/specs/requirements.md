# Requirements: Init Redesign

## Functional Requirements

### Init Flow

**FR-1: Spec Mode Prompt**
During init, prompt the user to choose spec mode: `local`, `local+global`, or `global`. Unchanged from current behavior.

**FR-2: Tool Selection Prompt**
After spec mode, prompt the user to choose their AI coding tool:
- OpenCode
- Claude Code
- Gemini CLI
- Cursor
- Codex
- Generic (no tool-specific setup)

The selected tool determines which adapter runs during scaffolding.

**FR-3: Skills Location Prompt**
After tool selection, prompt for skills installation location:
- **Local** — `<project>/skills/`
- **Global** — `~/.betterspec/skills/`
- **Both** — install to both; local takes precedence at runtime

**FR-4: Non-Interactive Defaults**
When running in a non-TTY environment, all prompts MUST use sensible defaults without blocking:
- Spec mode: `local`
- Tool: `generic`
- Skills location: `local`

### Scaffolding

**FR-5: Spec Directory Scaffolding**
Init MUST create the betterspec directory structure (unchanged):
- `betterspec/betterspec.json`
- `betterspec/changes/` and `betterspec/changes/archive/`
- `betterspec/knowledge/` with `architecture.md`, `patterns.md`, `glossary.md`
- `betterspec/knowledge/capabilities/` and `betterspec/knowledge/decisions/`

**FR-6: Skills Scaffolding**
Init MUST install all betterspec skills to the chosen location(s):
- `betterspec/SKILL.md` — generic entry-point skill
- `betterspec-workflow/SKILL.md` — workflow rules
- `betterspec-propose/SKILL.md` — proposal creation
- `betterspec-validate/SKILL.md` — validation process
- `betterspec-archive/SKILL.md` — archiving and knowledge extraction
- `betterspec-drift/SKILL.md` — drift detection
- `betterspec-knowledge/SKILL.md` — knowledge base management

**FR-7: agentskills.io Compliance**
Every SKILL.md MUST include valid YAML frontmatter per the agentskills.io spec:
- `name` (required): lowercase letters and hyphens, matches directory name
- `description` (required): describes what the skill does and when to use it
- `metadata` (optional): `author: betterspec`, `version: "<current>"`

**FR-8: Agent/Subagent Scaffolding (Tool-Specific)**
When a tool with agent support is selected, init MUST scaffold agent definitions in the tool's native format:
- **OpenCode**: `.opencode/agents/betterspec-{planner,builder,validator,archivist}.md` (YAML frontmatter + system prompt)
- **Claude Code**: `.claude/agents/betterspec-{planner,builder,validator,archivist}.md` (subagent format with tools, model, permissionMode, skills preloading)
- **Gemini CLI**: `.gemini/agents/betterspec-{planner,builder,validator,archivist}.md` (subagent format)
- **Cursor**: `.cursor/rules/betterspec.mdc` (single rules file — no subagent support, all context inline)
- **Codex**: `AGENTS.md` or Codex-specific format
- **Generic**: No agent files, skills alone provide discovery

The **Golden Rule** MUST be enforced: the validator agent MUST NOT have write/edit tools and MUST use a different model or clean context from the builder.

**FR-9: Hook Scaffolding (Tool-Specific)**
When a tool with hook support is selected, init MUST scaffold lifecycle hooks for enforcement:

Required hook behaviors:
1. **Spec context injection** — on session start or before LLM calls, inject active changes, task progress, and enforcement rules
2. **Unspecced edit warning** — after file write/edit, check if the file is referenced in any active spec's design.md; warn if not
3. **Stop/session end reminder** — remind user to update task status

Tool-specific hook formats:
- **OpenCode**: Plugin hooks via `@betterspec/cli` plugin export (system prompt transform + tool execute after)
- **Claude Code**: `.claude/settings.json` hooks config + `.claude/hooks/betterspec-*.sh` scripts (PostToolUse, SessionStart, Stop events)
- **Gemini CLI**: `.gemini/settings.json` hooks + hook scripts
- **Cursor**: No hook system — enforcement via rules only
- **Codex**: No hook system
- **Generic**: No hooks

Hook enforcement scripts MUST be portable shell scripts that call the `betterspec` CLI for logic, adapting only I/O format per tool.

**FR-10: Model Selection**
When a tool with agent support is selected, init MUST prompt the user to choose models for each agent role with sensible defaults. Model format varies by tool (e.g. `anthropic/claude-opus-4-20250514` for OpenCode, `opus` for Claude Code, Gemini model names for Gemini CLI).

**FR-11: Tool Configuration**
When a tool is selected, init MUST configure tool-specific integration:
- **OpenCode**: Add `@betterspec/cli` to `plugin[]` in `~/.config/opencode/opencode.json`
- **Claude Code**: Append betterspec section to `CLAUDE.md`
- **Gemini CLI**: Append betterspec section to `GEMINI.md`
- **Cursor**: No additional config (rules file is enough)
- **Generic**: No additional config

**FR-11: Config Persistence**
The selected tool and skills mode MUST be stored in `betterspec/betterspec.json`:
```json
{
  "mode": "local",
  "tool": "opencode",
  "skills": { "mode": "local" }
}
```

### Backward Compatibility

**FR-12: No-Overwrite Rule**
If any target file already exists (skill, agent, config), it MUST NOT be overwritten.

**FR-13: Re-Init Detection**
If betterspec is already initialized, init MUST exit early with a message. No changes to existing files.

## Non-Functional Requirements

**NFR-1: Single Package**
All init functionality MUST live within `@betterspec/core` and `@betterspec/cli`. No external packages required.

**NFR-2: Extensible Adapters**
The tool adapter system MUST be designed so new tools can be added by implementing a single adapter interface, without changing the init command logic.

**NFR-3: Performance**
Init MUST complete in under 5 seconds for local-only setups (no network calls).
