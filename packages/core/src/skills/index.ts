/**
 * Skill scaffolding
 * Writes SKILL.md files to local and/or global skills directories
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileExists, getLocalSkillsDir, getGlobalSkillsDir } from "../config/index.js";
import type { SkillsMode } from "../types/index.js";
import { SKILL_ENTRIES } from "./content.js";

export async function scaffoldSkills(
  projectRoot: string,
  mode: SkillsMode
): Promise<string[]> {
  const created: string[] = [];
  const targets: string[] = [];

  if (mode === "local" || mode === "both") {
    targets.push(getLocalSkillsDir(projectRoot));
  }
  if (mode === "global" || mode === "both") {
    targets.push(getGlobalSkillsDir());
  }

  for (const baseDir of targets) {
    for (const entry of SKILL_ENTRIES) {
      const skillDir = join(baseDir, entry.name);
      const skillPath = join(skillDir, "SKILL.md");

      if (await fileExists(skillPath)) continue;

      await mkdir(skillDir, { recursive: true });
      await writeFile(skillPath, entry.content, "utf-8");
      created.push(skillPath);
    }
  }

  return created;
}

export { SKILL_ENTRIES } from "./content.js";
