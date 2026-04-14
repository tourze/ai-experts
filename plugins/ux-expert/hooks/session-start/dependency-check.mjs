import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

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
    for (const key of Object.keys(enabled)) {
      if (enabled[key]) {
        out.add(key.split("@")[0]);
      }
    }
  } catch {
    // fail-open
  }
}

function scanPluginDirs(parentDir, out) {
  try {
    if (!existsSync(parentDir)) {
      return;
    }

    for (const dir of readdirSync(parentDir)) {
      const manifest = join(parentDir, dir, ".claude-plugin", "plugin.json");
      if (!existsSync(manifest)) {
        continue;
      }

      try {
        const parsed = JSON.parse(readFileSync(manifest, "utf-8"));
        if (parsed.name) {
          out.add(parsed.name);
        }
      } catch {
        // skip malformed manifests
      }
    }
  } catch {
    // fail-open
  }
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

export async function run() {
  const manifest = readOwnManifest();
  if (!manifest?.dependencies) {
    return null;
  }

  const required = manifest.dependencies.required || [];
  const optional = manifest.dependencies.optional || [];
  if (required.length === 0 && optional.length === 0) {
    return null;
  }

  const installed = collectInstalledPlugins();
  const missingRequired = required.filter((name) => !installed.has(name));
  const missingOptional = optional.filter((name) => !installed.has(name));

  if (missingRequired.length === 0 && missingOptional.length === 0) {
    return null;
  }

  const lines = [];

  if (missingRequired.length > 0) {
    lines.push("[Plugin Deps] ux-expert 缺少必要依赖：");
    for (const name of missingRequired) {
      lines.push(`  • ${name}`);
    }
    lines.push("  缺少这些插件会导致部分 UX 工作流无法运行。");
    lines.push("");
  }

  if (missingOptional.length > 0) {
    lines.push("[Plugin Deps] ux-expert 建议安装：");
    for (const name of missingOptional) {
      lines.push(`  • ${name}`);
    }
    lines.push("  例如与 `frontend-expert` 联动，可把审计建议直接落到前端实现。");
  }

  return {
    decision: "report",
    reason: lines.join("\n"),
  };
}
