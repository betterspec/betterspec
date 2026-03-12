/**
 * forgelore verify command
 * Structural verification of a change's spec completeness
 * NOTE: This does NOT call any LLM — it checks file existence and content structure
 */

import { resolve } from "node:path";
import {
  configExists,
  readChange,
  readChangeFile,
  listChanges,
  getChangePath,
  fileExists,
} from "@forgelore/core";
import { renderBox, renderSection } from "../ui/banner.js";
import { colors, icons, gradients } from "../ui/theme.js";

interface VerifyCheck {
  name: string;
  passed: boolean;
  message: string;
}

async function verifyChange(
  projectRoot: string,
  changeName: string
): Promise<VerifyCheck[]> {
  const checks: VerifyCheck[] = [];
  const changePath = getChangePath(projectRoot, changeName);

  // Check proposal.md exists and has content
  try {
    const proposal = await readChangeFile(projectRoot, changeName, "proposal.md");
    const hasContent = proposal.replace(/<!--.*?-->/gs, "").trim().length > 50;
    checks.push({
      name: "Proposal",
      passed: hasContent,
      message: hasContent
        ? "proposal.md has content"
        : "proposal.md is mostly empty — fill in motivation and scope",
    });
  } catch {
    checks.push({
      name: "Proposal",
      passed: false,
      message: "proposal.md is missing",
    });
  }

  // Check requirements.md
  try {
    const reqs = await readChangeFile(projectRoot, changeName, "specs/requirements.md");
    const hasContent = reqs.replace(/<!--.*?-->/gs, "").trim().length > 50;
    checks.push({
      name: "Requirements",
      passed: hasContent,
      message: hasContent
        ? "requirements.md has content"
        : "requirements.md is mostly empty — define functional and non-functional requirements",
    });
  } catch {
    checks.push({
      name: "Requirements",
      passed: false,
      message: "specs/requirements.md is missing",
    });
  }

  // Check scenarios.md
  try {
    const scenarios = await readChangeFile(projectRoot, changeName, "specs/scenarios.md");
    const hasContent = scenarios.replace(/<!--.*?-->/gs, "").trim().length > 50;
    checks.push({
      name: "Scenarios",
      passed: hasContent,
      message: hasContent
        ? "scenarios.md has content"
        : "scenarios.md is mostly empty — define happy path, edge cases, error cases",
    });
  } catch {
    checks.push({
      name: "Scenarios",
      passed: false,
      message: "specs/scenarios.md is missing",
    });
  }

  // Check design.md
  try {
    const design = await readChangeFile(projectRoot, changeName, "design.md");
    const hasContent = design.replace(/<!--.*?-->/gs, "").trim().length > 50;
    checks.push({
      name: "Design",
      passed: hasContent,
      message: hasContent
        ? "design.md has content"
        : "design.md is mostly empty — describe technical approach",
    });
  } catch {
    checks.push({
      name: "Design",
      passed: false,
      message: "design.md is missing",
    });
  }

  // Check tasks.md
  try {
    const tasks = await readChangeFile(projectRoot, changeName, "tasks.md");
    const hasContent = tasks.replace(/<!--.*?-->/gs, "").trim().length > 50;
    checks.push({
      name: "Tasks",
      passed: hasContent,
      message: hasContent
        ? "tasks.md has content"
        : "tasks.md is mostly empty — break down implementation into tasks",
    });
  } catch {
    checks.push({
      name: "Tasks",
      passed: false,
      message: "tasks.md is missing",
    });
  }

  return checks;
}

export async function verifyCommand(
  changeName?: string,
  options?: { cwd?: string }
): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    console.log(
      renderBox(
        `${icons.error} forgelore is not initialized.\nRun ${colors.primary("forgelore init")} first.`,
        "Not Initialized",
        "#EF4444"
      )
    );
    process.exit(1);
  }

  // If no change specified, verify all active changes
  const changesToVerify: string[] = [];
  if (changeName) {
    changesToVerify.push(changeName);
  } else {
    const changes = await listChanges(projectRoot, false);
    if (changes.length === 0) {
      console.log(
        renderBox(
          `${icons.info} No active changes to verify.\nRun ${colors.primary("forgelore propose")} to create one.`,
          "Nothing to Verify"
        )
      );
      return;
    }
    changesToVerify.push(...changes.map((c) => c.name));
  }

  let totalPassed = 0;
  let totalChecks = 0;

  for (const name of changesToVerify) {
    try {
      const checks = await verifyChange(projectRoot, name);
      const passed = checks.filter((c) => c.passed).length;
      totalPassed += passed;
      totalChecks += checks.length;

      const lines = checks.map(
        (c) =>
          `  ${c.passed ? icons.success : icons.error} ${colors.white(c.name)}: ${c.passed ? colors.muted(c.message) : colors.warning(c.message)}`
      );

      const allPassed = passed === checks.length;
      const borderColor = allPassed ? "#10B981" : "#F59E0B";

      console.log(
        renderBox(
          `${allPassed ? icons.success : icons.warning} ${passed}/${checks.length} checks passed\n\n${lines.join("\n")}`,
          name,
          borderColor
        )
      );
    } catch {
      console.log(
        renderBox(
          `${icons.error} Change ${colors.primary(name)} not found.`,
          name,
          "#EF4444"
        )
      );
    }
  }

  // Summary
  if (changesToVerify.length > 1) {
    const allPassed = totalPassed === totalChecks;
    console.log(
      renderBox(
        `${allPassed ? icons.success : icons.warning} ${totalPassed}/${totalChecks} total checks passed across ${changesToVerify.length} changes`,
        "Summary",
        allPassed ? "#10B981" : "#F59E0B"
      )
    );
  }
}
