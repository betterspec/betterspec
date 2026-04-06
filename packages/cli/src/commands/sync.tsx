/**
 * betterspec sync command — INK version
 * Sync with global spec repository
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync } from "node:fs";

const exec = promisify(execCb);
import { configExists, readConfig } from "@betterspec/core";
import {
  Box as BetterspecBox,
  Spinner,
  colors,
} from "../ui/ink/index.js";

type SyncPhase =
  | "check"
  | "local-mode"
  | "not-configured"
  | "syncing"
  | "done"
  | "error";

interface SyncDashboardProps {
  projectRoot: string;
  force?: boolean;
}

const SyncDashboard: React.FC<SyncDashboardProps> = ({
  projectRoot,
}) => {
  const [state, setState] = React.useState<{
    phase: SyncPhase;
    source?: string;
    targetPath?: string;
    message?: string;
    error?: string;
  }>({ phase: "check" });

  React.useEffect(() => {
    runSync();
  }, []);

  const runSync = async () => {
    try {
      const config = await readConfig(projectRoot);
      const source = config.global?.source;
      const isGitUrl =
        source?.startsWith("http://") ||
        source?.startsWith("https://") ||
        source?.startsWith("git@");
      const targetPath = config.global?.path;

      setState({ phase: "syncing", source, targetPath });

      if (isGitUrl) {
        if (existsSync(targetPath!)) {
          setState((s) => ({
            ...s,
            message: "Pulling latest changes...",
          }));
          await exec("git pull --ff-only", { cwd: targetPath! });
        } else {
          setState((s) => ({
            ...s,
            message: "Cloning global spec repo...",
          }));
          mkdirSync(targetPath!, { recursive: true });
          await exec(`git clone ${source} ${targetPath}`);
        }
      } else {
        if (existsSync(source!)) {
          // Filesystem path — just validate
        } else {
          setState({
            phase: "error",
            source,
            error: `Global spec path not found: ${source}`,
          });
          return;
        }
      }

      setState({
        phase: "done",
        source,
        targetPath,
      });
    } catch (err) {
      setState({
        phase: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  if (state.phase === "check" || state.phase === "syncing") {
    return (
      <BetterspecBox title="betterspec sync" borderColor="accent">
        <Spinner label={state.message ?? "Syncing..."} />
      </BetterspecBox>
    );
  }

  if (state.phase === "done") {
    return (
      <BetterspecBox title="Sync Complete" borderColor="success">
        <Text hex={colors.success}>\u2713 Global specs synced</Text>
        {state.source && (
          <Text dimColor>
            {" "}Source: {state.source}
          </Text>
        )}
        {state.targetPath && (
          <Text dimColor>
            {" "}Path: {state.targetPath}
          </Text>
        )}
      </BetterspecBox>
    );
  }

  if (state.phase === "error") {
    return (
      <BetterspecBox title="Sync Failed" borderColor="error">
        <Text hex={colors.error}>\u2717 Sync failed</Text>
        {state.error && <Text dimColor> {state.error}</Text>}
      </BetterspecBox>
    );
  }

  return null;
};

export async function syncCommand(options?: {
  force?: boolean;
  cwd?: string;
}): Promise<void> {
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

  const config = await readConfig(projectRoot);

  if (config.mode === "local") {
    render(
      <BetterspecBox title="No Sync Needed" borderColor="info">
        <Text>
          Spec mode is{" "}
          <Text hex={colors.primary}>local</Text>. No global repo to sync.
        </Text>
        <Text dimColor>
          {" "}Run{" "}
          <Text hex={colors.primary}>betterspec config mode local+global</Text>
          <Text dimColor> to enable global specs.</Text>
        </Text>
      </BetterspecBox>
    );
    return;
  }

  if (!config.global?.source) {
    render(
      <BetterspecBox title="Not Configured" borderColor="error">
        <Text>Global spec source not configured.</Text>
        <Text dimColor>
          {" "}Run{" "}
          <Text hex={colors.primary}>
            betterspec config global.source &lt;path-or-url&gt;
          </Text>
          <Text dimColor> to set it.</Text>
        </Text>
      </BetterspecBox>
    );
    process.exit(1);
  }

  render(<SyncDashboard projectRoot={projectRoot} />);
}
