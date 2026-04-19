#!/usr/bin/env node
// generate-codex-hooks.mjs
//
// Aggregate per-plugin hooks into a single project-level .codex/hooks.json
// for Codex CLI compatibility (Codex does not support plugin-bundled hooks).
//
// Transforms:
//   - ${CLAUDE_PLUGIN_ROOT} -> ./plugins/<name>/hooks (relative path)
//   - Notification event -> PermissionRequest (Codex equivalent)
//   - All other event names stay the same
//
// Usage: node scripts/generate-codex-hooks.mjs --write | --check

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(".");
const outputPath = resolve(repoRoot, ".codex", "hooks.json");

const EVENT_MAP = {
  SessionStart: "SessionStart",
  PreToolUse: "PreToolUse",
  PostToolUse: "PostToolUse",
  UserPromptSubmit: "UserPromptSubmit",
  Notification: "Notification",
  PreCompact: "PreCompact",
  Stop: "Stop",
};

function parseArgs(argv) {
  const args = { check: false, write: false };
  for (const arg of argv) {
    if (arg === "--check") args.check = true;
    else if (arg === "--write") args.write = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (args.check === args.write) {
    throw new Error("Use exactly one of --check or --write");
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

function transformCommand(command, pluginName) {
  return command.replace(
    /\$\{CLAUDE_PLUGIN_ROOT\}/g,
    `./plugins/${pluginName}`,
  );
}

function transformHookEntry(entry, pluginName) {
  return {
    ...entry,
    hooks: entry.hooks.map((hook) => ({
      ...hook,
      command: hook.command ? transformCommand(hook.command, pluginName) : hook.command,
    })),
  };
}

function buildAggregatedHooks() {
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
        merged[codexEvent].push(transformHookEntry(entry, pluginName));
      }
    }
  }

  return { hooks: merged };
}

function run(args) {
  const expected = `${JSON.stringify(buildAggregatedHooks(), null, 2)}\n`;
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
  console.log(`updated ${outputPath.replace(`${repoRoot}/`, "")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
