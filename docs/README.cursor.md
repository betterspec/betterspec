# betterspec for Cursor

## Marketplace Install (Recommended)

In Cursor Agent chat, install from marketplace:

```
/add-plugin betterspec
```

Or search for "betterspec" in the Cursor plugin marketplace.

## Manual Install

If you prefer manual installation or betterspec isn't yet in the Cursor marketplace:

### Step 1: Clone the repo

```bash
git clone https://github.com/betterspec/betterspec.git ~/cursor-betterspec
```

### Step 2: Register skills

Add to your Cursor settings (`~/.cursor/settings.json` or project `.cursor/settings.json`):

```json
{
  "agent": {
    "skills": {
      "paths": ["~/cursor-betterspec/skills"]
    }
  }
}
```

### Step 3: Restart Cursor

Skills are discovered on startup.

## betterspec CLI

For the full CLI experience:

```bash
npm install -g @betterspec/cli
# or
bun install -g @betterspec/cli
```

## What you get

Once installed, Cursor automatically activates betterspec skills when relevant:

- **betterspec-workflow** — Core spec-driven development workflow
- **betterspec-propose** — Writing change proposals
- **betterspec-clarify** — Requirements and scenario definition
- **betterspec-validate** — Verification against specs
- **betterspec-archive** — Archiving changes and extracting capabilities
- **betterspec-drift** — Detecting spec drift
- **betterspec-knowledge** — Managing the project knowledge base

## Updating

```bash
cd ~/cursor-betterspec && git pull
```

## Uninstalling

1. Remove the skills path from your Cursor settings
2. Optionally delete the clone: `rm -rf ~/cursor-betterspec`
