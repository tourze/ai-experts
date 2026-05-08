import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const pythonEnvDetectorHook = defineHook({
  id: "python-env-detector",
  description: "检测 Python 项目的包管理器、版本、框架与虚拟环境。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./python-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * env-detector (SessionStart) — 探测 Python 项目环境
 *
 * 检测包管理器、Python 版本、框架与虚拟环境，
 * 帮助当前代理从第一条消息起就使用正确的工具链。
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

  const pyproject = findUp("pyproject.toml", cwd);
  const uvLock = findUp("uv.lock", cwd);
  const poetryLock = findUp("poetry.lock", cwd);
  const pipfile = findUp("Pipfile", cwd);
  const requirements = findUp("requirements.txt", cwd);
  const pythonVer = findUp(".python-version", cwd);

  if (!pyproject && !requirements && !pipfile && !pythonVer) return null;

  const facts = [];

  // Python 版本
  if (pythonVer) {
    const ver = readText(pythonVer);
    if (ver) facts.push(`Python 版本: ${ver}`);
  }

  // 包管理器
  if (uvLock) {
    facts.push("包管理器: uv");
  } else if (poetryLock) {
    facts.push("包管理器: Poetry");
  } else if (pipfile) {
    facts.push("包管理器: Pipenv");
  } else if (requirements) {
    facts.push("包管理器: pip (requirements.txt)");
  }

  // pyproject.toml 关键字段
  if (pyproject) {
    const content = readText(pyproject);
    const nameMatch = content.match(/^name\s*=\s*"([^"]+)"/m);
    if (nameMatch) facts.push(`项目名: ${nameMatch[1]}`);

    const lower = content.toLowerCase();
    if (lower.includes("django")) facts.push("框架: Django");
    else if (lower.includes("fastapi")) facts.push("框架: FastAPI");
    else if (lower.includes("flask")) facts.push("框架: Flask");
  }

  // 虚拟环境
  const projectRoot = pyproject ? dirname(pyproject) : cwd;
  for (const v of [".venv", "venv"]) {
    const venvBin = join(projectRoot, v, "bin/python");
    const venvWin = join(projectRoot, v, "Scripts/python.exe");
    if (existsSync(venvBin) || existsSync(venvWin)) {
      facts.push(`虚拟环境: ${v}/`);
      break;
    }
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Python Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
