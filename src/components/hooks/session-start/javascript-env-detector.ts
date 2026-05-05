import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const javascriptEnvDetectorHook = defineHook({
  id: "javascript-env-detector",
  description: "检测 JavaScript 项目的包管理器、Node 版本与主要框架。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./javascript-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * env-detector (SessionStart) — 探测 JavaScript 项目环境
 *
 * 检测包管理器、Node 版本约束与主要框架，
 * 帮助 Claude 从第一条消息起就使用正确的工具链。
 */


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

  const pkgPath = findUp("package.json", cwd);
  if (!pkgPath) return null;

  const pkg = readJSON(pkgPath);
  if (!pkg) return null;

  const projectRoot = dirname(pkgPath);
  const facts = [];

  // 项目名
  if (pkg.name) facts.push(`项目名: ${pkg.name}`);

  // Node 版本约束
  const nodeVer =
    findUp(".node-version", cwd) || findUp(".nvmrc", cwd);
  if (nodeVer) {
    const ver = readText(nodeVer);
    if (ver) facts.push(`Node 版本: ${ver}`);
  } else if (pkg.engines?.node) {
    facts.push(`Node 版本约束: ${pkg.engines.node}`);
  }

  // 包管理器
  if (pkg.packageManager) {
    facts.push(`包管理器: ${pkg.packageManager}`);
  } else if (existsSync(join(projectRoot, "bun.lockb")) || existsSync(join(projectRoot, "bun.lock"))) {
    facts.push("包管理器: Bun");
  } else if (existsSync(join(projectRoot, "pnpm-lock.yaml"))) {
    facts.push("包管理器: pnpm");
  } else if (existsSync(join(projectRoot, "yarn.lock"))) {
    facts.push("包管理器: Yarn");
  } else if (existsSync(join(projectRoot, "package-lock.json"))) {
    facts.push("包管理器: npm");
  }

  // 模块类型
  if (pkg.type) facts.push(`模块类型: ${pkg.type}`);

  // 主要框架检测
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };
  const frameworks = [];
  if (allDeps.next) frameworks.push(`Next.js ${allDeps.next}`);
  if (allDeps.nuxt) frameworks.push(`Nuxt ${allDeps.nuxt}`);
  if (allDeps.react) frameworks.push(`React ${allDeps.react}`);
  if (allDeps.vue) frameworks.push(`Vue ${allDeps.vue}`);
  if (allDeps.svelte) frameworks.push("Svelte");
  if (allDeps.express) frameworks.push("Express");
  if (allDeps.astro) frameworks.push("Astro");
  if (frameworks.length > 0) facts.push(`框架: ${frameworks.join(", ")}`);

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[JS Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
