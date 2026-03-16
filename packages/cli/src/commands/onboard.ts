/**
 * betterspec onboard command
 * Generate a narrative onboarding guide for the project using AI
 */

import ora from "ora";
import { resolve } from "node:path";
import {
  configExists,
  readConfig,
  listChanges,
  listCapabilities,
  runAI,
} from "@betterspec/core";
import { renderBox } from "../ui/banner.js";
import { colors, icons } from "../ui/theme.js";

export async function onboardCommand(options?: {
  cwd?: string;
}): Promise<void> {
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
    text: "Gathering project context...",
    color: "magenta",
  }).start();

  try {
    const [config, changes, capabilities] = await Promise.all([
      readConfig(projectRoot),
      listChanges(projectRoot),
      listCapabilities(projectRoot),
    ]);

    const activeChanges = changes.filter(
      (c) => c.status !== "archived"
    );

    spinner.text = "Generating onboarding guide...";

    const changesText = activeChanges
      .map(
        (c) =>
          `- **${c.name}** (${c.status}): ${c.tasks.length} tasks, updated ${c.updatedAt}`
      )
      .join("\n");

    const capsText = capabilities
      .map(
        (c) =>
          `- **${c.name}**: from change "${c.sourceChange}", archived ${c.archivedAt}`
      )
      .join("\n");

    const response = await runAI(
      `Generate an onboarding guide for a new developer joining this project.\n\n` +
        `## Project Configuration\n` +
        `- Mode: ${config.mode}\n` +
        `- Tool: ${config.tool ?? "none"}\n\n` +
        `## Active Changes (${activeChanges.length})\n${changesText || "None"}\n\n` +
        `## Capabilities (${capabilities.length})\n${capsText || "None"}\n\n` +
        `Write a friendly, narrative onboarding guide that helps a new developer understand ` +
        `the project's current state, what's being worked on, established patterns, and where to start.`,
      {
        projectRoot,
        scope: "full",
        systemPrompt:
          "You are a senior developer writing an onboarding guide for a new team member. " +
          "Write in a warm, narrative style (not bullet lists). Structure your response with: " +
          "## Welcome, ## What This Project Does, ## Current Work in Progress, " +
          "## Established Patterns & Capabilities, ## Where to Start, ## Tips & Conventions. " +
          "Be specific to the actual project data provided. Keep it concise but thorough.",
      }
    );

    spinner.succeed(colors.success("Onboarding guide generated"));

    console.log("\n" + response.text + "\n");

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
      spinner.fail(colors.error("Onboarding guide generation failed"));
      console.error(err.message);
    }
  }
}
