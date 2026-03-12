/**
 * forgelore CLI
 * Spec-driven development for AI-assisted teams
 * Forge knowledge, shape code.
 */

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { proposeCommand } from "./commands/propose.js";
import { statusCommand } from "./commands/status.js";
import { clarifyCommand } from "./commands/clarify.js";
import { listCommand } from "./commands/list.js";
import { verifyCommand } from "./commands/verify.js";
import { archiveCommand } from "./commands/archive.js";
import { syncCommand } from "./commands/sync.js";
import { doctorCommand } from "./commands/doctor.js";
import { capabilitiesCommand } from "./commands/capabilities.js";
import { configCommand } from "./commands/config.js";
import { diffCommand } from "./commands/diff.js";
import { renderAnimatedBanner } from "./ui/banner.js";

const program = new Command();

program
  .name("forgelore")
  .description("Spec-driven development for AI-assisted teams — forge knowledge, shape code")
  .version("0.2.3");

// --- init ---
program
  .command("init")
  .description("Initialize forgelore in the current project")
  .option("-C, --cwd <path>", "Working directory")
  .action((opts) => initCommand({ cwd: opts.cwd }));

// --- propose ---
program
  .command("propose [idea]")
  .description("Create a new change proposal")
  .option("-C, --cwd <path>", "Working directory")
  .action((idea, opts) => proposeCommand(idea, { cwd: opts.cwd }));

// --- clarify ---
program
  .command("clarify <change>")
  .description("Review and refine requirements for a change")
  .option("-C, --cwd <path>", "Working directory")
  .action((change, opts) => clarifyCommand(change, { cwd: opts.cwd }));

// --- status ---
program
  .command("status")
  .description("Show project status dashboard")
  .option("-C, --cwd <path>", "Working directory")
  .action((opts) => statusCommand({ cwd: opts.cwd }));

// --- list ---
program
  .command("list")
  .description("List all changes")
  .option("-a, --archived", "Include archived changes")
  .option("-s, --status <status>", "Filter by status")
  .option("-C, --cwd <path>", "Working directory")
  .action((opts) => listCommand({ archived: opts.archived, status: opts.status, cwd: opts.cwd }));

// --- verify ---
program
  .command("verify [change]")
  .description("Verify a change against its specs (structural check)")
  .option("-C, --cwd <path>", "Working directory")
  .action((change, opts) => verifyCommand(change, { cwd: opts.cwd }));

// --- archive ---
program
  .command("archive <change>")
  .description("Archive a completed change and extract capabilities")
  .option("--skip-outcome", "Skip outcome.md generation step")
  .option("-C, --cwd <path>", "Working directory")
  .action((change, opts) => archiveCommand(change, { skipOutcome: opts.skipOutcome, cwd: opts.cwd }));

// --- sync ---
program
  .command("sync")
  .description("Sync with the global spec repository")
  .option("--force", "Force sync even if local changes exist")
  .option("-C, --cwd <path>", "Working directory")
  .action((opts) => syncCommand({ force: opts.force, cwd: opts.cwd }));

// --- doctor ---
program
  .command("doctor")
  .description("Check forgelore health and diagnose issues")
  .option("--fix", "Attempt to fix detected issues")
  .option("-C, --cwd <path>", "Working directory")
  .action((opts) => doctorCommand({ fix: opts.fix, cwd: opts.cwd }));

// --- capabilities ---
program
  .command("capabilities")
  .alias("caps")
  .description("List all registered capabilities")
  .option("--json", "Output as JSON")
  .option("-C, --cwd <path>", "Working directory")
  .action((opts) => capabilitiesCommand({ json: opts.json, cwd: opts.cwd }));

// --- config ---
program
  .command("config [key] [value]")
  .description("Get or set configuration values")
  .option("--list", "List all config values")
  .option("-C, --cwd <path>", "Working directory")
  .action((key, value, opts) => configCommand(key, value, { list: opts.list, cwd: opts.cwd }));

// --- diff ---
program
  .command("diff [change]")
  .description("Show drift between specs and implementation")
  .option("-C, --cwd <path>", "Working directory")
  .action((change, opts) => diffCommand(change, { cwd: opts.cwd }));

// Default: animated banner + help
program.action(async () => {
  await renderAnimatedBanner();
  program.outputHelp();
});

program.parse();
