/**
 * betterspec list command — INK version
 * List all changes with status and progress
 */

import React from "react";
import { render, Box, Text } from "ink";
import { resolve } from "node:path";
import {
  configExists,
  listChanges,
  summarizeTasks,
} from "@betterspec/core";
import { Logo, Tagline } from "../ui/ink/index.js";
import { BetterspecBox, Section, Table, ProgressBar } from "../ui/ink/index.js";
import { colors, statusColor } from "../ui/ink/index.js";

interface ListViewProps {
  projectRoot: string;
  archived: boolean;
  statusFilter?: string;
}

const ListView: React.FC<ListViewProps> = ({
  projectRoot,
  archived,
  statusFilter,
}) => {
  const [state, setState] = React.useState<{
    loading: boolean;
    changes?: any[];
    error?: string;
  }>({ loading: true });

  React.useEffect(() => {
    (async () => {
      try {
        let changes = await listChanges(projectRoot, archived);
        if (statusFilter) {
          changes = changes.filter((c) => c.status === statusFilter);
        }
        setState({ loading: false, changes });
      } catch (err: any) {
        setState({ loading: false, error: err.message });
      }
    })();
  }, [projectRoot, archived, statusFilter]);

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

  const { changes } = state;

  return (
    <Box flexDirection="column">
      <Logo />
      <Box paddingTop={1}>
        <Tagline version="0.4.0" />
      </Box>

      {changes.length === 0 ? (
        <BetterspecBox title="Changes" borderColor="default">
          <Text>
            <Text hex={colors.secondary}> No changes found.</Text>
          </Text>
          <Text dimColor> Run </Text>
          <Text hex={colors.primary}>betterspec propose</Text>
          <Text dimColor> to create one.</Text>
        </BetterspecBox>
      ) : (
        <Box flexDirection="column" paddingTop={1}>
          <Section title={archived ? "All Changes (including archived)" : "Active Changes"}>
            <Table
              columns={[
                { key: "name", header: "Name", width: 28 },
                {
                  key: "status",
                  header: "Status",
                  width: 14,
                  render: (row) => <Text hex={statusColor(row.status)}>{row.status}</Text>,
                },
                {
                  key: "tasks",
                  header: "Tasks",
                  width: 10,
                  render: (row) => {
                    const ts = summarizeTasks(row.tasks);
                    return ts.total > 0 ? (
                      <Text>
                        <Text hex={colors.success}>{ts.passed}</Text>
                        <Text dimColor>/{ts.total}</Text>
                      </Text>
                    ) : (
                      <Text dimColor>--</Text>
                    );
                  },
                },
                {
                  key: "tasks",
                  header: "Progress",
                  width: 26,
                  render: (row) => {
                    const ts = summarizeTasks(row.tasks);
                    return ts.total > 0 ? (
                      <ProgressBar percent={ts.completionPercent} width={20} />
                    ) : (
                      <Text dimColor>--</Text>
                    );
                  },
                },
                {
                  key: "updatedAt",
                  header: "Updated",
                  width: 14,
                  render: (row) => (
                    <Text dimColor>{row.updatedAt?.slice(0, 10) ?? "-"}</Text>
                  ),
                },
              ]}
              rows={changes}
            />
          </Section>
          <Box paddingTop={1}>
            <Text dimColor>
              {"  "}
              {changes.length} change{changes.length === 1 ? "" : "s"} found
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export async function listCommand(options?: {
  archived?: boolean;
  status?: string;
  cwd?: string;
}): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    render(
      <Box flexDirection="column" padding={1}>
        <Logo />
        <BetterspecBox title="Not Initialized" borderColor="error">
          <Text>betterspec is not initialized in this project.</Text>
          <Text dimColor> Run </Text>
          <Text hex={colors.primary}>betterspec init</Text>
          <Text dimColor> first.</Text>
        </BetterspecBox>
      </Box>
    );
    process.exit(1);
  }

  render(
    <ListView
      projectRoot={projectRoot}
      archived={options?.archived ?? false}
      statusFilter={options?.status}
    />
  );
}
