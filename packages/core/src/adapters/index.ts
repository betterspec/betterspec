import type { ToolAdapter, ToolName } from "../types/index.js";

const adapters = new Map<ToolName, () => Promise<ToolAdapter>>();

// Lazy-load adapters to avoid importing everything upfront
adapters.set("opencode", async () => (await import("./opencode.js")).default);
adapters.set("claude-code", async () => (await import("./claude-code.js")).default);
adapters.set("gemini-cli", async () => (await import("./gemini-cli.js")).default);
adapters.set("cursor", async () => (await import("./cursor.js")).default);
adapters.set("codex", async () => (await import("./codex.js")).default);
adapters.set("generic", async () => (await import("./generic.js")).default);

export async function getAdapter(tool: ToolName): Promise<ToolAdapter> {
  const factory = adapters.get(tool);
  if (!factory) {
    throw new Error(`Unknown tool: ${tool}. Available: ${listAdapterNames().join(", ")}`);
  }
  return factory();
}

export function listAdapterNames(): ToolName[] {
  return Array.from(adapters.keys());
}

export interface AdapterInfo {
  name: ToolName;
  displayName: string;
}

export function listAdapters(): AdapterInfo[] {
  return [
    { name: "opencode", displayName: "OpenCode" },
    { name: "claude-code", displayName: "Claude Code" },
    { name: "gemini-cli", displayName: "Gemini CLI" },
    { name: "cursor", displayName: "Cursor" },
    { name: "codex", displayName: "Codex" },
    { name: "generic", displayName: "Generic (no tool-specific setup)" },
  ];
}
