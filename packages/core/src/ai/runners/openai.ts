import type { AIRunner, AIRunOptions, AIResponse } from "../../types/index.js";

const DEFAULT_MODEL = "gpt-4.1-mini";

export class OpenAIRunner implements AIRunner {
  name = "openai";
  private model: string;

  constructor(model?: string) {
    this.model = model && model !== "auto" ? model : DEFAULT_MODEL;
  }

  async available(): Promise<boolean> {
    return !!process.env.OPENAI_API_KEY;
  }

  async run(prompt: string, options?: AIRunOptions): Promise<AIResponse> {
    // Lazy-load SDK — use string variable to prevent TypeScript from resolving the module
    const sdkName = "openai";
    let OpenAI: any;
    try {
      const mod = await (Function("name", "return import(name)")(sdkName) as Promise<any>);
      OpenAI = mod.default ?? mod.OpenAI;
    } catch {
      throw new Error(
        "OpenAI SDK not installed. Run: bun add openai"
      );
    }

    const client = new OpenAI();
    const messages: any[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await client.chat.completions.create({
      model: this.model,
      max_tokens: options?.maxTokens ?? 4096,
      messages,
    });

    const text = response.choices?.[0]?.message?.content ?? "";
    const usage = response.usage
      ? {
          inputTokens: response.usage.prompt_tokens ?? 0,
          outputTokens: response.usage.completion_tokens ?? 0,
        }
      : undefined;

    return { text, model: this.model, usage };
  }
}
