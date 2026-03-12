/**
 * Capability extraction
 * Extract capabilities from archived changes for the knowledge base
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";
import { addCapability } from "../knowledge/index.js";
import type { Capability } from "../types/index.js";

/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Create a capability record from extracted data
 */
export function createCapability(
  name: string,
  description: string,
  sourceChange: string,
  files: string[] = [],
  tags: string[] = []
): Capability {
  return {
    id: slugify(name),
    name,
    description,
    sourceChange,
    archivedAt: new Date().toISOString(),
    files,
    tags,
  };
}

/**
 * Register a capability in the project's knowledge base
 */
export async function registerCapability(
  projectRoot: string,
  capability: Capability
): Promise<void> {
  await addCapability(projectRoot, capability);
}

/**
 * Read the outcome.md from an archived change (if it exists)
 */
export async function readOutcome(archivePath: string): Promise<string | null> {
  const outcomePath = join(archivePath, "outcome.md");
  if (!(await fileExists(outcomePath))) return null;
  return readFile(outcomePath, "utf-8");
}

/**
 * Write outcome.md to a change directory (step 1 of archive)
 */
export async function writeOutcome(
  changePath: string,
  content: string
): Promise<void> {
  const { writeFile: wf } = await import("node:fs/promises");
  await wf(join(changePath, "outcome.md"), content, "utf-8");
}
