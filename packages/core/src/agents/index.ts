import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";
import type { AgentRole } from "../types/index.js";
import {
  AGENT_ROLES,
  plannerContent,
  builderContent,
  validatorContent,
  archivistContent,
} from "./content.js";

const contentMap: Record<AgentRole, (model: string) => string> = {
  planner: plannerContent,
  builder: builderContent,
  validator: validatorContent,
  archivist: archivistContent,
};

export async function scaffoldAgents(
  targetDir: string,
  modelOverrides?: Partial<Record<AgentRole, string>>
): Promise<string[]> {
  const created: string[] = [];

  await mkdir(targetDir, { recursive: true });

  for (const role of AGENT_ROLES) {
    const model = modelOverrides?.[role.role] ?? role.defaultModel;
    const filename = `${role.name}.md`;
    const filePath = join(targetDir, filename);

    if (await fileExists(filePath)) continue;

    const content = contentMap[role.role](model);
    await writeFile(filePath, content, "utf-8");
    created.push(filePath);
  }

  return created;
}

export { AGENT_ROLES } from "./content.js";
