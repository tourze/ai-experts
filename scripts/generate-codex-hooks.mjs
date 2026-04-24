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
//   node scripts/generate-codex-hooks.mjs --write --user   # write user-level hooks.json

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(".");

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
  const args = { check: false, write: false, user: false };
  for (const arg of argv) {
    if (arg === "--check") args.check = true;
    else if (arg === "--write") args.write = true;
    else if (arg === "--user") args.user = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (args.check === args.write) {
    throw new Error("Use exactly one of --check or --write");
  }
  if (args.write && !args.user) {
    throw new Error("Project-level .codex/hooks.json is intentionally unsupported; use --write --user.");
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

function run(args) {
  const expected = `${JSON.stringify(buildAggregatedHooks(true), null, 2)}\n`;

  if (args.check && !args.user) {
    JSON.parse(expected);
    console.log("generate-codex-hooks: OK (repository does not track .codex/hooks.json)");
    return;
  }

  const outputPath = userHooksPath();
  const actual = existsSync(outputPath) ? readFileSync(outputPath, "utf-8") : null;

  if (actual === expected) {
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
  writeFileSync(outputPath, expected);
  console.log(`updated ${outputPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export { buildAggregatedHooks };
