/**
 * betterspec core types
 * Provider-agnostic spec management types
 */

// --- Config ---

export type SpecMode = "local" | "local+global" | "global";

export interface GlobalSpecConfig {
  source: string; // filesystem path or GitHub URL
  path: string; // resolved local path (cache dir for remote)
  autoSync?: boolean;
}

export interface OrchestrationConfig {
  defaultMode: "sequential" | "parallel" | "swarm";
  maxRetries: number;
  parallelTracks: number;
}

export interface EnforcementConfig {
  requireSpecForChanges: boolean;
  warnOnUnspeccedEdits: boolean;
  blockArchiveOnDrift: boolean;
  autoInjectContext: boolean;
}

export interface betterspecConfig {
  $schema?: string;
  version: string;
  mode: SpecMode;
  global?: GlobalSpecConfig;
  orchestration: OrchestrationConfig;
  enforcement: EnforcementConfig;
}

// --- Spec ---

export type ChangeStatus =
  | "proposed"
  | "planning"
  | "in-progress"
  | "validating"
  | "validated"
  | "archiving"
  | "archived";

export type TaskStatus =
  | "pending"
  | "claimed"
  | "in-progress"
  | "implemented"
  | "validating"
  | "passed"
  | "failed"
  | "blocked";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo?: string; // agent role or provider
  category?: string; // frontend, backend, infra, etc.
  dependencies?: string[]; // task IDs
}

export interface Change {
  name: string;
  status: ChangeStatus;
  createdAt: string;
  updatedAt: string;
  path: string; // absolute path to change directory
  tasks: Task[];
  proposal?: string; // content of proposal.md
}

// --- Knowledge ---

export interface Capability {
  id: string;
  name: string;
  description: string;
  sourceChange: string; // archived change name
  archivedAt: string;
  files: string[]; // key implementation files
  tags?: string[];
}

export interface Decision {
  id: string;
  title: string;
  status: "proposed" | "accepted" | "deprecated" | "superseded";
  date: string;
  context: string;
  decision: string;
  consequences: string;
}

export interface KnowledgeBase {
  capabilities: Capability[];
  decisions: Decision[];
  architecture?: string; // content of architecture.md
  patterns?: string; // content of patterns.md
  glossary?: string; // content of glossary.md
}

// --- Drift ---

export type DriftSeverity = "info" | "warning" | "critical";

export interface DriftItem {
  type: "unspecced-change" | "stale-spec" | "missing-capability" | "outdated-knowledge";
  severity: DriftSeverity;
  file?: string;
  spec?: string;
  message: string;
}

export interface DriftReport {
  score: number; // 0-100, where 100 = no drift
  items: DriftItem[];
  timestamp: string;
}

// --- Validation (used by skills, not executed by core) ---

export type ValidationVerdict = "PASS" | "FAIL" | "NEEDS_REVIEW";

export interface RequirementValidation {
  requirement: string;
  status: "pass" | "fail" | "partial";
  evidence?: string;
  reason?: string;
}

export interface ValidationResult {
  verdict: ValidationVerdict;
  confidence: number; // 0-100
  requirements: RequirementValidation[];
  issues: string[];
  suggestions: string[];
}

// --- Project ---

export interface betterspecProject {
  root: string; // project root path
  betterspecDir: string; // betterspec/ directory path
  config: betterspecConfig;
  changes: Change[];
  knowledge: KnowledgeBase;
  globalKnowledge?: KnowledgeBase; // from global spec repo
}
