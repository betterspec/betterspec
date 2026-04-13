# Requirements: adopt-agentskills-directory-structure

## Functional Requirements

1. The `getLocalSkillsDir` function must return `<projectRoot>/.agents/skills`.
2. The `getGlobalSkillsDir` function must return `~/.agents/skills`.
3. The interactive `init` wizard options should show the `.agents/skills` directories as hints.

## Non-Functional Requirements

1. Existing tests for `scaffoldSkills` must be updated to pass.
2. The knowledge base documentation must be updated.
