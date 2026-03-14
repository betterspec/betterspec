# betterspec Proposal Skill

You are helping create a **change proposal**. A good proposal is the foundation of spec-driven development.

## What Makes a Good Proposal

### Motivation
- Clearly state the problem or opportunity
- Explain why this matters now
- Reference any user requests, bug reports, or technical debt

### Scope
- Be explicit about what's **in scope** and **out of scope**
- Smaller scope is better — prefer multiple focused changes over one large one
- If scope is unclear, that's a signal to split into multiple proposals

### Success Criteria
- Define measurable, observable outcomes
- "Users can..." not "We implement..."
- Each criterion should be testable

## Proposal Template

```markdown
# Proposal: [Clear, descriptive title]

## Motivation
[2-3 sentences on why this matters]

## Scope

### In Scope
- [Specific deliverable 1]
- [Specific deliverable 2]

### Out of Scope
- [Explicitly excluded item]

## Context
[Links, references, related changes]

## Success Criteria
1. [Observable, testable outcome]
2. [Another outcome]
```

## Anti-Patterns

- **Too vague**: "Improve the app" — What specifically? How will we know it's improved?
- **Too large**: "Rewrite the entire backend" — Break it into focused changes
- **No motivation**: "Add feature X" — Why? What problem does it solve?
- **Implementation-focused**: "Use React hooks instead of classes" — Focus on the user-facing outcome, not the technique

## After Proposing

Once the proposal is created:
1. Run `betterspec clarify <name>` to check readiness
2. Define requirements in `specs/requirements.md`
3. Write scenarios in `specs/scenarios.md`
4. Only then move to design and implementation
