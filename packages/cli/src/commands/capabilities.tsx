/**
 * betterspec capabilities command — INK version
 * List all registered capabilities in the knowledge base
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import { configExists, listCapabilities } from "@betterspec/core";
import {
  BetterspecBox,
  Table,
  colors,
} from "../ui/ink/index.js";

interface CapabilitiesDashboardProps {
  projectRoot: string;
  json?: boolean;
}

const CapabilitiesDashboard: React.FC<CapabilitiesDashboardProps> = ({
  projectRoot,
  json,
}) => {
  const [capabilities, setCapabilities] = React.useState<any[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    listCapabilities(projectRoot)
      .then(setCapabilities)
      .catch((err: Error) => setError(err.message));
  }, [projectRoot]);

  if (error) {
    return (
      <BetterspecBox title="Capabilities" borderColor="error">
        <Text color={colors.error}>Failed to load capabilities: {error}</Text>
      </BetterspecBox>
    );
  }

  if (!capabilities) {
    return (
      <BetterspecBox title="Capabilities" borderColor="accent">
        <Text dimColor>Loading...</Text>
      </BetterspecBox>
    );
  }

  if (capabilities.length === 0) {
    return (
      <BetterspecBox title="Capabilities" borderColor="info">
        <Text>No capabilities registered yet.</Text>
        <Text dimColor>Archive a completed change to extract capabilities.</Text>
        <InkBox paddingTop={1}>
          <Text dimColor>
            Run <Text color={colors.primary}>betterspec archive &lt;change&gt;</Text>
          </Text>
        </InkBox>
      </BetterspecBox>
    );
  }

  const columns = [
    { key: "name", header: "Name", width: 20 },
    { key: "description", header: "Description", width: 28 },
    { key: "sourceChange", header: "Source", width: 16 },
    { key: "archivedAt", header: "Archived", width: 12 },
    { key: "tags", header: "Tags", width: 14, render: (row: any) => (
      row.tags?.length ? (
        <Text color={colors.accent}>{row.tags.join(", ")}</Text>
      ) : (
        <Text dimColor>--</Text>
      )
    )},
  ];

  const rows = capabilities.map((cap: any) => ({
    ...cap,
    description: (
      <Text dimColor>{cap.description?.slice(0, 60) ?? ""}</Text>
    ),
    sourceChange: <Text color={colors.secondary}>{cap.sourceChange}</Text>,
    archivedAt: <Text dimColor>{cap.archivedAt?.slice(0, 10)}</Text>,
  }));

  return (
    <InkBox flexDirection="column">
      <BetterspecBox title="Capabilities" borderColor="accent">
        <Text>
          <Text color={colors.primary}>{capabilities.length}</Text>
          <Text dimColor> capabilit{capabilities.length === 1 ? "y" : "ies"} registered</Text>
        </Text>
      </BetterspecBox>
      <InkBox paddingTop={1}>
        <Table columns={columns} rows={rows} />
      </InkBox>
    </InkBox>
  );
};

export async function capabilitiesCommand(options?: {
  json?: boolean;
  cwd?: string;
}): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    render(
      <BetterspecBox title="Not Initialized" borderColor="error">
        <Text>betterspec is not initialized.</Text>
        <Text dimColor> Run </Text>
        <Text color={colors.primary}>betterspec init</Text>
        <Text dimColor> first.</Text>
      </BetterspecBox>
    );
    process.exit(1);
  }

  if (options?.json) {
    const capabilities = await listCapabilities(projectRoot);
    console.log(JSON.stringify(capabilities, null, 2));
    return;
  }

  render(<CapabilitiesDashboard projectRoot={projectRoot} />);
}
