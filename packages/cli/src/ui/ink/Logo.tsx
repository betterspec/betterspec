/**
 * betterspec ASCII logo rendered with INK
 * Sedona-inspired warm → cool gradient
 */

import React from "react";
import { Text } from "ink";

const LOGO_LINES = [
  " ██████  ███████ ████████ ████████ ███████ ██████  ███████ ██████  ███████  ██████ ",
  " ██   ██ ██         ██       ██    ██      ██   ██ ██      ██   ██ ██      ██      ",
  " ██████  █████      ██       ██    █████   ██████  ███████ ██████  █████   ██      ",
  " ██   ██ ██         ██       ██    ██      ██   ██      ██ ██      ██      ██      ",
  " ██████  ███████    ██       ██    ███████ ██   ██ ███████ ██      ███████  ██████ ",
];

// Sedona warm → cool brand gradient stops
const GRADIENT_HEX = [
  "#CC5500", // deep Sedona red
  "#E07020", // Sedona glow
  "#F5A050", // sunset gold
  "#7C3AED", // brand violet
  "#06B6D4", // brand cyan
];

function gradientColor(
  char: string,
  lineIndex: number,
  totalWidth: number,
): string {
  // Map each character position to a gradient color
  const t = lineIndex / (LOGO_LINES.length - 1);
  const idx = Math.floor(t * (GRADIENT_HEX.length - 1));
  return GRADIENT_HEX[Math.min(idx, GRADIENT_HEX.length - 1)];
}

interface LogoProps {
  dim?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ dim = false }) => {
  return (
    <Text dimColor={dim}>
      {LOGO_LINES.map((line, lineIdx) => (
        <Text key={lineIdx}>
          {line.split("").map((char, charIdx) => {
            const t = lineIdx / (LOGO_LINES.length - 1);
            const colorIdx = Math.min(
              Math.floor(t * (GRADIENT_HEX.length - 1)),
              GRADIENT_HEX.length - 1,
            );
            return (
              <Text
                key={charIdx}
                color={dim ? "#4a4a4a" : GRADIENT_HEX[colorIdx]}
              >
                {char}
              </Text>
            );
          })}
          {"\n"}
        </Text>
      ))}
    </Text>
  );
};

interface TaglineProps {
  version?: string;
}

export const Tagline: React.FC<TaglineProps> = ({ version }) => (
  <Text dimColor>
    {"  better specs, better code"}
    {version && (
      <Text dimColor>
        {"  v"}
        {version}
      </Text>
    )}
  </Text>
);
