import type { AIRunner, AIRunOptions, AIResponse } from "../../types/index.js";

const DEFAULT_MODEL = "claude-haiku-4-20250514";

// Rough cost estimates per million tokens
const COST_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-20250514": { input: 0.25, output: 1.25 },
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-opus-4-20250514": { input: 5, output: 25 },
};

export class AnthropicRunner implements AIRunner {
  name = "anthropic";
  private model: string;

  constructor(model?: string) {
    this.model = model && model !== "auto" ? model : DEFAULT_MODEL;
  }

  async available(): Promise<boolean> {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async run(prompt: string, options?: AIRunOptions): Promise<AIResponse> {
    // Lazy-load SDK — use string variable to prevent TypeScript from resolving the module
    const sdkName = "@anthropic-ai/sdk";
    let Anthropic: any;
    try {
      const mod = await (Function("name", "return import(name)")(sdkName) as Promise<any>);
      Anthropic = mod.default ?? mod.Anthropic;
    } catch {
      throw new Error(
        "Anthropic SDK not installed. Run: bun add @anthropic-ai/sdk"
      );
    }

    const client = new Anthropic();
    const message = await client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens ?? 4096,
      ...(options?.systemPrompt && { system: options.systemPrompt }),
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    const usage = {
      inputTokens: message.usage?.input_tokens ?? 0,
      outputTokens: message.usage?.output_tokens ?? 0,
    };

    const costInfo = COST_PER_MTOK[this.model];
    const cost = costInfo
      ? (usage.inputTokens * costInfo.input + usage.outputTokens * costInfo.output) / 1_000_000
      : undefined;

    return { text, model: this.model, usage, cost };
  }
}
