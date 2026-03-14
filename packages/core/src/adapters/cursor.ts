import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";
import type { ToolAdapter } from "../types/index.js";

const CURSOR_RULES = `---
description: betterspec spec-driven development workflow
globs: "**/*"
---

# betterspec Rules

This project uses **betterspec** for spec-driven development.

## Before Starting Work

1. Run \`betterspec status\` to see project state
2. Check \`betterspec list\` for active changes
3. Read \`betterspec/knowledge/architecture.md\` and \`betterspec/knowledge/patterns.md\`

## Workflow

1. **Propose** — \`betterspec propose "idea"\` — create a change proposal
2. **Plan** — Fill in requirements.md, scenarios.md, design.md, tasks.md
3. **Build** — Implement tasks, updating status as you go
4. **Validate** — Review implementation against specs (use a separate context)
5. **Archive** — \`betterspec archive <name>\` — capture knowledge

## Rules

- **Spec first.** Do not start coding without a spec for non-trivial changes.
- **Follow patterns.** Read \`betterspec/knowledge/patterns.md\` before writing code.
- **Update tasks.** Mark task status as you work.
- **Knowledge compounds.** After completing a change, archive it to capture capabilities.
- **The builder never validates.** Validation must come from a separate context.

## Key Directories

\`\`\`
betterspec/
  betterspec.json          # Configuration
  changes/                 # Active change specs
  knowledge/               # Architecture, patterns, glossary, capabilities
\`\`\`

## CLI Commands

| Command | Purpose |
|---------|---------|
| \`betterspec status\` | Project dashboard |
| \`betterspec propose "idea"\` | Create change |
| \`betterspec clarify <name>\` | Refine requirements |
| \`betterspec verify <name>\` | Check spec completeness |
| \`betterspec diff\` | Show drift |
| \`betterspec archive <name>\` | Archive completed change |
`;

const adapter: ToolAdapter = {
  name: "cursor",
  displayName: "Cursor",
  capabilities: { agents: false, subagents: false, hooks: false, skills: true, memory: false },

  async scaffold(projectRoot) {
    const created: string[] = [];
    const rulesDir = join(projectRoot, ".cursor", "rules");
    const rulesPath = join(rulesDir, "betterspec.mdc");

    if (!(await fileExists(rulesPath))) {
      await mkdir(rulesDir, { recursive: true });
      await writeFile(rulesPath, CURSOR_RULES, "utf-8");
      created.push(rulesPath);
    }

    return { filesCreated: created, configChanges: [] };
  },
};

export default adapter;
