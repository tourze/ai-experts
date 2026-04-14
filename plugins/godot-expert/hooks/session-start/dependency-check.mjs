import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const PLUGIN_NAME = "godot-expert";
const SHELL = existsSync("/bin/bash") ? "/bin/bash" : (process.env.SHELL || "bash");
const OPTIONAL_TOOLS = [
  {
    commands: ["godot4", "godot"],
    usage: "Godot CLI（headless 语法检查、场景烟测）",
  },
  {
    commands: ["gdformat"],
    usage: "GDScript 格式化与示例代码整理",
  },
];

function runCommandCheck(command, env) {
  return spawnSync(SHELL, ["-c", `command -v ${command} >/dev/null 2>&1`], {
    stdio: "ignore",
    env,
  }).status === 0;
}

function findAvailableCommand(group, env = process.env) {
  return group.commands.find((command) => runCommandCheck(command, env)) ?? null;
}

function collectMissing(groups, env = process.env) {
  return groups.filter((group) => !findAvailableCommand(group, env));
}

export function findGodotProjectRoot(startDir = process.cwd()) {
  let currentDir = resolve(startDir);

  while (true) {
    if (existsSync(join(currentDir, "project.godot"))) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

function formatMissing(title, missingGroups) {
  if (missingGroups.length === 0) {
    return [];
  }

  const lines = [`[Plugin Deps] ${PLUGIN_NAME} ${title}：`];
  for (const group of missingGroups) {
    lines.push(`  • ${group.commands.join(" | ")}：${group.usage}`);
  }
  return lines;
}

export async function run() {
  const projectRoot = findGodotProjectRoot();
  if (projectRoot == null) {
    return null;
  }

  const missingOptional = collectMissing(OPTIONAL_TOOLS);
  if (missingOptional.length === 0) {
    return null;
  }

  const lines = [
    `[Plugin Deps] ${PLUGIN_NAME} 检测到 Godot 项目：${projectRoot}`,
    ...formatMissing("建议补齐本地工具链", missingOptional),
  ];

  lines.push("  缺少命令不会阻止插件加载，但会让本地示例验证、headless 检查或格式化无法直接执行。");
  return { decision: "report", reason: lines.join("\n") };
}
