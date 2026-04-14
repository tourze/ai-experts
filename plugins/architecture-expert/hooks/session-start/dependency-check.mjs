/**
 * 插件依赖检查 hook（SessionStart）
 *
 * architecture-expert 当前未声明插件级依赖；此 hook 作为统一入口保留，
 * 后续若在 plugin.json 中补充 dependencies，可直接生效而无需改动 hooks 结构。
 */

import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "..", "..");

function readManifest() {
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

export async function run() {
  const manifest = readManifest();
  if (!manifest?.dependencies) {
    return null;
  }

  const required = manifest.dependencies.required || [];
  const optional = manifest.dependencies.optional || [];

  if (required.length === 0 && optional.length === 0) {
    return null;
  }

  return {
    decision: "report",
    reason: "[Plugin Deps] architecture-expert 已声明依赖，但当前版本仅校验结构完整性；如需自动发现依赖，请补充安装检测逻辑。",
  };
}
