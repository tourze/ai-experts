#!/usr/bin/env node
/**
 * Codex CLI 兼容层生成脚本
 *
 * 为每个插件生成 .codex-plugin/plugin.json，
 * 生成仓库级 .codex-plugin/marketplace.json，
 * 生成 AGENTS.md（从 CLAUDE.md 派生）。
 *
 * 用法：node scripts/sync-codex-metadata.mjs --write | --check
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(".");

// ── 工具函数 ────────────────────────────────────────────────

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

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function writeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function listTrackedPlugins() {
  const tracked = execFileSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).split("\n");

  return tracked
    .filter((f) => f.startsWith("plugins/") && f.endsWith("/.claude-plugin/plugin.json"))
    .map((f) => resolve(repoRoot, f.replace(/\/\.claude-plugin\/plugin\.json$/, "")))
    .sort();
}

function kebabToTitleCase(name) {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Phase 1：Plugin Manifest 双格式 ─────────────────────────

function buildCodexManifest(pluginRoot) {
  const src = readJson(resolve(pluginRoot, ".claude-plugin", "plugin.json"));
  const out = {
    name: src.name,
    version: src.version,
    description: src.description,
  };
  if (src.author) out.author = src.author;
  if (src.license) out.license = src.license;
  if (src.keywords) out.keywords = src.keywords;
  if (src.skills) out.skills = src.skills;
  // Codex 不支持 dependencies，省略
  out.interface = {
    displayName: kebabToTitleCase(src.name),
    shortDescription: src.description,
  };
  return out;
}

// ── Phase 4：Codex Marketplace ──────────────────────────────

function buildCodexMarketplace(pluginRoots) {
  const plugins = pluginRoots
    .map((root) => {
      const manifest = readJson(resolve(root, ".claude-plugin", "plugin.json"));
      return {
        name: basename(root),
        source: { source: "local", path: `./plugins/${basename(root)}` },
        description: manifest.description,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return { name: "ai-experts", plugins };
}

// ── Phase 3：AGENTS.md ──────────────────────────────────────

function buildAgentsMd() {
  const claudeMd = readFileSync(resolve(repoRoot, "CLAUDE.md"), "utf-8");
  return `<!-- Auto-generated from CLAUDE.md — do not edit directly -->\n\n${claudeMd}`;
}

// ── 主流程 ──────────────────────────────────────────────────

function collectExpectedFiles() {
  const files = new Map();
  const pluginRoots = listTrackedPlugins();

  // Phase 1: 每个插件的 .codex-plugin/plugin.json
  for (const root of pluginRoots) {
    const codexManifestPath = resolve(root, ".codex-plugin", "plugin.json");
    files.set(codexManifestPath, writeJson(buildCodexManifest(root)));
  }

  // Phase 3: AGENTS.md
  files.set(resolve(repoRoot, "AGENTS.md"), buildAgentsMd());

  // Phase 4: .agents/plugins/marketplace.json (Codex auto-discovery path)
  const codexMarketplacePath = resolve(repoRoot, ".agents", "plugins", "marketplace.json");
  files.set(codexMarketplacePath, writeJson(buildCodexMarketplace(pluginRoots)));

  return files;
}

function ensureParentDir(filePath) {
  const dir = resolve(filePath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function run(args) {
  const expectedFiles = collectExpectedFiles();
  const changedFiles = [];

  for (const [filePath, expectedContent] of expectedFiles.entries()) {
    const actualContent = existsSync(filePath) ? readFileSync(filePath, "utf-8") : null;
    if (actualContent !== expectedContent) {
      changedFiles.push(filePath);
      if (args.write) {
        ensureParentDir(filePath);
        writeFileSync(filePath, expectedContent);
      }
    }
  }

  if (args.write) {
    if (changedFiles.length === 0) {
      console.log("sync-codex-metadata: already up to date");
      return;
    }
    for (const f of changedFiles) {
      console.log(`updated ${f.replace(`${repoRoot}/`, "")}`);
    }
    return;
  }

  if (changedFiles.length > 0) {
    for (const f of changedFiles) {
      console.error(`out of sync: ${f.replace(`${repoRoot}/`, "")}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("sync-codex-metadata: OK");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
