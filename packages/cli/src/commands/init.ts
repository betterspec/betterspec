/**
 * betterspec init command
 * Scaffold betterspec in a project, configure mode and paths
 */

import * as p from "@clack/prompts";
import ora from "ora";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createDefaultConfig,
  writeConfig,
  configExists,
  getbetterspecDir,
  type SpecMode,
  type betterspecConfig,
} from "@betterspec/core";
import { scaffoldSpecDirs, scaffoldSkill } from "@betterspec/core";
import { scaffoldKnowledge } from "@betterspec/core";
import { renderBanner, renderBox } from "../ui/banner.js";
import { colors, icons, gradients } from "../ui/theme.js";

export async function initCommand(options: { cwd?: string }): Promise<void> {
  const projectRoot = resolve(options.cwd || process.cwd());

  console.log(renderBanner());

  // Check if already initialized
  if (await configExists(projectRoot)) {
    console.log(
      renderBox(
        `${icons.warning} betterspec is already initialized in this project.\n` +
          `${colors.muted("Run")} ${colors.primary("betterspec status")} ${colors.muted("to see current state.")}`,
        "Already Initialized"
      )
    );
    return;
  }

  p.intro(gradients.brand(" betterspec init "));

  // Choose mode
  const mode = (await p.select({
    message: "How do you want to manage specs?",
    options: [
      {
        value: "local",
        label: "Local only",
        hint: "Specs live in this repo only",
      },
      {
        value: "local+global",
        label: "Local + Global",
        hint: "Local specs + a shared company spec repo",
      },
      {
        value: "global",
        label: "Global only",
        hint: "Reference a shared spec repo",
      },
    ],
  })) as SpecMode;

  if (p.isCancel(mode)) {
    p.cancel("Init cancelled.");
    process.exit(0);
  }

  // Configure global source if needed
  let globalSource: string | undefined;
  if (mode === "local+global" || mode === "global") {
    const source = await p.text({
      message: "Global spec source (filesystem path or GitHub URL):",
      placeholder: "/path/to/company-specs or https://github.com/org/specs",
      validate: (val) => {
        if (!val) return "Please enter a path or URL";
        return undefined;
      },
    });

    if (p.isCancel(source)) {
      p.cancel("Init cancelled.");
      process.exit(0);
    }

    globalSource = source as string;
  }

  // Create config
  const config = createDefaultConfig(mode);
  if (globalSource) {
    const isUrl =
      globalSource.startsWith("http://") || globalSource.startsWith("https://");
    config.global = {
      source: globalSource,
      path: isUrl
        ? `~/.cache/betterspec/global/${globalSource.split("/").pop()}`
        : globalSource,
      autoSync: true,
    };
  }

  // Scaffold
  const spinner = ora({
    text: "Scaffolding betterspec...",
    color: "magenta",
  }).start();

  try {
    const betterspecDir = getbetterspecDir(projectRoot);
    await mkdir(betterspecDir, { recursive: true });

    spinner.text = "Creating directory structure...";
    await scaffoldSpecDirs(projectRoot);

    spinner.text = "Setting up knowledge base...";
    await scaffoldKnowledge(projectRoot);

    spinner.text = "Creating skill...";
    await scaffoldSkill(projectRoot);

    spinner.text = "Writing config...";
    await writeConfig(projectRoot, config);

    spinner.succeed(colors.success("betterspec initialized"));
  } catch (err) {
    spinner.fail(colors.error("Failed to initialize betterspec"));
    console.error(err);
    process.exit(1);
  }

  // Summary
  const summary = [
    `${icons.success} ${colors.white("Created:")}`,
    `  ${icons.bullet} ${colors.muted("betterspec/betterspec.json")}`,
    `  ${icons.bullet} ${colors.muted("betterspec/changes/")}`,
    `  ${icons.bullet} ${colors.muted("betterspec/knowledge/architecture.md")}`,
    `  ${icons.bullet} ${colors.muted("betterspec/knowledge/patterns.md")}`,
    `  ${icons.bullet} ${colors.muted("betterspec/knowledge/glossary.md")}`,
    `  ${icons.bullet} ${colors.muted("betterspec/knowledge/capabilities/")}`,
    `  ${icons.bullet} ${colors.muted("betterspec/knowledge/decisions/")}`,
    `  ${icons.bullet} ${colors.muted("skills/betterspec/SKILL.md")}`,
    "",
    `${icons.info} Mode: ${colors.primary(mode)}`,
  ];

  if (globalSource) {
    summary.push(`${icons.info} Global: ${colors.secondary(globalSource)}`);
  }

  console.log(renderBox(summary.join("\n"), "Setup Complete", "#10B981"));

  p.outro(
    `Run ${colors.primary("betterspec propose")} ${colors.muted('"your idea"')} to create your first spec.`
  );
}
