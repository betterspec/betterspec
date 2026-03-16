import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { writeConfig, createDefaultConfig } from "../config/index.js";
import { scaffoldSpecDirs } from "../spec/index.js";
import { scaffoldKnowledge } from "../knowledge/index.js";
import { assembleContext, estimateTokens, truncateToTokenBudget } from "./context.js";
import { createSubprocessRunner } from "./runners/subprocess.js";
import { AnthropicRunner } from "./runners/anthropic.js";
import { OpenAIRunner } from "./runners/openai.js";
import { createRunners } from "./runners/index.js";

const TEST_ROOT = join(import.meta.dirname, "__test_ai__");

beforeEach(async () => {
  await mkdir(join(TEST_ROOT, "betterspec"), { recursive: true });
  await writeConfig(TEST_ROOT, createDefaultConfig("local"));
  await scaffoldSpecDirs(TEST_ROOT);
  await scaffoldKnowledge(TEST_ROOT);
});

afterEach(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("estimateTokens", () => {
  it("estimates ~4 chars per token", () => {
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcdefgh")).toBe(2);
    expect(estimateTokens("")).toBe(0);
  });
});

describe("truncateToTokenBudget", () => {
  it("returns text unchanged if within budget", () => {
    const text = "hello world";
    expect(truncateToTokenBudget(text, 100)).toBe(text);
  });

  it("truncates text exceeding budget", () => {
    const text = "a".repeat(1000);
    const result = truncateToTokenBudget(text, 10); // 40 chars budget
    expect(result.length).toBeLessThan(1000);
    expect(result).toContain("truncated");
  });
});

describe("assembleContext", () => {
  it("assembles context for full scope", async () => {
    const context = await assembleContext(TEST_ROOT, "full");
    expect(typeof context).toBe("string");
    // Should include architecture section since scaffoldKnowledge creates it
    expect(context).toContain("Architecture");
  });

  it("assembles context for digest scope", async () => {
    const context = await assembleContext(TEST_ROOT, "digest");
    expect(typeof context).toBe("string");
  });

  it("assembles context for search scope", async () => {
    const context = await assembleContext(TEST_ROOT, "search");
    expect(typeof context).toBe("string");
  });

  it("respects token budget", async () => {
    // Large context with small budget should trigger truncation
    const fullContext = await assembleContext(TEST_ROOT, "full", { tokenBudget: 100000 });
    const smallContext = await assembleContext(TEST_ROOT, "full", { tokenBudget: 5 });
    // Small budget context should be shorter than full (if full exceeds budget)
    if (estimateTokens(fullContext) > 5) {
      expect(smallContext.length).toBeLessThan(fullContext.length);
    }
  });
});

describe("SubprocessRunner", () => {
  it("creates runner for supported tools", () => {
    const runner = createSubprocessRunner("opencode");
    expect(runner).not.toBeNull();
    expect(runner!.name).toBe("subprocess:opencode");
  });

  it("returns null for unsupported tools", () => {
    expect(createSubprocessRunner("cursor")).toBeNull();
    expect(createSubprocessRunner("codex")).toBeNull();
    expect(createSubprocessRunner("generic")).toBeNull();
  });

  it("creates runners for all supported tools", () => {
    expect(createSubprocessRunner("opencode")).not.toBeNull();
    expect(createSubprocessRunner("claude-code")).not.toBeNull();
    expect(createSubprocessRunner("gemini-cli")).not.toBeNull();
  });
});

describe("AnthropicRunner", () => {
  it("is unavailable without API key", async () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const runner = new AnthropicRunner();
    expect(await runner.available()).toBe(false);
    if (original) process.env.ANTHROPIC_API_KEY = original;
  });

  it("uses default model when not specified", () => {
    const runner = new AnthropicRunner();
    expect(runner.name).toBe("anthropic");
  });
});

describe("OpenAIRunner", () => {
  it("is unavailable without API key", async () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const runner = new OpenAIRunner();
    expect(await runner.available()).toBe(false);
    if (original) process.env.OPENAI_API_KEY = original;
  });
});

describe("createRunners", () => {
  it("creates runners with subprocess first for supported tools", () => {
    const runners = createRunners("opencode");
    expect(runners.length).toBe(3); // subprocess + anthropic + openai
    expect(runners[0].name).toBe("subprocess:opencode");
    expect(runners[1].name).toBe("anthropic");
    expect(runners[2].name).toBe("openai");
  });

  it("creates only API runners for unsupported tools", () => {
    const runners = createRunners("cursor");
    expect(runners.length).toBe(2); // anthropic + openai only
    expect(runners[0].name).toBe("anthropic");
    expect(runners[1].name).toBe("openai");
  });

  it("creates only API runners when no tool specified", () => {
    const runners = createRunners();
    expect(runners.length).toBe(2);
  });
});
