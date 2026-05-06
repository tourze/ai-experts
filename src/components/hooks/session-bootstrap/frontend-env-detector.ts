import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const frontendEnvDetectorHook = defineHook({
  id: "frontend-env-detector",
  description: "检测前端项目的构建工具、CSS 框架、测试工具与包管理器。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./frontend-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * env-detector (SessionStart) — 前端项目环境探测
 *
 * 检测构建工具（Vite/Webpack/Turbopack）、CSS 框架、测试工具与包管理器，
 * 帮助 Claude 从第一条消息起就使用正确的前端工具链和配置方式。
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

export async function run(payload: LegacyHookPayload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  const pkgPath = findUp("package.json", cwd);
  if (!pkgPath) return null;

  const pkg = readJSON(pkgPath);
  if (!pkg) return null;

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  // 前端项目信号：至少需要有前端相关依赖
  const hasFrontend =
    allDeps.vite || allDeps.webpack || allDeps.parcel || allDeps.esbuild ||
    allDeps.tailwindcss || allDeps.react || allDeps.vue || allDeps.svelte;
  if (!hasFrontend) return null;

  const projectRoot = dirname(pkgPath);
  const facts = [];

  // 构建工具
  if (allDeps.vite) {
    facts.push(`构建: Vite ${allDeps.vite}`);
  } else if (allDeps.webpack) {
    facts.push(`构建: Webpack ${allDeps.webpack}`);
  } else if (allDeps.esbuild) {
    facts.push("构建: esbuild");
  } else if (allDeps.parcel) {
    facts.push("构建: Parcel");
  } else if (allDeps.turbo) {
    facts.push("构建: Turbopack");
  }

  // 包管理器
  if (pkg.packageManager) {
    facts.push(`包管理器: ${pkg.packageManager}`);
  } else if (existsSync(join(projectRoot, "pnpm-lock.yaml"))) {
    facts.push("包管理器: pnpm");
  } else if (existsSync(join(projectRoot, "yarn.lock"))) {
    facts.push("包管理器: Yarn");
  } else if (existsSync(join(projectRoot, "bun.lockb")) || existsSync(join(projectRoot, "bun.lock"))) {
    facts.push("包管理器: Bun");
  }

  // CSS 框架
  const cssLibs = [];
  if (allDeps.tailwindcss) cssLibs.push("Tailwind CSS");
  if (allDeps.bootstrap) cssLibs.push("Bootstrap");
  if (allDeps["@unocss/core"] || allDeps.unocss) cssLibs.push("UnoCSS");
  if (allDeps["styled-components"]) cssLibs.push("styled-components");
  if (allDeps["@emotion/react"]) cssLibs.push("Emotion");
  if (cssLibs.length > 0) facts.push(`CSS: ${cssLibs.join(", ")}`);

  // 测试工具
  const testLibs = [];
  if (allDeps.vitest) testLibs.push("Vitest");
  if (allDeps.jest) testLibs.push("Jest");
  if (allDeps.playwright || allDeps["@playwright/test"]) testLibs.push("Playwright");
  if (allDeps.cypress) testLibs.push("Cypress");
  if (allDeps["@testing-library/react"] || allDeps["@testing-library/vue"]) testLibs.push("Testing Library");
  if (testLibs.length > 0) facts.push(`测试: ${testLibs.join(", ")}`);

  // TypeScript
  if (allDeps.typescript) facts.push(`TypeScript: ${allDeps.typescript}`);

  // Monorepo 信号
  if (existsSync(join(projectRoot, "pnpm-workspace.yaml"))) {
    facts.push("Monorepo: pnpm workspace");
  } else if (existsSync(join(projectRoot, "lerna.json"))) {
    facts.push("Monorepo: Lerna");
  } else if (pkg.workspaces) {
    facts.push("Monorepo: npm/yarn workspaces");
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Frontend Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
