/**
 * betterspec init command
 * Scaffold betterspec in a project — specs, skills, agents, hooks, tool config
 */

import * as p from "@clack/prompts";
import ora from "ora";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createDefaultConfig,
  writeConfig,
  configExists,
  getbetterspecDir,
  scaffoldSpecDirs,
  scaffoldKnowledge,
  scaffoldSkills,
  getAdapter,
  listAdapters,
  type SpecMode,
  type ToolName,
  type SkillsMode,
} from "@betterspec/core";
import { renderBanner, renderBox } from "../ui/banner.js";
import { colors, icons, gradients } from "../ui/theme.js";

export async function initCommand(options: { cwd?: string }): Promise<void> {
  const projectRoot = resolve(options.cwd || process.cwd());
  const isTTY = process.stdout.isTTY;

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

  // --- 1. Spec mode ---
  const mode = isTTY
    ? ((await p.select({
        message: "How do you want to manage specs?",
        options: [
          { value: "local", label: "Local only", hint: "Specs live in this repo only" },
          { value: "local+global", label: "Local + Global", hint: "Local specs + a shared company spec repo" },
          { value: "global", label: "Global only", hint: "Reference a shared spec repo" },
        ],
      })) as SpecMode)
    : ("local" as SpecMode);

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

  // --- 2. Tool selection ---
  const adapterList = listAdapters();
  const toolName = isTTY
    ? ((await p.select({
        message: "Which AI coding tool do you use?",
        options: adapterList.map((a) => ({
          value: a.name,
          label: a.displayName,
        })),
      })) as ToolName)
    : ("generic" as ToolName);

  if (p.isCancel(toolName)) {
    p.cancel("Init cancelled.");
    process.exit(0);
  }

  // --- 3. Skills location ---
  const skillsMode = isTTY
    ? ((await p.select({
        message: "Where should skills be installed?",
        options: [
          { value: "local", label: "Local", hint: "skills/ in this project" },
          { value: "global", label: "Global", hint: "~/.betterspec/skills/" },
          { value: "both", label: "Both", hint: "Local + global, local overrides" },
        ],
      })) as SkillsMode)
    : ("local" as SkillsMode);

  if (p.isCancel(skillsMode)) {
    p.cancel("Init cancelled.");
    process.exit(0);
  }

  // --- 4. Load adapter and run tool-specific prompts ---
  const adapter = await getAdapter(toolName);
  let toolConfig: Record<string, unknown> = {};

  if (adapter.promptConfig && isTTY) {
    toolConfig = await adapter.promptConfig(projectRoot);
  }

  // --- 5. Scaffold everything ---
  const spinner = ora({
    text: "Scaffolding betterspec...",
    color: "magenta",
  }).start();

  const allCreated: string[] = [];
  const allConfigChanges: string[] = [];

  try {
    // Spec directory
    const betterspecDir = getbetterspecDir(projectRoot);
    await mkdir(betterspecDir, { recursive: true });

    spinner.text = "Creating directory structure...";
    await scaffoldSpecDirs(projectRoot);

    spinner.text = "Setting up knowledge base...";
    await scaffoldKnowledge(projectRoot);

    // Skills
    spinner.text = "Installing skills...";
    const skillFiles = await scaffoldSkills(projectRoot, skillsMode);
    allCreated.push(...skillFiles);

    // Tool adapter (agents, hooks, config)
    spinner.text = `Configuring ${adapter.displayName}...`;
    const adapterResult = await adapter.scaffold(projectRoot, toolConfig);
    allCreated.push(...adapterResult.filesCreated);
    allConfigChanges.push(...adapterResult.configChanges);

    // Write config
    spinner.text = "Writing config...";
    const config = createDefaultConfig(mode, toolName, skillsMode);
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
    await writeConfig(projectRoot, config);

    spinner.succeed(colors.success("betterspec initialized"));
  } catch (err) {
    spinner.fail(colors.error("Failed to initialize betterspec"));
    console.error(err);
    process.exit(1);
  }

  // --- 6. Summary ---
  const summary: string[] = [];

  // Specs
  summary.push(`${icons.success} ${colors.white("Specs:")}`);
  summary.push(`  ${icons.bullet} ${colors.muted("betterspec/betterspec.json")}`);
  summary.push(`  ${icons.bullet} ${colors.muted("betterspec/changes/")}`);
  summary.push(`  ${icons.bullet} ${colors.muted("betterspec/knowledge/")}`);

  // Skills
  if (allCreated.some((f) => f.includes("SKILL.md"))) {
    summary.push("");
    summary.push(`${icons.success} ${colors.white("Skills:")} ${colors.muted(`(${skillsMode})`)}`);
    const skillCount = allCreated.filter((f) => f.includes("SKILL.md")).length;
    summary.push(`  ${icons.bullet} ${colors.muted(`${skillCount} skills installed`)}`);
  }

  // Agents
  const agentFiles = allCreated.filter(
    (f) => f.includes("/agents/") && f.endsWith(".md")
  );
  if (agentFiles.length > 0) {
    summary.push("");
    summary.push(`${icons.success} ${colors.white("Agents:")}`);
    for (const f of agentFiles) {
      const name = f.split("/").pop()?.replace(".md", "") ?? f;
      summary.push(`  ${icons.bullet} ${colors.muted(name)}`);
    }
  }

  // Hooks / config changes
  if (allConfigChanges.length > 0) {
    summary.push("");
    summary.push(`${icons.success} ${colors.white("Config:")}`);
    for (const change of allConfigChanges) {
      summary.push(`  ${icons.bullet} ${colors.muted(change)}`);
    }
  }

  // Mode info
  summary.push("");
  summary.push(`${icons.info} Spec mode: ${colors.primary(mode)}`);
  summary.push(`${icons.info} Tool: ${colors.primary(adapter.displayName)}`);

  if (globalSource) {
    summary.push(`${icons.info} Global: ${colors.secondary(globalSource)}`);
  }

  console.log(renderBox(summary.join("\n"), "Setup Complete", "#10B981"));

  p.outro(
    `Run ${colors.primary("betterspec propose")} ${colors.muted('"your idea"')} to create your first spec.`
  );
}
