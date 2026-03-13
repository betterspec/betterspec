# betterspec Workflow Skill

You are working in a project that uses **betterspec** for spec-driven development. All changes must follow the betterspec workflow.

## Workflow

1. **Propose** — Create a change with `betterspec propose "idea"`. Fill in `proposal.md` with motivation, scope, and success criteria.
2. **Clarify** — Define requirements in `specs/requirements.md` and scenarios in `specs/scenarios.md`. Run `betterspec clarify <change>` to validate completeness.
3. **Design** — Document technical approach in `design.md`. List key decisions, files to modify, and dependencies.
4. **Plan** — Break down implementation into tasks in `tasks.md` with IDs, categories, and dependencies.
5. **Build** — Implement tasks. Update task status as you work. Each task should be small and focused.
6. **Validate** — Verify implementation against specs. A different agent/person should validate — never self-validate.
7. **Archive** — Create `outcome.md` documenting what was built. Run `betterspec archive <change>` to move to archive and extract capabilities.

## Rules

- **Never start coding without a spec.** If no spec exists for what you're doing, create one first with `betterspec propose`.
- **Update task status as you work.** Don't leave tasks in "pending" when they're being worked on.
- **The builder never validates.** Validation must come from a separate context with clean history.
- **Keep specs living.** If implementation diverges from spec, update the spec to reflect reality.
- **Extract capabilities on archive.** Every archived change should contribute to the knowledge base.

## Directory Structure

```
betterspec/
  betterspec.json              # Configuration
  changes/               # Active changes
    <name>/
      proposal.md        # What and why
      specs/
        requirements.md  # Functional + non-functional requirements
        scenarios.md     # Happy path, edge cases, error cases
      design.md          # Technical approach
      tasks.md           # Implementation breakdown
      outcome.md         # Created before archiving
    archive/             # Archived changes
  knowledge/
    architecture.md      # Living architecture docs
    patterns.md          # Established patterns
    glossary.md          # Domain terms
    capabilities/        # Extracted capability files (.json)
    decisions/           # Architecture decision records (.json)
```

## Before Starting Any Work

1. Run `betterspec status` to see the current project state
2. Check if a relevant change already exists with `betterspec list`
3. Read the knowledge base: `betterspec/knowledge/architecture.md`, `betterspec/knowledge/patterns.md`
4. Follow established patterns documented in the knowledge base
