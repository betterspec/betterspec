# betterspec for Crush

[Crush](https://github.com/charmbracelet/crush) is a terminal AI coding agent built by Charm. It extends capabilities via MCP (Model Context Protocol).

## MCP Integration

betterspec exposes a full MCP server that you can connect to Crush.

### Prerequisites

- [Crush installed](https://github.com/charmbracelet/crush#installation)
- [betterspec MCP server built](#building-the-mcp-server)

### Building the MCP server

```bash
cd /path/to/betterspec
bun install
bun run build
```

### Connecting to Crush

#### Option 1: Project-local MCP config

Create `.crush/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "betterspec": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/betterspec/packages/mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

Replace `/path/to/betterspec` with the actual path to your betterspec clone.

#### Option 2: Global MCP config

Create `~/.config/crush/mcp.json`:

```json
{
  "mcpServers": {
    "betterspec": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/betterspec/packages/mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

### Restart Crush

After adding the MCP config, restart Crush. The betterspec MCP server will be available as a tool.

## What you get

Connected to Crush, you can use betterspec capabilities directly in the terminal:

- Search the knowledge base
- Query change status
- Access architecture docs and patterns
- Get impact analysis for files

## betterspec CLI

For the full experience, also install the betterspec CLI:

```bash
npm install -g @betterspec/cli
# or
bun install -g @betterspec/cli
```

## Updating

```bash
cd /path/to/betterspec
git pull
bun run build
```

Restart Crush to pick up the updated MCP server.

## Troubleshooting

### MCP server not connecting

1. Verify the path to `packages/mcp/dist/index.js` is correct
2. Run the MCP server manually to check for errors:
   ```bash
   node /path/to/betterspec/packages/mcp/dist/index.js
   ```
   (It should stay running and wait for stdio input)
3. Check Crush logs for MCP connection errors

### Tools not appearing

After connecting the MCP server, Crush needs to refresh its tool list. Try:
1. Restarting Crush
2. Running `/mcp` in Crush to list available MCP tools
