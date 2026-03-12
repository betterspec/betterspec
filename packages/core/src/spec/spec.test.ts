import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { writeConfig, createDefaultConfig, fileExists } from "../config/index.js";
import {
  createChange,
  readChange,
  readChangeFile,
  listChanges,
  updateChangeStatus,
  archiveChange,
  scaffoldSpecDirs,
  getChangesDir,
  getArchiveDir,
  getChangePath,
} from "./index.js";

const TEST_ROOT = join(import.meta.dirname, "__test_spec__");

beforeEach(async () => {
  await mkdir(join(TEST_ROOT, "forgelore"), { recursive: true });
  await writeConfig(TEST_ROOT, createDefaultConfig("local"));
  await scaffoldSpecDirs(TEST_ROOT);
});

afterEach(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("path helpers", () => {
  it("getChangesDir returns correct path", () => {
    expect(getChangesDir(TEST_ROOT)).toBe(
      join(TEST_ROOT, "forgelore", "changes")
    );
  });

  it("getArchiveDir returns correct path", () => {
    expect(getArchiveDir(TEST_ROOT)).toBe(
      join(TEST_ROOT, "forgelore", "changes", "archive")
    );
  });

  it("getChangePath returns correct path", () => {
    expect(getChangePath(TEST_ROOT, "my-change")).toBe(
      join(TEST_ROOT, "forgelore", "changes", "my-change")
    );
  });
});

describe("scaffoldSpecDirs", () => {
  it("creates the directory structure", async () => {
    expect(await fileExists(getChangesDir(TEST_ROOT))).toBe(true);
    expect(await fileExists(getArchiveDir(TEST_ROOT))).toBe(true);
    expect(
      await fileExists(join(TEST_ROOT, "forgelore", "knowledge", "capabilities"))
    ).toBe(true);
    expect(
      await fileExists(join(TEST_ROOT, "forgelore", "knowledge", "decisions"))
    ).toBe(true);
  });
});

describe("createChange", () => {
  it("creates a change with all spec files", async () => {
    const change = await createChange(TEST_ROOT, "my-feature", "# Test proposal");

    expect(change.name).toBe("my-feature");
    expect(change.status).toBe("proposed");
    expect(change.tasks).toEqual([]);

    // Check files exist
    const changePath = getChangePath(TEST_ROOT, "my-feature");
    expect(await fileExists(join(changePath, "proposal.md"))).toBe(true);
    expect(await fileExists(join(changePath, "specs", "requirements.md"))).toBe(true);
    expect(await fileExists(join(changePath, "specs", "scenarios.md"))).toBe(true);
    expect(await fileExists(join(changePath, "design.md"))).toBe(true);
    expect(await fileExists(join(changePath, "tasks.md"))).toBe(true);
    expect(await fileExists(join(changePath, ".forge-meta.json"))).toBe(true);
  });

  it("writes the proposal content", async () => {
    await createChange(TEST_ROOT, "test-change", "# My Proposal\n\nDetails here.");
    const content = await readFile(
      join(getChangePath(TEST_ROOT, "test-change"), "proposal.md"),
      "utf-8"
    );
    expect(content).toContain("My Proposal");
    expect(content).toContain("Details here.");
  });

  it("throws if change already exists", async () => {
    await createChange(TEST_ROOT, "duplicate", "# Dup");
    await expect(createChange(TEST_ROOT, "duplicate", "# Dup")).rejects.toThrow(
      "already exists"
    );
  });
});

describe("readChange", () => {
  it("reads a created change", async () => {
    await createChange(TEST_ROOT, "readable", "# Test");
    const change = await readChange(TEST_ROOT, "readable");
    expect(change.name).toBe("readable");
    expect(change.status).toBe("proposed");
  });

  it("throws for non-existent change", async () => {
    await expect(readChange(TEST_ROOT, "nope")).rejects.toThrow("not found");
  });
});

describe("readChangeFile", () => {
  it("reads a specific file from a change", async () => {
    await createChange(TEST_ROOT, "file-test", "# Content");
    const content = await readChangeFile(TEST_ROOT, "file-test", "proposal.md");
    expect(content).toBe("# Content");
  });

  it("throws for missing files", async () => {
    await createChange(TEST_ROOT, "file-test2", "# X");
    await expect(
      readChangeFile(TEST_ROOT, "file-test2", "nonexistent.md")
    ).rejects.toThrow("not found");
  });
});

describe("listChanges", () => {
  it("returns empty for no changes", async () => {
    const changes = await listChanges(TEST_ROOT);
    expect(changes).toEqual([]);
  });

  it("lists active changes sorted by updatedAt desc", async () => {
    await createChange(TEST_ROOT, "alpha", "# A");
    // Small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 10));
    await createChange(TEST_ROOT, "beta", "# B");

    const changes = await listChanges(TEST_ROOT);
    expect(changes).toHaveLength(2);
    expect(changes[0].name).toBe("beta");
    expect(changes[1].name).toBe("alpha");
  });

  it("excludes archived changes by default", async () => {
    await createChange(TEST_ROOT, "active", "# A");
    await createChange(TEST_ROOT, "to-archive", "# B");
    await archiveChange(TEST_ROOT, "to-archive");

    const active = await listChanges(TEST_ROOT, false);
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe("active");
  });

  it("includes archived changes when requested", async () => {
    await createChange(TEST_ROOT, "active2", "# A");
    await createChange(TEST_ROOT, "archived2", "# B");
    await archiveChange(TEST_ROOT, "archived2");

    const all = await listChanges(TEST_ROOT, true);
    expect(all).toHaveLength(2);
  });
});

describe("updateChangeStatus", () => {
  it("updates the status", async () => {
    await createChange(TEST_ROOT, "status-test", "# S");
    const updated = await updateChangeStatus(TEST_ROOT, "status-test", "in-progress");
    expect(updated.status).toBe("in-progress");

    // Verify persisted
    const reread = await readChange(TEST_ROOT, "status-test");
    expect(reread.status).toBe("in-progress");
  });
});

describe("archiveChange", () => {
  it("moves to archive directory with date prefix", async () => {
    await createChange(TEST_ROOT, "archive-me", "# Archive");
    const archivePath = await archiveChange(TEST_ROOT, "archive-me");

    expect(archivePath).toContain("archive");
    expect(archivePath).toContain("archive-me");
    expect(await fileExists(archivePath)).toBe(true);

    // Original should be gone
    expect(await fileExists(getChangePath(TEST_ROOT, "archive-me"))).toBe(false);
  });

  it("throws for non-existent change", async () => {
    await expect(archiveChange(TEST_ROOT, "nope")).rejects.toThrow("not found");
  });
});
