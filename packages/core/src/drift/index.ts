/**
 * Drift detection
 * Identify where specs and implementation have diverged
 *
 * Drift categories:
 * - unspecced-change: files modified that aren't in any active spec
 * - stale-spec: specs with no progress or activity
 * - missing-capability: archived changes without capabilities extracted
 * - outdated-knowledge: knowledge base files that may be stale
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileExists, getbetterspecDir } from "../config/index.js";
import { listChanges, readChange, readChangeFile, getArchiveDir } from "../spec/index.js";
import { listCapabilities } from "../knowledge/index.js";
import type { DriftItem, DriftReport, DriftSeverity, Change } from "../types/index.js";

/**
 * Run a full drift analysis on the project
 */
export async function analyzeDrift(projectRoot: string): Promise<DriftReport> {
  const items: DriftItem[] = [];

  await detectStaleSpecs(projectRoot, items);
  await detectMissingCapabilities(projectRoot, items);
  await detectIncompleteSpecs(projectRoot, items);
  await detectStaleKnowledge(projectRoot, items);

  const score = calculateScore(items);

  return {
    score,
    items,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Detect changes that have gone stale (no updates in a while)
 */
async function detectStaleSpecs(
  projectRoot: string,
  items: DriftItem[]
): Promise<void> {
  const changes = await listChanges(projectRoot, false);
  const now = Date.now();

  for (const change of changes) {
    const daysSinceUpdate = Math.floor(
      (now - new Date(change.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (change.status === "proposed" && daysSinceUpdate > 14) {
      items.push({
        type: "stale-spec",
        severity: "warning",
        spec: change.name,
        message: `"${change.name}" proposed ${daysSinceUpdate} days ago with no progress — consider clarifying or closing`,
      });
    } else if (change.status === "proposed" && daysSinceUpdate > 7) {
      items.push({
        type: "stale-spec",
        severity: "info",
        spec: change.name,
        message: `"${change.name}" proposed ${daysSinceUpdate} days ago — consider running \`betterspec clarify ${change.name}\``,
      });
    }

    if (change.status === "in-progress" && daysSinceUpdate > 7) {
      items.push({
        type: "stale-spec",
        severity: "warning",
        spec: change.name,
        message: `"${change.name}" in progress for ${daysSinceUpdate} days since last update`,
      });
    }

    if (change.status === "validating" && daysSinceUpdate > 3) {
      items.push({
        type: "stale-spec",
        severity: "warning",
        spec: change.name,
        message: `"${change.name}" awaiting validation for ${daysSinceUpdate} days`,
      });
    }

    // Check for stale tasks: status is in-progress but all tasks still pending
    if (
      change.status === "in-progress" &&
      change.tasks.length > 0 &&
      change.tasks.every((t) => t.status === "pending")
    ) {
      items.push({
        type: "stale-spec",
        severity: "warning",
        spec: change.name,
        message: `"${change.name}" is in-progress but all ${change.tasks.length} tasks are still pending`,
      });
    }
  }
}

/**
 * Detect archived changes that don't have capabilities extracted
 */
async function detectMissingCapabilities(
  projectRoot: string,
  items: DriftItem[]
): Promise<void> {
  const archiveDir = getArchiveDir(projectRoot);
  if (!(await fileExists(archiveDir))) return;

  const capabilities = await listCapabilities(projectRoot);
  const capSources = new Set(capabilities.map((c) => c.sourceChange));

  const entries = await readdir(archiveDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    // Archive names are like "2025-01-15-feature-name"
    // The original change name is everything after the date prefix
    const match = entry.name.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
    const changeName = match ? match[1] : entry.name;

    // Check for outcome.md
    const outcomePath = join(archiveDir, entry.name, "outcome.md");
    if (!(await fileExists(outcomePath))) {
      items.push({
        type: "missing-capability",
        severity: "warning",
        spec: changeName,
        message: `Archived change "${changeName}" has no outcome.md — knowledge not captured`,
      });
      continue;
    }

    // Check if capabilities were extracted
    if (!capSources.has(changeName)) {
      items.push({
        type: "missing-capability",
        severity: "info",
        spec: changeName,
        message: `Archived change "${changeName}" has outcome.md but no capabilities extracted`,
      });
    }
  }
}

/**
 * Detect active changes with incomplete spec files
 */
async function detectIncompleteSpecs(
  projectRoot: string,
  items: DriftItem[]
): Promise<void> {
  const changes = await listChanges(projectRoot, false);

  for (const change of changes) {
    // Only flag incomplete specs for changes that are past the proposal stage
    if (change.status === "proposed") continue;

    const specFiles = [
      { path: "specs/requirements.md", name: "requirements" },
      { path: "specs/scenarios.md", name: "scenarios" },
      { path: "design.md", name: "design" },
      { path: "tasks.md", name: "tasks" },
    ];

    for (const spec of specFiles) {
      try {
        const content = await readChangeFile(projectRoot, change.name, spec.path);
        const stripped = content.replace(/<!--.*?-->/gs, "").trim();
        if (stripped.length < 50) {
          const severity: DriftSeverity =
            change.status === "in-progress" ? "warning" : "info";
          items.push({
            type: "stale-spec",
            severity,
            spec: change.name,
            file: spec.path,
            message: `"${change.name}/${spec.path}" has minimal content (status: ${change.status})`,
          });
        }
      } catch {
        items.push({
          type: "stale-spec",
          severity: "critical",
          spec: change.name,
          file: spec.path,
          message: `"${change.name}/${spec.path}" is missing`,
        });
      }
    }
  }
}

/**
 * Detect knowledge base files that may be outdated
 */
async function detectStaleKnowledge(
  projectRoot: string,
  items: DriftItem[]
): Promise<void> {
  const betterspecDir = getbetterspecDir(projectRoot);
  const knowledgeDir = join(betterspecDir, "knowledge");

  const knowledgeFiles = [
    { path: "architecture.md", name: "Architecture" },
    { path: "patterns.md", name: "Patterns" },
    { path: "glossary.md", name: "Glossary" },
  ];

  for (const kb of knowledgeFiles) {
    const filePath = join(knowledgeDir, kb.path);
    if (!(await fileExists(filePath))) {
      items.push({
        type: "outdated-knowledge",
        severity: "info",
        file: `knowledge/${kb.path}`,
        message: `${kb.name} documentation is missing`,
      });
      continue;
    }

    try {
      const content = await readFile(filePath, "utf-8");
      const stripped = content.replace(/<!--.*?-->/gs, "").trim();
      if (stripped.length < 50) {
        items.push({
          type: "outdated-knowledge",
          severity: "info",
          file: `knowledge/${kb.path}`,
          message: `${kb.name} documentation has minimal content`,
        });
      }

      // Check staleness by file modification time
      const stats = await stat(filePath);
      const daysSinceModified = Math.floor(
        (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24)
      );

      // Only flag if there have been archived changes since the last update
      const capabilities = await listCapabilities(projectRoot);
      const recentCaps = capabilities.filter((c) => {
        const archiveTime = new Date(c.archivedAt).getTime();
        return archiveTime > stats.mtimeMs;
      });

      if (recentCaps.length > 0 && daysSinceModified > 7) {
        items.push({
          type: "outdated-knowledge",
          severity: "warning",
          file: `knowledge/${kb.path}`,
          message: `${kb.name} not updated since ${recentCaps.length} capabilities were archived`,
        });
      }
    } catch {
      // Ignore read errors
    }
  }
}

/**
 * Calculate drift score (0-100, where 100 = no drift)
 */
function calculateScore(items: DriftItem[]): number {
  if (items.length === 0) return 100;

  let penalty = 0;
  for (const item of items) {
    switch (item.severity) {
      case "critical":
        penalty += 15;
        break;
      case "warning":
        penalty += 5;
        break;
      case "info":
        penalty += 1;
        break;
    }
  }

  return Math.max(0, 100 - penalty);
}
