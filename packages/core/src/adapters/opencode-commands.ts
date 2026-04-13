/**
 * OpenCode slash command templates for betterspec
 * Each command is written to .opencode/commands/<name>.md
 */

export interface CommandEntry {
  name: string;
  content: string;
}

export const OPENCODE_COMMANDS: CommandEntry[] = [
  {
    name: "propose",
    content: `---
description: Create a new betterspec change proposal
---
Run the following command and then help me fill in the proposal:
!\`betterspec propose "$ARGUMENTS"\`

After the proposal is created, read the generated proposal.md and help me refine:
- The motivation (why this matters)
- The scope (what's in/out)
- The success criteria (observable, testable outcomes)
`,
  },
  {
    name: "status",
    content: `---
description: Show betterspec project status
---
!\`betterspec status\`

Summarise the current state of the project — active changes, their phases, and what needs attention next.
`,
  },
  {
    name: "list",
    content: `---
description: List all betterspec changes
---
!\`betterspec list\`

Show the list of changes above. For any that are in-progress, suggest what the logical next step is.
`,
  },
  {
    name: "clarify",
    content: `---
description: Clarify requirements for a betterspec change
---
!\`betterspec clarify $ARGUMENTS\`

Read the current specs for the change and help identify:
- Any requirements that are ambiguous or missing
- Scenarios that aren't covered
- Acceptance criteria that aren't testable
`,
  },
  {
    name: "verify",
    content: `---
description: Check spec completeness for a betterspec change
---
!\`betterspec verify $ARGUMENTS\`

Review the verification output above. If there are missing sections, help fill them in.
`,
  },
  {
    name: "archive",
    content: `---
description: Archive a completed betterspec change
---
!\`betterspec archive $ARGUMENTS\`

Review the archive output. If outcome.md is needed, help write it by summarising:
- What was built
- Key decisions made
- Lessons learned
- Files changed
`,
  },
];
