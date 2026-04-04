/**
 * betterspec INK component library
 *
 * Migrates the CLI from chalk/gradient/ora/boxen/clack to INK (React for CLI).
 * This is the v0.4.0 breaking change.
 */

export { Logo, Tagline } from "./Logo.js";
export { BetterspecBox, Section } from "./Box.js";
export { Table, ProgressBar } from "./Table.js";
export { Spinner } from "./Spinner.js";

// Re-export raw INK primitives for direct use in commands
// (some commands need InkBox for low-level layout)
export { Box } from "ink";

// Color helpers — hex colors mapped to INK-compatible format
// Usage: <Text hex={colors.primary}>

export const colors = {
  primary: "#CC5500", // Sedona orange
  secondary: "#06B6D4", // brand cyan
  accent: "#F5A050", // Sedona sunset gold
  violet: "#7C3AED", // brand violet
  success: "#10B981", // emerald
  warning: "#E07020", // Sedona warm
  error: "#EF4444", // red
  muted: "#6B7280", // gray
};

// Status badge color
export const statusColor = (status: string): string => {
  switch (status) {
    case "passed":
    case "validated":
    case "archived":
      return "#10B981";
    case "failed":
      return "#EF4444";
    case "in-progress":
    case "claimed":
    case "implementing":
    case "validating":
      return "#F5A050";
    case "blocked":
      return "#EF4444";
    case "pending":
    case "proposed":
    case "planning":
      return "#6B7280";
    default:
      return "#FFFFFF";
  }
};
