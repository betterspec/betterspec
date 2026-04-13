import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";
import { scaffoldAgents } from "../agents/index.js";
import type { ToolAdapter, AgentRole } from "../types/index.js";

const GEMINI_MD_SECTION = `
## betterspec — Spec-Driven Development

This project uses **betterspec** for spec-driven development.

- Run \`betterspec status\` to see project state
- Run \`betterspec propose "idea"\` to start a new change
- Read \`betterspec/knowledge/\` for architecture, patterns, and glossary
- **Never start coding without an active spec** for non-trivial changes
- Use the betterspec skills for workflow guidance
`;

const adapter: ToolAdapter = {
  name: "gemini-cli",
  displayName: "Gemini CLI",
  capabilities: {
    agents: true,
    subagents: true,
    hooks: true,
    skills: true,
    memory: false,
  },

  async scaffold(projectRoot, config) {
    const created: string[] = [];
    const configChanges: string[] = [];
    const modelOverrides = (config.models || {}) as Partial<
      Record<AgentRole, string>
    >;
    const force = config.force === true;

    // 1. Scaffold agents to .gemini/agents/ (Gemini CLI discovers them here)
    const agentDir = join(projectRoot, ".gemini", "agents");
    const agentFiles = await scaffoldAgents(agentDir, modelOverrides, {
      force,
    });
    created.push(...agentFiles);

    // 2. Append to GEMINI.md
    const geminiMdPath = join(projectRoot, "GEMINI.md");
    let geminiMd = "";
    if (await fileExists(geminiMdPath)) {
      geminiMd = await readFile(geminiMdPath, "utf-8");
    }
    if (!geminiMd.includes("betterspec")) {
      geminiMd += GEMINI_MD_SECTION;
      await writeFile(geminiMdPath, geminiMd, "utf-8");
      created.push(geminiMdPath);
      configChanges.push("Added betterspec section to GEMINI.md");
    }

    return { filesCreated: created, configChanges };
  },
};

export default adapter;
