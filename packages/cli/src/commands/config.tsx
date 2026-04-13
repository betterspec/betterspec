/**
 * betterspec config command — INK version
 * Get, set, or list configuration values
 */

import React from "react";
import { render, Box as InkBox, Text } from "ink";
import { resolve } from "node:path";
import {
  configExists,
  readConfig,
  getConfigValue,
  setConfigValue,
} from "@betterspec/core";
import { BetterspecBox, colors } from "../ui/ink/index.js";

interface ConfigOutputProps {
  type: "list" | "get" | "set" | "error" | "not-found";
  key?: string;
  value?: string | Record<string, unknown>;
  error?: string;
  notFoundKey?: string;
}

const ConfigOutput: React.FC<ConfigOutputProps> = ({
  type,
  key,
  value,
  error,
  notFoundKey,
}) => {
  if (type === "error") {
    return (
      <BetterspecBox title="Error" borderColor="error">
        <Text color={colors.error}>{error}</Text>
      </BetterspecBox>
    );
  }

  if (type === "not-found") {
    return (
      <BetterspecBox title="Not Found" borderColor="error">
        <Text>
          Key <Text color={colors.primary}>{notFoundKey}</Text> not found in
          config.
        </Text>
      </BetterspecBox>
    );
  }

  if (type === "get" && typeof value === "string") {
    return (
      <BetterspecBox title="Config" borderColor="accent">
        <Text>
          <Text color={colors.primary}>{key}</Text>
          <Text dimColor> = </Text>
          <Text>{value}</Text>
        </Text>
      </BetterspecBox>
    );
  }

  if (type === "set") {
    return (
      <BetterspecBox title="Config" borderColor="success">
        <Text color={colors.success}>\u2713 Set </Text>
        <Text color={colors.primary}>{key}</Text>
        <Text dimColor> = </Text>
        <Text>{String(value)}</Text>
      </BetterspecBox>
    );
  }

  // List
  const obj = value as Record<string, unknown>;

  return (
    <BetterspecBox title="Configuration" borderColor="accent">
      <InkBox flexDirection="column">
        {Object.entries(obj ?? {}).map(([k, v]) => {
          if (typeof v === "object" && v !== null && !Array.isArray(v)) {
            return (
              <InkBox key={k} flexDirection="column">
                <Text dimColor>{k}:</Text>
                {Object.entries(v as Record<string, unknown>).map(
                  ([subK, subV]) => (
                    <Text key={subK} dimColor>
                      {"  "}
                      {subK} = <Text>{String(subV)}</Text>
                    </Text>
                  ),
                )}
              </InkBox>
            );
          }
          return (
            <Text key={k}>
              <Text color={colors.primary}>{k}</Text>
              <Text dimColor> = </Text>
              <Text>{String(v)}</Text>
            </Text>
          );
        })}
      </InkBox>
    </BetterspecBox>
  );
};

export async function configCommand(
  key?: string,
  value?: string,
  options?: { list?: boolean; cwd?: string },
): Promise<void> {
  const projectRoot = resolve(options?.cwd || process.cwd());

  if (!(await configExists(projectRoot))) {
    render(
      <BetterspecBox title="Not Initialized" borderColor="error">
        <Text>betterspec is not initialized.</Text>
        <Text dimColor> Run </Text>
        <Text color={colors.primary}>betterspec init</Text>
        <Text dimColor> first.</Text>
      </BetterspecBox>,
    );
    process.exit(1);
  }

  if (options?.list || (!key && !value)) {
    const config = await readConfig(projectRoot);
    render(
      <ConfigOutput
        type="list"
        value={config as unknown as Record<string, unknown>}
      />,
    );
    return;
  }

  if (key && !value) {
    const val = await getConfigValue(projectRoot, key);
    if (val === undefined) {
      render(<ConfigOutput type="not-found" notFoundKey={key} />);
      process.exit(1);
    }

    if (typeof val === "object" && val !== null) {
      render(
        <ConfigOutput
          type="get"
          key={key}
          value={val as Record<string, unknown>}
        />,
      );
    } else {
      render(<ConfigOutput type="get" key={key} value={String(val)} />);
    }
    return;
  }

  if (key && value) {
    let parsed: unknown = value;
    if (value === "true") parsed = true;
    else if (value === "false") parsed = false;
    else if (/^\d+$/.test(value)) parsed = parseInt(value, 10);
    else {
      try {
        parsed = JSON.parse(value);
      } catch {
        // keep as string
      }
    }

    await setConfigValue(projectRoot, key, parsed);
    render(<ConfigOutput type="set" key={key} value={String(parsed)} />);
  }
}
