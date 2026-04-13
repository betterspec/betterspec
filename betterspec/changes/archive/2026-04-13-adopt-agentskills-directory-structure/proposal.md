# Proposal: Adopt agentskills directory structure

## Motivation

Currently, betterspec scaffolds skills into `skills/` (locally) and `~/.betterspec/skills/` (globally). According to the agentskills.io guidelines, for cross-client interoperability, skills should be placed in `.agents/skills/` locally and `~/.agents/skills/` globally. Adopting this convention will ensure skills scaffolded by betterspec are automatically discovered by other tools following the agentskills standard.

## Scope

### In Scope

- Change local skills directory from `skills/` to `.agents/skills/`
- Change global skills directory from `~/.betterspec/skills/` to `~/.agents/skills/`
- Update CLI UI hints in the init command to reflect the new paths
- Update existing knowledge base docs and previous archive records referencing the old paths

### Out of Scope

- Migrating previously generated skills in users' existing repos
- Supporting both legacy and new paths for scaffolding

## Context

- https://agentskills.io/client-implementation/adding-skills-support.md

## Success Criteria

1. Running `betterspec init` with local skills outputs them to `.agents/skills/`
2. Running `betterspec init` with global skills outputs them to `~/.agents/skills/`
3. All internal tests pass with the new paths
4. Documentation correctly reflects the agentskills paths

---

_Proposed: 2026-04-13_
