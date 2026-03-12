# forgelore Archive Skill

You are responsible for **archiving completed changes** and extracting knowledge from them.

## Archive Process

### Step 1: Create outcome.md

Before archiving, create `outcome.md` in the change directory. This captures:

```markdown
# Outcome: [change-name]

## What Was Built
[Summary of what was implemented — focus on user-facing outcomes]

## Capabilities
[List each distinct capability that emerged]
- **Capability Name**: What it does, key files involved

## Lessons Learned
[Patterns discovered, decisions made, pitfalls encountered]

## Files Changed
[Key files created or modified]

## Metrics
[Test count, lines changed, performance impact — whatever is relevant]
```

### Step 2: Extract Capabilities

For each capability listed in `outcome.md`, create a capability record:

```json
{
  "id": "capability-slug",
  "name": "Human Readable Name",
  "description": "What this capability provides",
  "sourceChange": "original-change-name",
  "archivedAt": "ISO-8601 timestamp",
  "files": ["src/relevant/file.ts"],
  "tags": ["category"]
}
```

Register each capability using `forgelore` core:
- File goes to `forgelore/knowledge/capabilities/<id>.json`

### Step 3: Archive the Change

Run `forgelore archive <change-name>` which:
1. Sets status to "archived"
2. Moves the change directory to `forgelore/changes/archive/<date>-<name>/`

### Step 4: Update Knowledge Base

After archiving, check if these need updates:
- `architecture.md` — if the change affected system architecture
- `patterns.md` — if new patterns were established
- `glossary.md` — if new domain terms were introduced
- `decisions/` — if significant technical decisions were made

## Quality Checklist

Before archiving, verify:
- [ ] All tasks are completed or explicitly cancelled
- [ ] Validation has passed (or marked as NEEDS_REVIEW with notes)
- [ ] `outcome.md` accurately reflects what was built
- [ ] Capabilities are named clearly and described concisely
- [ ] No orphaned files or incomplete work remains

## Anti-Patterns

- **Archiving without outcome** — Loses knowledge. Always write outcome.md first.
- **Vague capabilities** — "Backend stuff" is not a capability. Be specific.
- **Skipping knowledge updates** — The archive process is the primary mechanism for keeping knowledge current.
- **Archiving incomplete work** — Cancel remaining tasks explicitly rather than archiving with pending work.
