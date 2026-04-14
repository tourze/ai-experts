import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const pluginRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");

function hasCommand(command) {
  return (
    spawnSync("bash", ["-lc", `command -v ${command} >/dev/null 2>&1`], {
      stdio: "ignore",
    }).status === 0
  );
}

function collectManifestIssues() {
  const issues = [];

  if (!existsSync(manifestPath)) {
    issues.push("缺少 .claude-plugin/plugin.json");
    return issues;
  }

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    if (manifest.name !== "product-expert") {
      issues.push(`manifest.name 异常：${JSON.stringify(manifest.name)}`);
    }
    if (manifest.skills !== "./skills/") {
      issues.push(`manifest.skills 应为 ./skills/，当前为 ${JSON.stringify(manifest.skills)}`);
    }
    if (manifest.hooks !== "./hooks/hooks.json") {
      issues.push(`manifest.hooks 应为 ./hooks/hooks.json，当前为 ${JSON.stringify(manifest.hooks)}`);
    }
  } catch (error) {
    issues.push(`plugin.json 解析失败：${error.message}`);
  }

  if (!existsSync(resolve(pluginRoot, "skills"))) {
    issues.push("缺少 skills/ 目录");
  }
  if (!existsSync(hooksPath)) {
    issues.push("缺少 hooks/hooks.json");
  }
  if (!existsSync(resolve(pluginRoot, "hooks/dispatch.mjs"))) {
    issues.push("缺少 hooks/dispatch.mjs");
  }

  return issues;
}

function collectRuntimeIssues() {
  const issues = [];

  if (!hasCommand("python3")) {
    issues.push("缺少 python3，现有产品脚本无法执行");
  }

  return issues;
}

export async function run() {
  const issues = [...collectManifestIssues(), ...collectRuntimeIssues()];
  if (issues.length === 0) {
    return null;
  }

  return {
    decision: "report",
    reason: [
      "[product-expert] 插件自检发现问题：",
      ...issues.map((issue) => `  • ${issue}`),
    ].join("\n"),
  };
}
