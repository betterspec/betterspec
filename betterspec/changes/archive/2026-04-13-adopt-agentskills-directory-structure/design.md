# Design: adopt-agentskills-directory-structure

## Approach

Change the return values of `getLocalSkillsDir` and `getGlobalSkillsDir` in `packages/core/src/config/index.ts`. Update the text hints in `packages/cli/src/commands/init.tsx`. Run `bun run test` to find broken tests and update them. Update any documentation files mentioning `skills/` or `~/.betterspec/skills/`.

## Key Decisions

We will only change where betterspec scaffolds the skills. We are not migrating old skills directories, as users can manually move them if they wish.

## Files to Modify

- `packages/core/src/config/index.ts`
- `packages/cli/src/commands/init.tsx`
- `packages/core/src/skills/skills.test.ts`
- `betterspec/knowledge/architecture.md`
- `betterspec/knowledge/capabilities/skills-scaffolding.json`
- `betterspec/changes/archive/2026-04-06-init-redesign/outcome.md`
- `betterspec/changes/archive/2026-04-06-init-redesign/tasks.md`
- `betterspec/changes/archive/2026-04-06-init-redesign/design.md`

## Dependencies

- None
