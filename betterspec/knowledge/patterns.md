# Patterns

Established patterns for contributing to betterspec. Read this before writing new code.

## Module Structure

Each core module lives at `packages/core/src/<module>/index.ts` with a barrel export from `packages/core/src/index.ts`.

New modules follow this layout:

```
packages/core/src/<module>/
  index.ts          # Public API: exported functions
  types.ts          # Module-local types (if substantial enough to separate)
  content.ts        # Static string content (skill/agent templates, etc.)
  <module>.test.ts  # Vitest tests
```

## File I/O Pattern

All filesystem operations use `node:fs/promises`. Never use sync fs methods.

```typescript
import { readFile, writeFile, mkdir, rename, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";

// Check before read
if (!(await fileExists(path))) {
  throw new Error(`Not found: ${path}`);
}
const raw = await readFile(path, "utf-8");
```

`fileExists()` from `config/index.ts` wraps `access()` — use it instead of try/catch around readFile.

## CLI Command Pattern

Each command is a standalone async function in `packages/cli/src/commands/<name>.tsx`:

```typescript
export async function myCommand(
  arg: string,
  options?: { cwd?: string; flag?: boolean }
): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    const { unmount } = render(<ErrorView message="Not initialized. Run betterspec init." />);
    unmount();
    process.exit(1);
  }

  const { unmount } = render(<MyCommandView projectRoot={projectRoot} arg={arg} options={options} />);
}
```

## INK Component Pattern

INK components use a phase state machine with async `useEffect`:

```typescript
type Phase = "loading" | "confirming" | "working" | "done" | "error";

const MyView: React.FC<Props> = ({ projectRoot }) => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== "loading") return;
    (async () => {
      try {
        const data = await readSomething(projectRoot);
        setPhase("confirming");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setPhase("error");
      }
    })();
  }, [phase]);

  if (phase === "error") return <ErrorView message={error!} />;
  if (phase === "done") return <Text color="green">Done.</Text>;
  // ...
};
```

Always use `useApp().exit()` or `process.exit()` to terminate after rendering the final state — INK does not auto-exit.

## Shared INK Components

Use components from `packages/cli/src/ui/ink/`:

- `<BetterspecBox>` — branded box with title
- `<Section title="...">` — indented section with bold header
- `<Table columns={[...]} rows={[...]} />` — formatted table
- `<Spinner label="..." />` — animated spinner
- `<Confirm message="..." onConfirm={fn} onCancel={fn} />` — y/n prompt
- `<TextInput label="..." onSubmit={fn} />` — text input
- `<Select options={[...]} onSelect={fn} />` — arrow-key selection
- `<ErrorView message="..." />` — red error box

Never use raw `ink` `<Text color="...">` for brand colors — use `<BetterspecBox>` or components from the shared library.

## Adapter Pattern

Adding support for a new AI coding tool:

1. Create `packages/core/src/adapters/<toolname>.ts`
2. Implement the `ToolAdapter` interface from `adapters/types.ts`
3. Register in `packages/core/src/adapters/index.ts`
4. Add `ToolName` union member in `types/index.ts`

```typescript
import type { ToolAdapter } from "./types.js";

export const myToolAdapter: ToolAdapter = {
  name: "my-tool",
  displayName: "My Tool",
  capabilities: {
    agents: true,
    subagents: false,
    hooks: false,
    skills: true,
  },
  async promptConfig(projectRoot) {
    return {}; // tool-specific prompts
  },
  async scaffold(projectRoot, config) {
    // write files
    return ["list", "of", "created", "files"];
  },
};
```

## Naming Conventions

| Kind             | Convention       | Example                                      |
| ---------------- | ---------------- | -------------------------------------------- |
| Types/interfaces | PascalCase       | `BetterspecConfig`, `ChangeStatus`           |
| Functions        | camelCase        | `readChange`, `scaffoldSkills`               |
| Constants        | UPPER_SNAKE_CASE | `CONFIG_FILENAME`, `BETTERSPEC_DIR`          |
| Files            | kebab-case       | `dispatch-build.ts`, `on-session-created.ts` |
| CLI commands     | kebab-case       | `betterspec propose`, `betterspec init`      |
| Change names     | kebab-case       | `init-redesign`, `mcp-server`                |
| Capability IDs   | kebab-case       | `tool-adapter-system`, `mcp-server`          |

## Error Handling

- Throw `Error` with descriptive messages for programmer errors
- Catch and display via `<ErrorView />` for user-facing failures
- Never swallow errors silently
- MCP tools return error strings in the MCP error format; never throw from tool handlers

## Testing Pattern

Tests live alongside the module they test as `<module>.test.ts`. Use Vitest.

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const TEST_ROOT = join(tmpdir(), "betterspec-test-" + Date.now());

beforeEach(async () => {
  await mkdir(TEST_ROOT, { recursive: true });
});

afterEach(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});
```

Always clean up temp dirs. Use `tmpdir()` for test roots, never a path inside the repo.

## Import Style

Always use `.js` extensions in TypeScript imports (ESM requirement):

```typescript
import { fileExists } from "../config/index.js"; // correct
import { fileExists } from "../config/index"; // wrong — will fail at runtime
```

## Build

```bash
bun run build   # builds all packages via turbo (tsup → ESM)
bun run test    # runs tests across all packages
```

Build output: `packages/<name>/dist/index.js` (ESM only, no CJS).

tsup config uses `entry: ["src/index.ts"]`, `format: ["esm"]`, `dts: true`.
