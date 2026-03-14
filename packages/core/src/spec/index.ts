/**
 * Spec CRUD operations
 * Create, read, update, list, and archive spec changes
 */

import { readFile, writeFile, readdir, mkdir, rename, rm } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileExists, getbetterspecDir } from "../config/index.js";
import type { Change, ChangeStatus, Task, TaskStatus } from "../types/index.js";

// --- Paths ---

export function getChangesDir(projectRoot: string): string {
  return join(getbetterspecDir(projectRoot), "changes");
}

export function getArchiveDir(projectRoot: string): string {
  return join(getChangesDir(projectRoot), "archive");
}

export function getChangePath(projectRoot: string, changeName: string): string {
  return join(getChangesDir(projectRoot), changeName);
}

// --- Scaffold ---

export async function scaffoldSpecDirs(projectRoot: string): Promise<void> {
  const betterspecDir = getbetterspecDir(projectRoot);
  await mkdir(join(betterspecDir, "changes"), { recursive: true });
  await mkdir(join(betterspecDir, "changes", "archive"), { recursive: true });
  await mkdir(join(betterspecDir, "knowledge", "capabilities"), { recursive: true });
  await mkdir(join(betterspecDir, "knowledge", "decisions"), { recursive: true });
}

/**
 * @deprecated Use scaffoldSkills from ../skills/index.js instead.
 * Kept temporarily for backward compatibility.
 */
export { scaffoldSkills as scaffoldSkill } from "../skills/index.js";

// --- Create ---

export async function createChange(
  projectRoot: string,
  name: string,
  proposalContent: string
): Promise<Change> {
  const changePath = getChangePath(projectRoot, name);

  if (await fileExists(changePath)) {
    throw new Error(`Change '${name}' already exists at ${changePath}`);
  }

  await mkdir(changePath, { recursive: true });
  await mkdir(join(changePath, "specs"), { recursive: true });

  const now = new Date().toISOString();

  // Write proposal
  await writeFile(join(changePath, "proposal.md"), proposalContent, "utf-8");

  // Write empty spec files from templates
  await writeFile(
    join(changePath, "specs", "requirements.md"),
    `# Requirements: ${name}\n\n<!-- Define the requirements for this change -->\n\n## Functional Requirements\n\n1. \n\n## Non-Functional Requirements\n\n1. \n`,
    "utf-8"
  );

  await writeFile(
    join(changePath, "specs", "scenarios.md"),
    `# Scenarios: ${name}\n\n<!-- Define acceptance scenarios -->\n\n## Happy Path\n\n1. \n\n## Edge Cases\n\n1. \n\n## Error Cases\n\n1. \n`,
    "utf-8"
  );

  await writeFile(
    join(changePath, "design.md"),
    `# Design: ${name}\n\n<!-- Technical approach and architecture decisions -->\n\n## Approach\n\n\n## Key Decisions\n\n\n## Files to Modify\n\n- \n\n## Dependencies\n\n- \n`,
    "utf-8"
  );

  await writeFile(
    join(changePath, "tasks.md"),
    `# Tasks: ${name}\n\n<!-- Implementation checklist -->\n\n| ID | Task | Status | Category | Notes |\n|----|------|--------|----------|-------|\n| 1  |      | pending |          |       |\n`,
    "utf-8"
  );

  const change: Change = {
    name,
    status: "proposed",
    createdAt: now,
    updatedAt: now,
    path: changePath,
    tasks: [],
  };

  // Write metadata
  await writeFile(
    join(changePath, ".betterspec-meta.json"),
    JSON.stringify(change, null, 2) + "\n",
    "utf-8"
  );

  return change;
}

// --- Read ---

export async function readChange(
  projectRoot: string,
  name: string
): Promise<Change> {
  const changePath = getChangePath(projectRoot, name);
  const metaPath = join(changePath, ".betterspec-meta.json");

  if (!(await fileExists(metaPath))) {
    throw new Error(`Change '${name}' not found at ${changePath}`);
  }

  const raw = await readFile(metaPath, "utf-8");
  return JSON.parse(raw) as Change;
}

export async function readChangeFile(
  projectRoot: string,
  changeName: string,
  fileName: string
): Promise<string> {
  const filePath = join(getChangePath(projectRoot, changeName), fileName);
  if (!(await fileExists(filePath))) {
    throw new Error(`File '${fileName}' not found in change '${changeName}'`);
  }
  return readFile(filePath, "utf-8");
}

// --- List ---

export async function listChanges(
  projectRoot: string,
  includeArchived = false
): Promise<Change[]> {
  const changesDir = getChangesDir(projectRoot);

  if (!(await fileExists(changesDir))) {
    return [];
  }

  const entries = await readdir(changesDir, { withFileTypes: true });
  const changes: Change[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "archive") continue;

    const metaPath = join(changesDir, entry.name, ".betterspec-meta.json");
    if (await fileExists(metaPath)) {
      const raw = await readFile(metaPath, "utf-8");
      changes.push(JSON.parse(raw) as Change);
    }
  }

  if (includeArchived) {
    const archiveDir = getArchiveDir(projectRoot);
    if (await fileExists(archiveDir)) {
      const archiveEntries = await readdir(archiveDir, { withFileTypes: true });
      for (const entry of archiveEntries) {
        if (!entry.isDirectory()) continue;
        const metaPath = join(archiveDir, entry.name, ".betterspec-meta.json");
        if (await fileExists(metaPath)) {
          const raw = await readFile(metaPath, "utf-8");
          changes.push(JSON.parse(raw) as Change);
        }
      }
    }
  }

  return changes.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// --- Update ---

export async function updateChangeStatus(
  projectRoot: string,
  name: string,
  status: ChangeStatus
): Promise<Change> {
  const change = await readChange(projectRoot, name);
  change.status = status;
  change.updatedAt = new Date().toISOString();

  const metaPath = join(change.path, ".betterspec-meta.json");
  await writeFile(metaPath, JSON.stringify(change, null, 2) + "\n", "utf-8");

  return change;
}

export async function updateTaskStatus(
  projectRoot: string,
  changeName: string,
  taskId: string,
  status: TaskStatus
): Promise<void> {
  const change = await readChange(projectRoot, changeName);
  const task = change.tasks.find((t) => t.id === taskId);
  if (task) {
    task.status = status;
  }
  change.updatedAt = new Date().toISOString();

  const metaPath = join(change.path, ".betterspec-meta.json");
  await writeFile(metaPath, JSON.stringify(change, null, 2) + "\n", "utf-8");
}

// --- Archive ---

export async function archiveChange(
  projectRoot: string,
  name: string
): Promise<string> {
  const changePath = getChangePath(projectRoot, name);
  if (!(await fileExists(changePath))) {
    throw new Error(`Change '${name}' not found`);
  }

  const archiveDir = getArchiveDir(projectRoot);
  const datestamp = new Date().toISOString().slice(0, 10);
  const archiveName = `${datestamp}-${name}`;
  const archivePath = join(archiveDir, archiveName);

  // Update status before archiving
  await updateChangeStatus(projectRoot, name, "archived");

  // Move to archive
  await rename(changePath, archivePath);

  return archivePath;
}
