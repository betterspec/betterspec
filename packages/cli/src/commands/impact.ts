/**
 * betterspec impact command
 * Analyze the impact of a file or path across specs and capabilities
 */

import ora from "ora";
import { resolve, relative } from "node:path";
import {
  configExists,
  listChanges,
  listCapabilities,
  readChangeFile,
  runAI,
} from "@betterspec/core";
import { renderBox } from "../ui/banner.js";
import { colors, icons } from "../ui/theme.js";

export async function impactCommand(
  targetPath: string,
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

  const resolvedPath = resolve(projectRoot, targetPath);
  const relPath = relative(projectRoot, resolvedPath);

  const spinner = ora({
    text: `Analyzing impact of ${relPath}...`,
    color: "magenta",
  }).start();

  try {
    // Gather all changes and capabilities for grep-based matching
    const [changes, capabilities] = await Promise.all([
      listChanges(projectRoot),
      listCapabilities(projectRoot),
    ]);

    spinner.text = "Scanning specs for references...";

    // Grep-based matching: check which specs reference this path
    const matchedChanges: Array<{ name: string; file: string; match: string }> = [];

    for (const change of changes) {
      const specFiles = [
        "proposal.md",
        "specs/requirements.md",
        "specs/scenarios.md",
        "design.md",
        "tasks.md",
      ];

      for (const file of specFiles) {
        try {
          const content = await readChangeFile(projectRoot, change.name, file);
          if (content.includes(relPath) || content.includes(targetPath)) {
            const lines = content.split("\n");
            const matchLine = lines.find(
              (l) => l.includes(relPath) || l.includes(targetPath)
            );
            matchedChanges.push({
              name: change.name,
              file,
              match: matchLine?.trim() ?? "(referenced)",
            });
          }
        } catch {
          // File doesn't exist, skip
        }
      }
    }

    // Check capabilities for file references
    const matchedCapabilities = capabilities.filter(
      (cap) =>
        cap.files?.some(
          (f: string) => f.includes(relPath) || f.includes(targetPath)
        )
    );

    spinner.text = "Running AI impact analysis...";

    // Build context for AI
    const matchSummary = matchedChanges.length > 0
      ? matchedChanges
          .map((m) => `- ${m.name}/${m.file}: ${m.match}`)
          .join("\n")
      : "No direct references found in specs.";

    const capSummary = matchedCapabilities.length > 0
      ? matchedCapabilities
          .map((c) => `- ${c.name} (files: ${c.files?.join(", ") ?? "none"})`)
          .join("\n")
      : "No matching capabilities.";

    const response = await runAI(
      `Analyze the impact of changes to this file/path: ${relPath}\n\n` +
        `## Direct References in Specs\n${matchSummary}\n\n` +
        `## Related Capabilities\n${capSummary}\n\n` +
        `## All Active Changes\n${changes.map((c) => `- ${c.name} (${c.status})`).join("\n") || "None"}\n\n` +
        `Provide a thorough impact analysis. What would break? What needs updating? What's the blast radius?`,
      {
        projectRoot,
        scope: "impact",
        targetPath: relPath,
        systemPrompt:
          "You are a software impact analyst. Given a file path and the project's spec/capability data, " +
          "analyze what would be affected if this file changes. Format your response with sections: " +
          "## Direct Impact (specs that reference this path), ## Indirect Impact (related capabilities " +
          "and changes), ## Risk Assessment (high/medium/low with explanation), ## Recommendations. " +
          "Be specific and actionable.",
      }
    );

    spinner.succeed(colors.success("Impact analysis complete"));

    // Show grep-based matches first
    if (matchedChanges.length > 0) {
      console.log(
        renderBox(
          matchedChanges
            .map(
              (m) =>
                `${icons.bullet} ${colors.primary(m.name)}/${colors.muted(m.file)}`
            )
            .join("\n"),
          `${matchedChanges.length} Direct Reference${matchedChanges.length === 1 ? "" : "s"}`
        )
      );
    }

    if (matchedCapabilities.length > 0) {
      console.log(
        renderBox(
          matchedCapabilities
            .map((c) => `${icons.bullet} ${colors.primary(c.name)}`)
            .join("\n"),
          `${matchedCapabilities.length} Related Capabilit${matchedCapabilities.length === 1 ? "y" : "ies"}`
        )
      );
    }

    // AI analysis
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
      spinner.fail(colors.error("Impact analysis failed"));
      console.error(err.message);
    }
  }
}
