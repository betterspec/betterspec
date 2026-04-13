# Tasks: fix-cli-and-mcp-typescript-errors-for-0-5-release

| ID  | Task                                                                             | Status               | Category | Notes                              |
| --- | -------------------------------------------------------------------------------- | -------------------- | -------- | ---------------------------------- | -------- |
| T1  | Add `@types/node` to CLI and MCP package.json devDeps                            | pending              | infra    |                                    |
| T2  | Add `"types": ["node"]` to CLI and MCP tsconfig.json                             | pending              | infra    |                                    |
| T3  | Replace `hex={` with `color={` in all CLI command files                          | pending              | fix      | Global find-replace                |
| T4  | Replace `<Text paddingLeft/paddingTop>` with `<Box>` wrappers                    | pending              | fix      | impact.tsx, propose.tsx, init.tsx  |
| T5  | Fix `<Box title>` errors — ensure commands use `<BetterspecBox>` not raw `<Box>` | pending              | fix      | Already works, likely import issue |
| T6  | Fix MCP `summary.config` — remove or replace with `readConfig()`                 | pending              | fix      | tools.ts lines 29, 171-173         |
| T7  | Fix MCP `createChange` call — add proposalContent arg                            | pending              | fix      | tools.ts line 147                  |
| T8  | Fix `clarify.tsx` `<Select>` — add `message` and `onCancel` props                | pending              | fix      |                                    |
| T9  | Fix undefined narrowing in `list.tsx` and `status.tsx`                           | pending              | fix      |                                    |
| T10 | Fix `propose.tsx` string                                                         | undefined type error | pending  | fix                                | line 207 |
| T11 | Fix `init.tsx` missing `TextInput` import                                        | pending              | fix      |                                    |
| T12 | Run `tsc --noEmit` on all packages and confirm 0 errors                          | pending              | validate |                                    |
| T13 | Run `bun run test` and confirm no regressions                                    | pending              | validate |                                    |
