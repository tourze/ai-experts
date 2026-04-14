/**
 * 插件依赖检查 hook（SessionStart）
 *
 * 读取当前插件的 plugin.json 中的 dependencies 字段，
 * 扫描已安装插件列表，报告缺失的依赖。
 *
 * 检测策略（三路并查）：
 *   1. ~/.claude/settings.json + .claude/settings.json → enabledPlugins
 *   2. 兄弟目录扫描（--plugin-dir 开发场景）
 *   3. ~/.claude/plugins/cache/ 缓存扫描（marketplace 安装场景）
 *
 * 设计决策：
 *   - 仅 report，不 block：缺少依赖不应阻止插件使用
 *   - fail-open：任何检测异常静默跳过，不影响工作流
 *   - required 和 optional 分开提示，语气不同
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "..", "..");

function readOwnManifest() {
  const manifestPath = join(PLUGIN_ROOT, ".claude-plugin", "plugin.json");
  if (!existsSync(manifestPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch {
    return null;
  }
}

function extractFromSettings(filePath, out) {
  try {
    if (!existsSync(filePath)) {
      return;
    }

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
        out.add(key.split("@")[0]);
      }
    }
  } catch {
    // fail-open
  }
}

function scanPluginDirs(parentDir, out, depth = 0) {
  try {
    if (!existsSync(parentDir) || depth > 2) {
      return;
    }

    for (const entry of readdirSync(parentDir)) {
      const fullPath = join(parentDir, entry);
      const manifestPath = join(fullPath, ".claude-plugin", "plugin.json");

      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
          if (typeof manifest.name === "string" && manifest.name.trim()) {
            out.add(manifest.name);
          }
        } catch {
          // skip malformed plugin
        }
        continue;
      }

      scanPluginDirs(fullPath, out, depth + 1);
    }
  } catch {
    // fail-open
  }
}

function normalizeDeps(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.filter((item) => typeof item === "string" && item.trim());
}

function parseDependencies(dependencies) {
  if (Array.isArray(dependencies)) {
    return {
      required: normalizeDeps(dependencies),
      optional: [],
    };
  }

  if (dependencies && typeof dependencies === "object") {
    return {
      required: normalizeDeps(dependencies.required),
      optional: normalizeDeps(dependencies.optional),
    };
  }

  return { required: [], optional: [] };
}

function collectInstalledPlugins() {
  const installed = new Set();

  extractFromSettings(join(homedir(), ".claude", "settings.json"), installed);
  extractFromSettings(join(process.cwd(), ".claude", "settings.json"), installed);
  extractFromSettings(join(process.cwd(), ".claude", "settings.local.json"), installed);

  scanPluginDirs(dirname(PLUGIN_ROOT), installed);
  scanPluginDirs(join(homedir(), ".claude", "plugins", "cache"), installed);

  return installed;
}

export async function run(_payload) {
  const manifest = readOwnManifest();
  if (!manifest?.dependencies) {
    return null;
  }

  const { required, optional } = parseDependencies(manifest.dependencies);

  if (required.length === 0 && optional.length === 0) {
    return null;
  }

  const installed = collectInstalledPlugins();
  const missingRequired = required.filter((dep) => !installed.has(dep));
  const missingOptional = optional.filter((dep) => !installed.has(dep));

  if (missingRequired.length === 0 && missingOptional.length === 0) {
    return null;
  }

  const lines = [];

  if (missingRequired.length > 0) {
    lines.push(`[Plugin Deps] ${manifest.name ?? "unknown"} 缺少必要依赖：`);
    for (const dep of missingRequired) {
      lines.push(`  • ${dep}`);
    }
    lines.push("  部分功能（语法检查/lint/框架模式等）将不可用。");
    lines.push("");
  }

  if (missingOptional.length > 0) {
    lines.push(`[Plugin Deps] ${manifest.name ?? "unknown"} 建议安装：`);
    for (const dep of missingOptional) {
      lines.push(`  • ${dep}`);
    }
  }

  return { decision: "report", reason: lines.join("\n") };
}
