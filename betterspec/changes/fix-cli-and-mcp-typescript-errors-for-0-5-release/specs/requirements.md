# Requirements: fix-cli-and-mcp-typescript-errors-for-0-5-release

## Functional Requirements

1. All CLI commands must compile without TypeScript errors when `tsc --noEmit` is run in `packages/cli`
2. The MCP package must compile without TypeScript errors when `tsc --noEmit` is run in `packages/mcp`
3. INK `<Text>` components must use the `color` prop (not `hex`) for hex color strings
4. Layout spacing must use `<Box paddingLeft/paddingTop>` wrappers, not `<Text paddingLeft/paddingTop>`
5. MCP `betterspec_status` and `betterspec_digest` tools must not access `summary.config` (field does not exist on `ProjectSummary`)
6. MCP `betterspec_propose` tool must pass a `proposalContent` string as the third argument to `createChange`
7. The `<Select>` component in `clarify.tsx` must supply the required `message` and `onCancel` props
8. `changes` and `capabilities` arrays must be narrowed from `undefined` before use in `list.tsx` and `status.tsx`

## Non-Functional Requirements

1. No behavioral regressions — all existing tests must pass
2. The fix must be purely mechanical (type/API correctness) — no logic changes
