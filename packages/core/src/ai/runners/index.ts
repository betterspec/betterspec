import type { AIRunner, ToolName } from "../../types/index.js";
import { SubprocessRunner, createSubprocessRunner } from "./subprocess.js";
import { AnthropicRunner } from "./anthropic.js";
import { OpenAIRunner } from "./openai.js";

export function createRunners(
  tool?: ToolName,
  model?: string
): AIRunner[] {
  const runners: AIRunner[] = [];

  // Subprocess runner for the configured tool (highest priority)
  if (tool) {
    const sub = createSubprocessRunner(tool);
    if (sub) runners.push(sub);
  }

  // Direct API runners as fallbacks
  runners.push(new AnthropicRunner(model));
  runners.push(new OpenAIRunner(model));

  return runners;
}

export { SubprocessRunner, createSubprocessRunner } from "./subprocess.js";
export { AnthropicRunner } from "./anthropic.js";
export { OpenAIRunner } from "./openai.js";
