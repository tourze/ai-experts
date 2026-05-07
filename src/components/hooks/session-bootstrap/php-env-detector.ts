import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const phpEnvDetectorHook = defineHook({
  id: "php-env-detector",
  description: "检测 PHP 项目的版本约束、框架与 composer 配置。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./php-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * env-detector (SessionStart) — 探测 PHP 项目环境
 *
 * 检测 composer.json 的 PHP 版本约束、框架与包管理器配置，
 * 帮助 Claude 从第一条消息起就使用正确的 PHP 版本特性和框架约定。
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

function readJSON(p: string) {
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

export async function run(payload: NormalizedHookPayload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  const composerPath = findUp("composer.json", cwd);
  if (!composerPath) return null;

  const composer = readJSON(composerPath);
  if (!composer) return null;

  const facts = [];

  // 项目名
  if (composer.name) facts.push(`项目名: ${composer.name}`);

  // PHP 版本约束
  const phpVer = composer.require?.php;
  if (phpVer) facts.push(`PHP 版本约束: ${phpVer}`);

  // 框架检测
  const req = composer.require || {};
  if (req["laravel/framework"]) {
    facts.push(`框架: Laravel ${req["laravel/framework"]}`);
  } else if (req["symfony/framework-bundle"]) {
    facts.push(`框架: Symfony ${req["symfony/framework-bundle"]}`);
  } else if (req["slim/slim"]) {
    facts.push("框架: Slim");
  }

  // composer.lock 存在性
  const projectRoot = dirname(composerPath);
  if (existsSync(join(projectRoot, "composer.lock"))) {
    facts.push("composer.lock: 有");
  }

  // PSR-4 autoload namespace
  const psr4 = composer.autoload?.["psr-4"];
  if (psr4) {
    const namespaces = Object.keys(psr4);
    if (namespaces.length > 0) {
      facts.push(
        `主命名空间: ${namespaces.slice(0, 3).join(", ")}${namespaces.length > 3 ? ` (+${namespaces.length - 3})` : ""}`,
      );
    }
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[PHP Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
