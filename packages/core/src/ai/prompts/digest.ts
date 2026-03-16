export interface DigestInput {
  archivedChanges: Array<{
    name: string;
    proposal?: string;
    outcome?: string;
    archivedAt?: string;
  }>;
}

export function digestPrompt(input: DigestInput): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a technical writer generating a knowledge digest for a software project. 
Your output should be clear, concise, and valuable for both technical and non-technical stakeholders.
Format your response as markdown with these sections:
## What Changed
## Decisions Made
## Patterns Established
## Knowledge Shifts
## Metrics`;

  const changes = input.archivedChanges
    .map((c) => {
      let entry = `### ${c.name}`;
      if (c.archivedAt) entry += ` (${c.archivedAt})`;
      entry += "\n";
      if (c.proposal) entry += `**Proposal:**\n${c.proposal}\n`;
      if (c.outcome) entry += `**Outcome:**\n${c.outcome}\n`;
      return entry;
    })
    .join("\n---\n\n");

  const userPrompt = `Generate a knowledge digest from these recently archived changes:\n\n${changes}\n\nSynthesize the information — don't just repeat it. Identify themes, patterns, and shifts in the project's direction.`;

  return { systemPrompt, userPrompt };
}
