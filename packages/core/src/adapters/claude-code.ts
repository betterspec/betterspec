import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";
import type { ToolAdapter, AgentRole } from "../types/index.js";

// Claude Code uses its own agent format with different frontmatter
function claudeAgentContent(role: string, description: string, model: string, tools: string, prompt: string, extra: string = ""): string {
  return `---
name: betterspec-${role}
description: ${description}
model: ${model}
tools: ${tools}
${extra}---

${prompt}
`;
}

const PLANNER_PROMPT = `You are the betterspec planner. Transform change proposals into complete specifications.

When invoked:
1. Read the proposal in \`betterspec/changes/<name>/proposal.md\`
2. Read the knowledge base: \`betterspec/knowledge/architecture.md\`, \`betterspec/knowledge/patterns.md\`
3. Write \`specs/requirements.md\` — functional and non-functional requirements
4. Write \`specs/scenarios.md\` — happy path, edge cases, error cases
5. Write \`design.md\` — technical approach, files to modify, dependencies
6. Write \`tasks.md\` — atomic task breakdown with IDs, categories, dependencies

Task rules: each task must be atomic, independently verifiable, categorized, and traceable to a requirement.`;

const BUILDER_PROMPT = `You are the betterspec builder. Implement tasks from specs following established patterns.

When invoked:
1. Read ALL spec files for the change (requirements, scenarios, design, tasks)
2. Read the knowledge base for patterns and conventions
3. Implement tasks one at a time, updating status as you go
4. Follow the design document exactly — if something seems wrong, flag it rather than improvise

Rules:
- Build exactly what the spec says. Do not add unrequested features.
- Note ambiguity rather than guessing. Flag unclear requirements.
- You will NOT validate your own work. A separate validator will review.
- Keep changes minimal and focused.
- Write tests for new functionality.`;

const VALIDATOR_PROMPT = `You are the betterspec validator. You verify implementation against specifications with clean context.

**THE GOLDEN RULE: You have NOT seen the build process. You only see specs and code.**

Validation process:
1. Read \`specs/requirements.md\` and \`specs/scenarios.md\`
2. Read \`design.md\` for intended approach
3. Examine the actual code changes
4. Check each requirement individually — is it met?
5. Walk through each scenario — does the code handle it?
6. Output a structured verdict

Output JSON:
\`\`\`json
{
  "verdict": "PASS | FAIL | NEEDS_REVIEW",
  "confidence": 85,
  "requirements": [{ "requirement": "...", "status": "pass|fail|partial", "evidence": "...", "reason": "..." }],
  "issues": ["..."],
  "suggestions": ["..."]
}
\`\`\`

- PASS: All requirements met, confidence >= 80
- FAIL: Requirements not met. Must cite specific failures.
- NEEDS_REVIEW: Specs unclear or human judgment needed.`;

const ARCHIVIST_PROMPT = `You are the betterspec archivist. Archive completed changes and extract knowledge.

When invoked:
1. Create \`outcome.md\` documenting what was built
2. Extract capabilities as JSON to \`betterspec/knowledge/capabilities/\`
3. Update \`architecture.md\` if architecture changed
4. Update \`patterns.md\` if new patterns established
5. Update \`glossary.md\` if new terms introduced
6. Run \`betterspec archive <change-name>\`

Capability format:
\`\`\`json
{
  "id": "slug",
  "name": "Human Name",
  "description": "What it does",
  "sourceChange": "change-name",
  "archivedAt": "ISO-8601",
  "files": ["src/file.ts"],
  "tags": ["category"]
}
\`\`\``;

// Hook script that checks for unspecced edits
const CHECK_UNSPECCED_SCRIPT = `#!/bin/bash
# betterspec: Check if an edited file is referenced in any active spec
# Called as a PostToolUse hook for Edit|Write events

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Check if file is referenced in any active spec's design.md
RESULT=$(betterspec diff --check-file "$FILE_PATH" 2>/dev/null)

if echo "$RESULT" | grep -q "unspecced"; then
  jq -n --arg file "$FILE_PATH" '{
    systemMessage: ("⚠ " + $file + " is not referenced in any active spec. Consider running betterspec propose to create a spec.")
  }'
else
  exit 0
fi
`;

// Hook script for session context injection
const SESSION_CONTEXT_SCRIPT = `#!/bin/bash
# betterspec: Inject project status into session context

STATUS=$(betterspec status --json 2>/dev/null)

if [ -z "$STATUS" ]; then
  exit 0
fi

CONTEXT="## betterspec Project Context\\n"
CONTEXT+=$(echo "$STATUS" | jq -r '
  "Active changes: " + (.changes // [] | length | tostring) + "\\n" +
  "Capabilities: " + (.capabilities // [] | length | tostring) + "\\n" +
  if (.changes // [] | length) > 0 then
    (.changes[] | "- " + .name + " (" + .status + ")") + "\\n"
  else "" end
')

jq -n --arg ctx "$CONTEXT" '{
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: $ctx
  }
}'
`;

const CLAUDE_MD_SECTION = `
## betterspec — Spec-Driven Development

This project uses **betterspec** for spec-driven development. All significant changes should go through the spec workflow.

- Run \`betterspec status\` to see project state
- Run \`betterspec propose "idea"\` to start a new change
- Read \`betterspec/knowledge/\` for architecture, patterns, and glossary
- **Never start coding without an active spec** for non-trivial changes
- The betterspec-validator subagent will independently verify your work
`;

const adapter: ToolAdapter = {
  name: "claude-code",
  displayName: "Claude Code",
  capabilities: {
    agents: true,
    subagents: true,
    hooks: true,
    skills: true,
    memory: true,
  },

  async scaffold(projectRoot, config) {
    const created: string[] = [];
    const configChanges: string[] = [];
    const models = (config.models || {}) as Partial<Record<string, string>>;

    // 1. Scaffold subagents
    const agentDir = join(projectRoot, ".claude", "agents");
    await mkdir(agentDir, { recursive: true });

    const agents = [
      { role: "planner", desc: "Transforms proposals into complete specs", tools: "Read, Write, Glob, Grep", model: models.planner || "opus", prompt: PLANNER_PROMPT },
      { role: "builder", desc: "Implements tasks from betterspec specs", tools: "Read, Write, Edit, Bash, Glob, Grep", model: models.builder || "sonnet", prompt: BUILDER_PROMPT },
      { role: "validator", desc: "Independent verification — clean context, no build history", tools: "Read, Glob, Grep, Bash", model: models.validator || "sonnet", prompt: VALIDATOR_PROMPT, extra: "permissionMode: plan\nskills:\n  - betterspec-validate\n" },
      { role: "archivist", desc: "Archives completed changes, extracts knowledge", tools: "Read, Write, Glob", model: models.archivist || "sonnet", prompt: ARCHIVIST_PROMPT },
    ];

    for (const agent of agents) {
      const filePath = join(agentDir, `betterspec-${agent.role}.md`);
      if (!(await fileExists(filePath))) {
        const content = claudeAgentContent(agent.role, agent.desc, agent.model, agent.tools, agent.prompt, agent.extra || "");
        await writeFile(filePath, content, "utf-8");
        created.push(filePath);
      }
    }

    // 2. Scaffold hook scripts
    const hookDir = join(projectRoot, ".claude", "hooks");
    await mkdir(hookDir, { recursive: true });

    const hookScripts = [
      { name: "betterspec-check-unspecced.sh", content: CHECK_UNSPECCED_SCRIPT },
      { name: "betterspec-session-context.sh", content: SESSION_CONTEXT_SCRIPT },
    ];

    for (const script of hookScripts) {
      const scriptPath = join(hookDir, script.name);
      if (!(await fileExists(scriptPath))) {
        await writeFile(scriptPath, script.content, { mode: 0o755 });
        created.push(scriptPath);
      }
    }

    // 3. Write hook configuration to .claude/settings.json
    const settingsPath = join(projectRoot, ".claude", "settings.json");
    let settings: Record<string, any> = {};
    if (await fileExists(settingsPath)) {
      try {
        settings = JSON.parse(await readFile(settingsPath, "utf-8"));
      } catch {
        settings = {};
      }
    }

    if (!settings.hooks) {
      settings.hooks = {};
    }

    // Only add hooks if not already configured
    if (!settings.hooks.PostToolUse) {
      settings.hooks.PostToolUse = [{
        matcher: "Edit|Write",
        hooks: [{
          type: "command",
          command: "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/betterspec-check-unspecced.sh",
        }],
      }];
    }

    if (!settings.hooks.SessionStart) {
      settings.hooks.SessionStart = [{
        hooks: [{
          type: "command",
          command: "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/betterspec-session-context.sh",
        }],
      }];
    }

    await mkdir(join(projectRoot, ".claude"), { recursive: true });
    await writeFile(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
    created.push(settingsPath);
    configChanges.push("Added betterspec hooks to .claude/settings.json");

    // 4. Append to CLAUDE.md
    const claudeMdPath = join(projectRoot, "CLAUDE.md");
    let claudeMd = "";
    if (await fileExists(claudeMdPath)) {
      claudeMd = await readFile(claudeMdPath, "utf-8");
    }
    if (!claudeMd.includes("betterspec")) {
      claudeMd += CLAUDE_MD_SECTION;
      await writeFile(claudeMdPath, claudeMd, "utf-8");
      created.push(claudeMdPath);
      configChanges.push("Added betterspec section to CLAUDE.md");
    }

    return { filesCreated: created, configChanges };
  },
};

export default adapter;
