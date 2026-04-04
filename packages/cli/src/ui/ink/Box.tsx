/**
 * INK Box component — renders a bordered box with optional title
 * Replaces the boxen-based renderBox()
 */

import React from "react";
import { Box, Text } from "ink";

const BORDER_CHARS = {
  topLeft: "\u250C",
  topRight: "\u2510",
  bottomLeft: "\u2514",
  bottomRight: "\u2518",
  horizontal: "\u2500",
  vertical: "\u2502",
};

type BorderColor = "default" | "success" | "error" | "warning" | "info" | "accent";

const COLOR_MAP: Record<BorderColor, string> = {
  default: "#6B7280",
  success: "#10B981",
  error: "#EF4444",
  warning: "#E07020",
  info: "#06B6D4",
  accent: "#7C3AED",
};

interface BoxProps {
  children: React.ReactNode;
  title?: string;
  borderColor?: BorderColor;
  padding?: number;
}

export const BetterspecBox: React.FC<BoxProps> = ({
  children,
  title,
  borderColor = "default",
  padding = 1,
}) => {
  const bc = COLOR_MAP[borderColor];

  return (
    <Box flexDirection="column" padding={padding}>
      {title && (
        <Box>
          <Text hex={bc}>{BORDER_CHARS.topLeft}</Text>
          <Text hex={bc}>{BORDER_CHARS.horizontal.repeat(title.length + 2)}</Text>
          <Text bold hex={bc}>
            {" "}
            {title.toUpperCase()}{" "}
          </Text>
          <Text hex={bc}>{BORDER_CHARS.horizontal.repeat(2)}</Text>
          <Text hex={bc}>{BORDER_CHARS.topRight}</Text>
        </Box>
      )}
      {!title && (
        <Box>
          <Text hex={bc}>{BORDER_CHARS.topLeft}</Text>
          <Text hex={bc}>{BORDER_CHARS.horizontal.repeat(3)}</Text>
          <Text hex={bc}>{BORDER_CHARS.topRight}</Text>
        </Box>
      )}
      <Box>
        <Text hex={bc}>{BORDER_CHARS.vertical}</Text>
        <Box flexGrow={1} paddingLeft={1}>
          {children}
        </Box>
        <Text hex={bc}>{BORDER_CHARS.vertical}</Text>
      </Box>
      <Box>
        <Text hex={bc}>{BORDER_CHARS.bottomLeft}</Text>
        <Text hex={bc}>
          {BORDER_CHARS.horizontal.repeat(title ? title.length + 7 : 3)}
        </Text>
        <Text hex={bc}>{BORDER_CHARS.bottomRight}</Text>
      </Box>
    </Box>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const SECTION_GRADIENT = ["#CC5500", "#F5A050", "#7C3AED", "#06B6D4"];

export const Section: React.FC<SectionProps> = ({ title, children }) => (
  <Box flexDirection="column">
    <Box>
      <Text bold hex="#CC5500">
        {" "}
        {title.toUpperCase()}{" "}
      </Text>
    </Box>
    <Box flexDirection="column" paddingTop={0}>
      {children}
    </Box>
  </Box>
);
