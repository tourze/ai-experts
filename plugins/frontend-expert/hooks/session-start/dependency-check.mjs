/**
 * 配套插件检查 hook（SessionStart）
 *
 * Claude Code 当前的 plugin manifest schema 不接受自定义 dependencies 字段，
 * 因此前端生态协作插件矩阵维护在此脚本中，并在 SessionStart 时提示缺失项。
 *
 * 检测策略（三路并查）：
 *   1. ~/.claude/settings.json + .claude/settings.json → enabledPlugins
 *   2. 兄弟目录扫描（--plugin-dir 开发场景）
 *   3. ~/.claude/plugins/cache/ 缓存扫描（marketplace 安装场景）
 *
 * 设计决策：
 *   - 仅 report，不 block
 *   - fail-open
 *   - 只提示协作增强能力，不把任何 companion plugin 当作硬依赖
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "..", "..");
const OPTIONAL_PLUGINS = [
  {
    name: "javascript-expert",
    reason: "补齐现代 JavaScript、脚本调试与通用 Node 生态约束",
  },
  {
    name: "typescript-expert",
    reason: "补齐 TS 类型系统、组件 props 与高级类型约束",
  },
  {
    name: "react-expert",
    reason: "补齐 React Hooks、RSC、性能与 RN 相关技能联动",
  },
  {
    name: "nextjs-expert",
    reason: "补齐 Next.js App Router、Server Actions 与部署约束",
  },
];

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

export async function run(_payload) {
  const manifest = readOwnManifest();
  const installed = collectInstalledPlugins();
  const ownName = manifest?.name || "frontend-expert";
  const missingOptional = OPTIONAL_PLUGINS.filter((plugin) => !installed.has(plugin.name));

  if (missingOptional.length === 0) {
    return null;
  }

  const lines = [`[Plugin Deps] ${ownName} 建议同时安装以下协作插件：`];
  for (const plugin of missingOptional) {
    lines.push(`  • ${plugin.name}：${plugin.reason}`);
  }
  lines.push("  缺少这些插件不会阻止 frontend-expert 工作，但会减少框架级约束与跨插件联动提示。");

  return { decision: "report", reason: lines.join("\n") };
}
