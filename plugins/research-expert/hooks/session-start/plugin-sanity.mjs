import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "..", "..");
const EXPECTED_NAME = "research-expert";

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (error) {
    return {
      __error: error instanceof Error ? error.message : String(error),
    };
  }
}

function hasCommand(command) {
  if (process.platform === "win32") {
    return spawnSync("where", [command], { stdio: "ignore" }).status === 0;
  }

  return spawnSync("bash", ["-lc", `command -v '${command}' >/dev/null 2>&1`], {
    stdio: "ignore",
  }).status === 0;
}

function collectIssues() {
  const issues = [];
  const manifestPath = join(PLUGIN_ROOT, ".claude-plugin", "plugin.json");
  const readmePath = join(PLUGIN_ROOT, "README.md");
  const hooksPath = join(PLUGIN_ROOT, "hooks", "hooks.json");
  const dispatchPath = join(PLUGIN_ROOT, "hooks", "dispatch.mjs");
  const skillsRoot = join(PLUGIN_ROOT, "skills");

  if (!existsSync(manifestPath)) {
    issues.push("缺少 .claude-plugin/plugin.json。");
    return issues;
  }

  const manifest = readJson(manifestPath);
  if (manifest.__error) {
    issues.push(`plugin.json 无法解析：${manifest.__error}`);
    return issues;
  }

  if (manifest.name !== EXPECTED_NAME) {
    issues.push(`plugin.json.name 应为 ${EXPECTED_NAME}，实际为 ${String(manifest.name) || "<empty>"}`);
  }

  if (manifest.skills !== "./skills/") {
    issues.push(`plugin.json.skills 应为 ./skills/，实际为 ${String(manifest.skills) || "<empty>"}`);
  } else {
    const skillsPath = resolve(PLUGIN_ROOT, manifest.skills);
    if (!existsSync(skillsPath)) {
      issues.push(`plugin.json.skills 指向的路径不存在：${manifest.skills}`);
    }
  }

  if ("hooks" in manifest) {
    issues.push(`plugin.json.hooks 不应重复声明标准 hooks/hooks.json；Claude 会自动加载该文件，实际为 ${String(manifest.hooks) || "<empty>"}`);
  }

  for (const [filePath, label] of [
    [readmePath, "README.md"],
    [hooksPath, "hooks/hooks.json"],
    [dispatchPath, "hooks/dispatch.mjs"],
    [skillsRoot, "skills/"],
  ]) {
    if (!existsSync(filePath)) {
      issues.push(`缺少 ${label}。`);
    }
  }

  if (existsSync(skillsRoot)) {
    for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const skillPath = join(skillsRoot, entry.name, "SKILL.md");
      if (!existsSync(skillPath)) {
        issues.push(`skill 目录缺少 SKILL.md：skills/${entry.name}/SKILL.md`);
      }
    }
  }

  for (const command of ["node", "python3"]) {
    if (!hasCommand(command)) {
      issues.push(`缺少基础命令：${command}`);
    }
  }

  return issues;
}

export async function run() {
  const issues = collectIssues();
  if (issues.length === 0) {
    return null;
  }

  return {
    decision: "report",
    reason: `[Plugin Sanity] research-expert 自检失败：\n- ${issues.join("\n- ")}`,
  };
}
