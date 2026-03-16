/**
 * betterspec search command
 * AI-powered semantic search across specs, changes, and capabilities
 */

import ora from "ora";
import { resolve } from "node:path";
import {
  configExists,
  listChanges,
  listCapabilities,
  runAI,
} from "@betterspec/core";
import { renderBox } from "../ui/banner.js";
import { colors, icons } from "../ui/theme.js";

export async function searchCommand(
  query: string,
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
    text: `Searching for "${query}"...`,
    color: "magenta",
  }).start();

  try {
    const [changes, capabilities] = await Promise.all([
      listChanges(projectRoot),
      listCapabilities(projectRoot),
    ]);

    const changesText = changes
      .map((c) => `- ${c.name} (${c.status}, updated ${c.updatedAt})`)
      .join("\n");

    const capsText = capabilities
      .map((c) => `- ${c.name} (from ${c.sourceChange}, archived ${c.archivedAt})`)
      .join("\n");

    spinner.text = "Analyzing with AI...";

    const response = await runAI(
      `Search query: "${query}"\n\n` +
        `## Active Changes\n${changesText || "None"}\n\n` +
        `## Capabilities\n${capsText || "None"}\n\n` +
        `Find and rank results relevant to the query. For each result, explain why it matches.`,
      {
        projectRoot,
        scope: "search",
        systemPrompt:
          "You are a search engine for a software project's specification system. " +
          "Given a search query and the project's changes and capabilities, return ranked results. " +
          "Format as a numbered list with: name, type (change/capability), relevance score (1-10), " +
          "and a brief explanation of why it matches. Only include genuinely relevant results. " +
          "If nothing matches, say so clearly.",
      }
    );

    spinner.succeed(colors.success("Search complete"));

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
      spinner.fail(colors.error("Search failed"));
      console.error(err.message);
    }
  }
}
