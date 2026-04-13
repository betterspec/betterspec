/**
 * betterspec verify command — INK version
 * Structural verification of a change's spec completeness
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import {
  configExists,
  readChange,
  readChangeFile,
  listChanges,
  getChangePath,
} from "@betterspec/core";
import {
  BetterspecBox,
  colors,
} from "../ui/ink/index.js";

interface VerifyCheck {
  name: string;
  passed: boolean;
  message: string;
}

interface VerifyResult {
  changeName: string;
  checks: VerifyCheck[];
  error?: boolean;
}

interface VerifyDashboardProps {
  projectRoot: string;
  changeName?: string;
}

async function verifyChange(
  projectRoot: string,
  changeName: string
): Promise<VerifyCheck[]> {
  const checks: VerifyCheck[] = [];

  const specFiles = [
    { name: "Proposal", path: "proposal.md", hint: "motivation and scope" },
    {
      name: "Requirements",
      path: "specs/requirements.md",
      hint: "functional and non-functional requirements",
    },
    {
      name: "Scenarios",
      path: "specs/scenarios.md",
      hint: "happy path, edge cases, error cases",
    },
    { name: "Design", path: "design.md", hint: "technical approach" },
    { name: "Tasks", path: "tasks.md", hint: "implementation breakdown" },
  ];

  for (const spec of specFiles) {
    try {
      const content = await readChangeFile(projectRoot, changeName, spec.path);
      const hasContent =
        content.replace(/<!--.*?-->/gs, "").trim().length > 50;
      checks.push({
        name: spec.name,
        passed: hasContent,
        message: hasContent
          ? `${spec.path} has content`
          : `${spec.path} is mostly empty — define ${spec.hint}`,
      });
    } catch {
      checks.push({
        name: spec.name,
        passed: false,
        message: `${spec.path} is missing`,
      });
    }
  }

  return checks;
}

const VerifyRow: React.FC<{ check: VerifyCheck }> = ({ check }) => (
  <InkBox>
    <Text color={check.passed ? colors.success : colors.error}>
      {check.passed ? "\u2713" : "\u2717"}
    </Text>
    <Text> </Text>
    <Text bold={!check.passed} color={check.passed ? colors.muted : colors.warning}>
      {check.name}
    </Text>
    <Text dimColor>: </Text>
    <Text color={check.passed ? colors.muted : colors.warning}>
      {check.message}
    </Text>
  </InkBox>
);

const VerifyDashboard: React.FC<VerifyDashboardProps> = ({
  projectRoot,
  changeName,
}) => {
  const [results, setResults] = React.useState<VerifyResult[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    runVerify();
  }, []);

  const runVerify = async () => {
    try {
      const changesToVerify: string[] = [];

      if (changeName) {
        changesToVerify.push(changeName);
      } else {
        const changes = await listChanges(projectRoot, false);
        changesToVerify.push(...changes.map((c) => c.name));
      }

      const verifyResults: VerifyResult[] = [];

      for (const name of changesToVerify) {
        try {
          const checks = await verifyChange(projectRoot, name);
          verifyResults.push({ changeName: name, checks });
        } catch {
          verifyResults.push({
            changeName: name,
            checks: [],
            error: true,
          });
        }
      }

      setResults(verifyResults);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <BetterspecBox title="betterspec verify" borderColor="accent">
        <Text dimColor>Running verification checks...</Text>
      </BetterspecBox>
    );
  }

  if (!results || results.length === 0) {
    return (
      <BetterspecBox title="Nothing to Verify" borderColor="info">
        <Text>No active changes to verify.</Text>
        <Text dimColor>Run </Text>
        <Text color={colors.primary}>betterspec propose</Text>
        <Text dimColor> to create one.</Text>
      </BetterspecBox>
    );
  }

  let totalPassed = 0;
  let totalChecks = 0;

  const changeBoxes = results.map((result) => {
    const passed = result.checks.filter((c) => c.passed).length;
    const total = result.checks.length;
    totalPassed += passed;
    totalChecks += total;
    const allPassed = passed === total;
    const borderColor = result.error
      ? "error"
      : allPassed
        ? "success"
        : "warning";

    if (result.error) {
      return (
        <InkBox key={result.changeName} paddingTop={1}>
          <BetterspecBox
            title={result.changeName}
            borderColor="error"
          >
            <Text color={colors.error}>Change not found</Text>
          </BetterspecBox>
        </InkBox>
      );
    }

    return (
      <InkBox key={result.changeName} paddingTop={1}>
        <BetterspecBox title={result.changeName} borderColor={borderColor as any}>
          <InkBox flexDirection="column" gap={0}>
            {result.checks.map((check, i) => (
              <VerifyRow key={i} check={check} />
            ))}
          </InkBox>
          <InkBox paddingTop={1}>
            <Text>
              <Text color={allPassed ? colors.success : colors.warning}>
                {passed}/{total} checks passed
              </Text>
            </Text>
          </InkBox>
        </BetterspecBox>
      </InkBox>
    );
  });

  const allPassed = totalPassed === totalChecks;

  return (
    <InkBox flexDirection="column">
      {changeBoxes}
      {results.length > 1 && (
        <InkBox paddingTop={1}>
          <BetterspecBox
            title="Summary"
            borderColor={allPassed ? "success" : "warning"}
          >
            <Text
              color={allPassed ? colors.success : colors.warning}
            >
              {totalPassed}/{totalChecks} total checks passed across{" "}
              {results.length} changes
            </Text>
          </BetterspecBox>
        </InkBox>
      )}
    </InkBox>
  );
};

export async function verifyCommand(
  changeName?: string,
  options?: { cwd?: string }
): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    render(
      <BetterspecBox title="Not Initialized" borderColor="error">
        <Text>betterspec is not initialized.</Text>
        <Text dimColor> Run </Text>
        <Text color={colors.primary}>betterspec init</Text>
        <Text dimColor> first.</Text>
      </BetterspecBox>
    );
    process.exit(1);
  }

  render(<VerifyDashboard projectRoot={projectRoot} changeName={changeName} />);
}
