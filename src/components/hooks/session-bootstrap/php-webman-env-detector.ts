import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const phpWebmanEnvDetectorHook = defineHook({
  id: "php-webman-env-detector",
  description: "检测 Webman 项目的框架版本、Workerman 版本与已安装扩展。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./php-webman-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * env-detector (SessionStart) — Webman 项目环境探测
 *
 * 检测 webman 框架版本、Workerman 版本、已安装扩展与 PHP 版本约束，
 * 帮助 Claude 从第一条消息起就使用正确的 Webman 约定和 Workerman API。
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

  const req = composer.require || {};
  // webman 框架标识
  const webmanPkg =
    req["workerman/webman-framework"] ||
    req["webman/framework"];
  if (!webmanPkg) return null;

  const facts = [];

  // Webman 版本
  facts.push(`Webman: ${webmanPkg}`);

  // Workerman 版本
  if (req["workerman/workerman"]) {
    facts.push(`Workerman: ${req["workerman/workerman"]}`);
  }

  // PHP 版本约束
  if (req.php) facts.push(`PHP 版本约束: ${req.php}`);

  // 项目名
  if (composer.name) facts.push(`项目名: ${composer.name}`);

  // Webman 官方扩展
  const extensions = [];
  for (const [pkg, ver] of Object.entries(req)) {
    if (pkg.startsWith("webman/") && pkg !== "webman/framework") {
      extensions.push(pkg.replace("webman/", ""));
    }
  }
  if (extensions.length > 0) {
    facts.push(`Webman 扩展: ${extensions.join(", ")}`);
  }

  // 常见依赖
  const notable = [];
  if (req["illuminate/database"]) notable.push("illuminate/database");
  if (req["topthink/think-orm"]) notable.push("ThinkORM");
  if (req["vlucas/phpdotenv"]) notable.push("phpdotenv");
  if (req["twig/twig"]) notable.push("Twig");
  if (req["blade-ui-kit/blade-icons"] || req["jenssegers/blade"]) notable.push("Blade");
  if (notable.length > 0) facts.push(`关键依赖: ${notable.join(", ")}`);

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Webman Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
