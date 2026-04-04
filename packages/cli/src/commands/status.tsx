/**
 * betterspec status command — INK version
 * Beautiful dashboard showing all changes, progress, and capabilities
 */

import React from "react";
import { render, Box, Text } from "ink";
import { resolve } from "node:path";
import {
  configExists,
  readConfig,
  listCapabilities,
  getProjectSummary,
} from "@betterspec/core";
import { Logo, Tagline, BetterspecBox, Section, Table, ProgressBar } from "../ui/ink/index.js";
import { colors, statusColor } from "../ui/ink/index.js";

interface StatusDashboardProps {
  projectRoot: string;
}

// ── Sub-components ────────────────────────────────────────────────

const Divider: React.FC = () => (
  <Text dimColor>{"\u2500".repeat(60)}</Text>
);

const StatItem: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color,
}) => (
  <Text>
    <Text bold hex={color ?? colors.primary}>{value}</Text>
    <Text dimColor> {label}</Text>
  </Text>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <Text hex={statusColor(status)}>{status}</Text>
);

const NotInitialized: React.FC<{ projectRoot: string }> = ({ projectRoot }) => (
  <BetterspecBox
    title="not initialized"
    borderColor="error"
  >
    <Text>betterspec is not initialized in this project.</Text>
    <Text dimColor> Run </Text>
    <Text hex={colors.primary}>betterspec init</Text>
    <Text dimColor> first.</Text>
  </BetterspecBox>
);

// ── Main dashboard ────────────────────────────────────────────────

const StatusDashboard: React.FC<StatusDashboardProps> = ({ projectRoot }) => {
  const [state, setState] = React.useState<{
    loading: boolean;
    error?: string;
    config?: any;
    summary?: any;
    capabilities?: any[];
  }>({ loading: true });

  React.useEffect(() => {
    (async () => {
      try {
        const [config, summary, capabilities] = await Promise.all([
          readConfig(projectRoot),
          getProjectSummary(projectRoot),
          listCapabilities(projectRoot),
        ]);
        setState({ loading: false, config, summary, capabilities });
      } catch (err: any) {
        setState({ loading: false, error: err.message });
      }
    })();
  }, [projectRoot]);

  if (state.loading) {
    return (
      <Box flexDirection="column">
        <Logo />
        <Text dimColor> Loading...</Text>
      </Box>
    );
  }

  if (state.error) {
    return (
      <Box flexDirection="column">
        <Logo />
        <Text hex={colors.error}>{state.error}</Text>
      </Box>
    );
  }

  const { config, summary, capabilities } = state;

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Logo />
      <Box paddingTop={1} paddingBottom={1}>
        <Tagline version="0.4.0" />
      </Box>

      {/* Stats bar */}
      <BetterspecBox title="betterspec status" borderColor="accent">
        <Box gap={3}>
          <StatItem
            label="active"
            value={String(summary.activeChanges)}
            color={colors.primary}
          />
          <Text dimColor>|</Text>
          <StatItem
            label="archived"
            value={String(summary.archivedChanges)}
            color={colors.success}
          />
          <Text dimColor>|</Text>
          <StatItem
            label="capabilities"
            value={String(summary.totalCapabilities)}
            color={colors.secondary}
          />
          <Text dimColor>|</Text>
          <StatItem
            label="mode:"
            value={config.mode}
            color={colors.accent}
          />
        </Box>
      </BetterspecBox>

      {/* Active changes */}
      <Box paddingTop={1} paddingBottom={1}>
        {summary.changes.length > 0 ? (
          <Section title="Active Changes">
            <Table
              columns={[
                { key: "name", header: "Change", width: 28 },
                {
                  key: "status",
                  header: "Status",
                  width: 14,
                  render: (row) => <StatusBadge status={row.status} />,
                },
                {
                  key: "taskSummary",
                  header: "Tasks",
                  width: 10,
                  render: (row) => {
                    const ts = row.taskSummary;
                    return ts.total > 0 ? (
                      <Text>
                        <Text hex={colors.success}>{ts.passed}</Text>
                        <Text dimColor>/{ts.total}</Text>
                      </Text>
                    ) : (
                      <Text dimColor>none</Text>
                    );
                  },
                },
                {
                  key: "taskSummary",
                  header: "Progress",
                  width: 24,
                  render: (row) => {
                    const ts = row.taskSummary;
                    return ts.total > 0 ? (
                      <ProgressBar percent={ts.completionPercent} width={18} />
                    ) : (
                      <Text dimColor>--</Text>
                    );
                  },
                },
              ]}
              rows={summary.changes}
            />
          </Section>
        ) : (
          <Section title="Active Changes">
            <Text dimColor>  No active changes.</Text>
            <Text dimColor> Run </Text>
            <Text hex={colors.primary}>betterspec propose</Text>
            <Text dimColor> to create one.</Text>
          </Section>
        )}
      </Box>

      {/* Capabilities */}
      <Box paddingBottom={1}>
        {capabilities.length > 0 ? (
          <Section title="Capabilities">
            <Table
              columns={[
                { key: "name", header: "Capability", width: 28 },
                {
                  key: "sourceChange",
                  header: "Source",
                  width: 22,
                  render: (row) => <Text dimColor>{row.sourceChange}</Text>,
                },
                {
                  key: "archivedAt",
                  header: "Archived",
                  width: 14,
                  render: (row) => (
                    <Text dimColor>{row.archivedAt?.slice(0, 10) ?? "-"}</Text>
                  ),
                },
              ]}
              rows={capabilities.slice(0, 10)}
            />
            {capabilities.length > 10 && (
              <Text dimColor>
                {" "}
                ...and {capabilities.length - 10} more. Run{" "}
                <Text hex={colors.primary}>betterspec capabilities</Text>
                <Text dimColor> to see all.</Text>
              </Text>
            )}
          </Section>
        ) : (
          <Section title="Capabilities">
            <Text dimColor>
              {" "}
              No capabilities yet. Archive a completed change to start building
              the knowledge base.
            </Text>
          </Section>
        )}
      </Box>

      {/* Global mode */}
      {(config.mode === "local+global" || config.mode === "global") && (
        <Section title="Global Specs">
          {config.global ? (
            <Box flexDirection="column" gap={0}>
              <Text>
                <Text dimColor>  Source: </Text>
                <Text hex={colors.secondary}>{config.global.source}</Text>
              </Text>
              <Text>
                <Text dimColor>  Path: </Text>
                <Text dimColor>{config.global.path}</Text>
              </Text>
              <Text>
                <Text dimColor>  Auto-sync: </Text>
                <Text hex={config.global.autoSync ? colors.success : undefined}>
                  {config.global.autoSync ? "enabled" : "disabled"}
                </Text>
              </Text>
            </Box>
          ) : (
            <Text hex={colors.warning}>
              Global spec repo not configured.
            </Text>
          )}
        </Section>
      )}
    </Box>
  );
};

// ── Command entry point ──────────────────────────────────────────

export async function statusCommand(options?: {
  cwd?: string;
}): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    render(
      <Box flexDirection="column" padding={1}>
        <Logo />
        <NotInitialized projectRoot={projectRoot} />
      </Box>
    );
    process.exit(1);
  }

  render(<StatusDashboard projectRoot={projectRoot} />);
}
