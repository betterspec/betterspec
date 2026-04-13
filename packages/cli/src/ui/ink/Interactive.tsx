/**
 * INK interactive components — Confirm, TextInput, Select
 * These replace @clack/prompts for interactive CLI input
 */

import React from "react";
import { useInput, Text, Box } from "ink";

// ── Confirm ───────────────────────────────────────────────────────

interface ConfirmProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const Confirm: React.FC<ConfirmProps> = ({
  message,
  onConfirm,
  onCancel,
}) => {
  useInput((input, key) => {
    if (input.toLowerCase() === "y" || key.return) {
      onConfirm();
    } else if (input.toLowerCase() === "n" || key.escape) {
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
  useInput((input, key) => {
    if (key.return) {
      onSubmit();
    } else if (key.backspace || key.delete) {
      onChange(value.slice(0, -1));
    } else if (input) {
      onChange(value + input);
    }
  });

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

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (key.downArrow || input === "j") {
      setSelectedIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (key.return) {
      onSelect(options[selectedIndex].value);
    } else if (key.escape || input === "q") {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column">
      <Text>{message}</Text>
      {options.map((opt, i) => (
        <Box key={opt.value}>
          <Text dimColor> </Text>
          {i === selectedIndex ? (
            <Text color="#CC5500">▸ </Text>
          ) : (
            <Text dimColor> </Text>
          )}
          <Text bold={i === selectedIndex}>{opt.label}</Text>
          {opt.hint && <Text dimColor> — {opt.hint}</Text>}
        </Box>
      ))}
      <Text dimColor> ↑↓ navigate · enter select · esc cancel</Text>
    </Box>
  );
};
