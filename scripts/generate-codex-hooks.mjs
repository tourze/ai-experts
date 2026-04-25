#!/usr/bin/env node
// generate-codex-hooks.mjs
//
// Aggregate per-plugin hooks into a user-level hooks.json for Codex CLI
// compatibility (Codex does not load hooks from plugin directories).
//
// Repository policy:
//   This repository does not track or generate project-level .codex/hooks.json.
//   The installer writes user-level ${CODEX_HOME:-~/.codex}/hooks.json with absolute paths.
//
// Usage:
//   node scripts/generate-codex-hooks.mjs --check          # validate generation only
//   node scripts/generate-codex-hooks.mjs --check --user   # check user-level hooks.json
//   node scripts/generate-codex-hooks.mjs --write --user   # merge into user-level hooks.json
//   node scripts/generate-codex-hooks.mjs --remove --user  # remove only ai-experts hooks

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");

const EVENT_MAP = {
  SessionStart: "SessionStart",
  PreToolUse: "PreToolUse",
  PostToolUse: "PostToolUse",
  UserPromptSubmit: "UserPromptSubmit",
  Notification: "Notification",
  PreCompact: "PreCompact",
  Stop: "Stop",
};

// Codex CLI uses different tool names than Claude Code:
//   Edit/Write → apply_patch, Bash → exec_command
const CODEX_MATCHER_MAP = {
  "Edit|Write": "apply_patch",
  "Bash": "exec_command",
};

function parseArgs(argv) {
  const args = { check: false, write: false, remove: false, user: false };
  for (const arg of argv) {
    if (arg === "--check") args.check = true;
    else if (arg === "--write") args.write = true;
    else if (arg === "--remove") args.remove = true;
    else if (arg === "--user") args.user = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  const actions = [args.check, args.write, args.remove].filter(Boolean).length;
  if (actions !== 1) {
    throw new Error("Use exactly one of --check, --write, or --remove");
  }
  if (args.write && !args.user) {
    throw new Error("Project-level .codex/hooks.json is intentionally unsupported; use --write --user.");
  }
  if (args.remove && !args.user) {
    throw new Error("Removing project-level .codex/hooks.json is intentionally unsupported; use --remove --user.");
  }
  return args;
}

function listPluginHookFiles() {
  const tracked = execFileSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).split("\n");

  return tracked
    .filter((f) => f.startsWith("plugins/") && f.endsWith("/hooks/hooks.json"))
    .map((f) => ({
      pluginName: f.split("/")[1],
      hooksPath: resolve(repoRoot, f),
    }))
    .sort((a, b) => a.pluginName.localeCompare(b.pluginName));
}

function transformCommand(command, pluginName, useAbsPath) {
  const prefix = useAbsPath ? `${repoRoot}/plugins/${pluginName}` : `./plugins/${pluginName}`;
  return command.replace(
    /\$\{CLAUDE_PLUGIN_ROOT\}/g,
    prefix,
  );
}

function transformMatcher(matcher) {
  return CODEX_MATCHER_MAP[matcher] ?? matcher;
}

function transformHookEntry(entry, pluginName, useAbsPath) {
  return {
    ...entry,
    matcher: transformMatcher(entry.matcher),
    hooks: entry.hooks.map((hook) => ({
      ...hook,
      command: hook.command ? transformCommand(hook.command, pluginName, useAbsPath) : hook.command,
    })),
  };
}

function buildAggregatedHooks(useAbsPath = true) {
  const pluginHookFiles = listPluginHookFiles();
  const merged = {};

  for (const { pluginName, hooksPath } of pluginHookFiles) {
    const config = JSON.parse(readFileSync(hooksPath, "utf-8"));
    if (!config.hooks) continue;

    for (const [claudeEvent, entries] of Object.entries(config.hooks)) {
      const codexEvent = EVENT_MAP[claudeEvent];
      if (!codexEvent) continue;

      if (!merged[codexEvent]) merged[codexEvent] = [];

      for (const entry of entries) {
        merged[codexEvent].push(transformHookEntry(entry, pluginName, useAbsPath));
      }
    }
  }

  return { hooks: merged };
}

function userHooksPath() {
  return resolve(process.env.CODEX_HOME ?? resolve(homedir(), ".codex"), "hooks.json");
}

function normalizeHookCommand(command) {
  return typeof command === "string" ? command.replaceAll("\\", "/") : "";
}

function isCurrentRepoManagedHookCommand(command, managedCommands) {
  const normalized = normalizeHookCommand(command);
  if (!normalized) return false;
  if (managedCommands.has(normalized)) return true;

  const normalizedRepoRoot = repoRoot.replaceAll("\\", "/");
  return normalized.includes(`${normalizedRepoRoot}/plugins/`) &&
    normalized.includes("/hooks/dispatch.mjs");
}

function collectManagedCommands(config) {
  const commands = new Set();
  for (const entries of Object.values(config.hooks ?? {})) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      for (const hook of entry.hooks ?? []) {
        const command = normalizeHookCommand(hook.command);
        if (command) commands.add(command);
      }
    }
  }
  return commands;
}

function stripManagedHooksFromEntry(entry, managedCommands) {
  const hooks = (entry.hooks ?? []).filter((hook) => !isCurrentRepoManagedHookCommand(hook.command, managedCommands));
  return hooks.length > 0 ? { ...entry, hooks } : null;
}

function removeManagedHooksConfig(existingConfig, managedConfig) {
  const managedCommands = collectManagedCommands(managedConfig);
  const nextConfig = { ...existingConfig, hooks: {} };
  const existingHooks = existingConfig.hooks && typeof existingConfig.hooks === "object"
    ? existingConfig.hooks
    : {};

  for (const [eventName, entries] of Object.entries(existingHooks)) {
    if (!Array.isArray(entries)) {
      nextConfig.hooks[eventName] = entries;
      continue;
    }

    const preserved = entries
      .map((entry) => stripManagedHooksFromEntry(entry, managedCommands))
      .filter(Boolean);
    if (preserved.length > 0) {
      nextConfig.hooks[eventName] = preserved;
    }
  }

  return nextConfig;
}

function mergeUserHooksConfig(existingConfig, managedConfig) {
  const nextConfig = removeManagedHooksConfig(existingConfig, managedConfig);
  for (const [eventName, entries] of Object.entries(managedConfig.hooks ?? {})) {
    nextConfig.hooks[eventName] = [
      ...(Array.isArray(nextConfig.hooks[eventName]) ? nextConfig.hooks[eventName] : []),
      ...entries,
    ];
  }
  return nextConfig;
}

function readUserHooksConfig(actual, outputPath) {
  if (actual === null) {
    return {};
  }
  try {
    return JSON.parse(actual);
  } catch {
    throw new Error(`Existing Codex hooks file is not valid JSON: ${outputPath}`);
  }
}

function run(args) {
  const managedConfig = buildAggregatedHooks(true);
  const expected = `${JSON.stringify(managedConfig, null, 2)}\n`;

  if (args.check && !args.user) {
    JSON.parse(expected);
    console.log("generate-codex-hooks: OK (repository does not track .codex/hooks.json)");
    return;
  }

  const outputPath = userHooksPath();
  const actual = existsSync(outputPath) ? readFileSync(outputPath, "utf-8") : null;
  if (args.remove && actual === null) {
    console.log("generate-codex-hooks: OK");
    return;
  }
  const actualConfig = readUserHooksConfig(actual, outputPath);
  const targetConfig = args.remove
    ? removeManagedHooksConfig(actualConfig, managedConfig)
    : mergeUserHooksConfig(actualConfig, managedConfig);
  const target = `${JSON.stringify(targetConfig, null, 2)}\n`;

  if (actual === target) {
    console.log(args.write ? "generate-codex-hooks: already up to date" : "generate-codex-hooks: OK");
    return;
  }

  if (args.check) {
    console.error(`out of sync: ${outputPath.replace(`${repoRoot}/`, "")}`);
    process.exitCode = 1;
    return;
  }

  const dir = resolve(outputPath, "..");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(outputPath, target);
  console.log(args.remove ? `removed ai-experts hooks from ${outputPath}` : `updated ${outputPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export { buildAggregatedHooks, mergeUserHooksConfig, removeManagedHooksConfig };
