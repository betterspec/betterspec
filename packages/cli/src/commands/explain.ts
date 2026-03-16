/**
 * betterspec explain command
 * Generate an AI-powered narrative explanation of a change's full lifecycle
 */

import ora from "ora";
import { resolve } from "node:path";
import {
  configExists,
  readChange,
  readChangeFile,
  runAI,
} from "@betterspec/core";
import { renderBox } from "../ui/banner.js";
import { colors, icons } from "../ui/theme.js";

export async function explainCommand(
  changeName: string,
  options?: { cwd?: string }
): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    console.log(
      renderBox(
        `${icons.error} betterspec is not initialized.\n` +
          `Run ${colors.primary("betterspec init")} first.`,
        "Not Initialized",
        "#EF4444"
      )
    );
    process.exit(1);
  }

  const spinner = ora({
    text: `Reading change "${changeName}"...`,
    color: "magenta",
  }).start();

  try {
    let change;
    try {
      change = await readChange(projectRoot, changeName);
    } catch {
      spinner.fail(colors.error(`Change "${changeName}" not found`));
      console.log(
        renderBox(
          `${icons.error} Change ${colors.primary(changeName)} not found.\n` +
            `Run ${colors.primary("betterspec list")} to see available changes.`,
          "Not Found",
          "#EF4444"
        )
      );
      return;
    }

    // Read all spec files for the change
    const specFiles = [
      { key: "proposal", path: "proposal.md" },
      { key: "requirements", path: "specs/requirements.md" },
      { key: "scenarios", path: "specs/scenarios.md" },
      { key: "design", path: "design.md" },
      { key: "tasks", path: "tasks.md" },
    ];

    const fileContents: Record<string, string> = {};

    for (const { key, path } of specFiles) {
      try {
        fileContents[key] = await readChangeFile(projectRoot, changeName, path);
      } catch {
        fileContents[key] = "(not yet defined)";
      }
    }

    spinner.text = "Generating explanation...";

    // Build the full context from all files
    const tasksText = change.tasks.length > 0
      ? change.tasks
          .map((t) => `- [${t.status}] ${t.name}`)
          .join("\n")
      : "(no tasks defined)";

    const contextText =
      `## Change: ${changeName}\n` +
      `- Status: ${change.status}\n` +
      `- Created: ${change.createdAt}\n` +
      `- Updated: ${change.updatedAt}\n\n` +
      `## Proposal\n${fileContents.proposal}\n\n` +
      `## Requirements\n${fileContents.requirements}\n\n` +
      `## Scenarios\n${fileContents.scenarios}\n\n` +
      `## Design\n${fileContents.design}\n\n` +
      `## Tasks\n${fileContents.tasks}\n\n` +
      `## Task Status\n${tasksText}`;

    const response = await runAI(
      `Explain this change as a narrative lifecycle story:\n\n${contextText}`,
      {
        projectRoot,
        scope: "full",
        systemPrompt:
          "You are a technical narrator explaining a software change's full lifecycle. " +
          "Given the proposal, requirements, scenarios, design, and tasks for a change, " +
          "write a clear narrative that explains: ## The Problem (what motivated this change), " +
          "## The Approach (how it was designed), ## The Plan (how it was broken into tasks), " +
          "## Current State (where things stand now), ## Key Decisions (notable choices made). " +
          "Write in a clear, engaging style. Reference specific details from the spec files. " +
          "If sections are empty or undefined, note what's missing and what should come next.",
      }
    );

    spinner.succeed(colors.success("Explanation generated"));

    // Show change metadata header
    console.log(
      renderBox(
        [
          `${icons.info} Change: ${colors.primary(changeName)}`,
          `${icons.info} Status: ${colors.accent(change.status)}`,
          `${icons.info} Tasks: ${colors.white(String(change.tasks.length))}`,
          `${icons.info} Created: ${colors.muted(change.createdAt.slice(0, 10))}`,
        ].join("\n"),
        "Change Details"
      )
    );

    console.log(response.text + "\n");

    if (response.usage) {
      console.log(
        colors.muted(
          `Tokens: ${response.usage.inputTokens} in / ${response.usage.outputTokens} out`
        )
      );
    }
    if (response.cost) {
      console.log(colors.muted(`Estimated cost: $${response.cost.toFixed(4)}`));
    }
    if (response.model) {
      console.log(colors.muted(`Model: ${response.model}`));
    }
  } catch (err: any) {
    if (err.name === "AINotAvailableError") {
      spinner.fail("AI not available");
      console.log(renderBox(err.message, "AI Setup Required"));
    } else {
      spinner.fail(colors.error("Explanation failed"));
      console.error(err.message);
    }
  }
}
