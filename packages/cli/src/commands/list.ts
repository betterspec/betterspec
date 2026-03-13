/**
 * betterspec list command
 * List all changes with status and progress
 */

import { resolve } from "node:path";
import Table from "cli-table3";
import {
  configExists,
  listChanges,
} from "@betterspec/core";
import { summarizeTasks } from "@betterspec/core";
import { renderBox, renderSection } from "../ui/banner.js";
import { colors, icons, statusColor, progressBar } from "../ui/theme.js";

export async function listCommand(options?: {
  archived?: boolean;
  status?: string;
  cwd?: string;
}): Promise<void> {
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

  let changes = await listChanges(projectRoot, options?.archived ?? false);

  // Filter by status if specified
  if (options?.status) {
    changes = changes.filter((c) => c.status === options.status);
  }

  if (changes.length === 0) {
    const msg = options?.status
      ? `No changes with status "${options.status}".`
      : "No changes found.";
    console.log(
      renderBox(
        `${icons.info} ${msg}\nRun ${colors.primary("betterspec propose")} to create one.`,
        "Changes"
      )
    );
    return;
  }

  const table = new Table({
    head: [
      colors.bold("Name"),
      colors.bold("Status"),
      colors.bold("Tasks"),
      colors.bold("Progress"),
      colors.bold("Updated"),
    ].map(String),
    style: { head: [], border: ["gray"] },
    colWidths: [28, 14, 10, 26, 14],
  });

  for (const change of changes) {
    const ts = summarizeTasks(change.tasks);
    const taskStr = ts.total > 0 ? `${ts.passed}/${ts.total}` : colors.muted("--");
    const progress = ts.total > 0 ? progressBar(ts.completionPercent) : colors.muted("--");
    const updated = colors.dim(change.updatedAt.slice(0, 10));

    table.push([
      colors.white(change.name),
      statusColor(change.status),
      taskStr,
      progress,
      updated,
    ]);
  }

  const title = options?.archived ? "All Changes (including archived)" : "Active Changes";
  console.log(renderSection(title, table.toString()));
  console.log(
    colors.muted(`  ${changes.length} change${changes.length === 1 ? "" : "s"} found`)
  );
}
