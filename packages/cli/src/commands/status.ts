/**
 * forgelore status command
 * Beautiful dashboard showing all changes, progress, and capabilities
 */

import { resolve } from "node:path";
import Table from "cli-table3";
import {
  configExists,
  readConfig,
  listCapabilities,
  getProjectSummary,
} from "@forgelore/core";
import { renderBanner, renderBox, renderSection } from "../ui/banner.js";
import { colors, icons, gradients, statusColor, progressBar } from "../ui/theme.js";

export async function statusCommand(options?: { cwd?: string }): Promise<void> {
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

  console.log(renderBanner());

  const config = await readConfig(projectRoot);
  const summary = await getProjectSummary(projectRoot);
  const capabilities = await listCapabilities(projectRoot);

  // Header stats
  const statsLine = [
    `${colors.primary(String(summary.activeChanges))} active`,
    `${colors.success(String(summary.archivedChanges))} archived`,
    `${colors.secondary(String(summary.totalCapabilities))} capabilities`,
    `${colors.muted("mode:")} ${colors.accent(config.mode)}`,
  ].join(colors.muted("  \u2502  "));

  console.log(renderBox(statsLine, "forgelore status", "#7C3AED"));

  // Active changes table
  if (summary.changes.length > 0) {
    const table = new Table({
      head: [
        colors.bold("Change"),
        colors.bold("Status"),
        colors.bold("Tasks"),
        colors.bold("Progress"),
      ].map(String),
      style: { head: [], border: ["gray"] },
      colWidths: [30, 14, 10, 30],
    });

    for (const change of summary.changes) {
      const ts = change.taskSummary;
      const taskStr =
        ts.total > 0
          ? `${ts.passed}/${ts.total}`
          : colors.muted("none");
      const progress =
        ts.total > 0 ? progressBar(ts.completionPercent) : colors.muted("--");

      table.push([
        colors.white(change.name),
        statusColor(change.status),
        taskStr,
        progress,
      ]);
    }

    console.log(renderSection("Active Changes", table.toString()));
  } else {
    console.log(
      renderSection(
        "Active Changes",
        `  ${colors.muted("No active changes.")} Run ${colors.primary("forgelore propose")} to create one.`
      )
    );
  }

  // Capabilities
  if (capabilities.length > 0) {
    const capTable = new Table({
      head: [
        colors.bold("Capability"),
        colors.bold("Source"),
        colors.bold("Archived"),
      ].map(String),
      style: { head: [], border: ["gray"] },
      colWidths: [30, 25, 16],
    });

    for (const cap of capabilities.slice(0, 10)) {
      capTable.push([
        colors.white(cap.name),
        colors.muted(cap.sourceChange),
        colors.dim(cap.archivedAt.slice(0, 10)),
      ]);
    }

    const moreText =
      capabilities.length > 10
        ? `\n  ${colors.muted(`...and ${capabilities.length - 10} more. Run`)} ${colors.primary("forgelore capabilities")} ${colors.muted("to see all.")}`
        : "";

    console.log(
      renderSection("Capabilities", capTable.toString() + moreText)
    );
  } else {
    console.log(
      renderSection(
        "Capabilities",
        `  ${colors.muted("No capabilities yet.")} Archive a completed change to start building the knowledge base.`
      )
    );
  }

  // Global sync status
  if (config.mode === "local+global" || config.mode === "global") {
    const globalInfo = config.global
      ? `  ${icons.info} Source: ${colors.secondary(config.global.source)}\n` +
        `  ${icons.info} Path: ${colors.muted(config.global.path)}\n` +
        `  ${icons.info} Auto-sync: ${config.global.autoSync ? colors.success("enabled") : colors.muted("disabled")}`
      : `  ${colors.warning("Global spec repo not configured.")}`;

    console.log(renderSection("Global Specs", globalInfo));
  }
}
