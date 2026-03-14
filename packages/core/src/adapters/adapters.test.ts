import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";
import { getAdapter, listAdapters, listAdapterNames } from "./index.js";

const TEST_ROOT = join(import.meta.dirname, "__test_adapters__");

beforeEach(async () => {
  await mkdir(TEST_ROOT, { recursive: true });
});

afterEach(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("listAdapters", () => {
  it("returns 6 adapters", () => {
    const adapters = listAdapters();
    expect(adapters).toHaveLength(6);
  });

  it("each adapter has name and displayName", () => {
    const adapters = listAdapters();
    for (const adapter of adapters) {
      expect(adapter.name).toBeTruthy();
      expect(adapter.displayName).toBeTruthy();
    }
  });
});

describe("listAdapterNames", () => {
  it("returns all tool names", () => {
    const names = listAdapterNames();
    expect(names).toHaveLength(6);
    expect(names).toContain("opencode");
    expect(names).toContain("claude-code");
    expect(names).toContain("gemini-cli");
    expect(names).toContain("cursor");
    expect(names).toContain("codex");
    expect(names).toContain("generic");
  });
});

describe("getAdapter", () => {
  it("returns generic adapter with correct capabilities", async () => {
    const adapter = await getAdapter("generic");
    expect(adapter.name).toBe("generic");
    expect(adapter.capabilities.skills).toBe(true);
    expect(adapter.capabilities.agents).toBe(false);
    expect(adapter.capabilities.hooks).toBe(false);
    expect(adapter.capabilities.memory).toBe(false);
  });

  it("throws for unknown adapter", async () => {
    await expect(getAdapter("unknown" as any)).rejects.toThrow("Unknown tool");
  });

  it("all registered adapters can be loaded", async () => {
    const names = listAdapterNames();
    for (const name of names) {
      const adapter = await getAdapter(name);
      expect(adapter.name).toBe(name);
      expect(adapter.capabilities).toBeDefined();
      expect(typeof adapter.scaffold).toBe("function");
    }
  });
});

describe("generic adapter scaffold", () => {
  it("returns empty results", async () => {
    const adapter = await getAdapter("generic");
    const result = await adapter.scaffold(TEST_ROOT, {});
    expect(result.filesCreated).toEqual([]);
    expect(result.configChanges).toEqual([]);
  });
});

describe("opencode adapter scaffold", () => {
  it("scaffolds agent files and plugin file", async () => {
    const adapter = await getAdapter("opencode");
    const result = await adapter.scaffold(TEST_ROOT, {});

    expect(result.filesCreated.length).toBeGreaterThan(0);

    // Agent files
    const agentDir = join(TEST_ROOT, ".opencode", "agents");
    expect(await fileExists(join(agentDir, "betterspec-planner.md"))).toBe(true);
    expect(await fileExists(join(agentDir, "betterspec-builder.md"))).toBe(true);
    expect(await fileExists(join(agentDir, "betterspec-validator.md"))).toBe(true);
    expect(await fileExists(join(agentDir, "betterspec-archivist.md"))).toBe(true);

    // Plugin file
    const pluginPath = join(TEST_ROOT, ".opencode", "plugins", "betterspec.ts");
    expect(await fileExists(pluginPath)).toBe(true);
  });
});

describe("claude-code adapter scaffold", () => {
  it("scaffolds agent files, hook scripts, and settings.json", async () => {
    const adapter = await getAdapter("claude-code");
    const result = await adapter.scaffold(TEST_ROOT, {});

    expect(result.filesCreated.length).toBeGreaterThan(0);

    // Agent files
    const agentDir = join(TEST_ROOT, ".claude", "agents");
    expect(await fileExists(join(agentDir, "betterspec-planner.md"))).toBe(true);
    expect(await fileExists(join(agentDir, "betterspec-builder.md"))).toBe(true);
    expect(await fileExists(join(agentDir, "betterspec-validator.md"))).toBe(true);
    expect(await fileExists(join(agentDir, "betterspec-archivist.md"))).toBe(true);

    // Hook scripts
    const hookDir = join(TEST_ROOT, ".claude", "hooks");
    expect(await fileExists(join(hookDir, "betterspec-check-unspecced.sh"))).toBe(true);
    expect(await fileExists(join(hookDir, "betterspec-session-context.sh"))).toBe(true);

    // Settings
    const settingsPath = join(TEST_ROOT, ".claude", "settings.json");
    expect(await fileExists(settingsPath)).toBe(true);
  });
});

describe("cursor adapter scaffold", () => {
  it("scaffolds .cursor/rules/betterspec.mdc", async () => {
    const adapter = await getAdapter("cursor");
    const result = await adapter.scaffold(TEST_ROOT, {});

    expect(result.filesCreated.length).toBeGreaterThan(0);

    const rulesPath = join(TEST_ROOT, ".cursor", "rules", "betterspec.mdc");
    expect(await fileExists(rulesPath)).toBe(true);
  });
});
