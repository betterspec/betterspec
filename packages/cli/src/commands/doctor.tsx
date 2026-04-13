/**
 * betterspec doctor command — INK version
 * Health check and diagnostics for betterspec configuration
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve, join } from "node:path";
import { mkdir } from "node:fs/promises";
import {
  configExists,
  readConfig,
  fileExists,
  getbetterspecDir,
  listChanges,
} from "@betterspec/core";
import {
  BetterspecBox,
  Spinner,
  colors,
} from "../ui/ink/index.js";

interface HealthCheck {
  name: string;
  passed: boolean;
  message: string;
  fixable?: boolean;
}

interface DoctorDashboardProps {
  projectRoot: string;
  fix?: boolean;
}

const CheckRow: React.FC<{ check: HealthCheck; didFix?: boolean }> = ({
  check,
  didFix,
}) => (
  <InkBox>
    <Text color={check.passed ? colors.success : colors.error}>
      {check.passed ? "\u2713" : "\u2717"}
    </Text>
    <Text> </Text>
    <Text bold={!check.passed} color={check.passed ? colors.muted : colors.warning}>
      {check.name}
    </Text>
    <Text dimColor>: </Text>
    <Text color={check.passed ? colors.muted : colors.warning}>
      {check.message}
      {!check.passed && check.fixable && didFix ? " (fixed)" : ""}
    </Text>
  </InkBox>
);

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  projectRoot,
  fix,
}) => {
  const [state, setState] = React.useState<{
    phase: "running" | "done";
    checks: HealthCheck[];
    didFix?: boolean;
  }>({ phase: "running", checks: [] });

  React.useEffect(() => {
    runChecks().then((checks) => {
      setState({ phase: "done", checks, didFix: false });
    });
  }, [projectRoot, fix]);

  const runChecks = async (): Promise<HealthCheck[]> => {
    const checks: HealthCheck[] = [];
    const betterspecDir = getbetterspecDir(projectRoot);

    // 1. Config exists
    const hasConfig = await configExists(projectRoot);
    checks.push({
      name: "Configuration",
      passed: hasConfig,
      message: hasConfig
        ? "betterspec.json found"
        : "betterspec.json not found — run betterspec init",
    });
    setState((s) => ({ ...s, checks: [...checks] }));

    if (!hasConfig) return checks;

    // 2. Config parseable
    let config: any;
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
      setState((s) => ({ ...s, checks: [...checks] }));
      return checks;
    }
    setState((s) => ({ ...s, checks: [...checks] }));

    // 3. Directory structure
    const dirs = [
      { path: join(betterspecDir, "changes"), name: "changes/" },
      {
        path: join(betterspecDir, "changes", "archive"),
        name: "changes/archive/",
      },
      { path: join(betterspecDir, "knowledge"), name: "knowledge/" },
      {
        path: join(betterspecDir, "knowledge", "capabilities"),
        name: "knowledge/capabilities/",
      },
      {
        path: join(betterspecDir, "knowledge", "decisions"),
        name: "knowledge/decisions/",
      },
    ];

    for (const dir of dirs) {
      const exists = await fileExists(dir.path);
      checks.push({
        name: `Dir: ${dir.name}`,
        passed: exists,
        message: exists ? `${dir.name} exists` : `${dir.name} missing`,
        fixable: true,
      });
      setState((s) => ({ ...s, checks: [...checks] }));

      if (!exists && fix) {
        await mkdir(dir.path, { recursive: true });
        const idx = checks.length - 1;
        checks[idx] = { ...checks[idx], passed: true };
        setState((s) => ({ ...s, checks: [...checks], didFix: true }));
      }
    }

    // 4. Knowledge base files
    const knowledgeFiles = [
      {
        path: join(betterspecDir, "knowledge", "architecture.md"),
        name: "architecture.md",
      },
      {
        path: join(betterspecDir, "knowledge", "patterns.md"),
        name: "patterns.md",
      },
      {
        path: join(betterspecDir, "knowledge", "glossary.md"),
        name: "glossary.md",
      },
    ];

    for (const file of knowledgeFiles) {
      const exists = await fileExists(file.path);
      checks.push({
        name: `KB: ${file.name}`,
        passed: exists,
        message: exists ? `${file.name} present` : `${file.name} missing`,
      });
      setState((s) => ({ ...s, checks: [...checks] }));
    }

    // 5. Changes health
    try {
      const changes = await listChanges(projectRoot, false);
      checks.push({
        name: "Active Changes",
        passed: true,
        message: `${changes.length} active change${changes.length === 1 ? "" : "s"}`,
      });
      setState((s) => ({ ...s, checks: [...checks] }));

      for (const change of changes) {
        const hasProposal = await fileExists(
          join(change.path, "proposal.md")
        );
        if (!hasProposal) {
          checks.push({
            name: `Change: ${change.name}`,
            passed: false,
            message: `${change.name} has metadata but missing proposal.md`,
          });
          setState((s) => ({ ...s, checks: [...checks] }));
        }
      }
    } catch {
      checks.push({
        name: "Active Changes",
        passed: false,
        message: "Could not read changes directory",
      });
      setState((s) => ({ ...s, checks: [...checks] }));
    }

    // 6. Global sync (if applicable)
    if (config.mode !== "local" && config.global) {
      const globalExists = await fileExists(config.global.path);
      checks.push({
        name: "Global Repo",
        passed: globalExists,
        message: globalExists
          ? `Global specs available at ${config.global.path}`
          : `Global specs not found — run betterspec sync`,
      });
      setState((s) => ({ ...s, checks: [...checks] }));
    }

    return checks;
  };

  const { checks, didFix } = state;
  const passed = checks.filter((c) => c.passed).length;
  const total = checks.length;
  const allPassed = passed === total;
  const borderColor = (allPassed
    ? colors.success
    : passed > total / 2
      ? colors.warning
      : colors.error) as any;

  if (state.phase === "running") {
    return (
      <BetterspecBox title="betterspec doctor" borderColor="accent">
        <Spinner label="Running health checks..." />
      </BetterspecBox>
    );
  }

  return (
    <InkBox flexDirection="column">
      <BetterspecBox title="betterspec doctor" borderColor="accent">
        <Text color={allPassed ? colors.success : colors.warning}>
          {allPassed ? "\u2713" : "\u26A0"}{" "}
        </Text>
        <Text>
          {passed}/{total} checks passed
        </Text>
      </BetterspecBox>

      <InkBox paddingTop={1}>
        <BetterspecBox title="Results" borderColor={borderColor}>
          <InkBox flexDirection="column" gap={0}>
            {checks.map((check, i) => (
              <CheckRow key={i} check={check} didFix={didFix} />
            ))}
          </InkBox>
        </BetterspecBox>
      </InkBox>

      {!allPassed && !didFix && (
        <InkBox paddingTop={1} paddingLeft={1}>
          <Text dimColor>
            Run{" "}
            <Text color={colors.primary}>betterspec doctor --fix</Text>
            <Text dimColor> to auto-fix issues.</Text>
          </Text>
        </InkBox>
      )}
    </InkBox>
  );
};

export async function doctorCommand(options?: {
  fix?: boolean;
  cwd?: string;
}): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());
  render(<DoctorDashboard projectRoot={projectRoot} fix={options?.fix} />);
}
