/**
 * env-detector (SessionStart) — Laravel 项目环境探测
 *
 * 在 PHP hooks 的 PHP 基础环境之上，深入检测 Laravel 版本、
 * 关键包（Sanctum/Horizon/Nova）、队列驱动和 .env 环境标识，
 * 帮助 Claude 从第一条消息起就使用正确的 Laravel 约定。
 */

import { existsSync, readFileSync } from "node:fs";
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

function readJSON(p) {
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
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

  const composerPath = findUp("composer.json", cwd);
  if (!composerPath) return null;

  const composer = readJSON(composerPath);
  if (!composer) return null;

  const req = composer.require || {};
  if (!req["laravel/framework"]) return null;

  const projectRoot = dirname(composerPath);
  const facts = [];

  // Laravel 版本
  facts.push(`Laravel: ${req["laravel/framework"]}`);

  // PHP 版本约束
  if (req.php) facts.push(`PHP 版本约束: ${req.php}`);

  // artisan 存在性
  if (existsSync(join(projectRoot, "artisan"))) {
    facts.push("artisan: 有");
  }

  // 关键 Laravel 包
  const packages = [];
  if (req["laravel/sanctum"]) packages.push(`Sanctum ${req["laravel/sanctum"]}`);
  if (req["laravel/horizon"]) packages.push(`Horizon ${req["laravel/horizon"]}`);
  if (req["laravel/nova"]) packages.push("Nova");
  if (req["laravel/octane"]) packages.push(`Octane ${req["laravel/octane"]}`);
  if (req["laravel/livewire"] || req["livewire/livewire"]) packages.push("Livewire");
  if (req["inertiajs/inertia-laravel"]) packages.push("Inertia");
  if (req["laravel/cashier"]) packages.push("Cashier");
  if (req["laravel/scout"]) packages.push("Scout");
  if (packages.length > 0) facts.push(`关键包: ${packages.join(", ")}`);

  // 测试框架
  const devReq = composer["require-dev"] || {};
  if (devReq["pestphp/pest"]) {
    facts.push("测试: Pest");
  } else if (devReq["phpunit/phpunit"]) {
    facts.push("测试: PHPUnit");
  }

  // .env APP_ENV（只读第一个匹配行，不暴露敏感值）
  const envFile = join(projectRoot, ".env");
  if (existsSync(envFile)) {
    const envContent = readText(envFile);
    const appEnv = envContent.match(/^APP_ENV\s*=\s*(\S+)/m);
    if (appEnv) facts.push(`APP_ENV: ${appEnv[1]}`);
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Laravel Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
