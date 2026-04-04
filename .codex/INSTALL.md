# Installing betterspec for Codex

Enable betterspec skills in OpenAI Codex via native skill discovery. Just clone and symlink.

## Prerequisites

- Git

## Installation

1. **Clone the betterspec repository:**
   ```bash
   git clone https://github.com/betterspec/betterspec.git ~/.codex/betterspec
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/betterspec/skills ~/.agents/skills/betterspec
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\betterspec" "$env:USERPROFILE\.codex\betterspec\skills"
   ```

3. **Restart Codex** (quit and relaunch the CLI) to discover the skills.

## Verify

```bash
ls -la ~/.agents/skills/betterspec
```

You should see a symlink (or junction on Windows) pointing to the betterspec skills directory.

## Updating

```bash
cd ~/.codex/betterspec && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.agents/skills/betterspec
```

Optionally delete the clone: `rm -rf ~/.codex/betterspec`.

## What you get

Once installed, Codex automatically discovers these betterspec skills:

- **betterspec-workflow** — Core spec-driven development workflow
- **betterspec-propose** — How to write good change proposals
- **betterspec-clarify** — Requirements and scenario definition
- **betterspec-validate** — Verification against specs
- **betterspec-archive** — Archiving changes and extracting capabilities
- **betterspec-drift** — Detecting spec drift
- **betterspec-knowledge** — Managing the project knowledge base

## betterspec CLI

The skills handle workflow awareness. For the full betterspec CLI experience, install it:

```bash
npm install -g @betterspec/cli
# or
bun install -g @betterspec/cli
```

Then run `betterspec status` to see the current project state.
