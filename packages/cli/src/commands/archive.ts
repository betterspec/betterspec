/**
 * betterspec archive command
 * Two-step archive: 1) write outcome.md, 2) move to archive + extract capabilities
 */

import * as p from "@clack/prompts";
import ora from "ora";
import { resolve } from "node:path";
import {
  configExists,
  readChange,
  archiveChange,
  readOutcome,
  writeOutcome,
  getChangePath,
} from "@betterspec/core";
import { renderBox } from "../ui/banner.js";
import { colors, icons, gradients } from "../ui/theme.js";

export async function archiveCommand(
  changeName: string,
  options?: { skipOutcome?: boolean; cwd?: string }
): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    console.log(
      renderBox(
        `${icons.error} betterspec is not initialized.\nRun ${colors.primary("betterspec init")} first.`,
        "Not Initialized",
        "#EF4444"
      )
    );
    process.exit(1);
  }

  p.intro(gradients.brand(" betterspec archive "));

  let change;
  try {
    change = await readChange(projectRoot, changeName);
  } catch {
    console.log(
      renderBox(
        `${icons.error} Change ${colors.primary(changeName)} not found.`,
        "Not Found",
        "#EF4444"
      )
    );
    process.exit(1);
  }

  // Check if outcome.md already exists
  const changePath = getChangePath(projectRoot, changeName);
  const existingOutcome = await readOutcome(changePath);

  if (!existingOutcome && !options?.skipOutcome) {
    // Step 1: outcome.md needs to be created
    console.log(
      renderBox(
        [
          `${icons.info} Before archiving, an ${colors.primary("outcome.md")} should be created.`,
          "",
          `This file captures:`,
          `  ${icons.bullet} What was built and the final state`,
          `  ${icons.bullet} Capabilities that emerged from this change`,
          `  ${icons.bullet} Lessons learned and patterns established`,
          "",
          `${colors.muted("An AI agent can generate this, or you can write it manually.")}`,
          `${colors.muted("Create")} ${colors.primary(`betterspec/changes/${changeName}/outcome.md`)} ${colors.muted("and run archive again.")}`,
        ].join("\n"),
        "Step 1: Outcome",
        "#F59E0B"
      )
    );

    const proceed = await p.confirm({
      message: "Create a placeholder outcome.md and continue archiving?",
      initialValue: false,
    });

    if (p.isCancel(proceed) || !proceed) {
      p.cancel("Archive paused. Create outcome.md and run archive again.");
      process.exit(0);
    }

    // Write placeholder outcome
    const placeholderOutcome = `# Outcome: ${changeName}

## What Was Built

<!-- Summary of what was implemented -->


## Capabilities

<!-- List capabilities that emerged from this change -->
<!-- Format: - **Capability Name**: Description -->

- 

## Lessons Learned

<!-- What did we learn? Any patterns to document? -->


## Files Changed

<!-- Key files that were created or modified -->

- 

---

*Archived: ${new Date().toISOString().slice(0, 10)}*
`;

    await writeOutcome(changePath, placeholderOutcome);
    console.log(`  ${icons.success} Created placeholder outcome.md`);
  }

  // Step 2: Archive
  const confirmArchive = await p.confirm({
    message: `Archive "${changeName}"? This will move it to betterspec/changes/archive/`,
    initialValue: true,
  });

  if (p.isCancel(confirmArchive) || !confirmArchive) {
    p.cancel("Archive cancelled.");
    process.exit(0);
  }

  const spinner = ora({
    text: "Archiving change...",
    color: "magenta",
  }).start();

  try {
    const archivePath = await archiveChange(projectRoot, changeName);
    spinner.succeed(colors.success("Change archived"));

    console.log(
      renderBox(
        [
          `${icons.success} ${colors.white("Archived:")} ${colors.primary(changeName)}`,
          `${icons.arrow} ${colors.muted(archivePath)}`,
          "",
          `${colors.muted("Next steps:")}`,
          `  1. Review ${colors.primary("outcome.md")} and extract capabilities`,
          `  2. Run ${colors.primary("betterspec capabilities")} to view the knowledge base`,
          `  3. Update ${colors.primary("betterspec/knowledge/architecture.md")} if needed`,
        ].join("\n"),
        "Archived",
        "#10B981"
      )
    );
  } catch (err) {
    spinner.fail(colors.error("Failed to archive"));
    if (err instanceof Error) {
      console.error(colors.muted(err.message));
    }
    process.exit(1);
  }

  p.outro(colors.muted("Knowledge captured. The spec lives on."));
}
