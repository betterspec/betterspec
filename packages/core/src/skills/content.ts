/**
 * Skill content templates for betterspec
 * Each skill is a SKILL.md with agentskills.io frontmatter
 */

// --- betterspec (generic entry point) ---

export const SKILL_BETTERSPEC = `---
name: betterspec
description: >
  Spec-driven development with betterspec. Use when working on any project that
  uses betterspec for managing changes, specs, and knowledge.
metadata:
  author: betterspec
  version: "0.3"
---

# betterspec — Spec-Driven Development

This project uses **betterspec** for spec-driven development. All significant changes
should go through the spec workflow before implementation begins.

## When to Use betterspec

- Before starting any new feature or significant change
- When requirements are unclear and need to be formalized
- When multiple agents or developers will collaborate on a change
- Before refactoring that touches multiple modules

## CLI Commands

| Command | Purpose |
|---------|---------|
| \`betterspec status\` | Show project status dashboard — start here |
| \`betterspec list\` | List all changes and their states |
| \`betterspec propose "idea"\` | Create a new change proposal |
| \`betterspec clarify <change>\` | Refine requirements interactively |
| \`betterspec verify <change>\` | Check spec completeness (structural) |
| \`betterspec diff <change>\` | Show drift between specs and code |
| \`betterspec archive <change>\` | Archive a completed change, extract knowledge |
| \`betterspec doctor\` | Health check for the betterspec setup |
| \`betterspec capabilities\` | List all registered capabilities |
| \`betterspec config [key] [value]\` | Get or set configuration |

## Workflow

1. **Propose** — \`betterspec propose "add user authentication"\`
2. **Plan** — Fill in \`betterspec/changes/<name>/specs/requirements.md\`, \`scenarios.md\`, \`design.md\`, and \`tasks.md\`
3. **Verify** — \`betterspec verify <name>\` to check spec completeness
4. **Build** — Implement tasks, updating status as you go
5. **Validate** — Review implementation against specs
6. **Archive** — \`betterspec archive <name>\` to capture knowledge

## Key Directories

\`\`\`
betterspec/
├── betterspec.json              # Configuration
├── changes/                    # Active change specs
│   └── <change-name>/
│       ├── proposal.md         # Original idea
│       ├── specs/
│       │   ├── requirements.md # What to build
│       │   └── scenarios.md    # How it should work
│       ├── design.md           # Technical approach
│       └── tasks.md            # Atomic task breakdown
└── knowledge/                  # Project knowledge base
    ├── architecture.md         # System architecture
    ├── patterns.md             # Code patterns and conventions
    ├── glossary.md             # Domain terminology
    ├── capabilities/           # Extracted capabilities (JSON)
    └── decisions/              # Architecture decision records
\`\`\`

## Rules

- **Spec first.** Do not start coding without a spec for non-trivial changes.
- **Follow patterns.** Read \`betterspec/knowledge/patterns.md\` before writing code.
- **Update tasks.** Mark task status as you work (\`pending\` → \`in-progress\` → \`implemented\`).
- **Knowledge compounds.** After completing a change, archive it to capture capabilities and update the knowledge base.
`;

// --- Workflow ---

export const SKILL_WORKFLOW = `---
name: betterspec-workflow
description: >
  Enforces the betterspec spec-driven development workflow. Use when working on
  any project that uses betterspec for managing changes, specs, and knowledge.
metadata:
  author: betterspec
  version: "0.3"
---

# betterspec Workflow Skill

You are working in a project that uses **betterspec** for spec-driven development.
Every non-trivial change MUST follow this lifecycle.

## Lifecycle Phases

1. **Propose** — Create a change proposal with \`betterspec propose "description"\`.
2. **Plan** — Fill in specs: \`requirements.md\`, \`scenarios.md\`, \`design.md\`, \`tasks.md\`.
3. **Verify** — Run \`betterspec verify <change>\` to check spec completeness.
4. **Build** — Implement tasks one at a time. Update task status as you go.
5. **Validate** — Review implementation against specs. Run \`betterspec diff <change>\`.
6. **Archive** — Run \`betterspec archive <change>\` to extract knowledge.

## Rules

- **Never skip the spec phase.** If a change touches more than one module or adds new
  behavior, it needs a spec.
- **One task at a time.** Claim a task, implement it, mark it done, then move on.
- **Spec and code must stay in sync.** If implementation reveals a spec change is
  needed, update the spec first, then continue building.
- **Check drift regularly.** Run \`betterspec diff <change>\` before marking a change
  as complete. Resolve all critical drift items.
- **Archive when done.** Every completed change should be archived to build the
  project knowledge base.

## Status Transitions

\`\`\`
proposed → planning → in-progress → validating → validated → archiving → archived
\`\`\`

Only move forward. If validation fails, stay in \`validating\` and fix issues.

## Before You Start Coding

1. Run \`betterspec status\` to see the project dashboard.
2. Check \`betterspec/knowledge/patterns.md\` for coding conventions.
3. If there is no active change for your work, create one with \`betterspec propose\`.
4. Read the full spec before writing any code.

## While Coding

1. Reference the task list in \`tasks.md\` — work through tasks in order.
2. Update task status: \`pending\` → \`in-progress\` → \`implemented\`.
3. If you discover a gap in the spec, stop and update the spec before continuing.

## After Coding

1. Run \`betterspec verify <change>\` to check spec completeness.
2. Run \`betterspec diff <change>\` to check for drift.
3. When all tasks are done and drift is clean, archive the change.
`;

// --- Propose ---

export const SKILL_PROPOSE = `---
name: betterspec-propose
description: >
  Guides creation of betterspec change proposals. Use when starting a new feature,
  refactor, or significant change in a betterspec-managed project.
metadata:
  author: betterspec
  version: "0.3"
---

# betterspec Proposal Skill

You are creating a new change proposal in a betterspec-managed project.

## Creating a Proposal

Run \`betterspec propose "short description of the change"\`.

This creates a new change directory under \`betterspec/changes/<name>/\` with:
- \`proposal.md\` — The original idea (auto-generated from your description)
- \`specs/requirements.md\` — Functional and non-functional requirements
- \`specs/scenarios.md\` — Acceptance scenarios (happy path, edge cases, errors)
- \`design.md\` — Technical approach and architecture decisions
- \`tasks.md\` — Atomic implementation task breakdown

## Writing a Good Proposal

The proposal should answer:
1. **What** is being changed and **why**?
2. **Who** benefits from this change?
3. What is the **scope** — what is included and what is explicitly excluded?
4. Are there any **constraints** or **dependencies**?

## After Creating the Proposal

Move to the planning phase by filling in the spec files:

### requirements.md
- List concrete, testable requirements
- Separate functional from non-functional requirements
- Each requirement should be independently verifiable

### scenarios.md
- Define happy-path scenarios first
- Add edge cases and error scenarios
- Use Given/When/Then format where helpful

### design.md
- Describe the technical approach
- List files that will be modified or created
- Document key design decisions and trade-offs
- Note any dependencies or prerequisites

### tasks.md
- Break work into atomic tasks (each < 1 hour of work)
- Order tasks by dependency — independent tasks first
- Assign categories (frontend, backend, infra, docs, etc.)
- Every requirement should map to at least one task

## Proposal Checklist

Before moving to implementation:
- [ ] All spec files have real content (not just templates)
- [ ] Requirements are testable and unambiguous
- [ ] Scenarios cover happy path, edge cases, and errors
- [ ] Design documents the approach and trade-offs
- [ ] Tasks are atomic and ordered
- [ ] Run \`betterspec verify <change>\` — all checks pass
`;

// --- Validate ---

export const SKILL_VALIDATE = `---
name: betterspec-validate
description: >
  Guides validation of implemented changes against their specs. Use when reviewing
  or validating work in a betterspec-managed project.
metadata:
  author: betterspec
  version: "0.3"
---

# betterspec Validation Skill

You are validating an implemented change against its spec in a betterspec-managed project.

## Validation Process

1. **Read the full spec** — requirements, scenarios, design, and tasks.
2. **Review the implementation** — check each requirement is met.
3. **Run drift detection** — \`betterspec diff <change>\` to find discrepancies.
4. **Produce a verdict** — PASS, FAIL, or NEEDS_REVIEW.

## Requirement-by-Requirement Review

For each requirement in \`specs/requirements.md\`:
- Find the code that implements it
- Verify the implementation matches the requirement
- Check edge cases from \`specs/scenarios.md\` are handled
- Note any deviations

## Drift Detection

Run \`betterspec diff <change>\` and review the output:

| Drift Type | Action |
|-----------|--------|
| \`unspecced-change\` | Code was changed without a spec — add to spec or revert |
| \`stale-spec\` | Spec describes something that doesn't match code — update spec |
| \`missing-capability\` | Feature exists but isn't registered — register it |
| \`outdated-knowledge\` | Knowledge base is stale — update after archiving |

## Verdict Criteria

### PASS
- All requirements are implemented correctly
- All scenarios are handled
- No critical drift items
- Tasks are all marked as \`implemented\` or \`passed\`

### FAIL
- One or more requirements are not met
- Critical scenarios are unhandled
- Critical drift items exist
- Significant deviation from design without spec update

### NEEDS_REVIEW
- Implementation is correct but spec needs updating
- Minor drift items exist
- Edge cases need human judgment

## After Validation

- If **PASS**: Move to archiving with \`betterspec archive <change>\`
- If **FAIL**: Document issues, return to implementation
- If **NEEDS_REVIEW**: Flag specific items for human review

## Output Format

When reporting validation results, use this structure:

\`\`\`
Verdict: PASS | FAIL | NEEDS_REVIEW
Confidence: 0-100%

Requirements:
- [PASS] Requirement 1 — evidence
- [FAIL] Requirement 2 — reason

Issues:
- Issue description

Suggestions:
- Improvement suggestion
\`\`\`
`;

// --- Archive ---

export const SKILL_ARCHIVE = `---
name: betterspec-archive
description: >
  Guides archiving of completed changes and knowledge extraction. Use when a change
  has been validated and is ready to be archived in a betterspec-managed project.
metadata:
  author: betterspec
  version: "0.3"
---

# betterspec Archive Skill

You are archiving a completed change in a betterspec-managed project. Archiving
captures knowledge from the change so future work benefits from what was learned.

## Prerequisites

Before archiving:
- All tasks should be marked as \`implemented\` or \`passed\`
- Validation should have produced a PASS verdict
- Run \`betterspec diff <change>\` — no critical drift items

## Archiving Process

Run \`betterspec archive <change>\` to:
1. Move the change directory to \`betterspec/changes/archive/<date>-<name>/\`
2. Update the change status to \`archived\`

## Knowledge Extraction

After archiving, manually extract knowledge into the knowledge base:

### Capabilities
For each new feature or capability introduced by the change:
- Register it with \`betterspec capabilities\` or create a JSON file in
  \`betterspec/knowledge/capabilities/\`
- Include: name, description, key files, tags

### Architecture Updates
If the change introduced architectural changes:
- Update \`betterspec/knowledge/architecture.md\`
- Document new components, services, or data flows

### Pattern Updates
If the change established new patterns or conventions:
- Update \`betterspec/knowledge/patterns.md\`
- Include code examples where helpful

### Decision Records
If significant design decisions were made:
- Create a new decision record in \`betterspec/knowledge/decisions/\`
- Document context, decision, and consequences

### Glossary Updates
If new domain terms were introduced:
- Update \`betterspec/knowledge/glossary.md\`

## Capability Registration Format

\`\`\`json
{
  "id": "capability-slug",
  "name": "Human-Readable Name",
  "description": "What this capability does",
  "sourceChange": "archived-change-name",
  "archivedAt": "2025-01-01T00:00:00.000Z",
  "files": ["src/feature/index.ts", "src/feature/utils.ts"],
  "tags": ["feature-area", "category"]
}
\`\`\`

## Archive Checklist

- [ ] Change has been validated (PASS verdict)
- [ ] No critical drift items
- [ ] \`betterspec archive <change>\` has been run
- [ ] New capabilities registered in knowledge base
- [ ] Architecture docs updated (if applicable)
- [ ] Patterns docs updated (if applicable)
- [ ] Decision records created (if applicable)
- [ ] Glossary updated (if applicable)

## Why Archiving Matters

Knowledge compounds. Every archived change makes the next change easier because:
- Future agents can reference past capabilities
- Patterns and conventions are documented
- Architecture decisions have context
- The knowledge base grows more useful over time
`;

// --- Drift ---

export const SKILL_DRIFT = `---
name: betterspec-drift
description: >
  Guides drift detection between specs and implementation. Use when checking if
  code and specs are in sync in a betterspec-managed project.
metadata:
  author: betterspec
  version: "0.3"
---

# betterspec Drift Detection Skill

You are detecting drift between specs and implementation in a betterspec-managed project.
Drift occurs when code and specs diverge — either code was changed without updating
specs, or specs were updated without changing code.

## Running Drift Detection

Run \`betterspec diff <change>\` to analyze a specific change.

## Drift Types

### unspecced-change (severity: warning or critical)
Code files were modified that are not covered by any active spec.

**Resolution:**
- If the change is intentional, add it to the relevant spec
- If the change is accidental, revert it
- If it is a new concern, create a new change proposal

### stale-spec (severity: warning)
A spec describes behavior that does not match the current implementation.

**Resolution:**
- If the code is correct, update the spec to match
- If the spec is correct, fix the code to match
- Document why the deviation occurred

### missing-capability (severity: info)
A feature exists in code but is not registered in the knowledge base.

**Resolution:**
- Register the capability in \`betterspec/knowledge/capabilities/\`
- Usually resolved during the archive phase

### outdated-knowledge (severity: info)
Knowledge base documents reference code or patterns that have changed.

**Resolution:**
- Update the relevant knowledge base files
- Check \`architecture.md\`, \`patterns.md\`, and \`glossary.md\`

## Drift Severity

| Severity | Meaning | Action |
|----------|---------|--------|
| \`critical\` | Spec and code fundamentally disagree | Must resolve before proceeding |
| \`warning\` | Spec and code are partially out of sync | Should resolve before archiving |
| \`info\` | Minor or cosmetic drift | Resolve when convenient |

## Drift Score

The drift score ranges from 0 to 100:
- **90-100**: Excellent — specs and code are well aligned
- **70-89**: Good — minor drift items to address
- **50-69**: Concerning — several drift items need attention
- **Below 50**: Critical — specs and code have significantly diverged

## When to Check for Drift

- Before marking a change as complete
- Before archiving a change
- After major refactoring
- Periodically as part of project health checks (\`betterspec doctor\`)

## Resolving Drift

1. Run \`betterspec diff <change>\` to get the drift report
2. Address critical items first
3. Update specs or code as needed
4. Re-run drift detection to confirm resolution
5. Proceed with validation or archiving once clean
`;

// --- Knowledge ---

export const SKILL_KNOWLEDGE = `---
name: betterspec-knowledge
description: >
  Guides knowledge base management in betterspec. Use when reading, updating, or
  organizing project knowledge in a betterspec-managed project.
metadata:
  author: betterspec
  version: "0.3"
---

# betterspec Knowledge Management Skill

You are managing the project knowledge base in a betterspec-managed project. The
knowledge base lives in \`betterspec/knowledge/\` and captures what the project knows
about itself.

## Knowledge Base Structure

\`\`\`
betterspec/knowledge/
├── architecture.md         # System architecture overview
├── patterns.md             # Code patterns and conventions
├── glossary.md             # Domain terminology
├── capabilities/           # Registered capabilities (JSON)
│   └── <capability-id>.json
└── decisions/              # Architecture decision records
    └── <decision-id>.md
\`\`\`

## Reading Knowledge

Before starting any work:
1. Read \`betterspec/knowledge/patterns.md\` for coding conventions
2. Read \`betterspec/knowledge/architecture.md\` for system overview
3. Check \`betterspec/knowledge/glossary.md\` for domain terms
4. Run \`betterspec capabilities\` to see registered capabilities

## architecture.md

Documents the high-level system architecture:
- Major components and their responsibilities
- Data flow between components
- External dependencies and integrations
- Deployment topology

Keep this document current. Update it when:
- New components are added
- Data flows change
- External dependencies are added or removed

## patterns.md

Documents coding patterns and conventions:
- File and directory naming conventions
- Common code patterns (error handling, logging, etc.)
- Testing patterns and conventions
- Import/export conventions

This is the most frequently referenced knowledge file. Keep it practical with
code examples.

## glossary.md

Documents domain-specific terminology:
- Business terms and their definitions
- Technical terms specific to this project
- Abbreviations and acronyms

Update when new domain concepts are introduced.

## Capabilities

Capabilities are registered features extracted from archived changes:
- Each capability is a JSON file in \`betterspec/knowledge/capabilities/\`
- Capabilities link back to their source change
- Use \`betterspec capabilities\` to list all capabilities

### When to Register a Capability
- After archiving a change that introduced new functionality
- When documenting existing features for the first time
- When a feature is significantly enhanced

## Decision Records

Architecture Decision Records (ADRs) capture significant design decisions:
- Created during the design phase of a change
- Updated if a decision is superseded or deprecated

### Decision Record Format
\`\`\`markdown
# ADR-001: Decision Title

**Status:** accepted | deprecated | superseded
**Date:** YYYY-MM-DD

## Context
Why this decision was needed.

## Decision
What was decided.

## Consequences
What follows from this decision.
\`\`\`

## Knowledge Maintenance

- **After every archive**: Check if knowledge files need updating
- **Periodically**: Run \`betterspec doctor\` to check for outdated knowledge
- **Before major changes**: Read relevant knowledge to inform design
- **Knowledge compounds**: The more you invest in the knowledge base, the more
  productive future work becomes
`;

// --- Entries array for iteration ---

export const SKILL_ENTRIES: { name: string; content: string }[] = [
  { name: "betterspec", content: SKILL_BETTERSPEC },
  { name: "betterspec-workflow", content: SKILL_WORKFLOW },
  { name: "betterspec-propose", content: SKILL_PROPOSE },
  { name: "betterspec-validate", content: SKILL_VALIDATE },
  { name: "betterspec-archive", content: SKILL_ARCHIVE },
  { name: "betterspec-drift", content: SKILL_DRIFT },
  { name: "betterspec-knowledge", content: SKILL_KNOWLEDGE },
];
