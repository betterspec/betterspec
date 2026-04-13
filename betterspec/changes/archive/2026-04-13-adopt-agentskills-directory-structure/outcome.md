# Outcome: adopt-agentskills-directory-structure

## What Was Built

Updated the internal directory structure for scaffolded skills to align with the agentskills.io specification. Betterspec now creates skills in `.agents/skills/` (project-level) and `~/.agents/skills/` (user-level) instead of `skills/` and `~/.betterspec/skills/`.

## Capabilities

- **Cross-client Skill Discovery**: By adopting the `.agents/skills/` convention, skills scaffolded by `betterspec init` are now natively visible to other agentskills.io compliant tools like Claude Code, OpenCode, and Gemini CLI without custom path configuration.

## Lessons Learned

- Keeping up with cross-client standards requires ongoing updates, but it significantly reduces user friction.
- Finding references to hardcoded paths across the knowledge base is just as important as changing the code logic itself.

## Files Changed

- `packages/core/src/config/index.ts`
- `packages/cli/src/commands/init.tsx`
- `packages/core/src/skills/skills.test.ts`
- `betterspec/knowledge/architecture.md`
- `betterspec/knowledge/capabilities/skills-scaffolding.json`
- `betterspec/changes/archive/2026-04-06-init-redesign/outcome.md`
- `betterspec/changes/archive/2026-04-06-init-redesign/tasks.md`
- `betterspec/changes/archive/2026-04-06-init-redesign/design.md`

## Metrics

- 5 out of 5 tasks completed
- Tests fully updated to match the new paths
