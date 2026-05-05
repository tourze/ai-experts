import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const javascriptVueEnvDetectorHook = defineHook({
  id: "javascript-vue-env-detector",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./javascript-vue-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * env-detector (SessionStart) — Vue 项目环境探测
 *
 * 检测 Vue 版本（2 / 3）、构建工具、状态管理与 UI 框架，
 * 帮助 Claude 从第一条消息起就使用正确的 Composition API / Options API 和工具链。
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

export async function run(payload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  const pkgPath = findUp("package.json", cwd);
  if (!pkgPath) return null;

  const pkg = readJSON(pkgPath);
  if (!pkg) return null;

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (!allDeps.vue) return null;

  const projectRoot = dirname(pkgPath);
  const facts = [];

  // Vue 版本
  const vueVer = allDeps.vue;
  facts.push(`Vue: ${vueVer}`);

  // Nuxt
  if (allDeps.nuxt) facts.push(`Nuxt: ${allDeps.nuxt}`);

  // 构建工具
  if (allDeps.vite) {
    facts.push("构建: Vite");
  } else if (allDeps["@vue/cli-service"]) {
    facts.push("构建: Vue CLI");
  } else if (existsSync(join(projectRoot, "webpack.config.js"))) {
    facts.push("构建: Webpack");
  }

  // 状态管理
  if (allDeps.pinia) {
    facts.push("状态管理: Pinia");
  } else if (allDeps.vuex) {
    facts.push("状态管理: Vuex");
  }

  // 路由
  if (allDeps["vue-router"]) facts.push(`vue-router: ${allDeps["vue-router"]}`);

  // TypeScript
  if (allDeps.typescript) facts.push(`TypeScript: ${allDeps.typescript}`);

  // UI 框架
  const uiLibs = [];
  if (allDeps["element-plus"]) uiLibs.push("Element Plus");
  if (allDeps["element-ui"]) uiLibs.push("Element UI");
  if (allDeps["ant-design-vue"]) uiLibs.push("Ant Design Vue");
  if (allDeps.vuetify) uiLibs.push("Vuetify");
  if (allDeps["naive-ui"]) uiLibs.push("Naive UI");
  if (allDeps.quasar) uiLibs.push("Quasar");
  if (uiLibs.length > 0) facts.push(`UI 框架: ${uiLibs.join(", ")}`);

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Vue Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
