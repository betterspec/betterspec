import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { analyzeDrift } from "./index.js";
import { createDefaultConfig, writeConfig } from "../config/index.js";
import { createChange, updateChangeStatus, getArchiveDir, archiveChange } from "../spec/index.js";
import { scaffoldSpecDirs } from "../spec/index.js";
import { scaffoldKnowledge, addCapability } from "../knowledge/index.js";
import type { Capability } from "../types/index.js";

const TEST_ROOT = join(import.meta.dirname, "__test_drift__");

beforeEach(async () => {
  await mkdir(join(TEST_ROOT, "forgelore"), { recursive: true });
  await writeConfig(TEST_ROOT, createDefaultConfig("local"));
  await scaffoldSpecDirs(TEST_ROOT);
  await scaffoldKnowledge(TEST_ROOT);
});

afterEach(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("analyzeDrift", () => {
  it("returns perfect score with no changes", async () => {
    const report = await analyzeDrift(TEST_ROOT);
    expect(report.score).toBe(100);
    expect(report.items).toHaveLength(0);
    expect(report.timestamp).toBeDefined();
  });

  it("returns a valid timestamp", async () => {
    const report = await analyzeDrift(TEST_ROOT);
    expect(new Date(report.timestamp).getTime()).not.toBeNaN();
  });
});

describe("stale spec detection", () => {
  it("flags proposals older than 14 days as warning", async () => {
    const change = await createChange(TEST_ROOT, "old-proposal", "# Proposal\n\nSome old idea");

    // Manually backdate the metadata
    const metaPath = join(change.path, ".forge-meta.json");
    const meta = { ...change, updatedAt: daysAgo(15) };
    await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf-8");

    const report = await analyzeDrift(TEST_ROOT);
    const staleItems = report.items.filter(
      (i) => i.type === "stale-spec" && i.spec === "old-proposal"
    );
    expect(staleItems.length).toBeGreaterThanOrEqual(1);
    expect(staleItems.some((i) => i.severity === "warning")).toBe(true);
  });

  it("flags proposals older than 7 days as info", async () => {
    const change = await createChange(TEST_ROOT, "week-old", "# Proposal\n\nWeek old idea");

    const metaPath = join(change.path, ".forge-meta.json");
    const meta = { ...change, updatedAt: daysAgo(10) };
    await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf-8");

    const report = await analyzeDrift(TEST_ROOT);
    const staleItems = report.items.filter(
      (i) => i.type === "stale-spec" && i.spec === "week-old"
    );
    expect(staleItems.length).toBeGreaterThanOrEqual(1);
    expect(staleItems.some((i) => i.severity === "info")).toBe(true);
  });

  it("flags in-progress changes stale after 7 days", async () => {
    const change = await createChange(TEST_ROOT, "long-running", "# Proposal\n\nTaking too long");
    await updateChangeStatus(TEST_ROOT, "long-running", "in-progress");

    // Backdate
    const metaPath = join(change.path, ".forge-meta.json");
    const raw = await import("node:fs/promises").then((fs) => fs.readFile(metaPath, "utf-8"));
    const meta = JSON.parse(raw);
    meta.updatedAt = daysAgo(10);
    await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf-8");

    const report = await analyzeDrift(TEST_ROOT);
    const staleItems = report.items.filter(
      (i) => i.type === "stale-spec" && i.spec === "long-running" && i.message.includes("in progress")
    );
    expect(staleItems.length).toBeGreaterThanOrEqual(1);
    expect(staleItems[0].severity).toBe("warning");
  });

  it("flags validating changes stale after 3 days", async () => {
    const change = await createChange(TEST_ROOT, "stuck-validation", "# Proposal\n\nStuck validating");
    await updateChangeStatus(TEST_ROOT, "stuck-validation", "validating");

    const metaPath = join(change.path, ".forge-meta.json");
    const raw = await import("node:fs/promises").then((fs) => fs.readFile(metaPath, "utf-8"));
    const meta = JSON.parse(raw);
    meta.updatedAt = daysAgo(5);
    await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf-8");

    const report = await analyzeDrift(TEST_ROOT);
    const staleItems = report.items.filter(
      (i) => i.type === "stale-spec" && i.spec === "stuck-validation" && i.message.includes("validation")
    );
    expect(staleItems.length).toBeGreaterThanOrEqual(1);
    expect(staleItems[0].severity).toBe("warning");
  });

  it("flags in-progress with all-pending tasks", async () => {
    const change = await createChange(TEST_ROOT, "no-started-tasks", "# Proposal\n\nTasks not started");

    const metaPath = join(change.path, ".forge-meta.json");
    const raw = await import("node:fs/promises").then((fs) => fs.readFile(metaPath, "utf-8"));
    const meta = JSON.parse(raw);
    meta.status = "in-progress";
    meta.tasks = [
      { id: "1", title: "Task 1", description: "", status: "pending" },
      { id: "2", title: "Task 2", description: "", status: "pending" },
    ];
    await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf-8");

    const report = await analyzeDrift(TEST_ROOT);
    const taskItems = report.items.filter(
      (i) => i.spec === "no-started-tasks" && i.message.includes("tasks are still pending")
    );
    expect(taskItems.length).toBe(1);
    expect(taskItems[0].severity).toBe("warning");
  });
});

describe("missing capability detection", () => {
  it("flags archived changes without outcome.md", async () => {
    // Create an archived change directory manually (archive format: date-name)
    const archiveDir = getArchiveDir(TEST_ROOT);
    const archivedPath = join(archiveDir, "2025-01-15-some-feature");
    await mkdir(archivedPath, { recursive: true });

    const report = await analyzeDrift(TEST_ROOT);
    const missingItems = report.items.filter(
      (i) => i.type === "missing-capability" && i.spec === "some-feature"
    );
    expect(missingItems.length).toBe(1);
    expect(missingItems[0].severity).toBe("warning");
    expect(missingItems[0].message).toContain("no outcome.md");
  });

  it("flags archived changes with outcome but no capabilities", async () => {
    const archiveDir = getArchiveDir(TEST_ROOT);
    const archivedPath = join(archiveDir, "2025-01-15-feature-x");
    await mkdir(archivedPath, { recursive: true });
    await writeFile(
      join(archivedPath, "outcome.md"),
      "# Outcome\n\nWe built a great feature that does things.\n\n## Capabilities\n\n- Feature X capability",
      "utf-8"
    );

    const report = await analyzeDrift(TEST_ROOT);
    const missingItems = report.items.filter(
      (i) => i.type === "missing-capability" && i.spec === "feature-x"
    );
    expect(missingItems.length).toBe(1);
    expect(missingItems[0].severity).toBe("info");
    expect(missingItems[0].message).toContain("no capabilities extracted");
  });

  it("does not flag archived changes with extracted capabilities", async () => {
    const archiveDir = getArchiveDir(TEST_ROOT);
    const archivedPath = join(archiveDir, "2025-01-15-complete-feature");
    await mkdir(archivedPath, { recursive: true });
    await writeFile(
      join(archivedPath, "outcome.md"),
      "# Outcome\n\nComplete feature with all capabilities extracted.",
      "utf-8"
    );

    // Add a capability referencing this change
    const cap: Capability = {
      id: "cap-complete-feature",
      name: "Complete Feature",
      description: "A fully extracted capability",
      sourceChange: "complete-feature",
      archivedAt: "2025-01-15T00:00:00.000Z",
      files: ["src/feature.ts"],
      tags: ["feature"],
    };
    await addCapability(TEST_ROOT, cap);

    const report = await analyzeDrift(TEST_ROOT);
    const missingItems = report.items.filter(
      (i) => i.type === "missing-capability" && i.spec === "complete-feature"
    );
    expect(missingItems.length).toBe(0);
  });
});

describe("incomplete spec detection", () => {
  it("flags missing spec files for non-proposed changes", async () => {
    // Create a change that's in-progress but delete a spec file
    const change = await createChange(TEST_ROOT, "missing-specs", "# Proposal\n\nThis will have missing specs");
    await updateChangeStatus(TEST_ROOT, "missing-specs", "in-progress");

    // Remove requirements.md to trigger missing file detection
    await rm(join(change.path, "specs", "requirements.md"));

    const report = await analyzeDrift(TEST_ROOT);
    const incompleteItems = report.items.filter(
      (i) => i.spec === "missing-specs" && i.file === "specs/requirements.md"
    );
    expect(incompleteItems.length).toBe(1);
    expect(incompleteItems[0].severity).toBe("critical");
    expect(incompleteItems[0].message).toContain("missing");
  });

  it("flags spec files with minimal content", async () => {
    const change = await createChange(TEST_ROOT, "thin-specs", "# Proposal\n\nThis will have thin specs");
    await updateChangeStatus(TEST_ROOT, "thin-specs", "in-progress");

    // Write minimal content to design.md
    await writeFile(join(change.path, "design.md"), "# Design\n\nTBD", "utf-8");

    const report = await analyzeDrift(TEST_ROOT);
    const thinItems = report.items.filter(
      (i) => i.spec === "thin-specs" && i.file === "design.md"
    );
    expect(thinItems.length).toBe(1);
    expect(thinItems[0].severity).toBe("warning");
    expect(thinItems[0].message).toContain("minimal content");
  });

  it("does not flag proposed changes for incomplete specs", async () => {
    await createChange(TEST_ROOT, "just-proposed", "# Proposal\n\nJust a proposal");

    const report = await analyzeDrift(TEST_ROOT);
    const proposedItems = report.items.filter(
      (i) => i.spec === "just-proposed" && i.type === "stale-spec" && i.file
    );
    // Proposed changes are skipped by detectIncompleteSpecs
    expect(proposedItems.length).toBe(0);
  });
});

describe("stale knowledge detection", () => {
  it("flags missing knowledge files", async () => {
    // Remove one of the scaffolded knowledge files
    await rm(join(TEST_ROOT, "forgelore", "knowledge", "architecture.md"));

    const report = await analyzeDrift(TEST_ROOT);
    const knowledgeItems = report.items.filter(
      (i) => i.type === "outdated-knowledge" && i.file === "knowledge/architecture.md"
    );
    expect(knowledgeItems.length).toBe(1);
    expect(knowledgeItems[0].severity).toBe("info");
    expect(knowledgeItems[0].message).toContain("missing");
  });

  it("flags knowledge files with minimal content", async () => {
    // Overwrite patterns.md with minimal content
    await writeFile(
      join(TEST_ROOT, "forgelore", "knowledge", "patterns.md"),
      "# Patterns\n\n",
      "utf-8"
    );

    const report = await analyzeDrift(TEST_ROOT);
    const minimalItems = report.items.filter(
      (i) =>
        i.type === "outdated-knowledge" &&
        i.file === "knowledge/patterns.md" &&
        i.message.includes("minimal content")
    );
    expect(minimalItems.length).toBe(1);
    expect(minimalItems[0].severity).toBe("info");
  });
});

describe("drift scoring", () => {
  it("deducts 15 per critical item", async () => {
    const change = await createChange(TEST_ROOT, "score-test", "# Proposal\n\nTest scoring");
    await updateChangeStatus(TEST_ROOT, "score-test", "in-progress");

    // Remove all 4 spec files to get 4 critical items
    await rm(join(change.path, "specs", "requirements.md"));
    await rm(join(change.path, "specs", "scenarios.md"));
    await rm(join(change.path, "design.md"));
    await rm(join(change.path, "tasks.md"));

    const report = await analyzeDrift(TEST_ROOT);
    const criticalCount = report.items.filter((i) => i.severity === "critical").length;
    expect(criticalCount).toBe(4);
    // 100 - (4 * 15) = 40, but there may be info items from knowledge too
    expect(report.score).toBeLessThanOrEqual(40);
  });

  it("deducts 5 per warning item", async () => {
    const change = await createChange(TEST_ROOT, "warn-test", "# Proposal\n\nWarn scoring");
    await updateChangeStatus(TEST_ROOT, "warn-test", "in-progress");

    // Backdate to trigger stale-spec warning
    const metaPath = join(change.path, ".forge-meta.json");
    const raw = await import("node:fs/promises").then((fs) => fs.readFile(metaPath, "utf-8"));
    const meta = JSON.parse(raw);
    meta.updatedAt = daysAgo(10);
    await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf-8");

    const report = await analyzeDrift(TEST_ROOT);
    const warningCount = report.items.filter((i) => i.severity === "warning").length;
    expect(warningCount).toBeGreaterThanOrEqual(1);
    // Score should be less than 100 but reflect the warnings
    expect(report.score).toBeLessThan(100);
  });

  it("score never goes below 0", async () => {
    // Create many problems at once
    for (let i = 0; i < 5; i++) {
      const change = await createChange(TEST_ROOT, `bad-change-${i}`, "# Proposal\n\nBad");
      await updateChangeStatus(TEST_ROOT, `bad-change-${i}`, "in-progress");
      // Remove all spec files
      await rm(join(change.path, "specs", "requirements.md"));
      await rm(join(change.path, "specs", "scenarios.md"));
      await rm(join(change.path, "design.md"));
      await rm(join(change.path, "tasks.md"));
    }

    const report = await analyzeDrift(TEST_ROOT);
    expect(report.score).toBeGreaterThanOrEqual(0);
  });
});

// --- Helpers ---

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
