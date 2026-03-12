/**
 * @forgelore/core
 * Provider-agnostic spec engine for forgelore
 */

// Types
export type * from "./types/index.js";

// Config
export {
  readConfig,
  writeConfig,
  createDefaultConfig,
  configExists,
  getConfigValue,
  setConfigValue,
  getForgeloreDir,
  getConfigPath,
  fileExists,
} from "./config/index.js";

// Spec operations
export {
  createChange,
  readChange,
  readChangeFile,
  listChanges,
  updateChangeStatus,
  updateTaskStatus,
  archiveChange,
  scaffoldSpecDirs,
  getChangesDir,
  getArchiveDir,
  getChangePath,
} from "./spec/index.js";

// Knowledge base
export {
  readKnowledge,
  listCapabilities,
  addCapability,
  getCapability,
  listDecisions,
  addDecision,
  scaffoldKnowledge,
  getKnowledgeDir,
  getCapabilitiesDir,
  getDecisionsDir,
} from "./knowledge/index.js";

// Capabilities
export {
  slugify,
  createCapability,
  registerCapability,
  readOutcome,
  writeOutcome,
} from "./capabilities/index.js";

// Progress
export {
  summarizeTasks,
  getProjectSummary,
  type TaskSummary,
  type ProjectSummary,
} from "./progress/index.js";
