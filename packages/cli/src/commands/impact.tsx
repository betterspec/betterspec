/**
 * betterspec impact command — INK version
 * Analyze the impact of a file or path across specs and capabilities
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve, relative } from "node:path";
import {
  configExists,
  listChanges,
  listCapabilities,
  readChangeFile,
  runAI,
} from "@betterspec/core";
import {
  Box as BetterspecBox,
  Spinner,
  colors,
} from "../ui/ink/index.js";

interface Match {
  name: string;
  file: string;
  match: string;
}

interface ImpactResult {
  matchedChanges: Match[];
  matchedCapabilities: any[];
  response: {
    text: string;
    usage?: { inputTokens: number; outputTokens: number };
    cost?: number;
    model?: string;
  };
}

interface ImpactDashboardProps {
  projectRoot: string;
  targetPath: string;
}

type Phase = "scanning" | "analyzing" | "done" | "error";

const ImpactDashboard: React.FC<ImpactDashboardProps> = ({
  projectRoot,
  targetPath,
}) => {
  const relPath = relative(projectRoot, resolve(projectRoot, targetPath));

  const [state, setState] = React.useState<{
    phase: Phase;
    message?: string;
    result?: ImpactResult;
    error?: string;
  }>({ phase: "scanning", message: `Analyzing impact of ${relPath}...` });

  React.useEffect(() => {
    runImpact();
  }, []);

  const runImpact = async () => {
    try {
      const [changes, capabilities] = await Promise.all([
        listChanges(projectRoot),
        listCapabilities(projectRoot),
      ]);

      setState({
        phase: "scanning",
        message: "Scanning specs for references...",
      });

      const matchedChanges: Match[] = [];
      for (const change of changes) {
        const specFiles = [
          "proposal.md",
          "specs/requirements.md",
          "specs/scenarios.md",
          "design.md",
          "tasks.md",
        ];

        for (const file of specFiles) {
          try {
            const content = await readChangeFile(
              projectRoot,
              change.name,
              file
            );
            if (content.includes(relPath) || content.includes(targetPath)) {
              const lines = content.split("\n");
              const matchLine = lines.find(
                (l) => l.includes(relPath) || l.includes(targetPath)
              );
              matchedChanges.push({
                name: change.name,
                file,
                match: matchLine?.trim() ?? "(referenced)",
              });
            }
          } catch {
            // File doesn't exist, skip
          }
        }
      }

      const matchedCapabilities = capabilities.filter((cap: any) =>
        cap.files?.some(
          (f: string) => f.includes(relPath) || f.includes(targetPath)
        )
      );

      setState({
        phase: "analyzing",
        message: "Running AI impact analysis...",
      });

      const matchSummary =
        matchedChanges.length > 0
          ? matchedChanges
              .map((m) => `- ${m.name}/${m.file}: ${m.match}`)
              .join("\n")
          : "No direct references found in specs.";

      const capSummary =
        matchedCapabilities.length > 0
          ? matchedCapabilities
              .map(
                (c: any) =>
                  `- ${c.name} (files: ${c.files?.join(", ") ?? "none"})`
              )
              .join("\n")
          : "No matching capabilities.";

      const response = await runAI(
        `Analyze the impact of changes to this file/path: ${relPath}\n\n` +
          `## Direct References in Specs\n${matchSummary}\n\n` +
          `## Related Capabilities\n${capSummary}\n\n` +
          `## All Active Changes\n${changes.map((c) => `- ${c.name} (${c.status})`).join("\n") || "None"}\n\n` +
          `Provide a thorough impact analysis. What would break? What needs updating? What's the blast radius?`,
        {
          projectRoot,
          scope: "impact",
          targetPath: relPath,
          systemPrompt:
            "You are a software impact analyst. " +
            "Format your response with sections: ## Direct Impact, ## Indirect Impact, ## Risk Assessment, ## Recommendations.",
        }
      );

      setState({
        phase: "done",
        result: { matchedChanges, matchedCapabilities, response },
      });
    } catch (err: any) {
      setState({
        phase: "error",
        error: err.message || "Impact analysis failed",
      });
    }
  };

  if (state.phase === "scanning" || state.phase === "analyzing") {
    return (
      <BetterspecBox title="betterspec impact" borderColor="accent">
        <Spinner label={state.message ?? "Working..."} />
      </BetterspecBox>
    );
  }

  if (state.phase === "error") {
    return (
      <BetterspecBox title="betterspec impact" borderColor="error">
        <Text hex={colors.error}>Impact analysis failed</Text>
        {state.error && <Text dimColor>{state.error}</Text>}
      </BetterspecBox>
    );
  }

  const { result } = state;

  return (
    <InkBox flexDirection="column">
      {result?.matchedChanges.length! > 0 && (
        <BetterspecBox
          title={`${result!.matchedChanges.length} Direct Reference${result!.matchedChanges.length === 1 ? "" : "s"}`}
          borderColor="info"
        >
          {result!.matchedChanges.map((m, i) => (
            <Text key={i} dimColor>
              {m.name}/{m.file}
            </Text>
          ))}
        </BetterspecBox>
      )}

      {result?.matchedCapabilities.length! > 0 && (
        <InkBox paddingTop={1}>
          <BetterspecBox
            title={`${result!.matchedCapabilities.length} Related Capabilit${result!.matchedCapabilities.length === 1 ? "y" : "ies"}`}
            borderColor="info"
          >
            {result!.matchedCapabilities.map((c: any, i: number) => (
              <Text key={i} dimColor>
                {c.name}
              </Text>
            ))}
          </BetterspecBox>
        </InkBox>
      )}

      <InkBox paddingTop={1} paddingLeft={1}>
        <Text>{result?.response.text}</Text>
      </InkBox>

      {result?.response.usage && (
        <InkBox paddingTop={1} paddingLeft={1}>
          <Text dimColor>
            Tokens: {result.response.usage.inputTokens} in /{" "}
            {result.response.usage.outputTokens} out
            {result.response.cost &&
              ` | Estimated cost: $${result.response.cost.toFixed(4)}`}
            {result.response.model && ` | Model: ${result.response.model}`}
          </Text>
        </InkBox>
      )}
    </InkBox>
  );
};

export async function impactCommand(
  targetPath: string,
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

  render(<ImpactDashboard projectRoot={projectRoot} targetPath={targetPath} />);
}
