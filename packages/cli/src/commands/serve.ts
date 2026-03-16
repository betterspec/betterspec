/**
 * betterspec serve command
 * Start the betterspec MCP server for AI tool integration
 */

import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { configExists } from "@betterspec/core";
import { renderBox } from "../ui/banner.js";
import { colors, icons } from "../ui/theme.js";

export async function serveCommand(options?: {
  cwd?: string;
  port?: number;
}): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    console.log(
      renderBox(
        `${icons.error} betterspec is not initialized.\n` +
          `Run ${colors.primary("betterspec init")} first.`,
        "Not Initialized",
        "#EF4444"
      )
    );
    process.exit(1);
  }

  const port = options?.port ?? 3100;

  console.log(
    renderBox(
      [
        `${icons.info} Starting MCP server on port ${colors.primary(String(port))}`,
        "",
        `${colors.bold("Connect from your AI tool:")}`,
        "",
        `${colors.muted("Claude Desktop / Cursor:")}`,
        `  Add to ${colors.primary("mcp.json")}:`,
        `  ${colors.muted(`{ "command": "npx", "args": ["@betterspec/mcp", "--port", "${port}"] }`)}`,
        "",
        `${colors.muted("Direct stdio:")}`,
        `  ${colors.primary(`npx @betterspec/mcp --cwd ${projectRoot}`)}`,
      ].join("\n"),
      "betterspec MCP Server"
    )
  );

  const child = spawn("npx", ["@betterspec/mcp", "--port", String(port)], {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env },
  });

  child.on("error", (err) => {
    console.log(
      renderBox(
        `${icons.error} Failed to start MCP server.\n\n` +
          `${colors.muted("Make sure")} ${colors.primary("@betterspec/mcp")} ${colors.muted("is installed:")}\n` +
          `  ${colors.primary("npm install -g @betterspec/mcp")}\n\n` +
          `${colors.muted("Error:")} ${err.message}`,
        "Server Error",
        "#EF4444"
      )
    );
    process.exit(1);
  });

  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.log(
        colors.error(`MCP server exited with code ${code}`)
      );
      process.exit(code);
    }
  });

  // Handle graceful shutdown
  const shutdown = () => {
    child.kill("SIGTERM");
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
