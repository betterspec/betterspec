# betterspec Knowledge Management Skill

You are responsible for maintaining the project's **knowledge base**. The knowledge base is the long-term memory of the project — it survives after individual changes are archived.

## Knowledge Base Structure

```
betterspec/knowledge/
  architecture.md      # System architecture overview
  patterns.md          # Established code patterns
  glossary.md          # Domain-specific terminology
  capabilities/        # Individual capability JSON files
  decisions/           # Architecture Decision Records (ADRs)
```

## Architecture Documentation

`architecture.md` should contain:
- High-level system overview
- Component diagram or description
- Data flow between components
- Key integrations and external dependencies
- Technology stack decisions

**Update when:** New components added, architecture changes, integrations change.

## Patterns Documentation

`patterns.md` should contain:
- Code patterns (how to structure new modules)
- Naming conventions
- Error handling patterns
- Testing patterns
- File organization patterns

**Update when:** New patterns established, existing patterns deprecated.

## Glossary

`glossary.md` should contain:
- Domain-specific terms and their definitions
- Acronyms and abbreviations
- Terms that have specific meaning in this project

**Update when:** New domain concepts introduced, terminology changes.

## Capabilities

Each capability is a JSON file in `capabilities/` with:
```json
{
  "id": "url-safe-slug",
  "name": "Human Readable Name",
  "description": "What this capability does",
  "sourceChange": "the-change-it-came-from",
  "archivedAt": "2025-01-15T00:00:00Z",
  "files": ["src/feature.ts", "src/feature.test.ts"],
  "tags": ["frontend", "auth"]
}
```

**Created when:** A change is archived and capabilities are extracted from `outcome.md`.

## Decisions

Architecture Decision Records (ADRs) in `decisions/`:
```json
{
  "id": "adr-001",
  "title": "Use PostgreSQL for primary datastore",
  "status": "accepted",
  "date": "2025-01-15",
  "context": "Why this decision was needed",
  "decision": "What was decided",
  "consequences": "What happens as a result"
}
```

**Created when:** A significant architectural or technical decision is made.

## Rules

- Knowledge docs are **living documents** — they must reflect current reality
- When archiving a change, always check if knowledge docs need updating
- Prefer updating existing entries over creating duplicates
- Keep entries concise — link to source code for details
