export interface ExplainInput {
  changeName: string;
  proposal?: string;
  requirements?: string;
  scenarios?: string;
  design?: string;
  tasks?: string;
  outcome?: string;
  status: string;
}

export function explainPrompt(input: ExplainInput): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are explaining the full lifecycle of a software change managed through betterspec's spec-driven workflow.
Trace the change from motivation through implementation to knowledge capture.

Write a narrative that covers:

## Why This Change Was Made
[Motivation and context from the proposal]

## What Was Specified
[Key requirements and scenarios — what was expected]

## How It Was Designed
[Technical approach, key design decisions, tradeoffs]

## What Was Built
[Implementation summary from outcome, or current state from task status]

## Knowledge Captured
[Capabilities extracted, patterns established, decisions recorded]

Write this as a coherent story, not a bullet-point summary. Someone reading this should understand not just what happened, but why each decision was made.`;

  const sections: string[] = [];
  sections.push(`# Change: ${input.changeName} (${input.status})`);
  if (input.proposal) sections.push(`## Proposal\n${input.proposal}`);
  if (input.requirements) sections.push(`## Requirements\n${input.requirements}`);
  if (input.scenarios) sections.push(`## Scenarios\n${input.scenarios}`);
  if (input.design) sections.push(`## Design\n${input.design}`);
  if (input.tasks) sections.push(`## Tasks\n${input.tasks}`);
  if (input.outcome) sections.push(`## Outcome\n${input.outcome}`);

  const userPrompt = `Explain the full lifecycle of this change:\n\n${sections.join("\n\n")}`;

  return { systemPrompt, userPrompt };
}
