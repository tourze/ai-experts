/**
 * 运行时依赖检查 hook（SessionStart）
 *
 * 目标：
 * - 检查 `python3` 是否可用
 * - 检查 `data-analysis` 依赖的 `duckdb` / `openpyxl` 是否可导入
 *
 * 设计约束：
 * - 仅 report，不 block
 * - fail-open：任何探测异常都降级为提示，不阻断插件使用
 * - `CLAUDE_PLUGIN_SKIP_DEP_CHECK=1` 时跳过，便于测试与静默运行
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "..", "..");
const PYTHON_MODULES = ["duckdb", "openpyxl"];

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

function probePythonDependencies() {
  const probeScript = [
    "import importlib, json",
    `modules = ${JSON.stringify(PYTHON_MODULES)}`,
    "result = {}",
    "for name in modules:",
    "    try:",
    "        importlib.import_module(name)",
    "        result[name] = 'ok'",
    "    except Exception as exc:",
    "        result[name] = f'{type(exc).__name__}: {exc}'",
    "print(json.dumps(result, ensure_ascii=False))",
  ].join("\n");

  const result = spawnSync("python3", ["-c", probeScript], {
    encoding: "utf-8",
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });

  if (result.error) {
    return {
      status: "python-missing",
      detail: result.error.message,
    };
  }

  if (result.status !== 0) {
    return {
      status: "python-error",
      detail: (result.stderr || result.stdout || "").trim(),
    };
  }

  try {
    return {
      status: "ok",
      modules: JSON.parse(result.stdout || "{}"),
    };
  } catch {
    return {
      status: "python-error",
      detail: `依赖探测返回了不可解析的 JSON：${(result.stdout || "").trim()}`,
    };
  }
}

export async function run() {
  if (process.env.CLAUDE_PLUGIN_SKIP_DEP_CHECK === "1") {
    return null;
  }

  const manifest = readManifest();
  const ownName = manifest?.name || "data-ai-expert";
  const probe = probePythonDependencies();

  if (probe.status === "ok") {
    const failures = Object.entries(probe.modules).filter(([, status]) => status !== "ok");
    if (failures.length === 0) {
      return null;
    }

    const lines = [];
    lines.push(`[Plugin Deps] ${ownName} 发现 Python 依赖缺失或导入异常：`);
    for (const [moduleName, status] of failures) {
      lines.push(`  • ${moduleName}: ${status}`);
    }
    lines.push("  建议：");
    lines.push("  1. 确认 `python3` 指向可用环境。");
    lines.push("  2. 运行 `python3 -m pip install duckdb openpyxl`。");
    lines.push("  3. 若只分析 CSV，可暂时忽略 `openpyxl`。");
    return { decision: "report", reason: lines.join("\n") };
  }

  return {
    decision: "report",
    reason:
      probe.status === "python-missing"
        ? `[Plugin Deps] ${ownName} 未找到 python3：${probe.detail}`
        : `[Plugin Deps] ${ownName} 无法完成 Python 依赖探测：${probe.detail}`,
  };
}
