/**
 * betterspec diff command
 * Show structural drift between specs and current project state
 * NOTE: This is a structural check, not an LLM-powered analysis
 */

import { resolve, relative } from "node:path";
import { readdir, stat } from "node:fs/promises";
import Table from "cli-table3";
import {
  configExists,
  readConfig,
  listChanges,
  readChange,
  readChangeFile,
  getChangesDir,
  fileExists,
} from "@betterspec/core";
import { renderBox, renderSection } from "../ui/banner.js";
import { colors, icons, gradients } from "../ui/theme.js";

interface DriftItem {
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

export async function diffCommand(
  changeName?: string,
  options?: { cwd?: string }
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

  const driftItems: DriftItem[] = [];

  if (changeName) {
    // Analyze a specific change
    try {
      const change = await readChange(projectRoot, changeName);
      await analyzeChangeDrift(projectRoot, changeName, driftItems);
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
  } else {
    // Analyze all active changes
    const changes = await listChanges(projectRoot, false);

    if (changes.length === 0) {
      console.log(
        renderBox(
          `${icons.info} No active changes to analyze.\nRun ${colors.primary("betterspec propose")} to create one.`,
          "No Changes"
        )
      );
      return;
    }

    for (const change of changes) {
      await analyzeChangeDrift(projectRoot, change.name, driftItems);
    }
  }

  if (driftItems.length === 0) {
    console.log(
      renderBox(
        `${icons.success} No drift detected. Specs and implementation are in sync.`,
        "All Clear",
        "#10B981"
      )
    );
    return;
  }

  // Display drift items
  const table = new Table({
    head: [
      colors.bold("Severity"),
      colors.bold("Type"),
      colors.bold("Message"),
    ].map(String),
    style: { head: [], border: ["gray"] },
    colWidths: [12, 20, 55],
    wordWrap: true,
  });

  for (const item of driftItems) {
    const sevColor =
      item.severity === "critical"
        ? colors.error
        : item.severity === "warning"
          ? colors.warning
          : colors.muted;

    table.push([
      sevColor(item.severity),
      colors.white(item.type),
      colors.muted(item.message),
    ]);
  }

  const critical = driftItems.filter((d) => d.severity === "critical").length;
  const warnings = driftItems.filter((d) => d.severity === "warning").length;
  const info = driftItems.filter((d) => d.severity === "info").length;

  const summaryParts = [];
  if (critical > 0) summaryParts.push(colors.error(`${critical} critical`));
  if (warnings > 0) summaryParts.push(colors.warning(`${warnings} warnings`));
  if (info > 0) summaryParts.push(colors.muted(`${info} info`));

  console.log(
    renderSection("Drift Report", table.toString())
  );
  console.log(
    renderBox(
      `${critical > 0 ? icons.error : icons.warning} ${summaryParts.join(", ")}`,
      "Summary",
      critical > 0 ? "#EF4444" : "#F59E0B"
    )
  );
}

async function analyzeChangeDrift(
  projectRoot: string,
  changeName: string,
  items: DriftItem[]
): Promise<void> {
  // Check for stale changes (proposed but no activity for 7+ days)
  try {
    const change = await readChange(projectRoot, changeName);
    const updatedAt = new Date(change.updatedAt);
    const daysSince = Math.floor(
      (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince > 14 && change.status === "proposed") {
      items.push({
        type: "stale-proposal",
        severity: "warning",
        message: `"${changeName}" proposed ${daysSince} days ago with no progress`,
      });
    }

    if (daysSince > 7 && change.status === "in-progress") {
      items.push({
        type: "stale-progress",
        severity: "info",
        message: `"${changeName}" in progress for ${daysSince} days since last update`,
      });
    }

    // Check for empty spec files
    const specFiles = ["proposal.md", "specs/requirements.md", "specs/scenarios.md", "design.md", "tasks.md"];
    for (const file of specFiles) {
      try {
        const content = await readChangeFile(projectRoot, changeName, file);
        const stripped = content.replace(/<!--.*?-->/gs, "").trim();
        if (stripped.length < 30) {
          items.push({
            type: "empty-spec",
            severity: change.status === "in-progress" ? "warning" : "info",
            message: `"${changeName}/${file}" has minimal content`,
          });
        }
      } catch {
        items.push({
          type: "missing-file",
          severity: "critical",
          message: `"${changeName}/${file}" is missing`,
        });
      }
    }

    // Check for tasks with no progress if status is in-progress
    if (
      change.status === "in-progress" &&
      change.tasks.length > 0 &&
      change.tasks.every((t) => t.status === "pending")
    ) {
      items.push({
        type: "no-task-progress",
        severity: "warning",
        message: `"${changeName}" is in-progress but all ${change.tasks.length} tasks are still pending`,
      });
    }
  } catch {
    items.push({
      type: "read-error",
      severity: "critical",
      message: `Could not read change "${changeName}"`,
    });
  }
}
