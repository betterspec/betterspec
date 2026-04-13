/**
 * betterspec impact command — pure data version
 * Show what specs and capabilities reference a file or directory path.
 * No AI — fast, deterministic output.
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve, relative } from "node:path";
import {
  configExists,
  listChanges,
  listCapabilities,
  readChangeFile,
} from "@betterspec/core";
import { BetterspecBox, colors } from "../ui/ink/index.js";

interface SpecMatch {
  changeName: string;
  status: string;
  files: string[];
}

interface CapMatch {
  name: string;
  description: string;
  files: string[];
}

interface ImpactDashboardProps {
  projectRoot: string;
  targetPath: string;
}

const SPEC_FILES = [
  "proposal.md",
  "specs/requirements.md",
  "specs/scenarios.md",
  "design.md",
  "tasks.md",
];

async function scanChanges(
  projectRoot: string,
  needle: string,
): Promise<SpecMatch[]> {
  const changes = await listChanges(projectRoot, true);
  const matches: SpecMatch[] = [];

  for (const change of changes) {
    const matchedFiles: string[] = [];
    for (const specFile of SPEC_FILES) {
      try {
        const content = await readChangeFile(
          projectRoot,
          change.name,
          specFile,
        );
        if (content.includes(needle)) {
          matchedFiles.push(specFile);
        }
      } catch {
        // file doesn't exist — skip
      }
    }
    if (matchedFiles.length > 0) {
      matches.push({
        changeName: change.name,
        status: change.status,
        files: matchedFiles,
      });
    }
  }

  return matches;
}

async function scanCapabilities(
  projectRoot: string,
  needle: string,
): Promise<CapMatch[]> {
  const caps = await listCapabilities(projectRoot);
  return caps
    .filter((c) => c.files.some((f) => f.includes(needle)))
    .map((c) => ({
      name: c.name,
      description: c.description,
      files: c.files.filter((f) => f.includes(needle)),
    }));
}

const ImpactDashboard: React.FC<ImpactDashboardProps> = ({
  projectRoot,
  targetPath,
}) => {
  const relPath = relative(projectRoot, resolve(projectRoot, targetPath));
  const [state, setState] = React.useState<{
    phase: "scanning" | "done" | "error";
    specMatches?: SpecMatch[];
    capMatches?: CapMatch[];
    error?: string;
  }>({ phase: "scanning" });

  React.useEffect(() => {
    (async () => {
      try {
        const [specMatches, capMatches] = await Promise.all([
          scanChanges(projectRoot, relPath),
          scanCapabilities(projectRoot, relPath),
        ]);
        setState({ phase: "done", specMatches, capMatches });
      } catch (err: any) {
        setState({ phase: "error", error: err.message });
      }
    })();
  }, []);

  if (state.phase === "scanning") {
    return (
      <BetterspecBox title="Impact" borderColor="accent">
        <Text dimColor>Scanning specs and capabilities for {relPath}...</Text>
      </BetterspecBox>
    );
  }

  if (state.phase === "error") {
    return (
      <BetterspecBox title="Impact" borderColor="error">
        <Text color={colors.error}>{state.error}</Text>
      </BetterspecBox>
    );
  }

  const { specMatches = [], capMatches = [] } = state;
  const total = specMatches.length + capMatches.length;

  return (
    <BetterspecBox
      title={`Impact: ${relPath}`}
      borderColor={total > 0 ? "warning" : "success"}
    >
      {total === 0 ? (
        <Text dimColor>No references found in specs or capabilities.</Text>
      ) : (
        <InkBox flexDirection="column" gap={1}>
          {specMatches.length > 0 && (
            <InkBox flexDirection="column">
              <Text bold color={colors.primary}>
                Changes ({specMatches.length})
              </Text>
              {specMatches.map((m) => (
                <InkBox
                  key={m.changeName}
                  flexDirection="column"
                  paddingLeft={2}
                >
                  <Text>
                    <Text bold>{m.changeName}</Text>
                    <Text dimColor> ({m.status})</Text>
                  </Text>
                  {m.files.map((f) => (
                    <InkBox key={f} paddingLeft={2}>
                      <Text dimColor>↳ {f}</Text>
                    </InkBox>
                  ))}
                </InkBox>
              ))}
            </InkBox>
          )}

          {capMatches.length > 0 && (
            <InkBox flexDirection="column">
              <Text bold color={colors.primary}>
                Capabilities ({capMatches.length})
              </Text>
              {capMatches.map((c) => (
                <InkBox key={c.name} flexDirection="column" paddingLeft={2}>
                  <Text>
                    <Text bold>{c.name}</Text>
                    <Text dimColor> — {c.description}</Text>
                  </Text>
                  {c.files.map((f) => (
                    <InkBox key={f} paddingLeft={2}>
                      <Text dimColor>↳ {f}</Text>
                    </InkBox>
                  ))}
                </InkBox>
              ))}
            </InkBox>
          )}
        </InkBox>
      )}
    </BetterspecBox>
  );
};

export async function impactCommand(
  targetPath: string,
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
    <ImpactDashboard projectRoot={projectRoot} targetPath={targetPath} />,
  );
  await waitUntilExit();
}
