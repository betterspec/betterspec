/**
 * betterspec explain command — INK version
 * Generate an AI-powered narrative explanation of a change's full lifecycle
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import {
  configExists,
  readChange,
  readChangeFile,
  runAI,
} from "@betterspec/core";
import {
  Box as BetterspecBox,
  Spinner,
  colors,
} from "../ui/ink/index.js";

interface ExplainResult {
  change: any;
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
  cost?: number;
  model?: string;
}

interface ExplainDashboardProps {
  projectRoot: string;
  changeName: string;
}

type Phase = "loading" | "reading" | "generating" | "done" | "error";

const ExplainDashboard: React.FC<ExplainDashboardProps> = ({
  projectRoot,
  changeName,
}) => {
  const [state, setState] = React.useState<{
    phase: Phase;
    message?: string;
    result?: ExplainResult;
    error?: string;
  }>({ phase: "loading", message: `Reading change "${changeName}"...` });

  React.useEffect(() => {
    runExplain();
  }, []);

  const runExplain = async () => {
    try {
      const change = await readChange(projectRoot, changeName);

      setState({ phase: "generating", message: "Generating explanation..." });

      const specFiles = [
        { key: "proposal", path: "proposal.md" },
        { key: "requirements", path: "specs/requirements.md" },
        { key: "scenarios", path: "specs/scenarios.md" },
        { key: "design", path: "design.md" },
        { key: "tasks", path: "tasks.md" },
      ];

      const fileContents: Record<string, string> = {};
      for (const { key, path } of specFiles) {
        try {
          fileContents[key] = await readChangeFile(
            projectRoot,
            changeName,
            path
          );
        } catch {
          fileContents[key] = "(not yet defined)";
        }
      }

      const tasksText =
        change.tasks.length > 0
          ? change.tasks.map((t: any) => `- [${t.status}] ${t.name}`).join("\n")
          : "(no tasks defined)";

      const contextText =
        `## Change: ${changeName}\n` +
        `- Status: ${change.status}\n` +
        `- Created: ${change.createdAt}\n` +
        `- Updated: ${change.updatedAt}\n\n` +
        `## Proposal\n${fileContents.proposal}\n\n` +
        `## Requirements\n${fileContents.requirements}\n\n` +
        `## Scenarios\n${fileContents.scenarios}\n\n` +
        `## Design\n${fileContents.design}\n\n` +
        `## Tasks\n${fileContents.tasks}\n\n` +
        `## Task Status\n${tasksText}`;

      const response = await runAI(
        `Explain this change as a narrative lifecycle story:\n\n${contextText}`,
        {
          projectRoot,
          scope: "full",
          systemPrompt:
            "You are a technical narrator explaining a software change's full lifecycle. " +
            "Given the proposal, requirements, scenarios, design, and tasks for a change, " +
            "write a clear narrative that explains: ## The Problem, ## The Approach, ## The Plan, " +
            "## Current State, ## Key Decisions. Write in a clear, engaging style.",
        }
      );

      setState({
        phase: "done",
        result: { change, text: response.text, ...response },
      });
    } catch (err: any) {
      if (err.name === "AINotAvailableError") {
        setState({ phase: "error", error: err.message });
      } else {
        setState({
          phase: "error",
          error: err.message || "Explanation failed",
        });
      }
    }
  };

  if (state.phase === "loading" || state.phase === "reading" || state.phase === "generating") {
    return (
      <BetterspecBox title="betterspec explain" borderColor="accent">
        <Spinner label={state.message ?? "Working..."} />
      </BetterspecBox>
    );
  }

  if (state.phase === "error") {
    return (
      <BetterspecBox title="betterspec explain" borderColor="error">
        <Text hex={colors.error}>Failed to generate explanation</Text>
        {state.error && (
          <Text dimColor>{state.error}</Text>
        )}
      </BetterspecBox>
    );
  }

  const { result } = state;

  return (
    <InkBox flexDirection="column">
      <BetterspecBox
        title={`Change: ${changeName}`}
        borderColor={result?.change?.status === "archived" ? "success" : "accent"}
      >
        <InkBox gap={3}>
          <Text dimColor>Status: </Text>
          <Text hex={result?.change?.status === "archived" ? colors.success : colors.accent}>
            {result?.change?.status}
          </Text>
          <Text dimColor>| Tasks: </Text>
          <Text>{result?.change?.tasks?.length ?? 0}</Text>
        </InkBox>
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

export async function explainCommand(
  changeName: string,
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

  render(<ExplainDashboard projectRoot={projectRoot} changeName={changeName} />);
}
