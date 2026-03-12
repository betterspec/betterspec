/**
 * forgelore doctor command
 * Health check and diagnostics for forgelore configuration
 */

import ora from "ora";
import { resolve, join } from "node:path";
import { mkdir } from "node:fs/promises";
import {
  configExists,
  readConfig,
  fileExists,
  getForgeloreDir,
  listChanges,
  listCapabilities,
} from "@forgelore/core";
import { renderBox, renderSection } from "../ui/banner.js";
import { colors, icons } from "../ui/theme.js";

interface HealthCheck {
  name: string;
  passed: boolean;
  message: string;
  fixable?: boolean;
}

export async function doctorCommand(options?: {
  fix?: boolean;
  cwd?: string;
}): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());
  const forgeloreDir = getForgeloreDir(projectRoot);
  const checks: HealthCheck[] = [];

  console.log(
    renderBox(
      `${icons.info} Running health checks...`,
      "forgelore doctor"
    )
  );

  // 1. Config exists
  const hasConfig = await configExists(projectRoot);
  checks.push({
    name: "Configuration",
    passed: hasConfig,
    message: hasConfig
      ? "forgelore.json found"
      : "forgelore.json not found — run forgelore init",
  });

  if (!hasConfig) {
    printResults(checks);
    return;
  }

  // 2. Config parseable
  let config;
  try {
    config = await readConfig(projectRoot);
    checks.push({
      name: "Config Valid",
      passed: true,
      message: `Config parsed (v${config.version}, mode: ${config.mode})`,
    });
  } catch (err) {
    checks.push({
      name: "Config Valid",
      passed: false,
      message: `Config parse error: ${err instanceof Error ? err.message : String(err)}`,
    });
    printResults(checks);
    return;
  }

  // 3. Directory structure
  const dirs = [
    { path: join(forgeloreDir, "changes"), name: "changes/" },
    { path: join(forgeloreDir, "changes", "archive"), name: "changes/archive/" },
    { path: join(forgeloreDir, "knowledge"), name: "knowledge/" },
    { path: join(forgeloreDir, "knowledge", "capabilities"), name: "knowledge/capabilities/" },
    { path: join(forgeloreDir, "knowledge", "decisions"), name: "knowledge/decisions/" },
  ];

  for (const dir of dirs) {
    const exists = await fileExists(dir.path);
    checks.push({
      name: `Dir: ${dir.name}`,
      passed: exists,
      message: exists ? `${dir.name} exists` : `${dir.name} missing`,
      fixable: true,
    });

    if (!exists && options?.fix) {
      await mkdir(dir.path, { recursive: true });
    }
  }

  // 4. Knowledge base files
  const knowledgeFiles = [
    { path: join(forgeloreDir, "knowledge", "architecture.md"), name: "architecture.md" },
    { path: join(forgeloreDir, "knowledge", "patterns.md"), name: "patterns.md" },
    { path: join(forgeloreDir, "knowledge", "glossary.md"), name: "glossary.md" },
  ];

  for (const file of knowledgeFiles) {
    const exists = await fileExists(file.path);
    checks.push({
      name: `KB: ${file.name}`,
      passed: exists,
      message: exists ? `${file.name} present` : `${file.name} missing`,
    });
  }

  // 5. Changes health
  try {
    const changes = await listChanges(projectRoot, false);
    checks.push({
      name: "Active Changes",
      passed: true,
      message: `${changes.length} active change${changes.length === 1 ? "" : "s"}`,
    });

    // Check for orphaned metadata
    for (const change of changes) {
      const hasProposal = await fileExists(join(change.path, "proposal.md"));
      if (!hasProposal) {
        checks.push({
          name: `Change: ${change.name}`,
          passed: false,
          message: `${change.name} has metadata but missing proposal.md`,
        });
      }
    }
  } catch {
    checks.push({
      name: "Active Changes",
      passed: false,
      message: "Could not read changes directory",
    });
  }

  // 6. Global sync (if applicable)
  if (config.mode !== "local" && config.global) {
    const globalExists = await fileExists(config.global.path);
    checks.push({
      name: "Global Repo",
      passed: globalExists,
      message: globalExists
        ? `Global specs available at ${config.global.path}`
        : `Global specs not found at ${config.global.path} — run forgelore sync`,
    });
  }

  printResults(checks, options?.fix);
}

function printResults(checks: HealthCheck[], didFix?: boolean): void {
  const passed = checks.filter((c) => c.passed).length;
  const total = checks.length;
  const allPassed = passed === total;

  const lines = checks.map(
    (c) =>
      `  ${c.passed ? icons.success : icons.error} ${colors.white(c.name)}: ${c.passed ? colors.muted(c.message) : colors.warning(c.message)}${!c.passed && c.fixable && didFix ? colors.success(" (fixed)") : ""}`
  );

  const borderColor = allPassed ? "#10B981" : passed > total / 2 ? "#F59E0B" : "#EF4444";

  console.log(
    renderBox(
      `${allPassed ? icons.success : icons.warning} ${passed}/${total} checks passed\n\n${lines.join("\n")}`,
      "Results",
      borderColor
    )
  );

  if (!allPassed && !didFix) {
    const fixable = checks.filter((c) => !c.passed && c.fixable).length;
    if (fixable > 0) {
      console.log(
        colors.muted(`  Run ${colors.primary("forgelore doctor --fix")} to auto-fix ${fixable} issue${fixable === 1 ? "" : "s"}.`)
      );
    }
  }
}
