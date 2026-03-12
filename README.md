# forgelore

**Forge knowledge, shape code.**

A provider-agnostic CLI and spec engine for spec-driven development. Forgelore manages the full lifecycle of specifications — from proposal through implementation to knowledge extraction — keeping your documentation alive and your AI agents informed.

## Why forgelore?

AI writes code fast. But knowledge becomes tribal — specs drift, architecture docs go stale, patterns get forgotten. Forgelore solves this by enforcing a **living specification workflow** and building a **persistent knowledge base** that grows with your project.

- **No AI dependency** — forgelore is a pure spec management tool. It doesn't call any LLM APIs.
- **Provider-agnostic** — works with any AI tool, IDE, or CI system.
- **Structured workflow** — propose → clarify → design → build → validate → archive.
- **Knowledge extraction** — archived changes become capabilities in your project's knowledge base.
- **Drift detection** — identifies when specs and implementation diverge.

## Install

```bash
# npm
npm install -g @forgelore/cli

# bun
bun add -g @forgelore/cli
```

## Quick Start

```bash
# Initialize forgelore in your project
forgelore init

# Create a change proposal
forgelore propose "Add user authentication"

# Check spec completeness
forgelore clarify add-user-authentication

# View project status
forgelore status

# Verify specs are filled in
forgelore verify

# Archive a completed change
forgelore archive add-user-authentication

# View knowledge base
forgelore capabilities
```

## Commands

| Command | Description |
|---------|-------------|
| `forgelore init` | Initialize forgelore in the current project |
| `forgelore propose [idea]` | Create a new change proposal |
| `forgelore clarify <change>` | Review and refine requirements |
| `forgelore status` | Show project status dashboard |
| `forgelore list` | List all changes |
| `forgelore verify [change]` | Structural spec completeness check |
| `forgelore archive <change>` | Archive completed change + extract capabilities |
| `forgelore sync` | Sync with global spec repository |
| `forgelore doctor` | Health check and diagnostics |
| `forgelore capabilities` | List registered capabilities |
| `forgelore config [key] [value]` | Get or set configuration |
| `forgelore diff [change]` | Show spec-to-implementation drift |

The `forge` alias is also available for all commands.

## Project Structure

After `forgelore init`, your project gets a `forgelore/` directory:

```
forgelore/
  forgelore.json              # Configuration
  changes/                    # Active change specs
    <name>/
      proposal.md             # What and why
      specs/
        requirements.md       # Functional + non-functional requirements
        scenarios.md          # Happy path, edge cases, error cases
      design.md               # Technical approach
      tasks.md                # Implementation breakdown
      outcome.md              # Created before archiving
    archive/                  # Completed changes
  knowledge/
    architecture.md           # Living architecture documentation
    patterns.md               # Established code patterns
    glossary.md               # Domain terminology
    capabilities/             # Extracted capabilities (.json)
    decisions/                # Architecture Decision Records (.json)
```

## Spec Modes

Configure during `forgelore init`:

- **Local** — Specs live in this repo only.
- **Local + Global** — Local specs plus a shared company spec repository.
- **Global** — Reference a shared spec repo (filesystem path or GitHub URL).

## Packages

| Package | Description |
|---------|-------------|
| [`@forgelore/core`](./packages/core) | Spec engine library — parsing, validation, drift detection, knowledge management |
| [`@forgelore/cli`](./packages/cli) | CLI tool with beautiful terminal UI |

## For AI Agents

Forgelore ships with **generic agent skills** in the `skills/` directory. These are provider-agnostic markdown instructions that can be loaded into any AI tool:

- `forgelore-workflow` — The full spec-driven workflow
- `forgelore-validate` — How to validate implementation against specs
- `forgelore-drift` — Drift detection methodology
- `forgelore-propose` — How to write good proposals
- `forgelore-knowledge` — Knowledge base management
- `forgelore-archive` — Archive process and capability extraction

### OpenCode Integration

For [OpenCode](https://opencode.ai) users, the companion plugin [`opencode-forgelore`](https://github.com/DxVapor/opencode-forgelore) provides multi-agent orchestration with dedicated builder, validator, planner, and archivist agents.

## Development

```bash
# Clone
git clone https://github.com/DxVapor/forgelore.git
cd forgelore

# Install
bun install

# Build
bun run build

# Run CLI locally
bun packages/cli/dist/index.js status
```

## License

MIT
