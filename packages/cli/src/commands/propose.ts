/**
 * forgelore propose command
 * Create a new change with proposal, specs, design, and tasks
 */

import * as p from "@clack/prompts";
import ora from "ora";
import { resolve } from "node:path";
import {
  configExists,
  createChange,
} from "@forgelore/core";
import { renderBanner, renderBox } from "../ui/banner.js";
import { colors, icons, gradients } from "../ui/theme.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function proposeCommand(
  idea?: string,
  options?: { cwd?: string }
): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  // Check if initialized
  if (!(await configExists(projectRoot))) {
    console.log(
      renderBox(
        `${icons.error} forgelore is not initialized.\n` +
          `Run ${colors.primary("forgelore init")} first.`,
        "Not Initialized",
        "#EF4444"
      )
    );
    process.exit(1);
  }

  p.intro(gradients.brand(" forgelore propose "));

  // Get the idea if not provided
  let ideaText = idea;
  if (!ideaText) {
    const input = await p.text({
      message: "What do you want to build?",
      placeholder: "e.g., Add dark mode toggle to settings",
      validate: (val) => {
        if (!val) return "Please describe your idea";
        return undefined;
      },
    });

    if (p.isCancel(input)) {
      p.cancel("Propose cancelled.");
      process.exit(0);
    }

    ideaText = input as string;
  }

  // Generate a slug name
  const suggestedName = slugify(ideaText).slice(0, 50);
  const nameInput = await p.text({
    message: "Change name (used as folder name):",
    placeholder: suggestedName,
    defaultValue: suggestedName,
    validate: (val) => {
      if (!val) return "Please enter a name";
      if (!/^[a-z0-9-]+$/.test(val))
        return "Use lowercase letters, numbers, and hyphens only";
      return undefined;
    },
  });

  if (p.isCancel(nameInput)) {
    p.cancel("Propose cancelled.");
    process.exit(0);
  }

  const changeName = (nameInput as string) || suggestedName;

  // Build the proposal content
  const proposalContent = `# Proposal: ${ideaText}

## Motivation

<!-- Why are we doing this? What problem does it solve? -->


## Scope

<!-- What is included and excluded from this change? -->

### In Scope


### Out of Scope


## Context

<!-- Any relevant context, links, or references -->


## Success Criteria

<!-- How do we know this is done? -->

1. 

---

*Proposed: ${new Date().toISOString().slice(0, 10)}*
`;

  // Create the change
  const spinner = ora({
    text: "Creating change...",
    color: "magenta",
  }).start();

  try {
    const change = await createChange(projectRoot, changeName, proposalContent);
    spinner.succeed(colors.success(`Created change: ${changeName}`));

    const files = [
      `forgelore/changes/${changeName}/proposal.md`,
      `forgelore/changes/${changeName}/specs/requirements.md`,
      `forgelore/changes/${changeName}/specs/scenarios.md`,
      `forgelore/changes/${changeName}/design.md`,
      `forgelore/changes/${changeName}/tasks.md`,
    ];

    const summary = [
      `${icons.success} ${colors.white("Change created:")} ${colors.primary(changeName)}`,
      "",
      `${colors.white("Files:")}`,
      ...files.map((f) => `  ${icons.bullet} ${colors.muted(f)}`),
      "",
      `${colors.muted("Next steps:")}`,
      `  1. Fill in ${colors.primary("proposal.md")} with motivation and scope`,
      `  2. Define requirements in ${colors.primary("specs/requirements.md")}`,
      `  3. Add scenarios in ${colors.primary("specs/scenarios.md")}`,
      `  4. Describe approach in ${colors.primary("design.md")}`,
      `  5. Break into tasks in ${colors.primary("tasks.md")}`,
    ];

    console.log(renderBox(summary.join("\n"), "Proposed", "#7C3AED"));
  } catch (err) {
    spinner.fail(colors.error("Failed to create change"));
    if (err instanceof Error) {
      console.error(colors.muted(err.message));
    }
    process.exit(1);
  }

  p.outro(
    `Run ${colors.primary("forgelore clarify")} ${colors.muted(changeName)} to refine requirements.`
  );
}
