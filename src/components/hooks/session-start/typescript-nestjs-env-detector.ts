import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const typescriptNestjsEnvDetectorHook = defineHook({
  id: "typescript-nestjs-env-detector",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./typescript-nestjs-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * env-detector (SessionStart) — NestJS 项目环境探测
 *
 * 检测 @nestjs/core 版本、ORM 选择、已安装的 @nestjs/* 模块与构建工具，
 * 帮助 Claude 从第一条消息起就使用正确的 NestJS 模块和装饰器。
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
  if (!allDeps["@nestjs/core"]) return null;

  const facts = [];

  // NestJS 版本
  facts.push(`NestJS: ${allDeps["@nestjs/core"]}`);

  // 已安装的 @nestjs/* 模块
  const nestModules = Object.keys(allDeps)
    .filter((k) => k.startsWith("@nestjs/") && k !== "@nestjs/core" && k !== "@nestjs/common")
    .map((k) => k.replace("@nestjs/", ""));
  if (nestModules.length > 0) {
    facts.push(`NestJS 模块: ${nestModules.join(", ")}`);
  }

  // ORM
  const orms = [];
  if (allDeps.typeorm || allDeps["@nestjs/typeorm"]) orms.push("TypeORM");
  if (allDeps["@prisma/client"]) orms.push("Prisma");
  if (allDeps["@mikro-orm/core"]) orms.push("MikroORM");
  if (allDeps.sequelize || allDeps["@nestjs/sequelize"]) orms.push("Sequelize");
  if (allDeps.mongoose || allDeps["@nestjs/mongoose"]) orms.push("Mongoose");
  if (orms.length > 0) facts.push(`ORM: ${orms.join(", ")}`);

  // TypeScript
  if (allDeps.typescript) facts.push(`TypeScript: ${allDeps.typescript}`);

  // 构建/运行
  if (allDeps["@swc/core"]) {
    facts.push("编译: SWC");
  } else {
    facts.push("编译: tsc (默认)");
  }

  // 测试框架
  if (allDeps.jest || allDeps["@nestjs/testing"]) facts.push("测试: Jest");
  if (allDeps.vitest) facts.push("测试: Vitest");

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[NestJS Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
