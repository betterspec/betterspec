/**
 * betterspec diff command — delegates to analyzeDrift()
 * Shows structural drift between specs and current project state.
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import { configExists, analyzeDrift } from "@betterspec/core";
import type { DriftReport, DriftItem } from "@betterspec/core";
import { BetterspecBox, colors } from "../ui/ink/index.js";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#FF4444",
  warning: "#FFA500",
  info: "#888888",
};

const SEVERITY_ICON: Record<string, string> = {
  critical: "✗",
  warning: "⚠",
  info: "·",
};

const DriftItemRow: React.FC<{ item: DriftItem }> = ({ item }) => (
  <InkBox paddingLeft={2}>
    <Text color={SEVERITY_COLOR[item.severity] ?? colors.muted}>
      {SEVERITY_ICON[item.severity] ?? "·"}{" "}
    </Text>
    <Text>{item.message}</Text>
  </InkBox>
);

interface DiffDashboardProps {
  projectRoot: string;
  changeName?: string;
}

const DiffDashboard: React.FC<DiffDashboardProps> = ({
  projectRoot,
  changeName,
}) => {
  const [state, setState] = React.useState<{
    phase: "loading" | "done" | "error";
    report?: DriftReport;
    error?: string;
  }>({ phase: "loading" });

  React.useEffect(() => {
    (async () => {
      try {
        const report = await analyzeDrift(projectRoot);
        setState({ phase: "done", report });
      } catch (err: any) {
        setState({ phase: "error", error: err.message });
      }
    })();
  }, []);

  if (state.phase === "loading") {
    return (
      <BetterspecBox title="Drift" borderColor="accent">
        <Text dimColor>Analyzing drift...</Text>
      </BetterspecBox>
    );
  }

  if (state.phase === "error") {
    return (
      <BetterspecBox title="Drift" borderColor="error">
        <Text color={colors.error}>{state.error}</Text>
      </BetterspecBox>
    );
  }

  const { report } = state;
  if (!report) return null;

  // Filter by changeName if provided
  const items = changeName
    ? report.items.filter((i) => !i.spec || i.spec === changeName)
    : report.items;

  const critical = items.filter((i) => i.severity === "critical");
  const warnings = items.filter((i) => i.severity === "warning");
  const info = items.filter((i) => i.severity === "info");

  const scoreColor =
    report.score >= 80
      ? colors.success
      : report.score >= 50
        ? "#FFA500"
        : colors.error;

  return (
    <BetterspecBox
      title={changeName ? `Drift: ${changeName}` : "Drift Report"}
      borderColor={
        report.score >= 80
          ? "success"
          : report.score >= 50
            ? "warning"
            : "error"
      }
    >
      <InkBox flexDirection="column" gap={1}>
        {/* Score */}
        <InkBox>
          <Text dimColor>Score: </Text>
          <Text bold color={scoreColor}>
            {report.score}/100
          </Text>
          {items.length === 0 && <Text dimColor> — no drift detected ✓</Text>}
        </InkBox>

        {/* Critical */}
        {critical.length > 0 && (
          <InkBox flexDirection="column">
            <Text bold color={SEVERITY_COLOR.critical}>
              Critical ({critical.length})
            </Text>
            {critical.map((item, i) => (
              <DriftItemRow key={i} item={item} />
            ))}
          </InkBox>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <InkBox flexDirection="column">
            <Text bold color={SEVERITY_COLOR.warning}>
              Warnings ({warnings.length})
            </Text>
            {warnings.map((item, i) => (
              <DriftItemRow key={i} item={item} />
            ))}
          </InkBox>
        )}

        {/* Info */}
        {info.length > 0 && (
          <InkBox flexDirection="column">
            <Text color={SEVERITY_COLOR.info}>Info ({info.length})</Text>
            {info.map((item, i) => (
              <DriftItemRow key={i} item={item} />
            ))}
          </InkBox>
        )}
      </InkBox>
    </BetterspecBox>
  );
};

export async function diffCommand(
  changeName: string | undefined,
  options?: { cwd?: string },
): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    render(
      <BetterspecBox title="Not Initialized" borderColor="error">
        <Text>
          betterspec is not initialized. Run{" "}
          <Text color={colors.primary}>betterspec init</Text> first.
        </Text>
      </BetterspecBox>,
    );
    process.exit(1);
  }

  const { waitUntilExit } = render(
    <DiffDashboard projectRoot={projectRoot} changeName={changeName} />,
  );
  await waitUntilExit();
}
