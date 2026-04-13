# Design: fix-cli-and-mcp-typescript-errors-for-0-5-release

## Approach

Mechanical type-correctness fixes across CLI and MCP packages. No logic changes.

## Key Decisions

- **`hex` → `color`**: INK `<Text>` exposes `color?: LiteralUnion<ForegroundColorName, string>` which accepts hex strings directly. Global find-replace `hex={` → `color={` across all CLI command files.
- **`paddingLeft`/`paddingTop` on Text**: Wrap content in a `<Box paddingLeft={n}>` or `<Box paddingTop={n}>` instead.
- **`@types/node`**: Add as devDependency to both `packages/cli` and `packages/mcp`. Root tsconfig needs `"types": ["node"]` or each package tsconfig adds it.
- **MCP `summary.config`**: Remove — `ProjectSummary` has no `.config` field. Use `readConfig(projectRoot)` separately if config values are needed.
- **`createChange` 3rd arg**: Pass `""` or a minimal template string as `proposalContent` when the MCP tool creates a change from just an idea string.

## Files to Modify

- `packages/cli/package.json` — add `@types/node` devDep
- `packages/mcp/package.json` — add `@types/node` devDep
- `packages/cli/tsconfig.json` — add `"types": ["node"]` to compilerOptions
- `packages/mcp/tsconfig.json` — add `"types": ["node"]` to compilerOptions
- `packages/cli/src/commands/*.tsx` — `hex` → `color`, fix padding, fix undefined narrowing, fix Select usage
- `packages/mcp/src/tools.ts` — fix `summary.config`, `createChange` args
- `packages/cli/src/ui/ink/Box.tsx` — `hex` → `color` (already uses hex internally)

## Dependencies

- No new runtime dependencies
- `@types/node` dev-only
