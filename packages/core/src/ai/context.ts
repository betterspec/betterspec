import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileExists, getbetterspecDir } from "../config/index.js";
import { listChanges } from "../spec/index.js";
import { listCapabilities, listDecisions } from "../knowledge/index.js";
import type { AIContextScope } from "../types/index.js";

const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function truncateToTokenBudget(text: string, budget: number): string {
  const maxChars = budget * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;
  // Keep first 80% and last 10% of budget, add truncation notice
  const headChars = Math.floor(maxChars * 0.8);
  const tailChars = Math.floor(maxChars * 0.1);
  return (
    text.slice(0, headChars) +
    "\n\n[... content truncated to fit token budget ...]\n\n" +
    text.slice(-tailChars)
  );
}

async function readKnowledgeFile(projectRoot: string, filename: string): Promise<string> {
  const filePath = join(getbetterspecDir(projectRoot), "knowledge", filename);
  if (!(await fileExists(filePath))) return "";
  return readFile(filePath, "utf-8");
}

export async function assembleContext(
  projectRoot: string,
  scope: AIContextScope,
  options?: { targetPath?: string; tokenBudget?: number }
): Promise<string> {
  const budget = options?.tokenBudget ?? 8000;
  const sections: string[] = [];

  // Architecture (all scopes except impact)
  if (scope !== "impact") {
    const arch = await readKnowledgeFile(projectRoot, "architecture.md");
    if (arch) {
      sections.push(`## Architecture\n\n${scope === "digest" ? arch.slice(0, 2000) : arch}`);
    }
  }

  // Patterns (all scopes except digest)
  if (scope !== "digest") {
    const patterns = await readKnowledgeFile(projectRoot, "patterns.md");
    if (patterns) {
      sections.push(`## Patterns\n\n${patterns}`);
    }
  }

  // Active changes (search, impact, full)
  if (scope === "full" || scope === "search" || scope === "impact") {
    try {
      const changes = await listChanges(projectRoot);
      if (changes.length > 0) {
        const changeList = changes
          .map((c) => `- **${c.name}** (${c.status})${c.tasks.length > 0 ? ` — ${c.tasks.length} tasks` : ""}`)
          .join("\n");
        sections.push(`## Active Changes\n\n${changeList}`);
      }
    } catch {
      // No changes dir yet
    }
  }

  // Capabilities
  try {
    const caps = await listCapabilities(projectRoot);
    if (caps.length > 0) {
      let filtered = caps;
      if (scope === "impact" && options?.targetPath) {
        filtered = caps.filter((c) =>
          c.files.some((f) => f.includes(options.targetPath!))
        );
      }
      if (scope === "digest") {
        filtered = caps.slice(-10); // last 10 for digest
      }
      if (filtered.length > 0) {
        const capList = filtered
          .map((c) => `- **${c.name}**: ${c.description} (files: ${c.files.join(", ")})`)
          .join("\n");
        sections.push(`## Capabilities\n\n${capList}`);
      }
    }
  } catch {
    // No capabilities yet
  }

  // Decisions (full, search, digest)
  if (scope !== "impact") {
    try {
      const decisions = await listDecisions(projectRoot);
      if (decisions.length > 0) {
        const recent = scope === "digest" ? decisions.slice(-5) : decisions;
        const decList = recent
          .map((d) => `- **${d.title}** (${d.status}, ${d.date}): ${d.decision}`)
          .join("\n");
        sections.push(`## Decisions\n\n${decList}`);
      }
    } catch {
      // No decisions yet
    }
  }

  // Glossary (full, search)
  if (scope === "full" || scope === "search") {
    const glossary = await readKnowledgeFile(projectRoot, "glossary.md");
    if (glossary && glossary.trim().length > 50) {
      sections.push(`## Glossary\n\n${glossary}`);
    }
  }

  const assembled = sections.join("\n\n---\n\n");
  return truncateToTokenBudget(assembled, budget);
}
