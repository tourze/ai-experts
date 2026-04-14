/**
 * 配套插件检查 hook（SessionStart）
 *
 * Claude Code 当前的 plugin manifest schema 不接受自定义 dependencies 字段，
 * 因此把 Next.js 插件的配套插件矩阵维护在此脚本中，并在 SessionStart
 * 时扫描本机可见插件，提示缺失的协作插件。
 *
 * 检测策略（三路并查）：
 *   1. ~/.claude/settings.json + .claude/settings.json → enabledPlugins
 *   2. 兄弟目录扫描（--plugin-dir 开发场景）
 *   3. ~/.claude/plugins/cache/ 缓存扫描（marketplace 安装场景）
 *
 * 设计决策：
 *   - 仅 report，不 block — 缺少依赖不应阻止插件使用
 *   - fail-open — 任何检测异常静默跳过，不影响工作流
 *   - 仅提示协作增强能力，不把任何 companion plugin 当作硬依赖
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// hooks/session-start/ → hooks/ → plugin root
const PLUGIN_ROOT = resolve(__dirname, "..", "..");
const OPTIONAL_PLUGINS = ["react-expert", "typescript-expert", "javascript-expert"];

/** 读取当前插件 manifest，仅用于获取插件名 */
function readOwnManifest() {
  const manifestPath = join(PLUGIN_ROOT, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch {
    return null;
  }
}

/** 从 settings.json 的 enabledPlugins 提取插件名 */
function extractFromSettings(filePath, out) {
  try {
    if (!existsSync(filePath)) return;
    const settings = JSON.parse(readFileSync(filePath, "utf-8"));
    const enabled = settings.enabledPlugins || {};

    if (Array.isArray(enabled)) {
      for (const key of enabled) {
        if (typeof key === "string" && key.trim()) {
          out.add(key.split("@")[0]);
        }
      }
      return;
    }

    for (const key of Object.keys(enabled)) {
      if (enabled[key] && typeof key === "string" && key.trim()) {
        // "plugin-name@marketplace" → "plugin-name"
        out.add(key.split("@")[0]);
      }
    }
  } catch { /* fail-open */ }
}

/** 扫描目录下所有插件的 plugin.json，提取 name */
function scanPluginDirs(parentDir, out, depth = 0) {
  try {
    if (!existsSync(parentDir) || depth > 2) return;

    for (const dir of readdirSync(parentDir)) {
      const fullPath = join(parentDir, dir);
      const manifest = join(fullPath, ".claude-plugin", "plugin.json");

      if (existsSync(manifest)) {
        try {
          const m = JSON.parse(readFileSync(manifest, "utf-8"));
          if (typeof m.name === "string" && m.name.trim()) {
            out.add(m.name);
          }
        } catch { /* skip malformed */ }
        continue;
      }

      scanPluginDirs(fullPath, out, depth + 1);
    }
  } catch { /* fail-open */ }
}

/** 收集所有可检测到的已安装插件名 */
function collectInstalledPlugins() {
  const installed = new Set();

  // 1. settings.json（全局 + 项目 + local）
  extractFromSettings(join(homedir(), ".claude", "settings.json"), installed);
  extractFromSettings(join(process.cwd(), ".claude", "settings.json"), installed);
  extractFromSettings(join(process.cwd(), ".claude", "settings.local.json"), installed);

  // 2. 兄弟目录（--plugin-dir 开发场景）
  scanPluginDirs(dirname(PLUGIN_ROOT), installed);

  // 3. marketplace 缓存
  scanPluginDirs(join(homedir(), ".claude", "plugins", "cache"), installed);

  return installed;
}

export async function run(_payload) {
  const manifest = readOwnManifest();
  const installed = collectInstalledPlugins();
  const ownName = manifest?.name || "nextjs-expert";
  const missingOptional = OPTIONAL_PLUGINS.filter((plugin) => !installed.has(plugin));

  if (missingOptional.length === 0) return null;

  const lines = [];
  lines.push(`[Plugin Deps] ${ownName} 建议同时安装以下配套插件：`);
  for (const dep of missingOptional) {
    lines.push(`  • ${dep}`);
  }
  lines.push("  缺少这些插件不会阻止 nextjs-expert 工作，但会减少 React/TypeScript/JavaScript 相关的跨技能联动。");

  return { decision: "report", reason: lines.join("\n") };
}
