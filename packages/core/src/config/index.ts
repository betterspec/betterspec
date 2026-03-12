/**
 * forgelore configuration management
 * Handles reading/writing forgelore.json config files
 */

import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import type { ForgeloreConfig, SpecMode } from "../types/index.js";

const CONFIG_FILENAME = "forgelore.json";
const FORGELORE_DIR = "forgelore";

const DEFAULT_CONFIG: ForgeloreConfig = {
  $schema: "https://forgelore.dev/config.json",
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

export function getForgeloreDir(projectRoot: string): string {
  return join(projectRoot, FORGELORE_DIR);
}

export function getConfigPath(projectRoot: string): string {
  return join(getForgeloreDir(projectRoot), CONFIG_FILENAME);
}

export async function readConfig(projectRoot: string): Promise<ForgeloreConfig> {
  const configPath = getConfigPath(projectRoot);
  if (!(await fileExists(configPath))) {
    throw new Error(
      `No forgelore config found at ${configPath}. Run 'forgelore init' to initialize.`
    );
  }

  const raw = await readFile(configPath, "utf-8");
  return JSON.parse(raw) as ForgeloreConfig;
}

export async function writeConfig(
  projectRoot: string,
  config: ForgeloreConfig
): Promise<void> {
  const configPath = getConfigPath(projectRoot);
  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function createDefaultConfig(mode: SpecMode): ForgeloreConfig {
  return { ...DEFAULT_CONFIG, mode };
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
