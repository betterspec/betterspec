import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";
import { scaffoldAgents } from "./index.js";
import { AGENT_ROLES } from "./content.js";

const TEST_ROOT = join(import.meta.dirname, "__test_agents__");

beforeEach(async () => {
  await mkdir(TEST_ROOT, { recursive: true });
});

afterEach(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("AGENT_ROLES", () => {
  it("has 4 entries", () => {
    expect(AGENT_ROLES).toHaveLength(4);
  });

  it("contains planner, builder, validator, archivist", () => {
    const roles = AGENT_ROLES.map((r) => r.role);
    expect(roles).toContain("planner");
    expect(roles).toContain("builder");
    expect(roles).toContain("validator");
    expect(roles).toContain("archivist");
  });

  it("each role has required fields", () => {
    for (const role of AGENT_ROLES) {
      expect(role.role).toBeTruthy();
      expect(typeof role.role).toBe("string");
      expect(role.name).toBeTruthy();
      expect(typeof role.name).toBe("string");
      expect(role.description).toBeTruthy();
      expect(typeof role.description).toBe("string");
      expect(role.defaultModel).toBeTruthy();
      expect(typeof role.defaultModel).toBe("string");
      expect(Array.isArray(role.tools)).toBe(true);
      expect(role.tools.length).toBeGreaterThan(0);
      expect(typeof role.temperature).toBe("number");
    }
  });
});

describe("scaffoldAgents", () => {
  it("creates 4 markdown files in target directory", async () => {
    const targetDir = join(TEST_ROOT, "agents");
    await scaffoldAgents(targetDir);

    for (const role of AGENT_ROLES) {
      const filePath = join(targetDir, `${role.name}.md`);
      expect(await fileExists(filePath)).toBe(true);
    }
  });

  it("created files contain YAML frontmatter with name and description", async () => {
    const targetDir = join(TEST_ROOT, "agents");
    await scaffoldAgents(targetDir);

    for (const role of AGENT_ROLES) {
      const filePath = join(targetDir, `${role.name}.md`);
      const content = await readFile(filePath, "utf-8");
      expect(content).toMatch(/^---/);
      expect(content).toMatch(/name:/);
      expect(content).toMatch(/description:/);
    }
  });

  it("does not overwrite existing agent files", async () => {
    const targetDir = join(TEST_ROOT, "agents");
    await mkdir(targetDir, { recursive: true });

    const existingPath = join(targetDir, `${AGENT_ROLES[0].name}.md`);
    await writeFile(existingPath, "custom agent content", "utf-8");

    await scaffoldAgents(targetDir);

    const content = await readFile(existingPath, "utf-8");
    expect(content).toBe("custom agent content");
  });

  it("returns list of created file paths", async () => {
    const targetDir = join(TEST_ROOT, "agents");
    const created = await scaffoldAgents(targetDir);

    expect(created).toHaveLength(4);
    for (const filePath of created) {
      expect(filePath).toContain(".md");
      expect(await fileExists(filePath)).toBe(true);
    }
  });

  it("returns fewer paths when some agents already exist", async () => {
    const targetDir = join(TEST_ROOT, "agents");
    await mkdir(targetDir, { recursive: true });

    const existingPath = join(targetDir, `${AGENT_ROLES[0].name}.md`);
    await writeFile(existingPath, "existing", "utf-8");

    const created = await scaffoldAgents(targetDir);

    expect(created).toHaveLength(3);
    expect(created).not.toContain(existingPath);
  });

  it("applies model overrides correctly", async () => {
    const targetDir = join(TEST_ROOT, "agents");
    const customModel = "custom-model/special-v2";
    await scaffoldAgents(targetDir, { planner: customModel });

    const plannerRole = AGENT_ROLES.find((r) => r.role === "planner")!;
    const plannerPath = join(targetDir, `${plannerRole.name}.md`);
    const content = await readFile(plannerPath, "utf-8");
    expect(content).toContain(customModel);
  });

  it("uses default model when no override is provided", async () => {
    const targetDir = join(TEST_ROOT, "agents");
    await scaffoldAgents(targetDir);

    const plannerRole = AGENT_ROLES.find((r) => r.role === "planner")!;
    const plannerPath = join(targetDir, `${plannerRole.name}.md`);
    const content = await readFile(plannerPath, "utf-8");
    expect(content).toContain(plannerRole.defaultModel);
  });
});
