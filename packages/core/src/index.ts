/**
 * @betterspec/core
 * Provider-agnostic spec engine for betterspec
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
  getbetterspecDir,
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
  scaffoldSkill,
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

// Drift detection
export {
  analyzeDrift,
} from "./drift/index.js";
