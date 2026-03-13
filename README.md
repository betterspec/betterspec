# betterspec

**Better specs, better code.**

A provider-agnostic CLI and spec engine for spec-driven development. betterspec manages the full lifecycle of specifications — from proposal through implementation to knowledge extraction — keeping your documentation alive and your AI agents informed.

## Why betterspec?

AI writes code fast. But knowledge becomes tribal — specs drift, architecture docs go stale, patterns get forgotten. betterspec solves this by enforcing a **living specification workflow** and building a **persistent knowledge base** that grows with your project.

- **No AI dependency** — betterspec is a pure spec management tool. It doesn't call any LLM APIs.
- **Provider-agnostic** — works with any AI tool, IDE, or CI system.
- **Structured workflow** — propose → clarify → design → build → validate → archive.
- **Knowledge extraction** — archived changes become capabilities in your project's knowledge base.
- **Drift detection** — identifies when specs and implementation diverge.

## Install

```bash
# npm
npm install -g @betterspec/cli

# bun
bun add -g @betterspec/cli
```

## Quick Start

```bash
# Initialize betterspec in your project
betterspec init

# Create a change proposal
betterspec propose "Add user authentication"

# Check spec completeness
betterspec clarify add-user-authentication

# View project status
betterspec status

# Verify specs are filled in
betterspec verify

# Archive a completed change
betterspec archive add-user-authentication

# View knowledge base
betterspec capabilities
```

## Commands

| Command | Description |
|---------|-------------|
| `betterspec init` | Initialize betterspec in the current project |
| `betterspec propose [idea]` | Create a new change proposal |
| `betterspec clarify <change>` | Review and refine requirements |
| `betterspec status` | Show project status dashboard |
| `betterspec list` | List all changes |
| `betterspec verify [change]` | Structural spec completeness check |
| `betterspec archive <change>` | Archive completed change + extract capabilities |
| `betterspec sync` | Sync with global spec repository |
| `betterspec doctor` | Health check and diagnostics |
| `betterspec capabilities` | List registered capabilities |
| `betterspec config [key] [value]` | Get or set configuration |
| `betterspec diff [change]` | Show spec-to-implementation drift |

The `bspec` alias is also available for all commands.

## Project Structure

After `betterspec init`, your project gets a `betterspec/` directory:

```
betterspec/
  betterspec.json              # Configuration
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

Configure during `betterspec init`:

- **Local** — Specs live in this repo only.
- **Local + Global** — Local specs plus a shared company spec repository.
- **Global** — Reference a shared spec repo (filesystem path or GitHub URL).

## Packages

| Package | Description |
|---------|-------------|
| [`@betterspec/core`](./packages/core) | Spec engine library — parsing, validation, drift detection, knowledge management |
| [`@betterspec/cli`](./packages/cli) | CLI tool with beautiful terminal UI |

## For AI Agents

betterspec ships with **generic agent skills** in the `skills/` directory. These are provider-agnostic markdown instructions that can be loaded into any AI tool:

- `betterspec-workflow` — The full spec-driven workflow
- `betterspec-validate` — How to validate implementation against specs
- `betterspec-drift` — Drift detection methodology
- `betterspec-propose` — How to write good proposals
- `betterspec-knowledge` — Knowledge base management
- `betterspec-archive` — Archive process and capability extraction

### OpenCode Integration

For [OpenCode](https://opencode.ai) users, the companion plugin [`opencode-betterspec`](https://github.com/betterspec/opencode-betterspec) provides multi-agent orchestration with dedicated builder, validator, planner, and archivist agents.

## Development

```bash
# Clone
git clone https://github.com/betterspec/betterspec.git
cd betterspec

# Install
bun install

# Build
bun run build

# Run CLI locally
bun packages/cli/dist/index.js status
```

## License

MIT
