/**
 * forgelore config command
 * Get, set, or list configuration values
 */

import { resolve } from "node:path";
import {
  configExists,
  readConfig,
  getConfigValue,
  setConfigValue,
} from "@forgelore/core";
import { renderBox, renderSection } from "../ui/banner.js";
import { colors, icons } from "../ui/theme.js";

export async function configCommand(
  key?: string,
  value?: string,
  options?: { list?: boolean; cwd?: string }
): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    console.log(
      renderBox(
        `${icons.error} forgelore is not initialized.\nRun ${colors.primary("forgelore init")} first.`,
        "Not Initialized",
        "#EF4444"
      )
    );
    process.exit(1);
  }

  // List all config
  if (options?.list || (!key && !value)) {
    const config = await readConfig(projectRoot);
    const lines = formatObject(config, "");

    console.log(
      renderSection("Configuration", lines.join("\n"))
    );
    return;
  }

  // Get value
  if (key && !value) {
    const val = await getConfigValue(projectRoot, key);
    if (val === undefined) {
      console.log(
        `  ${icons.error} Key ${colors.primary(key)} not found in config.`
      );
      process.exit(1);
    }

    if (typeof val === "object" && val !== null) {
      const lines = formatObject(val as Record<string, unknown>, "");
      console.log(renderSection(key, lines.join("\n")));
    } else {
      console.log(`  ${colors.primary(key)} ${colors.muted("=")} ${colors.white(String(val))}`);
    }
    return;
  }

  // Set value
  if (key && value) {
    // Parse value — try JSON, booleans, numbers, then string
    let parsed: unknown = value;
    if (value === "true") parsed = true;
    else if (value === "false") parsed = false;
    else if (/^\d+$/.test(value)) parsed = parseInt(value, 10);
    else {
      try {
        parsed = JSON.parse(value);
      } catch {
        // keep as string
      }
    }

    await setConfigValue(projectRoot, key, parsed);
    console.log(
      `  ${icons.success} Set ${colors.primary(key)} ${colors.muted("=")} ${colors.white(String(parsed))}`
    );
  }
}

function formatObject(
  obj: Record<string, unknown>,
  prefix: string
): string[] {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      lines.push(`  ${colors.muted(fullKey + ":")}`);
      lines.push(...formatObject(v as Record<string, unknown>, fullKey));
    } else {
      lines.push(
        `  ${colors.primary(fullKey)} ${colors.muted("=")} ${colors.white(String(v))}`
      );
    }
  }
  return lines;
}
