import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { writeConfig, createDefaultConfig } from "../config/index.js";
import { scaffoldSpecDirs, createChange } from "../spec/index.js";
import { scaffoldKnowledge } from "../knowledge/index.js";
import { summarizeTasks, getProjectSummary } from "./index.js";
import type { Task } from "../types/index.js";

const TEST_ROOT = join(import.meta.dirname, "__test_progress__");

beforeEach(async () => {
  await mkdir(join(TEST_ROOT, "betterspec"), { recursive: true });
  await writeConfig(TEST_ROOT, createDefaultConfig("local"));
  await scaffoldSpecDirs(TEST_ROOT);
  await scaffoldKnowledge(TEST_ROOT);
});

afterEach(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("summarizeTasks", () => {
  it("returns zeros for empty task list", () => {
    const summary = summarizeTasks([]);
    expect(summary.total).toBe(0);
    expect(summary.completionPercent).toBe(0);
  });

  it("counts tasks by status", () => {
    const tasks: Task[] = [
      { id: "1", title: "A", description: "", status: "pending" },
      { id: "2", title: "B", description: "", status: "in-progress" },
      { id: "3", title: "C", description: "", status: "passed" },
      { id: "4", title: "D", description: "", status: "failed" },
      { id: "5", title: "E", description: "", status: "blocked" },
    ];

    const summary = summarizeTasks(tasks);
    expect(summary.total).toBe(5);
    expect(summary.pending).toBe(1);
    expect(summary.inProgress).toBe(1);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.blocked).toBe(1);
    expect(summary.completionPercent).toBe(20); // 1/5
  });

  it("calculates 100% when all passed", () => {
    const tasks: Task[] = [
      { id: "1", title: "A", description: "", status: "passed" },
      { id: "2", title: "B", description: "", status: "passed" },
    ];
    expect(summarizeTasks(tasks).completionPercent).toBe(100);
  });
});

describe("getProjectSummary", () => {
  it("returns summary for empty project", async () => {
    const summary = await getProjectSummary(TEST_ROOT);
    expect(summary.activeChanges).toBe(0);
    expect(summary.archivedChanges).toBe(0);
    expect(summary.totalCapabilities).toBe(0);
    expect(summary.changes).toEqual([]);
  });

  it("counts active changes", async () => {
    await createChange(TEST_ROOT, "feat-a", "# A");
    await createChange(TEST_ROOT, "feat-b", "# B");

    const summary = await getProjectSummary(TEST_ROOT);
    expect(summary.activeChanges).toBe(2);
    expect(summary.changes).toHaveLength(2);
  });
});
