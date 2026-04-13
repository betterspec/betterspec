/**
 * INK Table component — renders a text table with borders
 * Replaces cli-table3
 *
 * Supports React nodes in cell values via `render` functions.
 */

import React from "react";
import { Box, Text } from "ink";

interface Column<T> {
  key: string;
  header?: string;
  width?: number;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
}

function repeatChar(char: string, n: number): string {
  return char.repeat(n);
}

// Pad a string to a given visual width (accounts for ANSI color codes)
function pad(str: string, width: number): string {
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, "");
  const visualLen = stripped.length;
  // Pad right so data doesn't touch the border
  return str + " ".repeat(Math.max(1, width - visualLen));
}

export function Table<T extends Record<string, any>>({
  columns,
  rows,
}: TableProps<T>): React.ReactNode {
  const colWidths = columns.map((c) => c.width ?? 20);
  const totalWidth = colWidths.reduce((a, b) => a + b, 0) + colWidths.length + 1;
  const divider = repeatChar("\u2500", totalWidth - 2);

  const col = (i: number) => columns[i];

  return (
    <Box flexDirection="column">
      {/* Top border */}
      <Box>
        <Text color="#6B7280">{"\u250C"}{divider}{"\u2510"}</Text>
      </Box>

      {/* Column headers */}
      <Box>
        <Text color="#6B7280">{"\u2502"}</Text>
        {columns.map((c, i) => (
          <Box key={i} width={colWidths[i]}>
            <Text bold color="#6B7280">{pad(String(c.header ?? c.key), colWidths[i])}</Text>
            <Text color="#6B7280">{"\u2502"}</Text>
          </Box>
        ))}
      </Box>

      {/* Header–data divider */}
      <Box>
        <Text color="#6B7280">{"\u251C"}{divider}{"\u2524"}</Text>
      </Box>

      {/* Data rows */}
      {rows.map((row, ri) => (
        <Box key={ri}>
          <Text color="#6B7280">{"\u2502"}</Text>
          {columns.map((c, ci) => {
            const raw = c.render ? c.render(row) : String(row[c.key] ?? "");
            const cellContent =
              typeof raw === "string" || typeof raw === "number" ? (
                <Text>{String(raw)}</Text>
              ) : raw;
            return (
              <Box key={ci} width={colWidths[ci]}>
                <Box flexGrow={1} justifyContent="flex-start">
                  {cellContent}
                </Box>
                <Text color="#6B7280">{"\u2502"}</Text>
              </Box>
            );
          })}
        </Box>
      ))}

      {/* Bottom border */}
      <Box>
        <Text color="#6B7280">{"\u2514"}{divider}{"\u2518"}</Text>
      </Box>
    </Box>
  );
}

// ── Progress bar ──────────────────────────────────────────────────

interface ProgressBarProps {
  percent: number;
  width?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  width = 20,
}) => {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return (
    <Text>
      <Text color="#10B981">{repeatChar("\u2588", filled)}</Text>
      <Text color="#6B7280">{repeatChar("\u2591", empty)}</Text>
      <Text dimColor> {percent}%</Text>
    </Text>
  );
};
