/**
 * forgelore clarify command
 * Review and refine requirements for a change
 */

import * as p from "@clack/prompts";
import { resolve } from "node:path";
import {
  configExists,
  readChange,
  readChangeFile,
  updateChangeStatus,
  getChangePath,
} from "@forgelore/core";
import { renderBox, renderSection } from "../ui/banner.js";
import { colors, icons, gradients } from "../ui/theme.js";

export async function clarifyCommand(
  changeName: string,
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

  p.intro(gradients.brand(" forgelore clarify "));

  let change;
  try {
    change = await readChange(projectRoot, changeName);
  } catch {
    console.log(
      renderBox(
        `${icons.error} Change ${colors.primary(changeName)} not found.\nRun ${colors.primary("forgelore list")} to see available changes.`,
        "Not Found",
        "#EF4444"
      )
    );
    process.exit(1);
  }

  // Show current state
  const proposal = await readChangeFile(projectRoot, changeName, "proposal.md");
  let requirements: string;
  try {
    requirements = await readChangeFile(projectRoot, changeName, "specs/requirements.md");
  } catch {
    requirements = "(not yet defined)";
  }

  let scenarios: string;
  try {
    scenarios = await readChangeFile(projectRoot, changeName, "specs/scenarios.md");
  } catch {
    scenarios = "(not yet defined)";
  }

  console.log(
    renderBox(
      [
        `${icons.info} Change: ${colors.primary(changeName)}`,
        `${icons.info} Status: ${colors.accent(change.status)}`,
        `${icons.info} Created: ${colors.muted(change.createdAt.slice(0, 10))}`,
      ].join("\n"),
      "Change Details"
    )
  );

  console.log(renderSection("Proposal", colors.muted(proposal.slice(0, 500))));
  console.log(renderSection("Requirements", colors.muted(requirements.slice(0, 500))));
  console.log(renderSection("Scenarios", colors.muted(scenarios.slice(0, 500))));

  // Clarification checklist
  const checks = await p.group({
    proposalComplete: () =>
      p.confirm({
        message: "Is the proposal well-defined with clear motivation and scope?",
        initialValue: false,
      }),
    requirementsDefined: () =>
      p.confirm({
        message: "Are functional and non-functional requirements specified?",
        initialValue: false,
      }),
    scenariosCovered: () =>
      p.confirm({
        message: "Are happy path, edge cases, and error scenarios defined?",
        initialValue: false,
      }),
    readyForDesign: () =>
      p.confirm({
        message: "Is this change ready for design and task breakdown?",
        initialValue: false,
      }),
  });

  if (p.isCancel(checks)) {
    p.cancel("Clarify cancelled.");
    process.exit(0);
  }

  const allReady = checks.proposalComplete && checks.requirementsDefined && checks.scenariosCovered && checks.readyForDesign;

  if (allReady) {
    await updateChangeStatus(projectRoot, changeName, "planning");
    console.log(
      renderBox(
        `${icons.success} Change ${colors.primary(changeName)} is ready for design.\n` +
          `Status updated to ${colors.accent("planning")}.\n\n` +
          `Next: Fill in ${colors.primary("design.md")} and ${colors.primary("tasks.md")}`,
        "Ready",
        "#10B981"
      )
    );
  } else {
    const incomplete = [];
    if (!checks.proposalComplete) incomplete.push(`  ${icons.pending} Proposal needs refinement`);
    if (!checks.requirementsDefined) incomplete.push(`  ${icons.pending} Requirements need specification`);
    if (!checks.scenariosCovered) incomplete.push(`  ${icons.pending} Scenarios need coverage`);

    console.log(
      renderBox(
        `${icons.warning} Change ${colors.primary(changeName)} needs more clarification:\n\n` +
          incomplete.join("\n") +
          `\n\n${colors.muted("Edit the spec files and run")} ${colors.primary("forgelore clarify " + changeName)} ${colors.muted("again.")}`,
        "Needs Work",
        "#F59E0B"
      )
    );
  }

  p.outro(colors.muted("Specs are the foundation. Take the time to get them right."));
}
