/**
 * betterspec sync command
 * Sync with global spec repository
 */

import ora from "ora";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import {
  configExists,
  readConfig,
} from "@betterspec/core";
import { renderBox } from "../ui/banner.js";
import { colors, icons, gradients } from "../ui/theme.js";

export async function syncCommand(options?: {
  force?: boolean;
  cwd?: string;
}): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    console.log(
      renderBox(
        `${icons.error} betterspec is not initialized.\nRun ${colors.primary("betterspec init")} first.`,
        "Not Initialized",
        "#EF4444"
      )
    );
    process.exit(1);
  }

  const config = await readConfig(projectRoot);

  if (config.mode === "local") {
    console.log(
      renderBox(
        `${icons.info} Spec mode is ${colors.primary("local")}. No global repo to sync.\n` +
          `Run ${colors.primary("betterspec config mode local+global")} to enable global specs.`,
        "No Sync Needed"
      )
    );
    return;
  }

  if (!config.global?.source) {
    console.log(
      renderBox(
        `${icons.error} Global spec source not configured.\n` +
          `Run ${colors.primary("betterspec config global.source <path-or-url>")} to set it.`,
        "Not Configured",
        "#EF4444"
      )
    );
    process.exit(1);
  }

  const source = config.global.source;
  const isGitUrl = source.startsWith("http://") || source.startsWith("https://") || source.startsWith("git@");
  const targetPath = config.global.path;

  const spinner = ora({
    text: `Syncing from ${source}...`,
    color: "magenta",
  }).start();

  try {
    if (isGitUrl) {
      // Git clone or pull
      if (existsSync(targetPath)) {
        spinner.text = "Pulling latest changes...";
        execSync("git pull --ff-only", { cwd: targetPath, stdio: "pipe" });
        spinner.succeed(colors.success("Global specs updated (git pull)"));
      } else {
        spinner.text = "Cloning global spec repo...";
        mkdirSync(targetPath, { recursive: true });
        execSync(`git clone ${source} ${targetPath}`, { stdio: "pipe" });
        spinner.succeed(colors.success("Global specs cloned"));
      }
    } else {
      // Filesystem path — just validate it exists
      if (existsSync(source)) {
        spinner.succeed(
          colors.success(`Global specs linked: ${colors.muted(source)}`)
        );
      } else {
        spinner.fail(
          colors.error(`Global spec path not found: ${source}`)
        );
        process.exit(1);
      }
    }

    console.log(
      renderBox(
        [
          `${icons.success} Global specs synced`,
          `${icons.info} Source: ${colors.secondary(source)}`,
          `${icons.info} Path: ${colors.muted(targetPath)}`,
        ].join("\n"),
        "Sync Complete",
        "#10B981"
      )
    );
  } catch (err) {
    spinner.fail(colors.error("Sync failed"));
    if (err instanceof Error) {
      console.error(colors.muted(err.message));
    }
    process.exit(1);
  }
}
