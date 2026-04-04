/**
 * betterspec serve command — INK version
 * Start the betterspec MCP server for AI tool integration
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { configExists } from "@betterspec/core";
import {
  Box as BetterspecBox,
  colors,
} from "../ui/ink/index.js";

const ServerInfo: React.FC<{ port: number; projectRoot: string }> = ({
  port,
  projectRoot,
}) => (
  <InkBox flexDirection="column">
    <Text>
      Starting MCP server on port{" "}
      <Text hex={colors.primary}>{port}</Text>
    </Text>
    <InkBox paddingTop={1} flexDirection="column">
      <Text bold>Connect from your AI tool:</Text>
      <InkBox flexDirection="column" paddingTop={0}>
        <Text dimColor>Claude Desktop / Cursor:</Text>
        <Text>
          {"  "}Add to <Text hex={colors.primary}>mcp.json</Text>:
        </Text>
        <Text dimColor>
          {`  { "command": "npx", "args": ["@betterspec/mcp", "--port", "${port}"] }`}
        </Text>
      </InkBox>
      <InkBox flexDirection="column" paddingTop={1}>
        <Text dimColor>Direct stdio:</Text>
        <Text>
          {"  "}
          <Text hex={colors.primary}>npx @betterspec/mcp --cwd {projectRoot}</Text>
        </Text>
      </InkBox>
    </InkBox>
  </InkBox>
);

export async function serveCommand(options?: {
  cwd?: string;
  port?: number;
}): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    render(
      <BetterspecBox title="Not Initialized" borderColor="error">
        <Text>betterspec is not initialized.</Text>
        <Text dimColor> Run </Text>
        <Text hex={colors.primary}>betterspec init</Text>
        <Text dimColor> first.</Text>
      </BetterspecBox>
    );
    process.exit(1);
  }

  const port = options?.port ?? 3100;

  render(
    <BetterspecBox title="betterspec MCP Server" borderColor="success">
      <ServerInfo port={port} projectRoot={projectRoot} />
    </BetterspecBox>
  );

  const child = spawn("npx", ["@betterspec/mcp", "--port", String(port)], {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env },
  });

  child.on("error", (err) => {
    render(
      <BetterspecBox title="Server Error" borderColor="error">
        <Text hex={colors.error}>Failed to start MCP server.</Text>
        <Text dimColor>
          Make sure <Text hex={colors.primary}>@betterspec/mcp</Text> is installed:
        </Text>
        <Text>
          {"  "}
          <Text hex={colors.primary}>npm install -g @betterspec/mcp</Text>
        </Text>
        <Text dimColor>Error: {err.message}</Text>
      </BetterspecBox>
    );
    process.exit(1);
  });

  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      process.exit(code ?? 1);
    }
  });

  const shutdown = () => {
    child.kill("SIGTERM");
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
