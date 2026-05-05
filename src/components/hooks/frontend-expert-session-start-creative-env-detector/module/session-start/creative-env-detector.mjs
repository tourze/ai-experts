/**
 * env-detector (SessionStart) — Godot 项目环境探测
 *
 * 检测 project.godot 中的引擎版本、项目名、渲染器与脚本语言，
 * 帮助 Claude 从第一条消息起就使用正确的 Godot 3 / 4 API。
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, parse } from "node:path";

function findUp(name, from) {
  let dir = from;
  const { root } = parse(dir);
  while (dir !== root) {
    if (existsSync(join(dir, name))) return join(dir, name);
    dir = dirname(dir);
  }
  return null;
}

function readText(p) {
  try {
    return readFileSync(p, "utf-8").trim();
  } catch {
    return "";
  }
}

export async function run(payload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  const projectPath = findUp("project.godot", cwd);
  if (!projectPath) return null;

  const content = readText(projectPath);
  if (!content) return null;

  const facts = [];

  // Godot 版本（config_version=5 → Godot 4.x，config_version=4 → Godot 3.x）
  const configVer = content.match(/^config_version\s*=\s*(\d+)/m);
  if (configVer) {
    const v = parseInt(configVer[1], 10);
    if (v >= 5) {
      facts.push("Godot: 4.x");
    } else if (v === 4) {
      facts.push("Godot: 3.x");
    } else {
      facts.push(`config_version: ${v}`);
    }
  }

  // 项目名
  const nameMatch = content.match(/^config\/name\s*=\s*"([^"]+)"/m);
  if (nameMatch) facts.push(`项目名: ${nameMatch[1]}`);

  // 渲染器
  const rendererMatch = content.match(/^rendering\/renderer\/rendering_method\s*=\s*"([^"]+)"/m);
  if (rendererMatch) {
    facts.push(`渲染器: ${rendererMatch[1]}`);
  } else {
    // Godot 3 style
    const qualityMatch = content.match(/^rendering\/quality\/driver\/driver_name\s*=\s*"([^"]+)"/m);
    if (qualityMatch) facts.push(`渲染器: ${qualityMatch[1]}`);
  }

  // 脚本语言
  const projectRoot = dirname(projectPath);
  try {
    const files = readdirSync(projectRoot);
    if (files.some((f) => f.endsWith(".csproj") || f.endsWith(".sln"))) {
      facts.push("脚本: C# + GDScript");
    } else {
      facts.push("脚本: GDScript");
    }
  } catch {
    facts.push("脚本: GDScript");
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Godot Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
