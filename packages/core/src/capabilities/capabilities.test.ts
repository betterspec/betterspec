import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";
import { scaffoldKnowledge, getCapability } from "../knowledge/index.js";
import {
  slugify,
  createCapability,
  registerCapability,
  writeOutcome,
  readOutcome,
} from "./index.js";

const TEST_ROOT = join(import.meta.dirname, "__test_caps__");

beforeEach(async () => {
  await mkdir(join(TEST_ROOT, "betterspec"), { recursive: true });
  await scaffoldKnowledge(TEST_ROOT);
});

afterEach(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips special characters", () => {
    expect(slugify("User Auth (JWT)")).toBe("user-auth-jwt");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("a   b   c")).toBe("a-b-c");
  });
});

describe("createCapability", () => {
  it("creates a capability with correct fields", () => {
    const cap = createCapability(
      "User Auth",
      "JWT-based authentication",
      "add-auth",
      ["src/auth.ts"],
      ["backend"]
    );

    expect(cap.id).toBe("user-auth");
    expect(cap.name).toBe("User Auth");
    expect(cap.description).toBe("JWT-based authentication");
    expect(cap.sourceChange).toBe("add-auth");
    expect(cap.files).toEqual(["src/auth.ts"]);
    expect(cap.tags).toEqual(["backend"]);
    expect(cap.archivedAt).toBeTruthy();
  });
});

describe("registerCapability", () => {
  it("writes capability to knowledge base", async () => {
    const cap = createCapability("Dark Mode", "Theme toggle", "add-dark-mode");
    await registerCapability(TEST_ROOT, cap);

    const stored = await getCapability(TEST_ROOT, "dark-mode");
    expect(stored).not.toBeNull();
    expect(stored!.name).toBe("Dark Mode");
  });
});

describe("outcome", () => {
  it("writes and reads outcome.md", async () => {
    const changePath = join(TEST_ROOT, "test-change");
    await mkdir(changePath, { recursive: true });

    await writeOutcome(changePath, "# Outcome\n\nWhat was built.");
    const content = await readOutcome(changePath);
    expect(content).toContain("What was built.");
  });

  it("returns null if no outcome.md", async () => {
    const emptyPath = join(TEST_ROOT, "empty-change");
    await mkdir(emptyPath, { recursive: true });
    expect(await readOutcome(emptyPath)).toBeNull();
  });
});
