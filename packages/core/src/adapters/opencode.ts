import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { scaffoldAgents } from "../agents/index.js";
import { fileExists } from "../config/index.js";
import type { ToolAdapter, AgentRole } from "../types/index.js";
import { OPENCODE_COMMANDS } from "./opencode-commands.js";

/**
 * OpenCode adapter for betterspec
 *
 * The betterspec global plugin (`.opencode/plugins/betterspec.js` at the repo root)
 * is the primary integration point for OpenCode users — it auto-installs via opencode.json.
 *
 * This adapter handles `betterspec init` scaffolding: agents, commands, and
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

    // Scaffold slash commands
    const commandDir = join(projectRoot, ".opencode", "commands");
    await mkdir(commandDir, { recursive: true });
    for (const cmd of OPENCODE_COMMANDS) {
      const filePath = join(commandDir, `${cmd.name}.md`);
      if (!force && (await fileExists(filePath))) continue;
      await writeFile(filePath, cmd.content, "utf-8");
      created.push(filePath);
    }

    // Direct users to install the global plugin via opencode.json.
    configChanges.push(
      'Add betterspec to opencode.json: plugin: ["betterspec@git+https://github.com/betterspec/betterspec.git"]',
    );
    configChanges.push("See .opencode/INSTALL.md for full setup instructions");

    return { filesCreated: created, configChanges };
  },
};

export default adapter;
