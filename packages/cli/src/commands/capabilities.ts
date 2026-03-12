/**
 * forgelore capabilities command
 * List all registered capabilities in the knowledge base
 */

import { resolve } from "node:path";
import Table from "cli-table3";
import {
  configExists,
  listCapabilities,
} from "@forgelore/core";
import type { Capability } from "@forgelore/core";
import { renderBox, renderSection } from "../ui/banner.js";
import { colors, icons } from "../ui/theme.js";

export async function capabilitiesCommand(options?: {
  json?: boolean;
  cwd?: string;
}): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    console.log(
      renderBox(
        `${icons.error} forgelore is not initialized.\nRun ${colors.primary("forgelore init")} first.`,
        "Not Initialized",
        "#EF4444"
      )
    );
    process.exit(1);
  }

  const capabilities = await listCapabilities(projectRoot);

  if (capabilities.length === 0) {
    console.log(
      renderBox(
        `${icons.info} No capabilities registered yet.\n\n` +
          `Capabilities are extracted when changes are archived.\n` +
          `Archive a completed change with ${colors.primary("forgelore archive <change>")} to start building\nyour knowledge base.`,
        "Capabilities"
      )
    );
    return;
  }

  // JSON output
  if (options?.json) {
    console.log(JSON.stringify(capabilities, null, 2));
    return;
  }

  // Table output
  const table = new Table({
    head: [
      colors.bold("Name"),
      colors.bold("Description"),
      colors.bold("Source"),
      colors.bold("Archived"),
      colors.bold("Tags"),
    ].map(String),
    style: { head: [], border: ["gray"] },
    colWidths: [22, 30, 18, 14, 16],
    wordWrap: true,
  });

  for (const cap of capabilities) {
    table.push([
      colors.white(cap.name),
      colors.muted(cap.description.slice(0, 60)),
      colors.secondary(cap.sourceChange),
      colors.dim(cap.archivedAt.slice(0, 10)),
      cap.tags?.length ? colors.accent(cap.tags.join(", ")) : colors.muted("--"),
    ]);
  }

  console.log(renderSection("Capabilities", table.toString()));
  console.log(
    colors.muted(
      `  ${capabilities.length} capabilit${capabilities.length === 1 ? "y" : "ies"} registered`
    )
  );
}
