/**
 * env-detector (SessionStart) — React / React Native 项目环境探测
 *
 * 检测 React 版本、渲染目标（DOM / Native / Expo）、状态管理与构建工具，
 * 帮助 Claude 从第一条消息起就使用正确的 API 风格和平台约束。
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

export async function run(payload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  const pkgPath = findUp("package.json", cwd);
  if (!pkgPath) return null;

  const pkg = readJSON(pkgPath);
  if (!pkg) return null;

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (!allDeps.react) return null;

  const projectRoot = dirname(pkgPath);
  const facts = [];

  // React 版本
  facts.push(`React: ${allDeps.react}`);

  // 渲染目标
  if (allDeps["react-native"]) {
    facts.push(`React Native: ${allDeps["react-native"]}`);
    if (allDeps.expo) {
      facts.push(`Expo SDK: ${allDeps.expo}`);
    }
  } else if (allDeps["react-dom"]) {
    facts.push(`react-dom: ${allDeps["react-dom"]}`);
  }

  // 元框架
  if (allDeps.next) facts.push(`Next.js: ${allDeps.next}`);
  if (allDeps.remix || allDeps["@remix-run/react"]) facts.push("Remix: 有");
  if (allDeps.gatsby) facts.push(`Gatsby: ${allDeps.gatsby}`);

  // 状态管理
  const stateLibs = [];
  if (allDeps.zustand) stateLibs.push("Zustand");
  if (allDeps["@reduxjs/toolkit"] || allDeps.redux) stateLibs.push("Redux");
  if (allDeps.jotai) stateLibs.push("Jotai");
  if (allDeps.recoil) stateLibs.push("Recoil");
  if (allDeps.mobx) stateLibs.push("MobX");
  if (allDeps.xstate) stateLibs.push("XState");
  if (stateLibs.length > 0) facts.push(`状态管理: ${stateLibs.join(", ")}`);

  // 构建工具
  if (allDeps.vite) facts.push("构建: Vite");
  else if (existsSync(join(projectRoot, "webpack.config.js")) || existsSync(join(projectRoot, "webpack.config.ts"))) {
    facts.push("构建: Webpack");
  }

  // TypeScript
  if (allDeps.typescript) facts.push(`TypeScript: ${allDeps.typescript}`);

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[React Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
