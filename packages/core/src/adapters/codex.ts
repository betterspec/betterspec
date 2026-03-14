import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";
import type { ToolAdapter } from "../types/index.js";

const CODEX_SECTION = `
## betterspec — Spec-Driven Development

This project uses **betterspec** for spec-driven development.

### Before Starting Work
- Run \`betterspec status\` to see project state
- Read \`betterspec/knowledge/architecture.md\` for system architecture
- Read \`betterspec/knowledge/patterns.md\` for established patterns

### Workflow
1. \`betterspec propose "idea"\` — create a change proposal
2. Fill in requirements, scenarios, design, tasks
3. Build tasks, updating status as you go
4. Archive when complete: \`betterspec archive <name>\`

### Rules
- Do not start coding without a spec for non-trivial changes
- Follow patterns from the knowledge base
- Update task status as you work
- Knowledge compounds — archive changes to capture capabilities
`;

const adapter: ToolAdapter = {
  name: "codex",
  displayName: "Codex",
  capabilities: { agents: true, subagents: true, hooks: false, skills: true, memory: false },

  async scaffold(projectRoot) {
    const created: string[] = [];
    const configChanges: string[] = [];
    const agentsPath = join(projectRoot, "AGENTS.md");

    let content = "";
    if (await fileExists(agentsPath)) {
      content = await readFile(agentsPath, "utf-8");
    }

    if (!content.includes("betterspec")) {
      content += CODEX_SECTION;
      await writeFile(agentsPath, content, "utf-8");
      created.push(agentsPath);
      configChanges.push("Added betterspec section to AGENTS.md");
    }

    return { filesCreated: created, configChanges };
  },
};

export default adapter;
