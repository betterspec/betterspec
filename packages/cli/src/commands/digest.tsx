/**
 * betterspec digest command — INK version
 * Generate a knowledge digest from recent/archived changes using AI
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { configExists, listChanges, runAI } from "@betterspec/core";
import {
  Box as BetterspecBox,
  Spinner,
  colors,
} from "../ui/ink/index.js";

interface DigestResult {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
  cost?: number;
  model?: string;
}

interface DigestDashboardProps {
  projectRoot: string;
  count: number;
  output?: string;
}

const DigestDashboard: React.FC<DigestDashboardProps> = ({
  projectRoot,
  count,
  output,
}) => {
  const [state, setState] = React.useState<{
    phase: "loading" | "generating" | "done" | "error";
    message: string;
    result?: DigestResult;
    error?: string;
  }>({ phase: "loading", message: "Reading changes..." });

  React.useEffect(() => {
    runDigest();
  }, []);

  const runDigest = async () => {
    try {
      const changes = await listChanges(projectRoot);
      const selected = changes.slice(0, count);

      if (selected.length === 0) {
        setState({
          phase: "error",
          message: "No changes found to digest.",
        });
        return;
      }

      setState({
        phase: "generating",
        message: `Generating digest from ${selected.length} change${selected.length === 1 ? "" : "s"}...`,
      });

      const changesText = selected
        .map(
          (c) =>
            `### ${c.name}\n- Status: ${c.status}\n- Created: ${c.createdAt}\n- Updated: ${c.updatedAt}`
        )
        .join("\n\n---\n\n");

      const response = await runAI(
        `Generate a knowledge digest from these recent changes:\n\n${changesText}\n\nSynthesize the information. Identify themes, patterns, and shifts.`,
        {
          projectRoot,
          scope: "digest",
          systemPrompt:
            "You are a technical writer generating a knowledge digest for a software project. " +
            "Format your response as markdown with sections: ## What Changed, ## Decisions Made, " +
            "## Patterns Established, ## Knowledge Shifts, ## Metrics. Be concise and insightful.",
        }
      );

      if (output) {
        await writeFile(resolve(output), response.text, "utf-8");
      }

      setState({ phase: "done", result: response });
    } catch (err: any) {
      if (err.name === "AINotAvailableError") {
        setState({
          phase: "error",
          message: "AI not available",
          error: err.message,
        });
      } else {
        setState({
          phase: "error",
          message: "Digest generation failed",
          error: err.message,
        });
      }
    }
  };

  if (state.phase === "loading") {
    return (
      <BetterspecBox title="betterspec digest" borderColor="accent">
        <Spinner label={state.message} />
      </BetterspecBox>
    );
  }

  if (state.phase === "generating") {
    return (
      <BetterspecBox title="betterspec digest" borderColor="accent">
        <Spinner label={state.message} />
      </BetterspecBox>
    );
  }

  if (state.phase === "error") {
    return (
      <BetterspecBox title="betterspec digest" borderColor="error">
        <Text hex={colors.error}>{state.message}</Text>
        {state.error && (
          <Text dimColor>{state.error}</Text>
        )}
      </BetterspecBox>
    );
  }

  const { result } = state;

  return (
    <InkBox flexDirection="column">
      <BetterspecBox title="betterspec digest" borderColor="success">
        <Text hex={colors.success}>\u2713 Digest generated</Text>
      </BetterspecBox>

      <InkBox paddingTop={1} paddingLeft={1}>
        <Text>{result?.text}</Text>
      </InkBox>

      {(result?.usage || result?.cost || result?.model) && (
        <InkBox paddingTop={1} paddingLeft={1}>
          <Text dimColor>
            {result.usage &&
              `Tokens: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`}
            {result.cost && ` | Estimated cost: $${result.cost.toFixed(4)}`}
            {result.model && ` | Model: ${result.model}`}
          </Text>
        </InkBox>
      )}

      {output && (
        <InkBox paddingTop={1} paddingLeft={1}>
          <Text hex={colors.success}>Written to {output}</Text>
        </InkBox>
      )}
    </InkBox>
  );
};

export async function digestCommand(options: {
  cwd?: string;
  count?: number;
  output?: string;
}): Promise<void> {
  const projectRoot = resolve(options.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    render(
      <BetterspecBox
        title="Not Initialized"
        borderColor="error"
      >
        <Text>betterspec is not initialized.</Text>
        <Text dimColor> Run </Text>
        <Text hex={colors.primary}>betterspec init</Text>
        <Text dimColor> first.</Text>
      </BetterspecBox>
    );
    process.exit(1);
  }

  render(
    <DigestDashboard
      projectRoot={projectRoot}
      count={options.count ?? 5}
      output={options.output}
    />
  );
}
