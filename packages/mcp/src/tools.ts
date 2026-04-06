import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getProjectSummary,
  listChanges,
  listCapabilities,
  analyzeDrift,
  createChange,
  readChange,
  readChangeFile,
  archiveChange,
  updateChangeStatus,
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

  // betterspec_list — list changes with optional filters
  server.tool(
    "betterspec_list",
    "List betterspec changes. Optionally filter by status or include archived changes.",
    {
      status: z.string().optional().describe("Filter by status: proposed, planning, in-progress, validating, validated, archiving, archived"),
      archived: z.boolean().optional().describe("Include archived changes (default: false)"),
    },
    async ({ status, archived }) => {
      try {
        let changes = await listChanges(projectRoot, archived ?? false);
        if (status) {
          changes = changes.filter((c) => c.status === status);
        }
        let text = `# Changes (${changes.length})\n\n`;
        for (const c of changes) {
          text += `## ${c.name}\n`;
          text += `- Status: ${c.status}\n`;
          text += `- Created: ${c.createdAt.slice(0, 10)}\n`;
          text += `- Updated: ${c.updatedAt.slice(0, 10)}\n`;
          if (c.tasks.length > 0) {
            const done = c.tasks.filter((t) => ["implemented", "passed"].includes(t.status)).length;
            text += `- Tasks: ${done}/${c.tasks.length} done\n`;
          }
          text += `\n`;
        }
        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  // betterspec_show — return all spec files for a change in one call
  server.tool(
    "betterspec_show",
    "Return all spec files for a change: proposal, requirements, scenarios, design, tasks",
    { change: z.string().describe("Change name") },
    async ({ change }) => {
      try {
        const metadata = await readChange(projectRoot, change);
        const specFiles = [
          { label: "Proposal", path: "proposal.md" },
          { label: "Requirements", path: "specs/requirements.md" },
          { label: "Scenarios", path: "specs/scenarios.md" },
          { label: "Design", path: "design.md" },
          { label: "Tasks", path: "tasks.md" },
        ];
        let text = `# Change: ${change} (${metadata.status})\n\n`;
        for (const s of specFiles) {
          text += `## ${s.label}\n\n`;
          try {
            const content = await readChangeFile(projectRoot, change, s.path);
            text += content.trim() + "\n\n";
          } catch {
            text += `*(not yet written)*\n\n`;
          }
        }
        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  // betterspec_verify — structural completeness check
  server.tool(
    "betterspec_verify",
    "Run structural completeness checks on a change's spec files",
    { change: z.string().describe("Change name to verify") },
    async ({ change }) => {
      try {
        const specFiles = [
          { name: "Proposal", path: "proposal.md" },
          { name: "Requirements", path: "specs/requirements.md" },
          { name: "Scenarios", path: "specs/scenarios.md" },
          { name: "Design", path: "design.md" },
          { name: "Tasks", path: "tasks.md" },
        ];
        const results: Array<{ name: string; passed: boolean; message: string }> = [];
        for (const s of specFiles) {
          try {
            const content = await readChangeFile(projectRoot, change, s.path);
            const stripped = content.replace(/<!--.*?-->/gs, "").trim();
            if (stripped.length < 50) {
              results.push({ name: s.name, passed: false, message: `Too short — has minimal content (${stripped.length} chars after stripping comments)` });
            } else {
              results.push({ name: s.name, passed: true, message: `OK (${stripped.length} chars)` });
            }
          } catch {
            results.push({ name: s.name, passed: false, message: "File missing" });
          }
        }
        const passed = results.filter((r) => r.passed).length;
        let text = `# Verify: ${change}\n\n`;
        text += `Score: ${passed}/${results.length} checks passed\n\n`;
        for (const r of results) {
          text += `${r.passed ? "✓" : "✗"} **${r.name}**: ${r.message}\n`;
        }
        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  // betterspec_diff — run analyzeDrift and return the drift report
  server.tool(
    "betterspec_diff",
    "Run drift analysis and return a report of spec/implementation gaps",
    {},
    async () => {
      try {
        const report = await analyzeDrift(projectRoot);
        let text = `# Drift Report\n\n`;
        text += `Score: ${report.score}/100\n`;
        text += `Timestamp: ${report.timestamp}\n\n`;
        const critical = report.items.filter((i) => i.severity === "critical");
        const warnings = report.items.filter((i) => i.severity === "warning");
        const info = report.items.filter((i) => i.severity === "info");
        if (critical.length > 0) {
          text += `## Critical (${critical.length})\n`;
          for (const i of critical) text += `- ${i.message}\n`;
          text += `\n`;
        }
        if (warnings.length > 0) {
          text += `## Warnings (${warnings.length})\n`;
          for (const i of warnings) text += `- ${i.message}\n`;
          text += `\n`;
        }
        if (info.length > 0) {
          text += `## Info (${info.length})\n`;
          for (const i of info) text += `- ${i.message}\n`;
        }
        if (report.items.length === 0) text += `No drift detected. ✓\n`;
        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  // betterspec_archive — archive a completed change
  server.tool(
    "betterspec_archive",
    "Archive a completed change. Optionally provide an outcome summary.",
    {
      change: z.string().describe("Change name to archive"),
      outcome: z.string().optional().describe("Outcome summary — what was built, what was learned"),
    },
    async ({ change, outcome }) => {
      try {
        if (outcome) {
          const { writeOutcome } = await import("@betterspec/core");
          await writeOutcome(projectRoot, change, outcome);
        }
        const archivePath = await archiveChange(projectRoot, change);
        const text = `✓ Archived: ${change}\nPath: ${archivePath}\n${
          outcome ? `\nOutcome recorded.` : `\nNo outcome provided — consider adding one for knowledge capture.`
        }`;
        return { content: [{ type: "text" as const, text }] };
      } catch (err: any) {
        return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
      }
    }
  );
}
