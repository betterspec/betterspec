import { spawn } from "node:child_process";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import type { AIRunner, AIRunOptions, AIResponse, ToolName } from "../../types/index.js";

const exec = promisify(execCb);

const TOOL_BINARIES: Partial<Record<ToolName, string>> = {
  opencode: "opencode",
  "claude-code": "claude",
  "gemini-cli": "gemini",
};

function getCommandArgs(tool: ToolName): { binary: string; args: string[] } {
  switch (tool) {
    case "opencode":
      return { binary: "opencode", args: ["run", "--format", "json"] };
    case "claude-code":
      return { binary: "claude", args: ["--print", "--output-format", "json"] };
    case "gemini-cli":
      return { binary: "gemini", args: ["-p", "--output-format", "json"] };
    default:
      throw new Error(`No subprocess runner for tool: ${tool}`);
  }
}

function parseResponse(tool: ToolName, stdout: string): AIResponse {
  try {
    const data = JSON.parse(stdout);
    switch (tool) {
      case "opencode":
        return {
          text: typeof data === "string" ? data : data.response ?? data.text ?? JSON.stringify(data),
          model: data.model,
          usage: data.usage,
        };
      case "claude-code":
        return {
          text: typeof data === "string" ? data : data.result ?? data.text ?? JSON.stringify(data),
          model: data.model,
          usage: data.usage,
        };
      case "gemini-cli":
        return {
          text: data.response ?? data.text ?? (typeof data === "string" ? data : JSON.stringify(data)),
          model: data.model,
          usage: data.stats ? { inputTokens: data.stats.inputTokens ?? 0, outputTokens: data.stats.outputTokens ?? 0 } : undefined,
        };
      default:
        return { text: stdout };
    }
  } catch {
    // If JSON parse fails, return raw text
    return { text: stdout.trim() };
  }
}

function runProcess(binary: string, args: string[], input: string, timeout: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, [...args, input], {
      stdio: ["pipe", "pipe", "pipe"],
      timeout,
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => { stdout += data.toString(); });
    child.stderr.on("data", (data: Buffer) => { stderr += data.toString(); });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Process exited with code ${code}\nstderr: ${stderr}`));
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to spawn ${binary}: ${err.message}`));
    });
  });
}

export class SubprocessRunner implements AIRunner {
  name: string;
  private tool: ToolName;
  private binary: string;
  private availableCache: boolean | null = null;

  constructor(tool: ToolName) {
    const binary = TOOL_BINARIES[tool];
    if (!binary) {
      throw new Error(`No subprocess binary for tool: ${tool}`);
    }
    this.tool = tool;
    this.binary = binary;
    this.name = `subprocess:${tool}`;
  }

  async available(): Promise<boolean> {
    if (this.availableCache !== null) return this.availableCache;
    try {
      await exec(`which ${this.binary}`);
      this.availableCache = true;
    } catch {
      this.availableCache = false;
    }
    return this.availableCache;
  }

  async run(prompt: string, options?: AIRunOptions): Promise<AIResponse> {
    const fullPrompt = options?.systemPrompt
      ? `${options.systemPrompt}\n\n${prompt}`
      : prompt;

    const { binary, args } = getCommandArgs(this.tool);

    try {
      const stdout = await runProcess(binary, args, fullPrompt, 120_000);
      return parseResponse(this.tool, stdout);
    } catch (err: any) {
      throw new Error(
        `Subprocess runner (${this.tool}) failed: ${err.message}`
      );
    }
  }
}

export function createSubprocessRunner(tool: ToolName): SubprocessRunner | null {
  if (!TOOL_BINARIES[tool]) return null;
  return new SubprocessRunner(tool);
}
