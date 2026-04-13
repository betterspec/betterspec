/**
 * betterspec show command (was: clarify)
 * Read-only spec viewer — shows proposal, requirements, scenarios, design, tasks.
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import {
  configExists,
  readChange,
  readChangeFile,
  listChanges,
} from "@betterspec/core";
import { BetterspecBox, Select, colors } from "../ui/ink/index.js";

interface SpecSection {
  title: string;
  path: string;
  content: string | null;
}

interface ShowViewProps {
  projectRoot: string;
  changeName: string;
}

const SpecBlock: React.FC<{ title: string; content: string | null }> = ({
  title,
  content,
}) => (
  <InkBox flexDirection="column" paddingBottom={1}>
    <Text bold color={colors.primary}>
      {title}
    </Text>
    {content ? (
      <Text>{content.trim()}</Text>
    ) : (
      <Text dimColor>(not yet written)</Text>
    )}
  </InkBox>
);

const ShowView: React.FC<ShowViewProps> = ({ projectRoot, changeName }) => {
  const [state, setState] = React.useState<{
    phase: "loading" | "done" | "error";
    change?: any;
    sections?: SpecSection[];
    error?: string;
  }>({ phase: "loading" });

  React.useEffect(() => {
    (async () => {
      try {
        const change = await readChange(projectRoot, changeName);
        const sectionDefs = [
          { title: "Proposal", path: "proposal.md" },
          { title: "Requirements", path: "specs/requirements.md" },
          { title: "Scenarios", path: "specs/scenarios.md" },
          { title: "Design", path: "design.md" },
          { title: "Tasks", path: "tasks.md" },
        ];

        const sections: SpecSection[] = await Promise.all(
          sectionDefs.map(async (s) => {
            let content: string | null = null;
            try {
              content = await readChangeFile(projectRoot, changeName, s.path);
            } catch {
              // missing — show as null
            }
            return { ...s, content };
          }),
        );

        setState({ phase: "done", change, sections });
      } catch (err: any) {
        setState({ phase: "error", error: err.message });
      }
    })();
  }, []);

  if (state.phase === "loading") {
    return (
      <BetterspecBox title="Show" borderColor="accent">
        <Text dimColor>Loading...</Text>
      </BetterspecBox>
    );
  }

  if (state.phase === "error") {
    return (
      <BetterspecBox title="Show" borderColor="error">
        <Text color={colors.error}>{state.error}</Text>
      </BetterspecBox>
    );
  }

  const { change, sections = [] } = state;

  return (
    <BetterspecBox
      title={`${changeName} (${change.status})`}
      borderColor="accent"
    >
      <InkBox flexDirection="column">
        <InkBox paddingBottom={1}>
          <Text dimColor>Created: {change.createdAt.slice(0, 10)} </Text>
          <Text dimColor>Updated: {change.updatedAt.slice(0, 10)}</Text>
        </InkBox>
        {sections.map((s) => (
          <SpecBlock key={s.path} title={s.title} content={s.content} />
        ))}
      </InkBox>
    </BetterspecBox>
  );
};

// Change picker for when no name is provided
interface PickerProps {
  projectRoot: string;
}

const ChangePicker: React.FC<PickerProps> = ({ projectRoot }) => {
  const [changes, setChanges] = React.useState<any[] | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    listChanges(projectRoot)
      .then(setChanges)
      .catch(() => setChanges([]));
  }, []);

  if (!changes) {
    return <Text dimColor>Loading...</Text>;
  }

  if (changes.length === 0) {
    return (
      <BetterspecBox title="Show" borderColor="info">
        <Text dimColor>
          No active changes. Run{" "}
          <Text color={colors.primary}>betterspec propose</Text> to create one.
        </Text>
      </BetterspecBox>
    );
  }

  if (selected) {
    return <ShowView projectRoot={projectRoot} changeName={selected} />;
  }

  return (
    <BetterspecBox title="Show — select a change" borderColor="accent">
      <Select
        message="Select a change to show:"
        options={changes.map((c) => ({
          label: `${c.name} (${c.status})`,
          value: c.name,
        }))}
        onSelect={setSelected}
        onCancel={() => process.exit(0)}
      />
    </BetterspecBox>
  );
};

export async function showCommand(
  changeName: string | undefined,
  options?: { cwd?: string },
): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    const { render } = await import("ink");
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

  const { render, waitUntilExit } = await import("ink").then((m) => ({
    render: m.render,
    waitUntilExit: null as any,
  }));

  if (changeName) {
    const { waitUntilExit } = render(
      <ShowView projectRoot={projectRoot} changeName={changeName} />,
    );
    await waitUntilExit();
  } else {
    const { waitUntilExit } = render(
      <ChangePicker projectRoot={projectRoot} />,
    );
    await waitUntilExit();
  }
}

// Keep old export name for backward compat during transition
export { showCommand as clarifyCommand };
