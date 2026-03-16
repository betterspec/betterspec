import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  getbetterspecDir,
  fileExists,
  listCapabilities,
  listDecisions,
  listChanges,
} from "@betterspec/core";

async function readKnowledgeFile(projectRoot: string, filename: string): Promise<string> {
  const filePath = join(getbetterspecDir(projectRoot), "knowledge", filename);
  if (!(await fileExists(filePath))) return `(${filename} not yet created)`;
  return readFile(filePath, "utf-8");
}

export function registerResources(server: McpServer, projectRoot: string) {
  server.resource(
    "betterspec://knowledge/architecture",
    "betterspec://knowledge/architecture",
    { description: "Project architecture documentation", mimeType: "text/markdown" },
    async () => ({
      contents: [{
        uri: "betterspec://knowledge/architecture",
        text: await readKnowledgeFile(projectRoot, "architecture.md"),
        mimeType: "text/markdown",
      }],
    })
  );

  server.resource(
    "betterspec://knowledge/patterns",
    "betterspec://knowledge/patterns",
    { description: "Established code patterns and conventions", mimeType: "text/markdown" },
    async () => ({
      contents: [{
        uri: "betterspec://knowledge/patterns",
        text: await readKnowledgeFile(projectRoot, "patterns.md"),
        mimeType: "text/markdown",
      }],
    })
  );

  server.resource(
    "betterspec://knowledge/glossary",
    "betterspec://knowledge/glossary",
    { description: "Domain-specific terminology", mimeType: "text/markdown" },
    async () => ({
      contents: [{
        uri: "betterspec://knowledge/glossary",
        text: await readKnowledgeFile(projectRoot, "glossary.md"),
        mimeType: "text/markdown",
      }],
    })
  );

  server.resource(
    "betterspec://capabilities",
    "betterspec://capabilities",
    { description: "All registered project capabilities", mimeType: "application/json" },
    async () => {
      const caps = await listCapabilities(projectRoot);
      return {
        contents: [{
          uri: "betterspec://capabilities",
          text: JSON.stringify(caps, null, 2),
          mimeType: "application/json",
        }],
      };
    }
  );

  server.resource(
    "betterspec://decisions",
    "betterspec://decisions",
    { description: "Architecture decision records", mimeType: "application/json" },
    async () => {
      const decisions = await listDecisions(projectRoot);
      return {
        contents: [{
          uri: "betterspec://decisions",
          text: JSON.stringify(decisions, null, 2),
          mimeType: "application/json",
        }],
      };
    }
  );

  server.resource(
    "betterspec://changes/active",
    "betterspec://changes/active",
    { description: "Currently active change specifications", mimeType: "application/json" },
    async () => {
      const changes = await listChanges(projectRoot);
      return {
        contents: [{
          uri: "betterspec://changes/active",
          text: JSON.stringify(changes.map((c) => ({
            name: c.name,
            status: c.status,
            tasks: c.tasks.length,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })), null, 2),
          mimeType: "application/json",
        }],
      };
    }
  );
}
