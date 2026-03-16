import { readConfig } from "../config/index.js";
import { assembleContext } from "./context.js";
import { createRunners } from "./runners/index.js";
import type { AIResponse, AIRunOptions, AIContextScope, ToolName } from "../types/index.js";

export class AINotAvailableError extends Error {
  constructor(tool?: ToolName) {
    const toolHint = tool
      ? `Install ${tool} or set ANTHROPIC_API_KEY / OPENAI_API_KEY`
      : "Set ANTHROPIC_API_KEY or OPENAI_API_KEY";
    super(
      `AI features require a provider.\n` +
      `${toolHint} to use AI-powered commands.\n` +
      `Run \`betterspec config ai.provider\` to configure.`
    );
    this.name = "AINotAvailableError";
  }
}

export interface RunAIOptions extends AIRunOptions {
  projectRoot: string;
  scope?: AIContextScope;
  targetPath?: string;
  skipContext?: boolean;
}

export async function detectProvider(
  projectRoot: string
): Promise<{ type: string; name: string } | null> {
  try {
    const config = await readConfig(projectRoot);
    const tool = config.tool;
    const aiProvider = config.ai?.provider ?? "auto";
    const model = config.ai?.model;

    const runners = createRunners(
      aiProvider === "tool" || aiProvider === "auto" ? tool : undefined,
      model
    );

    for (const runner of runners) {
      if (await runner.available()) {
        return { type: runner.name.includes(":") ? "subprocess" : "api", name: runner.name };
      }
    }
  } catch {
    // Config not found
  }
  return null;
}

export async function runAI(
  prompt: string,
  options: RunAIOptions
): Promise<AIResponse> {
  const { projectRoot, scope, targetPath, skipContext, ...runOptions } = options;

  let config;
  try {
    config = await readConfig(projectRoot);
  } catch {
    config = { tool: undefined as ToolName | undefined, ai: undefined };
  }

  const tool = config.tool;
  const aiProvider = config.ai?.provider ?? "auto";
  const model = config.ai?.model;
  const contextBudget = config.ai?.contextBudget ?? 8000;

  // Assemble context
  let systemPrompt = runOptions.systemPrompt ?? "";
  if (!skipContext && scope) {
    const context = await assembleContext(projectRoot, scope, {
      targetPath,
      tokenBudget: contextBudget,
    });
    if (context) {
      systemPrompt = systemPrompt
        ? `${systemPrompt}\n\n# Project Knowledge Base\n\n${context}`
        : `# Project Knowledge Base\n\n${context}`;
    }
  }

  // Build runner list based on provider preference
  const runners = createRunners(
    aiProvider === "tool" || aiProvider === "auto" ? tool : undefined,
    model
  );

  // If provider is specific, filter to only that type
  const filtered = aiProvider === "anthropic"
    ? runners.filter((r) => r.name === "anthropic")
    : aiProvider === "openai"
    ? runners.filter((r) => r.name === "openai")
    : runners;

  // Try each runner
  for (const runner of filtered) {
    if (await runner.available()) {
      return runner.run(prompt, { ...runOptions, systemPrompt });
    }
  }

  throw new AINotAvailableError(tool);
}

export { assembleContext, estimateTokens, truncateToTokenBudget } from "./context.js";
export { createRunners } from "./runners/index.js";
