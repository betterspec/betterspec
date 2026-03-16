import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getProjectSummary,
  listChanges,
  listCapabilities,
  analyzeDrift,
  createChange,
} from "@betterspec/core";

export function registerTools(server: McpServer, projectRoot: string) {
  server.tool(
    "betterspec_status",
    "Get project status — active changes, capabilities count, drift score",
    {},
    async () => {
      try {
        const summary = await getProjectSummary(projectRoot);
        const changes = await listChanges(projectRoot);
        const caps = await listCapabilities(projectRoot);

        let text = `# betterspec Status\n\n`;
        text += `- Active changes: ${changes.length}\n`;
        text += `- Capabilities: ${caps.length}\n`;
        text += `- Mode: ${summary.config.mode}\n\n`;

        if (changes.length > 0) {
          text += `## Active Changes\n\n`;
          for (const c of changes) {
            text += `- **${c.name}** (${c.status})`;
            if (c.tasks.length > 0) {
              const done = c.tasks.filter((t) =>
                ["implemented", "passed"].includes(t.status)
              ).length;
              text += ` — ${done}/${c.tasks.length} tasks done`;
            }
            text += `\n`;
          }
        }

        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    "betterspec_search",
    "Search the project knowledge base for capabilities, decisions, patterns, and specs",
    { query: z.string().describe("Search query") },
    async ({ query }) => {
      try {
        const caps = await listCapabilities(projectRoot);
        const changes = await listChanges(projectRoot);

        const q = query.toLowerCase();
        const results: string[] = [];

        // Search capabilities
        for (const cap of caps) {
          if (
            cap.name.toLowerCase().includes(q) ||
            cap.description.toLowerCase().includes(q) ||
            cap.tags?.some((t) => t.toLowerCase().includes(q))
          ) {
            results.push(`**Capability: ${cap.name}**\n${cap.description}\nFiles: ${cap.files.join(", ")}`);
          }
        }

        // Search changes
        for (const change of changes) {
          if (
            change.name.toLowerCase().includes(q) ||
            change.proposal?.toLowerCase().includes(q)
          ) {
            results.push(`**Change: ${change.name}** (${change.status})\n${change.proposal?.slice(0, 200) ?? "No proposal"}`);
          }
        }

        const text = results.length > 0
          ? `# Search Results for "${query}"\n\n${results.join("\n\n---\n\n")}`
          : `No results found for "${query}"`;

        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    "betterspec_impact",
    "Show what specs, capabilities, and patterns reference a file or directory",
    { path: z.string().describe("File or directory path to analyze") },
    async ({ path }) => {
      try {
        const caps = await listCapabilities(projectRoot);
        const changes = await listChanges(projectRoot);

        const matching = caps.filter((c) =>
          c.files.some((f) => f.includes(path))
        );

        let text = `# Impact Analysis: ${path}\n\n`;
        text += `## Capabilities Referencing This Path\n\n`;
        if (matching.length > 0) {
          for (const cap of matching) {
            text += `- **${cap.name}**: ${cap.description}\n`;
          }
        } else {
          text += `None found.\n`;
        }

        text += `\n## Active Changes\n\n`;
        // Check if any active change's design mentions this path
        const relevantChanges = changes.filter((c) =>
          c.proposal?.includes(path)
        );
        if (relevantChanges.length > 0) {
          for (const c of relevantChanges) {
            text += `- **${c.name}** (${c.status})\n`;
          }
        } else {
          text += `No active changes reference this path.\n`;
        }

        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    "betterspec_propose",
    "Create a new betterspec change proposal",
    {
      idea: z.string().describe("Brief description of the proposed change"),
    },
    async ({ idea }) => {
      try {
        const change = await createChange(projectRoot, idea);
        return {
          content: [{
            type: "text" as const,
            text: `Created change: ${change.name}\nPath: ${change.path}\n\nNext: fill in proposal.md with motivation, scope, and success criteria.`,
          }],
        };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  server.tool(
    "betterspec_digest",
    "Get a summary of project knowledge — capabilities, recent changes, architecture overview",
    {},
    async () => {
      try {
        const caps = await listCapabilities(projectRoot);
        const changes = await listChanges(projectRoot);
        const summary = await getProjectSummary(projectRoot);

        let text = `# betterspec Knowledge Digest\n\n`;
        text += `## Project Configuration\n- Mode: ${summary.config.mode}\n`;
        if (summary.config.tool) text += `- Tool: ${summary.config.tool}\n`;
        text += `\n`;

        text += `## Active Changes (${changes.length})\n\n`;
        for (const c of changes) {
          text += `- **${c.name}** (${c.status})\n`;
        }

        text += `\n## Capabilities (${caps.length})\n\n`;
        for (const cap of caps) {
          text += `- **${cap.name}**: ${cap.description}\n`;
        }

        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );
}
