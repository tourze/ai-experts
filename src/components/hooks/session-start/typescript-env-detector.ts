import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const typescriptEnvDetectorHook = defineHook({
  id: "typescript-env-detector",
  description: "检测 TypeScript 项目的 tsconfig 严格模式、编译目标与 monorepo 结构。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./typescript-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * env-detector (SessionStart) — 探测 TypeScript 项目配置
 *
 * 检测 tsconfig 的 strict/target/module 设置与 monorepo 结构，
 * 帮助 Claude 从第一条消息起就使用正确的类型约束和编译选项。
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
    // tsconfig 可能有注释，简单移除单行注释
    const raw = readFileSync(p, "utf-8").replace(/\/\/.*$/gm, "");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function run(payload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  const tsconfigPath = findUp("tsconfig.json", cwd);
  if (!tsconfigPath) return null;

  const tsconfig = readJSON(tsconfigPath);
  if (!tsconfig) return null;

  const facts = [];
  const co = tsconfig.compilerOptions || {};

  // strict 模式
  if (co.strict !== undefined) {
    facts.push(`strict: ${co.strict}`);
  }

  // 编译目标
  if (co.target) facts.push(`target: ${co.target}`);
  if (co.module) facts.push(`module: ${co.module}`);

  // JSX
  if (co.jsx) facts.push(`jsx: ${co.jsx}`);

  // monorepo 标志
  if (tsconfig.references) {
    facts.push(`monorepo: composite + ${tsconfig.references.length} project references`);
  }

  // 路径别名
  if (co.paths) {
    const aliases = Object.keys(co.paths);
    if (aliases.length > 0) {
      facts.push(`路径别名: ${aliases.slice(0, 5).join(", ")}${aliases.length > 5 ? ` (+${aliases.length - 5})` : ""}`);
    }
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[TS Env] TypeScript 项目配置",
      "",
      `  tsconfig: ${tsconfigPath}`,
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
