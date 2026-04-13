# Scenarios: fix-cli-and-mcp-typescript-errors-for-0-5-release

## Happy Path

1. Developer runs `tsc --noEmit` in `packages/cli` — exits 0 with no errors
2. Developer runs `tsc --noEmit` in `packages/mcp` — exits 0 with no errors
3. Developer runs `tsc --noEmit` in `packages/core` — exits 0 (already clean)
4. Developer runs `bun run test` — all 101 core tests pass, CLI and MCP pass with no tests

## Edge Cases

1. `<Text color="#CC5500">` renders correctly at runtime (chalk accepts hex via LiteralUnion)
2. `<Box paddingLeft={2}>` replacing `<Text paddingLeft={2}>` preserves visual layout
3. MCP `betterspec_propose` creates a change with an empty proposal stub when no content is provided

## Error Cases

1. Any remaining `tsc` error is treated as a blocker — the change is not done until the count is 0
