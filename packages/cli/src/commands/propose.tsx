/**
 * betterspec propose command — INK version
 * Create a new change with proposal, specs, design, and tasks
 *
 * Usage:
 *   betterspec propose "Add user auth"        non-interactive
 *   betterspec propose                       interactive (TTY required)
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import { configExists, createChange } from "@betterspec/core";
import {
  BetterspecBox,
  Logo,
  Spinner,
  colors,
} from "../ui/ink/index.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface ProposeViewProps {
  projectRoot: string;
  idea: string;
  name?: string;
}

const PROPOSAL_TEMPLATE = (idea: string) => `# Proposal: ${idea}

## Motivation

<!-- Why are we doing this? What problem does it solve? -->


## Scope

<!-- What is included and excluded from this change? -->

### In Scope


### Out of Scope


## Context

<!-- Any relevant context, links, or references -->


## Success Criteria

<!-- How do we know this is done? -->

1. 

---

*Proposed: ${new Date().toISOString().slice(0, 10)}*
`;

const ProposeView: React.FC<ProposeViewProps> = ({
  projectRoot,
  idea,
  name,
}) => {
  const [phase, setPhase] = React.useState<"creating" | "done" | "error">("creating");
  const [changeName, setChangeName] = React.useState<string>("");
  const [files, setFiles] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    doCreate();
  }, []);

  const doCreate = async () => {
    const slug = name ?? slugify(idea).slice(0, 50);
    const content = PROPOSAL_TEMPLATE(idea);

    try {
      await createChange(projectRoot, slug, content);
      setChangeName(slug);
      setFiles([
        `betterspec/changes/${slug}/proposal.md`,
        `betterspec/changes/${slug}/specs/requirements.md`,
        `betterspec/changes/${slug}/specs/scenarios.md`,
        `betterspec/changes/${slug}/design.md`,
        `betterspec/changes/${slug}/tasks.md`,
      ]);
      setPhase("done");
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
      setPhase("error");
    }
  };

  if (phase === "creating") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="betterspec propose" borderColor="accent">
          <Spinner label={`Creating change "${name ?? idea.slice(0, 30)}"...`} />
        </BetterspecBox>
      </InkBox>
    );
  }

  if (phase === "error") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Error" borderColor="error">
          <Text hex={colors.error}>{error}</Text>
        </BetterspecBox>
      </InkBox>
    );
  }

  return (
    <InkBox flexDirection="column">
      <Logo />
      <BetterspecBox title="Proposed" borderColor="success">
        <Text>
          <Text hex={colors.success}>✓</Text> Created change:{" "}
          <Text hex={colors.primary}>{changeName}</Text>
        </Text>
      </BetterspecBox>

      <InkBox flexDirection="column" paddingTop={1} paddingLeft={1}>
        <Text bold>Files:</Text>
        {files.map((f) => (
          <Text key={f} dimColor>  • {f}</Text>
        ))}
      </InkBox>

      <InkBox flexDirection="column" paddingTop={1}>
        <BetterspecBox title="Next Steps" borderColor="default">
          <InkBox flexDirection="column" gap={0}>
            <Text dimColor>  1. Fill in </Text>
            <Text hex={colors.primary}>    proposal.md</Text>
            <Text dimColor>       with motivation and scope</Text>
            <Text dimColor>  2. Define requirements in </Text>
            <Text hex={colors.primary}>    specs/requirements.md</Text>
            <Text dimColor>  3. Add scenarios in </Text>
            <Text hex={colors.primary}>    specs/scenarios.md</Text>
            <Text dimColor>  4. Describe approach in </Text>
            <Text hex={colors.primary}>    design.md</Text>
            <Text dimColor>  5. Break into tasks in </Text>
            <Text hex={colors.primary}>    tasks.md</Text>
          </InkBox>
        </BetterspecBox>
      </InkBox>

      <Text dimColor paddingTop={1}>
        Run{" "}
        <Text hex={colors.primary}>betterspec clarify {changeName}</Text>
        <Text dimColor> to refine requirements.</Text>
      </Text>
    </InkBox>
  );
};

export async function proposeCommand(
  idea?: string,
  options?: { cwd?: string }
): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    render(
      <InkBox flexDirection="column" padding={1}>
        <Logo />
        <BetterspecBox title="Not Initialized" borderColor="error">
          <Text>betterspec is not initialized.</Text>
          <Text dimColor> Run </Text>
          <Text hex={colors.primary}>betterspec init</Text>
          <Text dimColor> first.</Text>
        </BetterspecBox>
      </InkBox>
    );
    process.exit(1);
  }

  if (!idea) {
    render(
      <InkBox flexDirection="column" padding={1}>
        <Logo />
        <BetterspecBox title="Usage" borderColor="default">
          <Text>betterspec propose "your idea here"</Text>
          <Text dimColor> </Text>
          <Text dimColor>Provide the idea as an argument:</Text>
          <Text dimColor>  betterspec propose "Add dark mode"</Text>
        </BetterspecBox>
      </InkBox>
    );
    process.exit(1);
  }

  render(
    <ProposeView
      projectRoot={projectRoot}
      idea={idea}
    />
  );
}
