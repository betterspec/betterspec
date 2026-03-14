import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";
import { scaffoldSkills } from "./index.js";
import { SKILL_ENTRIES } from "./content.js";

const TEST_ROOT = join(import.meta.dirname, "__test_skills__");

beforeEach(async () => {
  await mkdir(TEST_ROOT, { recursive: true });
});

afterEach(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("SKILL_ENTRIES", () => {
  it("has 7 entries", () => {
    expect(SKILL_ENTRIES).toHaveLength(7);
  });

  it("all entries have name and content", () => {
    for (const entry of SKILL_ENTRIES) {
      expect(entry.name).toBeTruthy();
      expect(typeof entry.name).toBe("string");
      expect(entry.content).toBeTruthy();
      expect(typeof entry.content).toBe("string");
    }
  });

  it("all SKILL.md files contain agentskills.io frontmatter", () => {
    for (const entry of SKILL_ENTRIES) {
      expect(entry.content).toMatch(/^---/);
      expect(entry.content).toMatch(/name:/);
      expect(entry.content).toMatch(/description:/);
    }
  });
});

describe("scaffoldSkills", () => {
  it("creates skills in <project>/skills/ with mode local", async () => {
    await scaffoldSkills(TEST_ROOT, "local");

    const skillsDir = join(TEST_ROOT, "skills");
    expect(await fileExists(skillsDir)).toBe(true);

    for (const entry of SKILL_ENTRIES) {
      const skillPath = join(skillsDir, entry.name, "SKILL.md");
      expect(await fileExists(skillPath)).toBe(true);
    }
  });

  it("created files have correct content", async () => {
    await scaffoldSkills(TEST_ROOT, "local");

    for (const entry of SKILL_ENTRIES) {
      const skillPath = join(TEST_ROOT, "skills", entry.name, "SKILL.md");
      const content = await readFile(skillPath, "utf-8");
      expect(content).toBe(entry.content);
    }
  });

  it("does not overwrite existing skill files", async () => {
    const skillDir = join(TEST_ROOT, "skills", SKILL_ENTRIES[0].name);
    const skillPath = join(skillDir, "SKILL.md");
    await mkdir(skillDir, { recursive: true });
    await writeFile(skillPath, "custom content", "utf-8");

    await scaffoldSkills(TEST_ROOT, "local");

    const content = await readFile(skillPath, "utf-8");
    expect(content).toBe("custom content");
  });

  it("returns list of created file paths", async () => {
    const created = await scaffoldSkills(TEST_ROOT, "local");

    expect(created).toHaveLength(SKILL_ENTRIES.length);
    for (const filePath of created) {
      expect(filePath).toContain("SKILL.md");
      expect(await fileExists(filePath)).toBe(true);
    }
  });

  it("returns fewer paths when some skills already exist", async () => {
    const skillDir = join(TEST_ROOT, "skills", SKILL_ENTRIES[0].name);
    const skillPath = join(skillDir, "SKILL.md");
    await mkdir(skillDir, { recursive: true });
    await writeFile(skillPath, "existing", "utf-8");

    const created = await scaffoldSkills(TEST_ROOT, "local");

    expect(created).toHaveLength(SKILL_ENTRIES.length - 1);
    expect(created).not.toContain(skillPath);
  });
});
