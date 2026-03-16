import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { resolve } from "node:path";
import { configExists } from "@betterspec/core";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";

async function findProjectRoot(): Promise<string> {
  // Walk up from cwd looking for betterspec/betterspec.json
  let dir = process.cwd();
  const { dirname } = await import("node:path");

  while (true) {
    if (await configExists(dir)) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }

  // Fallback to cwd
  return process.cwd();
}

async function main() {
  const projectRoot = await findProjectRoot();

  const server = new McpServer({
    name: "betterspec",
    version: "0.4.0",
  });

  registerTools(server, projectRoot);
  registerResources(server, projectRoot);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("betterspec MCP server failed to start:", err.message);
  process.exit(1);
});
