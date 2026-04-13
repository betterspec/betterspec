# Glossary

Domain-specific terms used in betterspec. These have precise meanings in this codebase.

## Core Concepts

**Change**
A unit of planned work tracked in betterspec. A change has a name (kebab-case), a status, and a directory under `betterspec/changes/`. It moves through the lifecycle: proposed → planning → in-progress → validating → validated → archived. Stored on disk as a directory with `proposal.md`, `specs/`, `design.md`, `tasks.md`, `outcome.md`, and `.betterspec-meta.json`.

**Proposal**
The `proposal.md` file inside a change directory. Captures the motivation, scope (in/out of scope), and success criteria for a change. Written before any implementation begins.

**Spec**
The `specs/` subdirectory inside a change. Contains `requirements.md` (functional and non-functional requirements) and `scenarios.md` (happy path, edge cases, error cases). Defines what success looks like before design or implementation begins.

**Design**
The `design.md` file inside a change. Documents the technical approach, key decisions, files to modify, and dependencies. Written after specs, before tasks.

**Tasks**
The `tasks.md` file inside a change. A breakdown of implementation work with IDs (T1, T2, ...), categories, statuses, and dependencies. Task statuses: `pending`, `claimed`, `in-progress`, `implemented`, `validating`, `passed`, `failed`, `cancelled`.

**Outcome**
The `outcome.md` file inside a change. Written just before archiving. Captures what was actually built, capabilities extracted, lessons learned, files changed, and metrics. The source of truth for capability extraction.

**Archive**
Moving a completed change from `betterspec/changes/<name>/` to `betterspec/changes/archive/<date>-<name>/`. The change directory is preserved with all its files. `betterspec archive <name>` performs this operation.

**Capability**
A distinct piece of functionality extracted from an archived change. Stored as a JSON file in `betterspec/knowledge/capabilities/<id>.json`. Capabilities are the long-term record of what the system can do, outlasting the change that produced them.

**Knowledge Base**
The `betterspec/knowledge/` directory. Contains `architecture.md`, `patterns.md`, `glossary.md`, `capabilities/`, and `decisions/`. The persistent project memory — updated on archive, referenced during development.

**ADR** (Architecture Decision Record)
A record of a significant technical or architectural decision. Stored as JSON in `betterspec/knowledge/decisions/adr-<n>.json`. Fields: id, title, status (accepted/deprecated/superseded), date, context, decision, consequences.

## Tool Concepts

**Tool Adapter**
An implementation of the `ToolAdapter` interface for a specific AI coding tool. Controls how `betterspec init` scaffolds files for that tool. Each adapter declares `capabilities` and implements `scaffold()`. Located in `packages/core/src/adapters/`.

**Skill**
A SKILL.md file following the [agentskills.io](https://agentskills.io) specification. Must include YAML frontmatter with `name` and `description`. Contains instructions for an AI agent filling a specific role. betterspec ships 6 skills: `betterspec-workflow`, `betterspec-propose`, `betterspec-validate`, `betterspec-archive`, `betterspec-drift`, `betterspec-knowledge`.

**Agent Role**
One of four roles in the betterspec workflow: `planner`, `builder`, `validator`, `archivist`. Each has a distinct system prompt, tool access policy, and behavioral rules. Agent files are scaffolded by `betterspec init` in a format appropriate for the selected tool.

**Skills Mode**
Where skills are installed during `betterspec init`: `local` (in `skills/` inside the project), `global` (in `~/.betterspec/skills/`), or `both`.

## MCP Concepts

**MCP Server**
The `@betterspec/mcp` package. Runs as a stdio process, exposes betterspec's knowledge base to any MCP-compatible AI tool. Launched via `betterspec serve` or the `betterspec-mcp` binary.

**betterspec_digest**
An MCP tool that returns raw knowledge base content (capabilities, decisions, recent archived changes) for the connected AI to summarize. Does **not** call any LLM — it is a data dump.

**betterspec_impact**
An MCP tool (and planned CLI command) that does grep-based scanning to find which specs, capabilities, and knowledge docs reference a given file path.

## Workflow Concepts

**Drift**
When code and specs diverge. Categories: unspecced changes (code changed without a spec), stale specs (spec no longer matches implementation), missing capabilities (completed work not captured in knowledge base), outdated knowledge (architecture/patterns docs out of date).

**The Golden Rule**
The builder never validates. Validation must come from a separate agent or person with clean context — no knowledge of the build process, only the specs and the current code.

**Betterspec.json**
Config file at `betterspec/betterspec.json`. Fields: `mode` (local/cloud), `tool` (which AI tool adapter was chosen), `skills` (local/global/both), `enforcement` (flags for spec enforcement), `orchestration` (multi-agent settings).
