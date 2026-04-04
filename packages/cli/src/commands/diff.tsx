/**
 * betterspec diff command — INK version
 * Show structural drift between specs and current project state
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import {
  configExists,
  listChanges,
  readChange,
  readChangeFile,
} from "@betterspec/core";
import {
  Box as BetterspecBox,
  Table,
  colors,
} from "../ui/ink/index.js";

interface DriftItem {
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

interface DiffDashboardProps {
  projectRoot: string;
  changeName?: string;
}

const DiffDashboard: React.FC<DiffDashboardProps> = ({
  projectRoot,
  changeName,
}) => {
  const [driftItems, setDriftItems] = React.useState<DriftItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [noChanges, setNoChanges] = React.useState(false);

  React.useEffect(() => {
    runDiff();
  }, []);

  const runDiff = async () => {
    try {
      const items: DriftItem[] = [];

      if (changeName) {
        try {
          await readChange(projectRoot, changeName);
          await analyzeChangeDrift(projectRoot, changeName, items);
          setDriftItems(items);
        } catch {
          setNotFound(true);
        }
      } else {
        const changes = await listChanges(projectRoot, false);
        if (changes.length === 0) {
          setNoChanges(true);
          return;
        }
        for (const change of changes) {
          await analyzeChangeDrift(projectRoot, change.name, items);
        }
        setDriftItems(items);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <BetterspecBox title="betterspec diff" borderColor="accent">
        <Text dimColor>Analyzing drift...</Text>
      </BetterspecBox>
    );
  }

  if (notFound) {
    return (
      <BetterspecBox title="Not Found" borderColor="error">
        <Text hex={colors.error}>Change "{changeName}" not found.</Text>
      </BetterspecBox>
    );
  }

  if (noChanges) {
    return (
      <BetterspecBox title="No Changes" borderColor="info">
        <Text>No active changes to analyze.</Text>
        <Text dimColor>Run </Text>
        <Text hex={colors.primary}>betterspec propose</Text>
        <Text dimColor> to create one.</Text>
      </BetterspecBox>
    );
  }

  if (driftItems.length === 0) {
    return (
      <BetterspecBox title="All Clear" borderColor="success">
        <Text hex={colors.success}>\u2713 No drift detected. Specs and implementation are in sync.</Text>
      </BetterspecBox>
    );
  }

  const critical = driftItems.filter((d) => d.severity === "critical").length;
  const warnings = driftItems.filter((d) => d.severity === "warning").length;
  const infos = driftItems.filter((d) => d.severity === "info").length;

  const columns = [
    { key: "severity", header: "Severity", width: 12 },
    { key: "type", header: "Type", width: 20 },
    { key: "message", header: "Message", width: 55 },
  ];

  const rows = driftItems.map((item) => {
    const sevColor =
      item.severity === "critical"
        ? colors.error
        : item.severity === "warning"
          ? colors.warning
          : colors.muted;
    return {
      severity: <Text hex={sevColor}>{item.severity}</Text>,
      type: <Text>{item.type}</Text>,
      message: <Text dimColor>{item.message}</Text>,
    };
  });

  const summaryParts: React.ReactNode[] = [];
  if (critical > 0) summaryParts.push(<Text hex={colors.error}>{critical} critical</Text>);
  if (warnings > 0) summaryParts.push(<Text hex={colors.warning}>{warnings} warnings</Text>);
  if (infos > 0) summaryParts.push(<Text dimColor>{infos} info</Text>);

  return (
    <InkBox flexDirection="column">
      <InkBox>
        <Table columns={columns} rows={rows} />
      </InkBox>
      <InkBox paddingTop={1}>
        <BetterspecBox
          title="Summary"
          borderColor={critical > 0 ? "error" : "warning"}
        >
          <InkBox gap={1}>{summaryParts.map((p, i) => <React.Fragment key={i}>{p}{i < summaryParts.length - 1 && <Text dimColor>, </Text>}</React.Fragment>)}</InkBox>
        </BetterspecBox>
      </InkBox>
    </InkBox>
  );
};

async function analyzeChangeDrift(
  projectRoot: string,
  changeName: string,
  items: DriftItem[]
): Promise<void> {
  try {
    const change = await readChange(projectRoot, changeName);
    const updatedAt = new Date(change.updatedAt);
    const daysSince = Math.floor(
      (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince > 14 && change.status === "proposed") {
      items.push({
        type: "stale-proposal",
        severity: "warning",
        message: `"${changeName}" proposed ${daysSince} days ago with no progress`,
      });
    }

    if (daysSince > 7 && change.status === "in-progress") {
      items.push({
        type: "stale-progress",
        severity: "info",
        message: `"${changeName}" in progress for ${daysSince} days since last update`,
      });
    }

    const specFiles = [
      "proposal.md",
      "specs/requirements.md",
      "specs/scenarios.md",
      "design.md",
      "tasks.md",
    ];
    for (const file of specFiles) {
      try {
        const content = await readChangeFile(projectRoot, changeName, file);
        const stripped = content.replace(/<!--.*?-->/gs, "").trim();
        if (stripped.length < 30) {
          items.push({
            type: "empty-spec",
            severity:
              change.status === "in-progress" ? "warning" : "info",
            message: `"${changeName}/${file}" has minimal content`,
          });
        }
      } catch {
        items.push({
          type: "missing-file",
          severity: "critical",
          message: `"${changeName}/${file}" is missing`,
        });
      }
    }

    if (
      change.status === "in-progress" &&
      change.tasks.length > 0 &&
      change.tasks.every((t: any) => t.status === "pending")
    ) {
      items.push({
        type: "no-task-progress",
        severity: "warning",
        message: `"${changeName}" is in-progress but all ${change.tasks.length} tasks are still pending`,
      });
    }
  } catch {
    items.push({
      type: "read-error",
      severity: "critical",
      message: `Could not read change "${changeName}"`,
    });
  }
}

export async function diffCommand(
  changeName?: string,
  options?: { cwd?: string }
): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    render(
      <BetterspecBox title="Not Initialized" borderColor="error">
        <Text>betterspec is not initialized.</Text>
        <Text dimColor> Run </Text>
        <Text hex={colors.primary}>betterspec init</Text>
        <Text dimColor> first.</Text>
      </BetterspecBox>
    );
    process.exit(1);
  }

  render(<DiffDashboard projectRoot={projectRoot} changeName={changeName} />);
}
