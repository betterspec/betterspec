import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";
import { scaffoldAgents } from "../agents/index.js";
import type { ToolAdapter, AgentRole } from "../types/index.js";

const OPENCODE_PLUGIN_CONTENT = `// betterspec plugin for OpenCode
// Provides spec context injection and unspecced edit warnings
import type { Plugin } from "@opencode-ai/plugin";

export const BetterspecPlugin: Plugin = async ({ $, directory }) => {
  return {
    // Inject spec context into every LLM call
    "experimental.chat.system.transform": async (input, output) => {
      try {
        const status = await $\`betterspec status --json 2>/dev/null\`.text();
        if (status.trim()) {
          const parsed = JSON.parse(status);
          let context = "\\n\\n## betterspec Context\\n";
          if (parsed.changes?.length > 0) {
            context += "Active changes:\\n";
            for (const c of parsed.changes) {
              context += \`- \${c.name} (\${c.status})\`;
              if (c.tasks?.length > 0) {
                const done = c.tasks.filter((t: any) => ["implemented", "passed"].includes(t.status)).length;
                context += \` — \${done}/\${c.tasks.length} tasks done\`;
              }
              context += "\\n";
            }
          }
          if (parsed.config?.enforcement?.requireSpecForChanges) {
            context += "\\n**Rule:** Do NOT start coding without an active spec. Run \\\`betterspec propose\\\` first.\\n";
          }
          output.system = (output.system || "") + context;
        }
      } catch {
        // betterspec not initialized or command failed, skip silently
      }
    },

    // Warn on unspecced file edits
    "tool.execute.after": async (input, output) => {
      if (!["edit", "write"].includes(input.tool)) return;
      try {
        const filePath = output.args?.filePath || output.args?.path;
        if (!filePath) return;

        const result = await $\`betterspec diff --check-file \${filePath} 2>/dev/null\`.text();
        if (result.includes("unspecced")) {
          output.metadata = output.metadata || {};
          output.metadata.warning = \`⚠ \${filePath} is not referenced in any active spec's design.md. Consider running \\\`betterspec propose\\\` to create a spec for this change.\`;
        }
      } catch {
        // Skip silently
      }
    },
  };
};
`;

const adapter: ToolAdapter = {
  name: "opencode",
  displayName: "OpenCode",
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
    const modelOverrides = (config.models || {}) as Partial<Record<AgentRole, string>>;

    // 1. Scaffold agents
    const agentDir = join(projectRoot, ".opencode", "agents");
    const agentFiles = await scaffoldAgents(agentDir, modelOverrides);
    created.push(...agentFiles);

    // 2. Write inline plugin
    const pluginDir = join(projectRoot, ".opencode", "plugins");
    const pluginPath = join(pluginDir, "betterspec.ts");
    if (!(await fileExists(pluginPath))) {
      await mkdir(pluginDir, { recursive: true });
      await writeFile(pluginPath, OPENCODE_PLUGIN_CONTENT, "utf-8");
      created.push(pluginPath);
    }

    // 3. Note about plugin loading (local plugins are auto-loaded from .opencode/plugins/)
    configChanges.push("OpenCode will auto-load the betterspec plugin from .opencode/plugins/");

    return { filesCreated: created, configChanges };
  },
};

export default adapter;
