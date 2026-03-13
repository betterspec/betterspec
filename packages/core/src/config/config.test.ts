import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  readConfig,
  writeConfig,
  createDefaultConfig,
  configExists,
  getConfigValue,
  setConfigValue,
  getbetterspecDir,
  getConfigPath,
  fileExists,
} from "./index.js";

const TEST_ROOT = join(import.meta.dirname, "__test_config__");

beforeEach(async () => {
  await mkdir(join(TEST_ROOT, "betterspec"), { recursive: true });
});

afterEach(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("fileExists", () => {
  it("returns true for existing directories", async () => {
    expect(await fileExists(TEST_ROOT)).toBe(true);
  });

  it("returns false for non-existent paths", async () => {
    expect(await fileExists(join(TEST_ROOT, "nope"))).toBe(false);
  });
});

describe("getbetterspecDir", () => {
  it("returns projectRoot/betterspec", () => {
    expect(getbetterspecDir("/my/project")).toBe("/my/project/betterspec");
  });
});

describe("getConfigPath", () => {
  it("returns betterspec/betterspec.json", () => {
    expect(getConfigPath("/my/project")).toBe(
      "/my/project/betterspec/betterspec.json"
    );
  });
});

describe("createDefaultConfig", () => {
  it("creates config with given mode", () => {
    const config = createDefaultConfig("local");
    expect(config.mode).toBe("local");
    expect(config.version).toBe("0.1.0");
    expect(config.orchestration.defaultMode).toBe("sequential");
    expect(config.enforcement.requireSpecForChanges).toBe(true);
  });

  it("supports all modes", () => {
    expect(createDefaultConfig("local+global").mode).toBe("local+global");
    expect(createDefaultConfig("global").mode).toBe("global");
  });
});

describe("writeConfig / readConfig", () => {
  it("round-trips config to disk", async () => {
    const config = createDefaultConfig("local");
    await writeConfig(TEST_ROOT, config);

    const read = await readConfig(TEST_ROOT);
    expect(read.mode).toBe("local");
    expect(read.version).toBe("0.1.0");
  });

  it("throws if config does not exist", async () => {
    const emptyRoot = join(TEST_ROOT, "empty");
    await mkdir(join(emptyRoot, "betterspec"), { recursive: true });
    await expect(readConfig(emptyRoot)).rejects.toThrow("No betterspec config");
  });
});

describe("configExists", () => {
  it("returns false before init", async () => {
    expect(await configExists(TEST_ROOT)).toBe(false);
  });

  it("returns true after writing config", async () => {
    await writeConfig(TEST_ROOT, createDefaultConfig("local"));
    expect(await configExists(TEST_ROOT)).toBe(true);
  });
});

describe("getConfigValue / setConfigValue", () => {
  beforeEach(async () => {
    await writeConfig(TEST_ROOT, createDefaultConfig("local"));
  });

  it("gets a top-level value", async () => {
    expect(await getConfigValue(TEST_ROOT, "mode")).toBe("local");
  });

  it("gets a nested value", async () => {
    expect(await getConfigValue(TEST_ROOT, "orchestration.maxRetries")).toBe(3);
  });

  it("returns undefined for missing keys", async () => {
    expect(await getConfigValue(TEST_ROOT, "nonexistent")).toBeUndefined();
  });

  it("sets a value and persists", async () => {
    await setConfigValue(TEST_ROOT, "orchestration.maxRetries", 5);
    expect(await getConfigValue(TEST_ROOT, "orchestration.maxRetries")).toBe(5);

    // Verify it's actually on disk
    const raw = await readFile(getConfigPath(TEST_ROOT), "utf-8");
    const parsed = JSON.parse(raw);
    expect(parsed.orchestration.maxRetries).toBe(5);
  });

  it("sets a top-level value", async () => {
    await setConfigValue(TEST_ROOT, "mode", "global");
    expect(await getConfigValue(TEST_ROOT, "mode")).toBe("global");
  });
});
