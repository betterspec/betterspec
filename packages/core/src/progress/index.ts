/**
 * Progress tracking
 * Calculate completion percentages and status summaries
 */

import type { Change, Task, TaskStatus, betterspecProject } from "../types/index.js";
import { listChanges } from "../spec/index.js";
import { listCapabilities } from "../knowledge/index.js";

export interface TaskSummary {
  total: number;
  pending: number;
  inProgress: number;
  passed: number;
  failed: number;
  blocked: number;
  completionPercent: number;
}

export interface ProjectSummary {
  activeChanges: number;
  archivedChanges: number;
  totalCapabilities: number;
  taskSummary: TaskSummary;
  changes: Array<{
    name: string;
    status: string;
    taskSummary: TaskSummary;
  }>;
}

export function summarizeTasks(tasks: Task[]): TaskSummary {
  const total = tasks.length;
  if (total === 0) {
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      passed: 0,
      failed: 0,
      blocked: 0,
      completionPercent: 0,
    };
  }

  const pending = tasks.filter((t) => t.status === "pending").length;
  const inProgress = tasks.filter(
    (t) =>
      t.status === "claimed" ||
      t.status === "in-progress" ||
      t.status === "implemented" ||
      t.status === "validating"
  ).length;
  const passed = tasks.filter((t) => t.status === "passed").length;
  const failed = tasks.filter((t) => t.status === "failed").length;
  const blocked = tasks.filter((t) => t.status === "blocked").length;

  const completionPercent = Math.round((passed / total) * 100);

  return { total, pending, inProgress, passed, failed, blocked, completionPercent };
}

export async function getProjectSummary(
  projectRoot: string
): Promise<ProjectSummary> {
  const activeChanges = await listChanges(projectRoot, false);
  const allChanges = await listChanges(projectRoot, true);
  const archivedChanges = allChanges.filter((c) => c.status === "archived");
  const capabilities = await listCapabilities(projectRoot);

  const allTasks = activeChanges.flatMap((c) => c.tasks);

  return {
    activeChanges: activeChanges.length,
    archivedChanges: archivedChanges.length,
    totalCapabilities: capabilities.length,
    taskSummary: summarizeTasks(allTasks),
    changes: activeChanges.map((c) => ({
      name: c.name,
      status: c.status,
      taskSummary: summarizeTasks(c.tasks),
    })),
  };
}
