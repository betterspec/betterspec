/**
 * Spec CRUD operations
 * Create, read, update, list, and archive spec changes
 */

import { readFile, writeFile, readdir, mkdir, rename, rm } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileExists, getForgeloreDir } from "../config/index.js";
import type { Change, ChangeStatus, Task, TaskStatus } from "../types/index.js";

// --- Paths ---

export function getChangesDir(projectRoot: string): string {
  return join(getForgeloreDir(projectRoot), "changes");
}

export function getArchiveDir(projectRoot: string): string {
  return join(getChangesDir(projectRoot), "archive");
}

export function getChangePath(projectRoot: string, changeName: string): string {
  return join(getChangesDir(projectRoot), changeName);
}

// --- Scaffold ---

export async function scaffoldSpecDirs(projectRoot: string): Promise<void> {
  const forgeloreDir = getForgeloreDir(projectRoot);
  await mkdir(join(forgeloreDir, "changes"), { recursive: true });
  await mkdir(join(forgeloreDir, "changes", "archive"), { recursive: true });
  await mkdir(join(forgeloreDir, "knowledge", "capabilities"), { recursive: true });
  await mkdir(join(forgeloreDir, "knowledge", "decisions"), { recursive: true });
}

/**
 * Scaffold the forgelore skill — agent-agnostic instructions for using
 * the forgelore CLI. This goes into the project root so any agent system
 * (OpenCode, Claude Code, Cursor, etc.) can discover it.
 */
export async function scaffoldSkill(projectRoot: string): Promise<void> {
  const skillDir = join(projectRoot, "skills", "forgelore");
  await mkdir(skillDir, { recursive: true });

  const skillPath = join(skillDir, "SKILL.md");
  if (await fileExists(skillPath)) {
    return; // Don't overwrite existing skill
  }

  const content = `# Forgelore — Spec-Driven Development

This project uses **forgelore** for spec-driven development. All significant changes
should go through the spec workflow before implementation begins.

## When to Use Forgelore

- Before starting any new feature or significant change
- When requirements are unclear and need to be formalized
- When multiple agents or developers will collaborate on a change
- Before refactoring that touches multiple modules

## CLI Commands

| Command | Purpose |
|---------|---------|
| \`forgelore status\` | Show project status dashboard — start here |
| \`forgelore list\` | List all changes and their states |
| \`forgelore propose "idea"\` | Create a new change proposal |
| \`forgelore clarify <change>\` | Refine requirements interactively |
| \`forgelore verify <change>\` | Check spec completeness (structural) |
| \`forgelore diff <change>\` | Show drift between specs and code |
| \`forgelore archive <change>\` | Archive a completed change, extract knowledge |
| \`forgelore doctor\` | Health check for the forgelore setup |
| \`forgelore capabilities\` | List all registered capabilities |
| \`forgelore config [key] [value]\` | Get or set configuration |

## Workflow

1. **Propose** — \`forgelore propose "add user authentication"\`
2. **Plan** — Fill in \`forgelore/changes/<name>/specs/requirements.md\`, \`scenarios.md\`, \`design.md\`, and \`tasks.md\`
3. **Verify** — \`forgelore verify <name>\` to check spec completeness
4. **Build** — Implement tasks, updating status as you go
5. **Validate** — Review implementation against specs
6. **Archive** — \`forgelore archive <name>\` to capture knowledge

## Key Directories

\`\`\`
forgelore/
├── forgelore.json              # Configuration
├── changes/                    # Active change specs
│   └── <change-name>/
│       ├── proposal.md         # Original idea
│       ├── specs/
│       │   ├── requirements.md # What to build
│       │   └── scenarios.md    # How it should work
│       ├── design.md           # Technical approach
│       └── tasks.md            # Atomic task breakdown
└── knowledge/                  # Project knowledge base
    ├── architecture.md         # System architecture
    ├── patterns.md             # Code patterns and conventions
    ├── glossary.md             # Domain terminology
    ├── capabilities/           # Extracted capabilities (JSON)
    └── decisions/              # Architecture decision records
\`\`\`

## Rules

- **Spec first.** Do not start coding without a spec for non-trivial changes.
- **Follow patterns.** Read \`forgelore/knowledge/patterns.md\` before writing code.
- **Update tasks.** Mark task status as you work (\`pending\` → \`in-progress\` → \`implemented\`).
- **Knowledge compounds.** After completing a change, archive it to capture capabilities and update the knowledge base.
`;

  await writeFile(skillPath, content, "utf-8");
}

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
    join(changePath, ".forge-meta.json"),
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
  const metaPath = join(changePath, ".forge-meta.json");

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

    const metaPath = join(changesDir, entry.name, ".forge-meta.json");
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
        const metaPath = join(archiveDir, entry.name, ".forge-meta.json");
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

  const metaPath = join(change.path, ".forge-meta.json");
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

  const metaPath = join(change.path, ".forge-meta.json");
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
