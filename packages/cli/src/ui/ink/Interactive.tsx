/**
 * INK interactive components — Confirm, TextInput, Select
 * These replace @clack/prompts for interactive CLI input
 */

import React from "react";
import { useInput, useStdin, Text, Box } from "ink";

// ── Confirm ───────────────────────────────────────────────────────

interface ConfirmProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const Confirm: React.FC<ConfirmProps> = ({ message, onConfirm, onCancel }) => {
  useInput((key) => {
    if (key === "y" || key === "Y" || key === "enter") {
      onConfirm();
    } else if (key === "n" || key === "N" || key === "escape") {
      onCancel();
    }
  });

  return (
    <Text>
      <Text dimColor>{message}</Text>
      <Text dimColor> [y/N] </Text>
    </Text>
  );
};

// ── TextInput ─────────────────────────────────────────────────────

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "",
}) => {
  const { stdin, setRawMode } = useStdin();

  React.useEffect(() => {
    setRawMode?.(true);
    return () => setRawMode?.(false);
  }, [setRawMode]);

  React.useEffect(() => {
    if (!stdin) return;

    const handleData = (chunk: Buffer) => {
      const key = chunk.toString();
      if (key === "\r" || key === "\n") {
        onSubmit();
      } else if (key === "\x7f" || key === "\b") {
        onChange(value.slice(0, -1));
      } else if (key.length === 1 && !key.match(/[\x00-\x1f]/)) {
        onChange(value + key);
      }
    };

    stdin.on("data", handleData);
    return () => { stdin.removeListener("data", handleData); };
  }, [stdin, value, onChange, onSubmit]);

  return (
    <Text>
      {placeholder && !value ? (
        <Text dimColor>{placeholder}</Text>
      ) : (
        <Text>{value}</Text>
      )}
      <Text dimColor>▌</Text>
    </Text>
  );
};

// ── Select ────────────────────────────────────────────────────────

interface SelectOption {
  label: string;
  value: string;
  hint?: string;
}

interface SelectProps {
  message: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  onCancel: () => void;
  initialIndex?: number;
}

export const Select: React.FC<SelectProps> = ({
  message,
  options,
  onSelect,
  onCancel,
  initialIndex = 0,
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState(initialIndex);

  useInput((key, match) => {
    if (match.upArrow || match.ctrlP || key === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (match.downArrow || match.ctrlN || key === "j") {
      setSelectedIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (key === "enter") {
      onSelect(options[selectedIndex].value);
    } else if (key === "escape" || key === "q") {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column">
      <Text>{message}</Text>
      {options.map((opt, i) => (
        <Box key={opt.value}>
          <Text dimColor>  </Text>
          {i === selectedIndex ? (
            <Text hex="#CC5500">▸ </Text>
          ) : (
            <Text dimColor>  </Text>
          )}
          <Text bold={i === selectedIndex}>{opt.label}</Text>
          {opt.hint && <Text dimColor> — {opt.hint}</Text>}
        </Box>
      ))}
      <Text dimColor>  ↑↓ navigate · enter select · esc cancel</Text>
    </Box>
  );
};
