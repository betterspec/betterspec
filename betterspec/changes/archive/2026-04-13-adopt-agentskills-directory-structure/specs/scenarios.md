# Scenarios: adopt-agentskills-directory-structure

## Happy Path

1. User initializes betterspec with "local" skills. The `SKILL.md` files are created in `.agents/skills/` relative to project root.
2. User initializes betterspec with "global" skills. The `SKILL.md` files are created in `~/.agents/skills/`.

## Edge Cases

1. Directory already exists: Scaffolding correctly skips existing files and adds missing ones inside `.agents/skills/`.

## Error Cases

1. Permission errors when writing to `~/.agents/skills/` (should fail gracefully as before).
