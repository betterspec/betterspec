/**
 * betterspec configuration management
 * Handles reading/writing betterspec.json config files
 */

import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { betterspecConfig, SpecMode, ToolName, SkillsMode } from "../types/index.js";

const CONFIG_FILENAME = "betterspec.json";
const betterspec_DIR = "betterspec";

const DEFAULT_CONFIG: betterspecConfig = {
  $schema: "https://betterspec.dev/config.json",
  version: "0.1.0",
  mode: "local",
  orchestration: {
    defaultMode: "sequential",
    maxRetries: 3,
    parallelTracks: 3,
  },
  enforcement: {
    requireSpecForChanges: true,
    warnOnUnspeccedEdits: true,
    blockArchiveOnDrift: true,
    autoInjectContext: true,
  },
};

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function getbetterspecDir(projectRoot: string): string {
  return join(projectRoot, betterspec_DIR);
}

export function getConfigPath(projectRoot: string): string {
  return join(getbetterspecDir(projectRoot), CONFIG_FILENAME);
}

export function getLocalSkillsDir(projectRoot: string): string {
  return join(projectRoot, "skills");
}

export function getGlobalSkillsDir(): string {
  return join(homedir(), ".betterspec", "skills");
}

export function getGlobalBetterspecDir(): string {
  return join(homedir(), ".betterspec");
}

export async function readConfig(projectRoot: string): Promise<betterspecConfig> {
  const configPath = getConfigPath(projectRoot);
  if (!(await fileExists(configPath))) {
    throw new Error(
      `No betterspec config found at ${configPath}. Run 'betterspec init' to initialize.`
    );
  }

  const raw = await readFile(configPath, "utf-8");
  return JSON.parse(raw) as betterspecConfig;
}

export async function writeConfig(
  projectRoot: string,
  config: betterspecConfig
): Promise<void> {
  const configPath = getConfigPath(projectRoot);
  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function createDefaultConfig(
  mode: SpecMode,
  tool?: ToolName,
  skillsMode?: SkillsMode
): betterspecConfig {
  return {
    ...DEFAULT_CONFIG,
    mode,
    ...(tool && { tool }),
    ...(skillsMode && { skills: { mode: skillsMode } }),
  };
}

export async function configExists(projectRoot: string): Promise<boolean> {
  return fileExists(getConfigPath(projectRoot));
}

export async function getConfigValue(
  projectRoot: string,
  key: string
): Promise<unknown> {
  const config = await readConfig(projectRoot);
  const keys = key.split(".");
  let current: unknown = config;
  for (const k of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[k];
  }
  return current;
}

export async function setConfigValue(
  projectRoot: string,
  key: string,
  value: unknown
): Promise<void> {
  const config = await readConfig(projectRoot);
  const keys = key.split(".");
  let current: Record<string, unknown> = config as unknown as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current) || typeof current[k] !== "object") {
      current[k] = {};
    }
    current = current[k] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
  await writeConfig(projectRoot, config);
}
