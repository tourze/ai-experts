import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const goEnvDetectorHook = defineHook({
  id: "go-env-detector",
  description: "检测 Go 项目的模块路径、版本约束与 workspace 结构。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./go-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * env-detector (SessionStart) — 探测 Go 项目环境
 *
 * 检测 go.mod 的 Go 版本、module path 与 workspace 结构，
 * 帮助当前代理从第一条消息起就使用正确的 Go 版本和模块路径。
 */


function findUp(name: string, from: string) {
  let dir = from;
  const { root } = parse(dir);
  while (dir !== root) {
    if (existsSync(join(dir, name))) return join(dir, name);
    dir = dirname(dir);
  }
  return null;
}

function readText(p: string) {
  try {
    return readFileSync(p, "utf-8").trim();
  } catch {
    return "";
  }
}

export async function run(payload: NormalizedHookPayload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  const goModPath = findUp("go.mod", cwd);
  if (!goModPath) return null;

  const content = readText(goModPath);
  if (!content) return null;

  const facts = [];

  // module path
  const moduleMatch = content.match(/^module\s+(\S+)/m);
  if (moduleMatch) facts.push(`module: ${moduleMatch[1]}`);

  // Go 版本
  const goVerMatch = content.match(/^go\s+(\S+)/m);
  if (goVerMatch) facts.push(`Go 版本: ${goVerMatch[1]}`);

  // go.work workspace
  const projectRoot = dirname(goModPath);
  const goWorkPath = join(projectRoot, "go.work");
  if (existsSync(goWorkPath)) {
    const work = readText(goWorkPath);
    const uses = work.match(/^use\s/gm);
    facts.push(`workspace: go.work (${uses ? uses.length : "?"} 个模块)`);
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Go Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
