/**
 * betterspec onboard command — INK version
 * Generate a narrative onboarding guide for the project using AI
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import {
  configExists,
  readConfig,
  listChanges,
  listCapabilities,
  runAI,
} from "@betterspec/core";
import {
  Box as BetterspecBox,
  Spinner,
  colors,
} from "../ui/ink/index.js";

interface OnboardResult {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
  cost?: number;
  model?: string;
}

interface OnboardDashboardProps {
  projectRoot: string;
}

const OnboardDashboard: React.FC<OnboardDashboardProps> = ({
  projectRoot,
}) => {
  const [state, setState] = React.useState<{
    phase: "gathering" | "generating" | "done" | "error";
    message?: string;
    result?: OnboardResult;
    error?: string;
  }>({ phase: "gathering", message: "Gathering project context..." });

  React.useEffect(() => {
    runOnboard();
  }, []);

  const runOnboard = async () => {
    try {
      const [config, changes, capabilities] = await Promise.all([
        readConfig(projectRoot),
        listChanges(projectRoot),
        listCapabilities(projectRoot),
      ]);

      setState({
        phase: "generating",
        message: "Generating onboarding guide...",
      });

      const activeChanges = changes.filter((c) => c.status !== "archived");

      const changesText = activeChanges
        .map(
          (c) =>
            `- **${c.name}** (${c.status}): ${c.tasks.length} tasks, updated ${c.updatedAt}`
        )
        .join("\n");

      const capsText = capabilities
        .map(
          (c) =>
            `- **${c.name}**: from change "${c.sourceChange}", archived ${c.archivedAt}`
        )
        .join("\n");

      const response = await runAI(
        `Generate an onboarding guide for a new developer joining this project.\n\n` +
          `## Project Configuration\n` +
          `- Mode: ${config.mode}\n` +
          `- Tool: ${config.tool ?? "none"}\n\n` +
          `## Active Changes (${activeChanges.length})\n${changesText || "None"}\n\n` +
          `## Capabilities (${capabilities.length})\n${capsText || "None"}\n\n` +
          `Write a friendly, narrative onboarding guide.`,
        {
          projectRoot,
          scope: "full",
          systemPrompt:
            "You are a senior developer writing an onboarding guide. " +
            "Structure with: ## Welcome, ## What This Project Does, ## Current Work, " +
            "## Established Patterns, ## Where to Start, ## Tips & Conventions.",
        }
      );

      setState({ phase: "done", result: response });
    } catch (err: any) {
      setState({
        phase: "error",
        error: err.message || "Onboarding guide generation failed",
      });
    }
  };

  if (state.phase === "gathering" || state.phase === "generating") {
    return (
      <BetterspecBox title="betterspec onboard" borderColor="accent">
        <Spinner label={state.message ?? "Working..."} />
      </BetterspecBox>
    );
  }

  if (state.phase === "error") {
    return (
      <BetterspecBox title="betterspec onboard" borderColor="error">
        <Text hex={colors.error}>Onboarding guide generation failed</Text>
        {state.error && <Text dimColor>{state.error}</Text>}
      </BetterspecBox>
    );
  }

  const { result } = state;

  return (
    <InkBox flexDirection="column">
      <BetterspecBox title="Onboarding Guide" borderColor="success">
        <Text hex={colors.success}>\u2713 Onboarding guide generated</Text>
      </BetterspecBox>

      <InkBox paddingTop={1} paddingLeft={1}>
        <Text>{result?.text}</Text>
      </InkBox>

      {(result?.usage || result?.cost || result?.model) && (
        <InkBox paddingTop={1} paddingLeft={1}>
          <Text dimColor>
            {result?.usage &&
              `Tokens: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`}
            {result?.cost && ` | Estimated cost: $${result.cost.toFixed(4)}`}
            {result?.model && ` | Model: ${result.model}`}
          </Text>
        </InkBox>
      )}
    </InkBox>
  );
};

export async function onboardCommand(options?: {
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

  render(<OnboardDashboard projectRoot={projectRoot} />);
}
