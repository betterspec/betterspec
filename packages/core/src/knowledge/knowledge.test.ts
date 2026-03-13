import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileExists } from "../config/index.js";
import {
  scaffoldKnowledge,
  listCapabilities,
  addCapability,
  getCapability,
  listDecisions,
  addDecision,
  readKnowledge,
  getKnowledgeDir,
  getCapabilitiesDir,
  getDecisionsDir,
} from "./index.js";
import type { Capability, Decision } from "../types/index.js";

const TEST_ROOT = join(import.meta.dirname, "__test_knowledge__");

beforeEach(async () => {
  await mkdir(join(TEST_ROOT, "betterspec"), { recursive: true });
});

afterEach(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("scaffoldKnowledge", () => {
  it("creates knowledge directories and template files", async () => {
    await scaffoldKnowledge(TEST_ROOT);

    expect(await fileExists(getCapabilitiesDir(TEST_ROOT))).toBe(true);
    expect(await fileExists(getDecisionsDir(TEST_ROOT))).toBe(true);
    expect(
      await fileExists(join(getKnowledgeDir(TEST_ROOT), "architecture.md"))
    ).toBe(true);
    expect(
      await fileExists(join(getKnowledgeDir(TEST_ROOT), "patterns.md"))
    ).toBe(true);
    expect(
      await fileExists(join(getKnowledgeDir(TEST_ROOT), "glossary.md"))
    ).toBe(true);
  });

  it("does not overwrite existing files", async () => {
    await scaffoldKnowledge(TEST_ROOT);
    // Run again — should not throw
    await scaffoldKnowledge(TEST_ROOT);
  });
});

describe("capabilities", () => {
  const testCap: Capability = {
    id: "user-auth",
    name: "User Authentication",
    description: "JWT-based auth with refresh tokens",
    sourceChange: "add-auth",
    archivedAt: "2025-06-01T00:00:00Z",
    files: ["src/auth.ts"],
    tags: ["auth", "backend"],
  };

  beforeEach(async () => {
    await scaffoldKnowledge(TEST_ROOT);
  });

  it("starts with no capabilities", async () => {
    expect(await listCapabilities(TEST_ROOT)).toEqual([]);
  });

  it("adds and retrieves a capability", async () => {
    await addCapability(TEST_ROOT, testCap);

    const cap = await getCapability(TEST_ROOT, "user-auth");
    expect(cap).not.toBeNull();
    expect(cap!.name).toBe("User Authentication");
    expect(cap!.tags).toEqual(["auth", "backend"]);
  });

  it("lists capabilities sorted by archivedAt desc", async () => {
    await addCapability(TEST_ROOT, testCap);
    await addCapability(TEST_ROOT, {
      ...testCap,
      id: "dark-mode",
      name: "Dark Mode",
      archivedAt: "2025-07-01T00:00:00Z",
    });

    const caps = await listCapabilities(TEST_ROOT);
    expect(caps).toHaveLength(2);
    expect(caps[0].id).toBe("dark-mode"); // more recent first
    expect(caps[1].id).toBe("user-auth");
  });

  it("returns null for non-existent capability", async () => {
    expect(await getCapability(TEST_ROOT, "nope")).toBeNull();
  });
});

describe("decisions", () => {
  const testDecision: Decision = {
    id: "adr-001",
    title: "Use PostgreSQL",
    status: "accepted",
    date: "2025-06-01",
    context: "Need a reliable datastore",
    decision: "Use PostgreSQL for all persistent data",
    consequences: "Requires managed DB instance",
  };

  beforeEach(async () => {
    await scaffoldKnowledge(TEST_ROOT);
  });

  it("starts with no decisions", async () => {
    expect(await listDecisions(TEST_ROOT)).toEqual([]);
  });

  it("adds and lists decisions", async () => {
    await addDecision(TEST_ROOT, testDecision);
    const decisions = await listDecisions(TEST_ROOT);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].title).toBe("Use PostgreSQL");
  });
});

describe("readKnowledge", () => {
  it("reads the full knowledge base", async () => {
    await scaffoldKnowledge(TEST_ROOT);
    const kb = await readKnowledge(TEST_ROOT);

    expect(kb.capabilities).toEqual([]);
    expect(kb.decisions).toEqual([]);
    expect(kb.architecture).toContain("Architecture");
    expect(kb.patterns).toContain("Patterns");
    expect(kb.glossary).toContain("Glossary");
  });
});
