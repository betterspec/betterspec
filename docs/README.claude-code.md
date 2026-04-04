# betterspec for Claude Code

## Marketplace Install (Recommended)

betterspec is available via the official Claude plugin marketplace once published.

Install the plugin from Claude marketplace:

```
/plugin install betterspec@claude-plugins-official
```

In Claude Code, register the marketplace first:

```
/plugin marketplace add betterspec/betterspec-marketplace
```

Then install the plugin:

```
/plugin install betterspec@betterspec-marketplace
```

## Manual Install via Skills

Until betterspec is published to the official marketplace, you can install it manually:

### Step 1: Clone the repo

```bash
git clone https://github.com/betterspec/betterspec.git ~/.claude-code/betterspec
```

### Step 2: Register skills directory

Add to your Claude Code config (`~/.claude.desktop/settings.json` or project `.claude.desktop/settings.json`):

```json
{
  "skills": {
    "directories": ["~/.claude-code/betterspec/skills"]
  }
}
```

### Step 3: Restart Claude Code

Skills are discovered on startup. After restarting, ask Claude Code: "What is betterspec?"

## betterspec CLI

Install the CLI for the full experience:

```bash
npm install -g @betterspec/cli
# or
bun install -g @betterspec/cli
```

## What you get

Once installed, Claude Code automatically loads betterspec skills when relevant:

- **betterspec-workflow** — Auto-triggered before writing code. Enforces spec-first workflow.
- **betterspec-propose** — Activated when creating new features or changes
- **betterspec-validate** — Activated during verification phase
- **betterspec-archive** — Activated when completing and archiving changes
- **betterspec-drift** — Activated when files change unexpectedly
- **betterspec-knowledge** — Activated when querying project knowledge

## Updating

```bash
cd ~/.claude-code/betterspec && git pull
```

## Uninstalling

1. Remove the skills directory from your Claude Code settings
2. Optionally delete the clone: `rm -rf ~/.claude-code/betterspec`
