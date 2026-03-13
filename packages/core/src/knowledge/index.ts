/**
 * Knowledge base management
 * Capabilities, decisions, architecture docs, patterns
 */

import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileExists, getbetterspecDir } from "../config/index.js";
import type { Capability, Decision, KnowledgeBase } from "../types/index.js";

// --- Paths ---

export function getKnowledgeDir(projectRoot: string): string {
  return join(getbetterspecDir(projectRoot), "knowledge");
}

export function getCapabilitiesDir(projectRoot: string): string {
  return join(getKnowledgeDir(projectRoot), "capabilities");
}

export function getDecisionsDir(projectRoot: string): string {
  return join(getKnowledgeDir(projectRoot), "decisions");
}

// --- Read Knowledge Base ---

export async function readKnowledge(projectRoot: string): Promise<KnowledgeBase> {
  const knowledgeDir = getKnowledgeDir(projectRoot);

  const kb: KnowledgeBase = {
    capabilities: await listCapabilities(projectRoot),
    decisions: await listDecisions(projectRoot),
  };

  // Read optional markdown files
  const archPath = join(knowledgeDir, "architecture.md");
  if (await fileExists(archPath)) {
    kb.architecture = await readFile(archPath, "utf-8");
  }

  const patternsPath = join(knowledgeDir, "patterns.md");
  if (await fileExists(patternsPath)) {
    kb.patterns = await readFile(patternsPath, "utf-8");
  }

  const glossaryPath = join(knowledgeDir, "glossary.md");
  if (await fileExists(glossaryPath)) {
    kb.glossary = await readFile(glossaryPath, "utf-8");
  }

  return kb;
}

// --- Capabilities ---

export async function listCapabilities(projectRoot: string): Promise<Capability[]> {
  const dir = getCapabilitiesDir(projectRoot);
  if (!(await fileExists(dir))) return [];

  const entries = await readdir(dir, { withFileTypes: true });
  const capabilities: Capability[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const raw = await readFile(join(dir, entry.name), "utf-8");
    capabilities.push(JSON.parse(raw) as Capability);
  }

  return capabilities.sort(
    (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
  );
}

export async function addCapability(
  projectRoot: string,
  capability: Capability
): Promise<void> {
  const dir = getCapabilitiesDir(projectRoot);
  await mkdir(dir, { recursive: true });

  const fileName = `${capability.id}.json`;
  await writeFile(
    join(dir, fileName),
    JSON.stringify(capability, null, 2) + "\n",
    "utf-8"
  );
}

export async function getCapability(
  projectRoot: string,
  id: string
): Promise<Capability | null> {
  const filePath = join(getCapabilitiesDir(projectRoot), `${id}.json`);
  if (!(await fileExists(filePath))) return null;
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as Capability;
}

// --- Decisions ---

export async function listDecisions(projectRoot: string): Promise<Decision[]> {
  const dir = getDecisionsDir(projectRoot);
  if (!(await fileExists(dir))) return [];

  const entries = await readdir(dir, { withFileTypes: true });
  const decisions: Decision[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const raw = await readFile(join(dir, entry.name), "utf-8");
    decisions.push(JSON.parse(raw) as Decision);
  }

  return decisions.sort((a, b) => a.id.localeCompare(b.id));
}

export async function addDecision(
  projectRoot: string,
  decision: Decision
): Promise<void> {
  const dir = getDecisionsDir(projectRoot);
  await mkdir(dir, { recursive: true });

  const fileName = `${decision.id}.json`;
  await writeFile(
    join(dir, fileName),
    JSON.stringify(decision, null, 2) + "\n",
    "utf-8"
  );
}

// --- Scaffold Knowledge ---

export async function scaffoldKnowledge(projectRoot: string): Promise<void> {
  const knowledgeDir = getKnowledgeDir(projectRoot);
  await mkdir(join(knowledgeDir, "capabilities"), { recursive: true });
  await mkdir(join(knowledgeDir, "decisions"), { recursive: true });

  const archPath = join(knowledgeDir, "architecture.md");
  if (!(await fileExists(archPath))) {
    await writeFile(
      archPath,
      `# Architecture\n\n<!-- Living architecture documentation. Updated as the system evolves. -->\n\n## Overview\n\n\n## Components\n\n\n## Data Flow\n\n\n## Key Integrations\n\n`,
      "utf-8"
    );
  }

  const patternsPath = join(knowledgeDir, "patterns.md");
  if (!(await fileExists(patternsPath))) {
    await writeFile(
      patternsPath,
      `# Patterns\n\n<!-- Established patterns in this codebase. Agents should follow these. -->\n\n## Code Patterns\n\n\n## Naming Conventions\n\n\n## Error Handling\n\n\n## Testing Patterns\n\n`,
      "utf-8"
    );
  }

  const glossaryPath = join(knowledgeDir, "glossary.md");
  if (!(await fileExists(glossaryPath))) {
    await writeFile(
      glossaryPath,
      `# Glossary\n\n<!-- Domain-specific terms used in this project -->\n\n| Term | Definition |\n|------|------------|\n|      |            |\n`,
      "utf-8"
    );
  }
}
