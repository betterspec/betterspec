/**
 * INK Spinner component — animated loading indicator
 * Replaces ora
 */

import React, { useEffect, useState } from "react";
import { Text, Box } from "ink";

const SPINNER_FRAMES = ["\u280B", "\u280F", "\u2879", "\u2877", "\u283F", "\u2837", "\u281F", "\u281B"];
const SPINNER_COLOR = "#F5A050";

interface SpinnerProps {
  label?: string;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  label,
  color = SPINNER_COLOR,
}) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(id);
  }, []);

  return (
    <Box>
      <Text color={color}>{SPINNER_FRAMES[frame]}</Text>
      {label && (
        <Text dimColor> {label}</Text>
      )}
    </Box>
  );
};
