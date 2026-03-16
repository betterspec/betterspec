/**
 * betterspec digest command
 * Generate a knowledge digest from recent/archived changes using AI
 */

import ora from "ora";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { configExists, listChanges, runAI } from "@betterspec/core";
import { renderBox } from "../ui/banner.js";
import { colors, icons } from "../ui/theme.js";

export async function digestCommand(options: {
  cwd?: string;
  count?: number;
  output?: string;
}): Promise<void> {
  const projectRoot = resolve(options.cwd || process.cwd());

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

  const spinner = ora({ text: "Reading changes...", color: "magenta" }).start();

  try {
    const changes = await listChanges(projectRoot);
    const selected = changes.slice(0, options.count ?? 5);

    if (selected.length === 0) {
      spinner.warn("No changes found to digest.");
      return;
    }

    spinner.text = `Generating digest from ${selected.length} changes...`;

    const changesText = selected
      .map(
        (c) =>
          `### ${c.name}\n- Status: ${c.status}\n- Created: ${c.createdAt}\n- Updated: ${c.updatedAt}`
      )
      .join("\n\n---\n\n");

    const response = await runAI(
      `Generate a knowledge digest from these recent changes:\n\n${changesText}\n\nSynthesize the information. Identify themes, patterns, and shifts.`,
      {
        projectRoot,
        scope: "digest",
        systemPrompt:
          "You are a technical writer generating a knowledge digest for a software project. " +
          "Format your response as markdown with sections: ## What Changed, ## Decisions Made, " +
          "## Patterns Established, ## Knowledge Shifts, ## Metrics. Be concise and insightful.",
      }
    );

    spinner.succeed(colors.success("Digest generated"));

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

    if (options.output) {
      await writeFile(resolve(options.output), response.text, "utf-8");
      console.log(colors.success(`\nWritten to ${options.output}`));
    }
  } catch (err: any) {
    if (err.name === "AINotAvailableError") {
      spinner.fail("AI not available");
      console.log(renderBox(err.message, "AI Setup Required"));
    } else {
      spinner.fail(colors.error("Digest generation failed"));
      console.error(err.message);
    }
  }
}
