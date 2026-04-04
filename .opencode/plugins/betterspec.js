/**
 * betterspec plugin for OpenCode.ai
 *
 * Auto-registers betterspec skills directory and injects bootstrap context
 * into the first user message of each session, following the superpowers pattern.
 */

import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Helpers ---

const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};

  for (const line of frontmatterStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "");
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: body };
};

const normalizePath = (p, homeDir) => {
  if (!p || typeof p !== "string") return null;
  let normalized = p.trim();
  if (!normalized) return null;
  if (normalized.startsWith("~/")) {
    normalized = path.join(homeDir, normalized.slice(2));
  } else if (normalized === "~") {
    normalized = homeDir;
  }
  return path.resolve(normalized);
};

const BETTERSPEC_VERSION = "0.3.2";

// --- Bootstrap content generators ---

const getWorkflowBootstrap = () => {
  const skillPath = path.join(__dirname, "../../skills/betterspec-workflow/SKILL.md");
  if (!fs.existsSync(skillPath)) return null;

  const fullContent = fs.readFileSync(skillPath, "utf8");
  const { content } = extractAndStripFrontmatter(fullContent);

  return `<IMPORTANT_BOOTSTRAP id="betterspec-workflow">
You are working in a project that uses **betterspec** (v${BETTERSPEC_VERSION}) for spec-driven development.

All changes must follow the betterspec workflow:
1. PROPOSE → CLARIFY → DESIGN → PLAN → BUILD → VALIDATE → ARCHIVE

**Core rules:**
- NEVER start coding without a spec. Use \`betterspec propose "idea"\` first.
- The BUILDER must NEVER validate their own work — validation runs in a separate context.
- Update task status as you work. Don't leave tasks in "pending" when being worked on.
- Extract capabilities on archive. Every archived change should contribute to the knowledge base.

**betterspec workflow skill content (ALREADY LOADED):**

${content}

**Tool mapping for OpenCode:**
- \`betterspec propose "idea"\` → \`betterspec propose "idea"\` (shell)
- \`betterspec clarify <change>\` → \`betterspec clarify <change>\` (shell)
- \`betterspec status\` → \`betterspec status\` (shell)
- \`betterspec list\` → \`betterspec list\` (shell)
- \`betterspec verify <change>\` → \`betterspec verify <change>\` (shell)
- \`betterspec archive <change>\` → \`betterspec archive <change>\` (shell)
- \`betterspec doctor\` → \`betterspec doctor\` (shell)
- Read/write/edit → your native tools

Run \`betterspec status\` to see the current project state before starting work.
</IMPORTANT_BOOTSTRAP>`;
};

const getProposeBootstrap = () => {
  const skillPath = path.join(__dirname, "../../skills/betterspec-propose/SKILL.md");
  if (!fs.existsSync(skillPath)) return null;

  const fullContent = fs.readFileSync(skillPath, "utf8");
  const { content } = extractAndStripFrontmatter(fullContent);

  return `<IMPORTANT_BOOTSTRAP id="betterspec-propose">
**betterspec proposal skill content (ALREADY LOADED):**

${content}
</IMPORTANT_BOOTSTRAP>`;
};

const getArchiveBootstrap = () => {
  const skillPath = path.join(__dirname, "../../skills/betterspec-archive/SKILL.md");
  if (!fs.existsSync(skillPath)) return null;

  const fullContent = fs.readFileSync(skillPath, "utf8");
  const { content } = extractAndStripFrontmatter(fullContent);

  return `<IMPORTANT_BOOTSTRAP id="betterspec-archive">
**betterspec archive skill content (ALREADY LOADED):**

${content}
</IMPORTANT_BOOTSTRAP>`;
};

const getDriftBootstrap = () => {
  const skillPath = path.join(__dirname, "../../skills/betterspec-drift/SKILL.md");
  if (!fs.existsSync(skillPath)) return null;

  const fullContent = fs.readFileSync(skillPath, "utf8");
  const { content } = extractAndStripFrontmatter(fullContent);

  return `<IMPORTANT_BOOTSTRAP id="betterspec-drift">
**betterspec drift skill content (ALREADY LOADED):**

${content}
</IMPORTANT_BOOTSTRAP>`;
};

const getValidateBootstrap = () => {
  const skillPath = path.join(__dirname, "../../skills/betterspec-validate/SKILL.md");
  if (!fs.existsSync(skillPath)) return null;

  const fullContent = fs.readFileSync(skillPath, "utf8");
  const { content } = extractAndStripFrontmatter(fullContent);

  return `<IMPORTANT_BOOTSTRAP id="betterspec-validate">
**betterspec validate skill content (ALREADY LOADED):**

${content}
</IMPORTANT_BOOTSTRAP>`;
};

const getKnowledgeBootstrap = () => {
  const skillPath = path.join(__dirname, "../../skills/betterspec-knowledge/SKILL.md");
  if (!fs.existsSync(skillPath)) return null;

  const fullContent = fs.readFileSync(skillPath, "utf8");
  const { content } = extractAndStripFrontmatter(fullContent);

  return `<IMPORTANT_BOOTSTRAP id="betterspec-knowledge">
**betterspec knowledge skill content (ALREADY LOADED):**

${content}
</IMPORTANT_BOOTSTRAP>`;
};

// --- Plugin ---

export const BetterspecPlugin = async ({ client, directory }) => {
  const homeDir = os.homedir();
  const betterspecSkillsDir = path.resolve(__dirname, "../../skills");

  const bootstrap = [
    getWorkflowBootstrap(),
    getProposeBootstrap(),
    getArchiveBootstrap(),
    getDriftBootstrap(),
    getValidateBootstrap(),
    getKnowledgeBootstrap(),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    // Register betterspec skills path so OpenCode discovers them automatically.
    // Modifies the cached config singleton so skills are discovered lazily later.
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(betterspecSkillsDir)) {
        config.skills.paths.push(betterspecSkillsDir);
      }
    },

    // Inject bootstrap into the first user message of each session.
    // Using a user message instead of a system message avoids token bloat
    // from repeated system messages (#750).
    "experimental.chat.messages.transform": async (_input, output) => {
      if (!bootstrap || !output.messages.length) return;

      const firstUser = output.messages.find((m) => m.info.role === "user");
      if (!firstUser || !firstUser.parts.length) return;

      // Only inject once per session
      if (
        firstUser.parts.some(
          (p) => p.type === "text" && p.text.includes("IMPORTANT_BOOTSTRAP")
        )
      )
        return;

      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: "text", text: bootstrap });
    },
  };
};

export default BetterspecPlugin;
