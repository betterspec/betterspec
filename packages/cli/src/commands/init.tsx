/**
 * betterspec init command — INK version
 * Scaffold betterspec in a project
 *
 * Non-interactive (default in CI): --mode, --tool, --skills flags
 * Interactive (TTY): guided wizard with Select + TextInput components
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
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
import {
  BetterspecBox,
  Logo,
  Select,
  Spinner,
  TextInput,
  colors,
} from "../ui/ink/index.js";

// ── Non-interactive init (CI / flags) ────────────────────────────

async function initNonInteractive(
  projectRoot: string,
  opts: {
    mode?: SpecMode;
    tool?: ToolName;
    skills?: SkillsMode;
    globalSource?: string;
  },
) {
  const mode: SpecMode = opts.mode ?? "local";
  const toolName: ToolName = opts.tool ?? "generic";
  const skillsMode: SkillsMode = opts.skills ?? "local";

  const betterspecDir = getbetterspecDir(projectRoot);
  await mkdir(betterspecDir, { recursive: true });
  await scaffoldSpecDirs(projectRoot);
  await scaffoldKnowledge(projectRoot);

  const skillFiles = await scaffoldSkills(projectRoot, skillsMode);
  const adapter = await getAdapter(toolName);
  const adapterResult = await adapter.scaffold(projectRoot, {});

  const config = createDefaultConfig(mode, toolName, skillsMode);
  if (opts.globalSource) {
    const isUrl = opts.globalSource.startsWith("http");
    config.global = {
      source: opts.globalSource,
      path: isUrl
        ? `~/.cache/betterspec/global/${opts.globalSource.split("/").pop()}`
        : opts.globalSource,
      autoSync: true,
    };
  }
  await writeConfig(projectRoot, config);

  return { skillFiles, adapterResult };
}

// ── Interactive state machine ──────────────────────────────────────

type Phase =
  | "mode"
  | "global-source"
  | "tool"
  | "skills"
  | "scaffolding"
  | "done";

const MODE_OPTIONS = [
  { label: "Local only", value: "local", hint: "Specs live in this repo only" },
  {
    label: "Local + Global",
    value: "local+global",
    hint: "Local specs + shared company spec repo",
  },
  {
    label: "Global only",
    value: "global",
    hint: "Reference a shared spec repo",
  },
];

const SKILLS_OPTIONS = [
  { label: "Local", value: "local", hint: ".agents/skills/ in this project" },
  { label: "Global", value: "global", hint: "~/.agents/skills/" },
  { label: "Both", value: "both", hint: "Local + global, local overrides" },
];

const InitWizard: React.FC<{
  projectRoot: string;
  mode: SpecMode;
  globalSource: string;
  tool: ToolName;
  skills: SkillsMode;
}> = ({ projectRoot, mode, globalSource, tool, skills }) => {
  const [phase, setPhase] = React.useState<Phase>("mode");
  const [modeVal, setModeVal] = React.useState<SpecMode>(mode);
  const [globalSourceVal, setGlobalSourceVal] = React.useState(globalSource);
  const [toolVal, setToolVal] = React.useState<ToolName>(tool);
  const [skillsVal, setSkillsVal] = React.useState<SkillsMode>(skills);
  const [error, setError] = React.useState<string>("");
  const [skillFiles, setSkillFiles] = React.useState<string[]>([]);
  const [adapterFiles, setAdapterFiles] = React.useState<string[]>([]);
  const [createdDirs, setCreatedDirs] = React.useState<string[]>([]);

  const adapterList = listAdapters();

  const handleMode = (val: string) => {
    setModeVal(val as SpecMode);
    if (val === "local") {
      setPhase("tool");
    } else {
      setPhase("global-source");
    }
  };

  const handleGlobalSource = (val: string) => {
    setGlobalSourceVal(val);
    setPhase("tool");
  };

  const handleTool = (val: string) => {
    setToolVal(val as ToolName);
    setPhase("skills");
  };

  const handleSkills = async (val: string) => {
    setSkillsVal(val as SkillsMode);
    setPhase("scaffolding");

    try {
      const betterspecDir = getbetterspecDir(projectRoot);
      await mkdir(betterspecDir, { recursive: true });
      setCreatedDirs((d) => [...d, "betterspec/"]);

      await scaffoldSpecDirs(projectRoot);
      setCreatedDirs((d) => [...d, "changes/", "knowledge/"]);

      await scaffoldKnowledge(projectRoot);
      setCreatedDirs((d) => [...d, "architecture.md", "patterns.md"]);

      const sf = await scaffoldSkills(projectRoot, val as SkillsMode);
      setSkillFiles(sf);

      const adapter = await getAdapter(toolVal);
      const ar = await adapter.scaffold(projectRoot, {});
      setAdapterFiles(ar.filesCreated);

      const config = createDefaultConfig(modeVal, toolVal, val as SkillsMode);
      if (globalSourceVal) {
        const isUrl = globalSourceVal.startsWith("http");
        config.global = {
          source: globalSourceVal,
          path: isUrl
            ? `~/.cache/betterspec/global/${globalSourceVal.split("/").pop()}`
            : globalSourceVal,
          autoSync: true,
        };
      }
      await writeConfig(projectRoot, config);

      setPhase("done");
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    }
  };

  if (phase === "mode") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Init — Step 1/4" borderColor="accent">
          <Text>How do you want to manage specs?</Text>
        </BetterspecBox>
        <InkBox paddingTop={1}>
          <Select
            message=""
            options={MODE_OPTIONS}
            onSelect={handleMode}
            onCancel={() => process.exit(0)}
          />
        </InkBox>
      </InkBox>
    );
  }

  if (phase === "global-source") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Init — Global Source" borderColor="accent">
          <Text>Enter the global spec source path or GitHub URL:</Text>
          <Text dimColor> </Text>
          <Text dimColor>
            {" "}
            /path/to/company-specs or https://github.com/org/specs
          </Text>
        </BetterspecBox>
        <InkBox paddingTop={1}>
          <InkBox>
            <Text color={colors.primary}>{">"} </Text>
            <TextInput
              value={globalSourceVal}
              onChange={setGlobalSourceVal}
              onSubmit={() => handleGlobalSource(globalSourceVal)}
              placeholder="/path/to/company-specs"
            />
          </InkBox>
        </InkBox>
      </InkBox>
    );
  }

  if (phase === "tool") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Init — Step 2/4" borderColor="accent">
          <Text>Which AI coding tool do you use?</Text>
        </BetterspecBox>
        <InkBox paddingTop={1}>
          <Select
            message=""
            options={adapterList.map((a) => ({
              label: a.displayName,
              value: a.name,
            }))}
            onSelect={handleTool}
            onCancel={() => process.exit(0)}
          />
        </InkBox>
      </InkBox>
    );
  }

  if (phase === "skills") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Init — Step 3/4" borderColor="accent">
          <Text>Where should skills be installed?</Text>
        </BetterspecBox>
        <InkBox paddingTop={1}>
          <Select
            message=""
            options={SKILLS_OPTIONS}
            onSelect={handleSkills}
            onCancel={() => process.exit(0)}
          />
        </InkBox>
      </InkBox>
    );
  }

  if (phase === "scaffolding") {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Scaffolding..." borderColor="accent">
          <Spinner label={`Creating ${createdDirs.join(", ")}...`} />
        </BetterspecBox>
      </InkBox>
    );
  }

  if (phase === "done") {
    const skillCount = skillFiles.filter((f) => f.includes("SKILL.md")).length;
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Setup Complete" borderColor="success">
          <Text color={colors.success}>✓ betterspec initialized</Text>
        </BetterspecBox>

        <InkBox paddingTop={1}>
          <BetterspecBox title="What was created" borderColor="default">
            <Text dimColor> • betterspec/betterspec.json</Text>
            <Text dimColor> • betterspec/changes/</Text>
            <Text dimColor> • betterspec/knowledge/</Text>
            {skillCount > 0 && (
              <Text dimColor>
                {" "}
                • {skillCount} skills installed ({skillsVal})
              </Text>
            )}
          </BetterspecBox>
        </InkBox>

        <InkBox paddingTop={1}>
          <BetterspecBox title="Config" borderColor="default">
            <Text dimColor> Mode: </Text>
            <Text color={colors.primary}>{modeVal}</Text>
            <Text dimColor> Tool: </Text>
            <Text color={colors.primary}>{toolVal}</Text>
            <Text dimColor> Skills: </Text>
            <Text color={colors.primary}>{skillsVal}</Text>
          </BetterspecBox>
        </InkBox>

        <InkBox paddingTop={1}>
          <Text dimColor>Run </Text>
          <Text color={colors.primary}>betterspec propose "your idea"</Text>
          <Text dimColor> to create your first spec.</Text>
        </InkBox>
      </InkBox>
    );
  }

  if (error) {
    return (
      <InkBox flexDirection="column">
        <Logo />
        <BetterspecBox title="Error" borderColor="error">
          <Text color={colors.error}>{error}</Text>
        </BetterspecBox>
      </InkBox>
    );
  }

  return null;
};

// ── Command entry point ───────────────────────────────────────────

export async function initCommand(
  opts: {
    cwd?: string;
    mode?: SpecMode;
    tool?: ToolName;
    skills?: SkillsMode;
    globalSource?: string;
    "global-source"?: string;
  } = {},
): Promise<void> {
  const projectRoot = resolve(opts.cwd || process.cwd());

  // Check already initialized
  if (await configExists(projectRoot)) {
    render(
      <InkBox flexDirection="column" padding={1}>
        <Logo />
        <BetterspecBox title="Already Initialized" borderColor="warning">
          <Text>betterspec is already initialized in this project.</Text>
          <Text dimColor>Run </Text>
          <Text color={colors.primary}>betterspec status</Text>
          <Text dimColor> to see current state.</Text>
        </BetterspecBox>
      </InkBox>,
    );
    return;
  }

  const isTTY = process.stdout.isTTY;
  const mode = opts.mode ?? "local";
  const tool = opts.tool ?? "generic";
  const skills = opts.skills ?? "local";
  const globalSource = opts.globalSource ?? opts["global-source"];

  if (!isTTY || (opts.mode && opts.tool)) {
    // Non-interactive mode: use flags or defaults
    try {
      await initNonInteractive(projectRoot, {
        mode,
        tool,
        skills,
        globalSource,
      });
      console.log("✓ betterspec initialized (non-interactive)");
    } catch (err) {
      console.error("Failed to initialize betterspec:", err);
      process.exit(1);
    }
    return;
  }

  // Interactive wizard
  render(
    <InitWizard
      projectRoot={projectRoot}
      mode={mode}
      globalSource={globalSource ?? ""}
      tool={tool}
      skills={skills}
    />,
  );
}
