import type { ToolAdapter } from "../types/index.js";

const adapter: ToolAdapter = {
  name: "generic",
  displayName: "Generic (no tool-specific setup)",
  capabilities: {
    agents: false,
    subagents: false,
    hooks: false,
    skills: true,
    memory: false,
  },
  async scaffold() {
    return { filesCreated: [], configChanges: [] };
  },
};

export default adapter;
