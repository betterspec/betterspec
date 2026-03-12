/**
 * forgelore CLI theme
 * Forge-inspired colors, gradients, and visual constants
 */

import chalk from "chalk";
import gradient from "gradient-string";

// Brand colors — forge (warm) + lore (cool)
export const colors = {
  primary: chalk.hex("#FF6B35"),   // forge orange
  secondary: chalk.hex("#06B6D4"), // lore cyan
  accent: chalk.hex("#FFD700"),    // spark gold
  lore: chalk.hex("#7C3AED"),      // lore violet
  success: chalk.hex("#10B981"),   // emerald
  warning: chalk.hex("#F97316"),   // orange
  error: chalk.hex("#EF4444"),     // red
  muted: chalk.hex("#6B7280"),     // gray
  dim: chalk.dim,
  bold: chalk.bold,
  white: chalk.white,
};

// Gradients
export const gradients = {
  brand: gradient(["#FF6B35", "#FFD700", "#7C3AED", "#06B6D4"]),
  forge: gradient(["#FF6B35", "#FFD700"]),
  lore: gradient(["#7C3AED", "#06B6D4"]),
  warm: gradient(["#F59E0B", "#EF4444"]),
  cool: gradient(["#06B6D4", "#7C3AED"]),
  success: gradient(["#10B981", "#06B6D4"]),
  sunset: gradient(["#F97316", "#EF4444", "#7C3AED"]),
};

// Status icons
export const icons = {
  success: colors.success("\u2713"),
  error: colors.error("\u2717"),
  warning: colors.warning("\u26A0"),
  info: colors.secondary("\u25C6"),
  pending: colors.muted("\u25CB"),
  inProgress: colors.accent("\u25CF"),
  arrow: colors.primary("\u2192"),
  bullet: colors.muted("\u2022"),
  star: colors.accent("\u2605"),
  spark: colors.accent("\u2726"),
  anvil: colors.primary("\u2692"),
};

// Status colors for tasks/changes
export function statusColor(status: string): string {
  switch (status) {
    case "passed":
    case "validated":
    case "archived":
      return colors.success(status);
    case "failed":
      return colors.error(status);
    case "in-progress":
    case "claimed":
    case "implementing":
    case "validating":
      return colors.accent(status);
    case "blocked":
      return colors.error(status);
    case "pending":
    case "proposed":
    case "planning":
      return colors.muted(status);
    default:
      return colors.white(status);
  }
}

// Progress bar
export function progressBar(percent: number, width = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const bar =
    colors.success("\u2588".repeat(filled)) + colors.muted("\u2591".repeat(empty));
  return `${bar} ${percent}%`;
}
