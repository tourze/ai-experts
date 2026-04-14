import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "..", "..");
const EXPECTED_NAME = "finance-expert";
const EXPECTED_HOOK_COMMAND =
  "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs session-start";

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (error) {
    return {
      __error: error instanceof Error ? error.message : String(error),
    };
  }
}

function collectIssues() {
  const issues = [];
  const manifestPath = join(PLUGIN_ROOT, ".claude-plugin", "plugin.json");
  const hooksPath = join(PLUGIN_ROOT, "hooks", "hooks.json");
  const dispatchPath = join(PLUGIN_ROOT, "hooks", "dispatch.mjs");
  const readmePath = join(PLUGIN_ROOT, "README.md");

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
    issues.push(
      `plugin.json.name 应为 ${EXPECTED_NAME}，实际为 ${String(manifest.name) || "<empty>"}`,
    );
  }

  for (const [key, expected] of [
    ["skills", "./skills/"],
    ["hooks", "./hooks/hooks.json"],
  ]) {
    if (manifest[key] !== expected) {
      issues.push(
        `plugin.json.${key} 应为 ${expected}，实际为 ${String(manifest[key]) || "<empty>"}`,
      );
      continue;
    }

    const target = resolve(PLUGIN_ROOT, manifest[key]);
    if (!existsSync(target)) {
      issues.push(`plugin.json.${key} 指向的路径不存在：${manifest[key]}`);
    }
  }

  if (!existsSync(readmePath)) {
    issues.push("缺少 README.md。");
  }

  if (!existsSync(dispatchPath)) {
    issues.push("缺少 hooks/dispatch.mjs。");
  }

  if (!existsSync(hooksPath)) {
    issues.push("缺少 hooks/hooks.json。");
  } else {
    const hooks = readJson(hooksPath);
    if (hooks.__error) {
      issues.push(`hooks/hooks.json 无法解析：${hooks.__error}`);
    } else {
      const sessionHooks = hooks.hooks?.SessionStart?.[0]?.hooks ?? [];
      if (sessionHooks.length !== 1) {
        issues.push(`SessionStart hooks 数量应为 1，实际为 ${sessionHooks.length}`);
      } else if (sessionHooks[0].command !== EXPECTED_HOOK_COMMAND) {
        issues.push(
          `SessionStart command 应为 ${EXPECTED_HOOK_COMMAND}，实际为 ${String(sessionHooks[0].command)}`,
        );
      }
    }
  }

  const skillsRoot = resolve(PLUGIN_ROOT, "skills");
  if (!existsSync(skillsRoot)) {
    issues.push("skills/ 目录不存在。");
    return issues;
  }

  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillPath = join(skillsRoot, entry.name, "SKILL.md");
    if (!existsSync(skillPath)) {
      issues.push(`缺少 skill 文档：skills/${entry.name}/SKILL.md`);
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
    reason: `[Plugin Sanity] finance-expert 自检失败：\n- ${issues.join("\n- ")}`,
  };
}
