# Redesign `betterspec init` as the Universal Setup Entry Point

## Motivation

Today, setting up betterspec for a real workflow requires multiple disconnected steps:

1. `betterspec init` — scaffolds the spec directory and a single generic skill
2. `bunx @betterspec/opencode` — a separate package/repo that installs the OpenCode plugin, agents, model selection, and hooks

This creates several problems:
- The value of betterspec is locked behind a separate OpenCode-specific package
- Supporting new tools (Cursor, Claude Code, Codex, Gemini CLI) means creating new repos for each
- Users need to know about multiple packages and run multiple commands
- The skills scaffolded during init don't follow the agentskills.io specification
- There's no way to choose where skills live (local vs global)

## Scope

Make `betterspec init` the **single command** that sets up everything a user needs, regardless of which AI coding tool they use.

### In Scope
- Redesign the init flow with interactive prompts for: spec mode, tool selection, skills location
- Build a tool adapter system so init can scaffold the right files for OpenCode, Cursor, Claude Code, Codex, or generic setups
- Move agent definitions, hooks, and tool-specific config into `@betterspec/core` and `@betterspec/cli`
- Update all skills to comply with the agentskills.io specification (YAML frontmatter)
- Support local, global, or both for skills installation
- Deprecate `@betterspec/opencode` as a separate package

### Out of Scope
- Runtime plugin hooks for OpenCode (system prompt injection, unspecced edit warnings) — these stay as a thin plugin wrapper that imports from `@betterspec/core`, addressed in a follow-up change
- Building adapters for every tool on day one — start with OpenCode + generic, add others incrementally

## Success Criteria
1. A single `betterspec init` command sets up specs, skills, and agents for the user's chosen tool
2. No separate `bunx @betterspec/opencode` step needed for OpenCode users
3. All SKILL.md files pass `skills-ref validate`
4. The init flow works non-interactively with sensible defaults
5. `@betterspec/opencode` can be deprecated with a message pointing to `betterspec init`
