# Proposal: Fix CLI and MCP TypeScript Errors for 0.5 Release

## Motivation

Running `tsc --noEmit` across all packages reveals ~150+ TypeScript errors in `@betterspec/cli` and `@betterspec/mcp`. These are pre-existing issues that prevent a clean build and signal real bugs — notably incorrect INK API usage and broken MCP tool implementations. Fixing these is a prerequisite for any 0.5 release.

## Scope

### In Scope

- Add `@types/node` to CLI and MCP devDependencies so `process`, `node:path`, `node:fs/promises`, etc. resolve
- Replace all `<Text hex={...}>` with `<Text color={...}>` across the CLI (INK's `Text` uses `color`, not `hex`)
- Replace `<Text paddingLeft={...}>` / `<Text paddingTop={...}>` with `<Box>` wrappers (padding is a Box prop, not Text)
- Fix MCP `tools.ts`: remove `.config` access from `ProjectSummary` (field doesn't exist), fix `createChange` call (needs 3 args), fix wrong arg counts
- Fix `clarify.tsx` `<Select>` usage: add missing `message` and `onCancel` props
- Fix null/undefined narrowing errors in `list.tsx`, `status.tsx`, `propose.tsx`

### Out of Scope

- Adding new CLI tests
- Changing INK component API design
- Any feature work

## Context

Discovered during pre-0.5 audit. The `hex` prop issue is pervasive — it was written against a non-existent API; INK's `<Text color>` accepts hex strings directly via chalk's `LiteralUnion`. The MCP `tools.ts` bugs are functional: `createChange` is called with 2 args but requires 3, and `summary.config` is accessed but doesn't exist on `ProjectSummary`.

## Success Criteria

1. `tsc --noEmit` exits with 0 errors in all three packages
2. `bun run test` passes with no regressions
3. `betterspec status` and other commands continue to render correctly

---

_Proposed: 2026-04-06_
