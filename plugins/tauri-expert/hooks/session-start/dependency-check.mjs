/**
 * 配套插件检查 hook（SessionStart）
 *
 * Claude Code 当前 manifest schema 不适合表达 required/optional 依赖矩阵，
 * 因此把 tauri-expert 的协作插件建议维护在这里，并在 SessionStart 时
 * 扫描本机可见插件，提示缺失的 Rust / TypeScript 配套能力。
 *
 * 检测策略（三路并查）：
 *   1. ~/.claude/settings.json + .claude/settings.json → enabledPlugins
 *   2. 兄弟目录扫描（--plugin-dir 开发场景）
 *   3. ~/.claude/plugins/cache/ 缓存扫描（marketplace 安装场景）
 *
 * 设计决策：
 *   - 仅 report，不 block — 缺少配套插件不应阻止 tauri-expert 使用
 *   - fail-open — 任何检测异常静默跳过，不影响工作流
 *   - 只提示联动增强项，不把 companion plugin 当作 manifest 硬依赖
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// hooks/session-start/ → hooks/ → plugin root
const PLUGIN_ROOT = resolve(__dirname, "..", "..");
const OPTIONAL_PLUGINS = ["rust-expert", "typescript-expert"];

function readOwnManifest() {
  const manifestPath = join(PLUGIN_ROOT, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch {
    return null;
  }
}

export function extractEnabledPluginNames(settings) {
  const installed = new Set();
  const enabled = settings?.enabledPlugins ?? {};

  if (Array.isArray(enabled)) {
    for (const item of enabled) {
      if (typeof item === "string" && item.trim()) {
        installed.add(item.split("@")[0]);
      }
    }
    return installed;
  }

  for (const key of Object.keys(enabled)) {
    if (enabled[key] && typeof key === "string" && key.trim()) {
      installed.add(key.split("@")[0]);
    }
  }

  return installed;
}

function extractFromSettings(filePath, out) {
  try {
    if (!existsSync(filePath)) return;
    const settings = JSON.parse(readFileSync(filePath, "utf-8"));
    for (const plugin of extractEnabledPluginNames(settings)) {
      out.add(plugin);
    }
  } catch { /* fail-open */ }
}

function scanPluginDirs(parentDir, out, depth = 0) {
  try {
    if (!existsSync(parentDir) || depth > 2) return;

    for (const dir of readdirSync(parentDir)) {
      const fullPath = join(parentDir, dir);
      const manifest = join(fullPath, ".claude-plugin", "plugin.json");

      if (existsSync(manifest)) {
        try {
          const parsed = JSON.parse(readFileSync(manifest, "utf-8"));
          if (typeof parsed.name === "string" && parsed.name.trim()) {
            out.add(parsed.name);
          }
        } catch { /* skip malformed */ }
        continue;
      }

      scanPluginDirs(fullPath, out, depth + 1);
    }
  } catch { /* fail-open */ }
}

export function collectInstalledPlugins(options = {}) {
  const currentHome = options.homeDir || homedir();
  const currentCwd = options.cwd || process.cwd();
  const siblingRoot = options.siblingRoot || dirname(PLUGIN_ROOT);
  const cacheRoot = options.cacheRoot || join(currentHome, ".claude", "plugins", "cache");
  const installed = new Set();

  extractFromSettings(join(currentHome, ".claude", "settings.json"), installed);
  extractFromSettings(join(currentCwd, ".claude", "settings.json"), installed);
  extractFromSettings(join(currentCwd, ".claude", "settings.local.json"), installed);

  scanPluginDirs(siblingRoot, installed);
  scanPluginDirs(cacheRoot, installed);

  return installed;
}

export async function run() {
  const manifest = readOwnManifest();
  const installed = collectInstalledPlugins();
  const ownName = manifest?.name || "tauri-expert";
  const missingOptional = OPTIONAL_PLUGINS.filter((plugin) => !installed.has(plugin));

  if (missingOptional.length === 0) return null;

  const lines = [];
  lines.push(`[Plugin Deps] ${ownName} 建议同时安装以下配套插件：`);
  for (const dep of missingOptional) {
    lines.push(`  • ${dep}`);
  }
  lines.push("  缺少这些插件不会阻止 tauri-expert 工作，但会减少 Rust 后端、TypeScript 边界和跨技能联动的深度。");

  return { decision: "report", reason: lines.join("\n") };
}
