# Installing betterspec for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed

## Installation

Add betterspec to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": ["betterspec@git+https://github.com/betterspec/betterspec.git"]
}
```

Restart OpenCode. That's it — the plugin auto-installs and registers all skills.

Verify by asking OpenCode: "What is betterspec?" or "Run betterspec status"

## What you get

Once installed, the plugin automatically:

1. **Registers betterspec skills** — All skills in the betterspec repo are discovered by OpenCode
2. **Injects workflow bootstrap** — The betterspec spec-driven workflow is loaded into every session
3. **Makes betterspec commands available** — `betterspec propose`, `betterspec clarify`, `betterspec status`, etc.

## Available skills

- **betterspec-workflow** — Core spec-driven development workflow (auto-loaded)
- **betterspec-propose** — How to write good change proposals
- **betterspec-clarify** — Requirements and scenario definition
- **betterspec-validate** — Verification against specs
- **betterspec-archive** — Archiving changes and extracting capabilities
- **betterspec-drift** — Detecting spec drift
- **betterspec-knowledge** — Managing the project knowledge base

## Updating

betterspec updates automatically when you restart OpenCode.

To pin a specific version:

```json
{
  "plugin": ["betterspec@git+https://github.com/betterspec/betterspec.git#v0.3.2"]
}
```

## Uninstalling

Remove the plugin line from your `opencode.json` and restart OpenCode.

## Troubleshooting

### Plugin not loading

1. Check logs: `opencode run --print-logs "hello" 2>&1 | grep -i betterspec`
2. Verify the plugin line in your `opencode.json`
3. Make sure you're running a recent version of OpenCode

### Skills not found

1. Use OpenCode's `skill` tool to list what's discovered
2. Check that the plugin is loading (see above)

### betterspec commands not found

Run `betterspec --version` in your terminal to verify betterspec CLI is installed:

```bash
npm install -g @betterspec/cli
# or
bun install -g @betterspec/cli
```
