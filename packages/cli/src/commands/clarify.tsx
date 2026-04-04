/**
 * betterspec clarify command — INK version
 * Review and refine requirements for a change
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import {
  configExists,
  readChange,
  readChangeFile,
  updateChangeStatus,
  listChanges,
} from "@betterspec/core";
import {
  BetterspecBox,
  Logo,
  Confirm,
  Select,
  Spinner,
  colors,
} from "../ui/ink/index.js";

interface ChecklistResult {
  proposalComplete: boolean;
  requirementsDefined: boolean;
  scenariosCovered: boolean;
  readyForDesign: boolean;
}

interface ClarifyViewProps {
  projectRoot: string;
  changeName?: string;
}

// ── Change detail display ─────────────────────────────────────────

const ChangeDetails: React.FC<{
  projectRoot: string;
  changeName: string;
}> = ({ projectRoot, changeName }) => {
  const [proposal, setProposal] = React.useState<string>("");
  const [requirements, setRequirements] = React.useState<string>("");
  const [scenarios, setScenarios] = React.useState<string>("");
  const [status, setStatus] = React.useState<string>("");
  const [created, setCreated] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const change = await readChange(projectRoot, changeName);
        const [prop, req, scen] = await Promise.all([
          readChangeFile(projectRoot, changeName, "proposal.md"),
          readChangeFile(projectRoot, changeName, "specs/requirements.md").catch(() => "(not yet defined)"),
          readChangeFile(projectRoot, changeName, "specs/scenarios.md").catch(() => "(not yet defined)"),
        ]);
        setProposal(prop);
        setRequirements(req);
        setScenarios(scen);
        setStatus(change.status);
        setCreated(change.createdAt.slice(0, 10));
      } finally {
        setLoading(false);
      }
    })();
  }, [projectRoot, changeName]);

  if (loading) {
    return <Spinner label="Loading change..." />;
  }

  return (
    <BetterspecBox title={`Change: ${changeName}`} borderColor="info">
      <Text>
        Status: <Text hex={colors.accent}>{status}</Text>
        {"  "}
        Created: <Text dimColor>{created}</Text>
      </Text>
      <Text dimColor> </Text>
      <Text bold>Proposal:</Text>
      <Text dimColor>{proposal.slice(0, 300)}{proposal.length > 300 ? "..." : ""}</Text>
      <Text dimColor> </Text>
      <Text bold>Requirements:</Text>
      <Text dimColor>{requirements.slice(0, 300)}{requirements.length > 300 ? "..." : ""}</Text>
      <Text dimColor> </Text>
      <Text bold>Scenarios:</Text>
      <Text dimColor>{scenarios.slice(0, 300)}{scenarios.length > 300 ? "..." : ""}</Text>
    </BetterspecBox>
  );
};

// ── Checklist step ───────────────────────────────────────────────

const ChecklistRow: React.FC<{
  label: string;
  checked: boolean;
  onToggle: () => void;
}> = ({ label, checked, onToggle }) => (
  <InkBox gap={1}>
    <Text
      hex={checked ? colors.success : colors.muted}
      onClick={onToggle}
    >
      {checked ? "☑" : "☐"}
    </Text>
    <Text bold={!checked} dimColor={checked}>{label}</Text>
  </InkBox>
);

// ── Main view ────────────────────────────────────────────────────

const ClarifyView: React.FC<ClarifyViewProps> = ({
  projectRoot,
  changeName: initialChange,
}) => {
  const [phase, setPhase] = React.useState<"select" | "details" | "checklist" | "done">("select");
  const [changeName, setChangeName] = React.useState<string>(initialChange ?? "");
  const [allChanges, setAllChanges] = React.useState<any[]>([]);
  const [checklist, setChecklist] = React.useState<ChecklistResult>({
    proposalComplete: false,
    requirementsDefined: false,
    scenariosCovered: false,
    readyForDesign: false,
  });

  React.useEffect(() => {
    if (!initialChange) {
      (async () => {
        const changes = await listChanges(projectRoot, false);
        setAllChanges(changes);
      })();
    }
  }, []);

  // Auto-advance to details if changeName provided
  React.useEffect(() => {
    if (initialChange) {
      setChangeName(initialChange);
      setPhase("details");
    }
  }, [initialChange]);

  const handleSelectChange = (name: string) => {
    setChangeName(name);
    setPhase("details");
  };

  const allReady =
    checklist.proposalComplete &&
    checklist.requirementsDefined &&
    checklist.scenariosCovered &&
    checklist.readyForDesign;

  const handleDone = async () => {
    if (allReady) {
      await updateChangeStatus(projectRoot, changeName, "planning");
    }
    setPhase("done");
  };

  const incomplete: string[] = [];
  if (!checklist.proposalComplete) incomplete.push("Proposal needs refinement");
  if (!checklist.requirementsDefined) incomplete.push("Requirements need specification");
  if (!checklist.scenariosCovered) incomplete.push("Scenarios need coverage");

  // ── Render ──────────────────────────────────────────────────

  if (phase === "select") {
    if (allChanges.length === 0) {
      return (
        <InkBox flexDirection="column">
          <Logo />
          <BetterspecBox title="No Changes" borderColor="info">
            <Text>No active changes to clarify.</Text>
            <Text dimColor>Run </Text>
            <Text hex={colors.primary}>betterspec propose "your idea"</Text>
            <Text dimColor> to create one.</Text>
          </BetterspecBox>
        </InkBox>
      );
    }

    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Select a Change" borderColor="accent">
          <Text>Choose a change to clarify:</Text>
        </BetterspecBox>
        <InkBox paddingTop={1}>
          <Select
            message=""
            options={allChanges.map((c) => ({
              label: c.name,
              value: c.name,
              hint: c.status,
            }))}
            onSelect={handleSelectChange}
            onCancel={() => process.exit(0)}
          />
        </InkBox>
      </InkBox>
    );
  }

  if (phase === "details") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <ChangeDetails projectRoot={projectRoot} changeName={changeName} />
        <InkBox paddingTop={1}>
          <Confirm
            message="Start clarification checklist?"
            onConfirm={() => setPhase("checklist")}
            onCancel={() => process.exit(0)}
          />
        </InkBox>
      </InkBox>
    );
  }

  if (phase === "checklist") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title={`Clarify: ${changeName}`} borderColor="accent">
          <Text bold>Review checklist:</Text>
          <Text dimColor>Click items to toggle. All must be checked to proceed.</Text>
          <Text dimColor> </Text>
          <ChecklistRow
            label="Proposal is well-defined with clear motivation and scope"
            checked={checklist.proposalComplete}
            onToggle={() =>
              setChecklist((c) => ({
                ...c,
                proposalComplete: !c.proposalComplete,
              }))}
          />
          <ChecklistRow
            label="Functional and non-functional requirements are specified"
            checked={checklist.requirementsDefined}
            onToggle={() =>
              setChecklist((c) => ({
                ...c,
                requirementsDefined: !c.requirementsDefined,
              }))}
          />
          <ChecklistRow
            label="Happy path, edge cases, and error scenarios defined"
            checked={checklist.scenariosCovered}
            onToggle={() =>
              setChecklist((c) => ({
                ...c,
                scenariosCovered: !c.scenariosCovered,
              }))}
          />
          <ChecklistRow
            label="This change is ready for design and task breakdown"
            checked={checklist.readyForDesign}
            onToggle={() =>
              setChecklist((c) => ({
                ...c,
                readyForDesign: !c.readyForDesign,
              }))}
          />
        </BetterspecBox>
        <InkBox paddingTop={1}>
          <Confirm
            message={allReady ? "Mark as ready for planning?" : "Some items incomplete. Continue anyway?"}
            onConfirm={handleDone}
            onCancel={() => process.exit(0)}
          />
        </InkBox>
      </InkBox>
    );
  }

  if (phase === "done") {
    if (allReady) {
      return (
        <InkBox flexDirection="column">
          <Logo />
          <BetterspecBox title="Ready" borderColor="success">
            <Text>
              <Text hex={colors.success}>✓</Text> Change{" "}
              <Text hex={colors.primary}>{changeName}</Text> is ready for design.
            </Text>
            <Text dimColor>Status updated to </Text>
            <Text hex={colors.accent}>planning</Text>
            <Text dimColor>.</Text>
            <Text dimColor> </Text>
            <Text dimColor>Next: Fill in design.md and tasks.md</Text>
          </BetterspecBox>
        </InkBox>
      );
    }

    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Needs Work" borderColor="warning">
          <Text>
            <Text hex={colors.warning}>⚠</Text> Change{" "}
            <Text hex={colors.primary}>{changeName}</Text> needs more clarification.
          </Text>
          <Text dimColor> </Text>
          {incomplete.map((item) => (
            <Text key={item} dimColor>  • {item}</Text>
          ))}
          <Text dimColor> </Text>
          <Text dimColor>Edit spec files and run again.</Text>
        </BetterspecBox>
      </InkBox>
    );
  }

  return null;
};

export async function clarifyCommand(
  changeName?: string,
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

  // If changeName provided, verify it exists
  if (changeName) {
    try {
      await readChange(projectRoot, changeName);
    } catch {
      render(
        <InkBox flexDirection="column" padding={1}>
          <Logo />
          <BetterspecBox title="Not Found" borderColor="error">
            <Text>
              Change <Text hex={colors.primary}>{changeName}</Text> not found.
            </Text>
            <Text dimColor>Run </Text>
            <Text hex={colors.primary}>betterspec list</Text>
            <Text dimColor> to see available changes.</Text>
          </BetterspecBox>
        </InkBox>
      );
      process.exit(1);
    }
  }

  render(<ClarifyView projectRoot={projectRoot} changeName={changeName} />);
}
