/**
 * betterspec archive command — INK version
 * Move a change to archive and extract capabilities
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import {
  configExists,
  readChange,
  archiveChange,
  readOutcome,
  writeOutcome,
  getChangePath,
} from "@betterspec/core";
import {
  BetterspecBox,
  Confirm,
  Spinner,
  Logo,
  colors,
} from "../ui/ink/index.js";

type Phase =
  | "loading"
  | "confirm"
  | "confirm-cancel"
  | "archiving"
  | "done"
  | "error"
  | "outcome-prompt";

interface ArchiveViewProps {
  projectRoot: string;
  changeName: string;
  skipOutcome: boolean;
}

const ArchiveView: React.FC<ArchiveViewProps> = ({
  projectRoot,
  changeName,
  skipOutcome,
}) => {
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [archivePath, setArchivePath] = React.useState<string>("");
  const [errorMsg, setErrorMsg] = React.useState<string>("");

  React.useEffect(() => {
    runArchive();
  }, []);

  const runArchive = async () => {
    // Read change
    try {
      await readChange(projectRoot, changeName);
    } catch {
      setErrorMsg(`Change "${changeName}" not found.`);
      setPhase("error");
      return;
    }

    // Check outcome
    if (!skipOutcome) {
      const changePath = getChangePath(projectRoot, changeName);
      const existingOutcome = await readOutcome(changePath);
      if (!existingOutcome) {
        setPhase("outcome-prompt");
        return;
      }
    }

    // Proceed to confirm
    setPhase("confirm");
  };

  const handleConfirm = async () => {
    setPhase("archiving");
    try {
      const path = await archiveChange(projectRoot, changeName);
      setArchivePath(path);
      setPhase("done");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Unknown error");
      setPhase("error");
    }
  };

  const handleOutcomeSkip = async () => {
    // Write a placeholder outcome and proceed
    try {
      const changePath = getChangePath(projectRoot, changeName);
      const placeholder = `# Outcome: ${changeName}

## What Was Built

<!-- Summary of what was implemented -->


## Capabilities

<!-- List capabilities that emerged from this change -->

-

## Lessons Learned

<!-- What did we learn? -->


## Files Changed

-

*Archived: ${new Date().toISOString().slice(0, 10)}*
`;
      await writeOutcome(changePath, placeholder);
      setPhase("confirm");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Failed to create placeholder outcome");
      setPhase("error");
    }
  };

  const handleCancel = () => {
    setPhase("confirm-cancel");
  };

  // ── Render ──────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="betterspec archive" borderColor="accent">
          <Spinner label={`Reading ${changeName}...`} />
        </BetterspecBox>
      </InkBox>
    );
  }

  if (phase === "outcome-prompt") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Step 1: Outcome" borderColor="warning">
          <Text>
            Before archiving, create an{" "}
            <Text hex={colors.primary}>outcome.md</Text>.
          </Text>
          <Text dimColor> This captures what was built, capabilities, and lessons.</Text>
          <Text dimColor> </Text>
          <Text dimColor>
            Run the archive command again after editing the outcome file, or:
          </Text>
        </BetterspecBox>
        <InkBox paddingTop={1}>
          <Confirm
            message="Create a placeholder outcome.md and continue archiving?"
            onConfirm={handleOutcomeSkip}
            onCancel={handleCancel}
          />
        </InkBox>
      </InkBox>
    );
  }

  if (phase === "confirm") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Confirm Archive" borderColor="accent">
          <Text>
            Archive{" "}
            <Text hex={colors.primary}>{changeName}</Text>
            ? This will move it to betterspec/changes/archive/.
          </Text>
        </BetterspecBox>
        <InkBox paddingTop={1}>
          <Confirm
            message={`Archive "${changeName}"?`}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </InkBox>
      </InkBox>
    );
  }

  if (phase === "confirm-cancel") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Cancelled" borderColor="default">
          <Text dimColor>Archive paused.</Text>
        </BetterspecBox>
      </InkBox>
    );
  }

  if (phase === "archiving") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Archiving..." borderColor="accent">
          <Spinner label={`Archiving ${changeName}...`} />
        </BetterspecBox>
      </InkBox>
    );
  }

  if (phase === "done") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Archived" borderColor="success">
          <Text>
            <Text hex={colors.success}>✓</Text>{" "}
            <Text bold>Archived:</Text>{" "}
            <Text hex={colors.primary}>{changeName}</Text>
          </Text>
          <Text dimColor>→ {archivePath}</Text>
          <Text dimColor> </Text>
          <Text dimColor>Next steps:</Text>
          <Text dimColor>  1. Review outcome.md and extract capabilities</Text>
          <Text dimColor>  2. Run betterspec capabilities to view knowledge base</Text>
          <Text dimColor>  3. Update knowledge/architecture.md if needed</Text>
        </BetterspecBox>
        <Text dimColor>Knowledge captured. The spec lives on.</Text>
      </InkBox>
    );
  }

  if (phase === "error") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Error" borderColor="error">
          <Text hex={colors.error}>{errorMsg}</Text>
        </BetterspecBox>
      </InkBox>
    );
  }

  return null;
};

export async function archiveCommand(
  changeName: string,
  options?: { skipOutcome?: boolean; cwd?: string }
): Promise<void> {
  if (!changeName) {
    console.error("Usage: betterspec archive <change-name>");
    process.exit(1);
  }

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

  render(
    <ArchiveView
      projectRoot={projectRoot}
      changeName={changeName}
      skipOutcome={options?.skipOutcome ?? false}
    />
  );
}
