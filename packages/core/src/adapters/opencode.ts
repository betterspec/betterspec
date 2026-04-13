import { join } from "node:path";
import { scaffoldAgents } from "../agents/index.js";
import type { ToolAdapter, AgentRole } from "../types/index.js";

/**
 * OpenCode adapter for betterspec
 *
 * The betterspec global plugin (`.opencode/plugins/betterspec.js` at the repo root)
 * is the primary integration point for OpenCode users — it auto-installs via opencode.json.
 *
 * This adapter handles `betterspec init` scaffolding: agents, knowledge base, and
 * directs users to add the global plugin to their opencode.json.
 */

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
    const modelOverrides = (config.models || {}) as Partial<
      Record<AgentRole, string>
    >;
    const force = config.force === true;

    // Scaffold agent definitions (planner, builder, validator, archivist)
    const agentDir = join(projectRoot, ".opencode", "agents");
    const agentFiles = await scaffoldAgents(agentDir, modelOverrides, {
      force,
    });
    created.push(...agentFiles);

    // Direct users to install the global plugin via opencode.json.
    // The global plugin (betterspec.js at repo root) auto-discovers skills
    // and provides system prompt injection.
    configChanges.push(
      'Add betterspec to opencode.json: plugin: ["betterspec@git+https://github.com/betterspec/betterspec.git"]',
    );
    configChanges.push("See .opencode/INSTALL.md for full setup instructions");

    return { filesCreated: created, configChanges };
  },
};

export default adapter;
