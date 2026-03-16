export interface ImpactInput {
  targetPath: string;
  directReferences: string[]; // grep-based matches found before calling AI
}

export function impactPrompt(input: ImpactInput): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are analyzing the impact of changing a file or directory in a software project.
You will receive the project's knowledge base (patterns, capabilities, active specs) as context.
Your job is to identify both direct and inferred references to the target path, and assess regression risk.

Format your response as:

## Direct References
[List the grep-based matches provided, plus any you find in the knowledge context]

## Inferred References
[Patterns, architectural components, or capabilities that depend on this path indirectly — 
for example, a pattern that describes behavior implemented in these files, 
or a capability that would break if these files changed]

## Regression Risk
- **Level**: low | medium | high
- **Reason**: [why this level]
- **Recommended Actions**: [what to update after changing these files]`;

  let userPrompt = `Analyze the impact of changing: \`${input.targetPath}\`\n\n`;
  if (input.directReferences.length > 0) {
    userPrompt += `Direct references found via grep:\n${input.directReferences.map((r) => `- ${r}`).join("\n")}\n\n`;
  } else {
    userPrompt += `No direct references found via grep.\n\n`;
  }
  userPrompt += `Based on the project knowledge base, what else depends on this path directly or indirectly? What's the regression risk?`;

  return { systemPrompt, userPrompt };
}
