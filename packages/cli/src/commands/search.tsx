/**
 * betterspec search command — INK version
 * AI-powered semantic search across specs, changes, and capabilities
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import {
  configExists,
  listChanges,
  listCapabilities,
  runAI,
} from "@betterspec/core";
import {
  Box as BetterspecBox,
  Spinner,
  colors,
} from "../ui/ink/index.js";

interface SearchResult {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
  cost?: number;
  model?: string;
}

interface SearchDashboardProps {
  projectRoot: string;
  query: string;
}

const SearchDashboard: React.FC<SearchDashboardProps> = ({
  projectRoot,
  query,
}) => {
  const [state, setState] = React.useState<{
    phase: "searching" | "analyzing" | "done" | "error";
    message?: string;
    result?: SearchResult;
    error?: string;
  }>({ phase: "searching", message: `Searching for "${query}"...` });

  React.useEffect(() => {
    runSearch();
  }, []);

  const runSearch = async () => {
    try {
      const [changes, capabilities] = await Promise.all([
        listChanges(projectRoot),
        listCapabilities(projectRoot),
      ]);

      setState({ phase: "analyzing", message: "Analyzing with AI..." });

      const changesText = changes
        .map((c) => `- ${c.name} (${c.status}, updated ${c.updatedAt})`)
        .join("\n");

      const capsText = capabilities
        .map(
          (c) =>
            `- ${c.name} (from ${c.sourceChange}, archived ${c.archivedAt})`
        )
        .join("\n");

      const response = await runAI(
        `Search query: "${query}"\n\n` +
          `## Active Changes\n${changesText || "None"}\n\n` +
          `## Capabilities\n${capsText || "None"}\n\n` +
          `Find and rank results relevant to the query. For each result, explain why it matches.`,
        {
          projectRoot,
          scope: "search",
          systemPrompt:
            "You are a search engine for a software project's specification system. " +
            "Return ranked results with: name, type (change/capability), relevance score (1-10), " +
            "and explanation. Only include genuinely relevant results.",
        }
      );

      setState({
        phase: "done",
        result: response,
      });
    } catch (err: any) {
      setState({
        phase: "error",
        error: err.message || "Search failed",
      });
    }
  };

  if (state.phase === "searching" || state.phase === "analyzing") {
    return (
      <BetterspecBox title="betterspec search" borderColor="accent">
        <Spinner label={state.message ?? "Searching..."} />
      </BetterspecBox>
    );
  }

  if (state.phase === "error") {
    return (
      <BetterspecBox title="betterspec search" borderColor="error">
        <Text hex={colors.error}>Search failed</Text>
        {state.error && <Text dimColor>{state.error}</Text>}
      </BetterspecBox>
    );
  }

  const { result } = state;

  return (
    <InkBox flexDirection="column">
      <BetterspecBox title="Search Results" borderColor="success">
        <Text hex={colors.success}>\u2713 Search complete</Text>
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

export async function searchCommand(
  query: string,
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

  render(<SearchDashboard projectRoot={projectRoot} query={query} />);
}
