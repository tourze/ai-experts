import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const reactNextjsEnvDetectorHook = defineHook({
  id: "react-nextjs-env-detector",
  description: "检测 Next.js 项目的版本、路由模式、部署目标与关键配置。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./react-nextjs-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * env-detector (SessionStart) — Next.js 项目环境探测
 *
 * 检测 Next.js 版本、路由模式（App Router / Pages Router）、部署目标与关键配置，
 * 帮助 Claude 从第一条消息起就使用正确的 API 和约定。
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

function dirExists(p) {
  try {
    return readdirSync(p).length >= 0;
  } catch {
    return false;
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
  if (!allDeps.next) return null;

  const projectRoot = dirname(pkgPath);
  const facts = [];

  // Next.js 版本
  facts.push(`Next.js: ${allDeps.next}`);

  // 路由模式检测
  const hasAppDir =
    dirExists(join(projectRoot, "app")) ||
    dirExists(join(projectRoot, "src/app"));
  const hasPagesDir =
    dirExists(join(projectRoot, "pages")) ||
    dirExists(join(projectRoot, "src/pages"));
  if (hasAppDir && hasPagesDir) {
    facts.push("路由: App Router + Pages Router (混合)");
  } else if (hasAppDir) {
    facts.push("路由: App Router");
  } else if (hasPagesDir) {
    facts.push("路由: Pages Router");
  }

  // React 版本
  if (allDeps.react) facts.push(`React: ${allDeps.react}`);

  // TypeScript
  if (allDeps.typescript) facts.push(`TypeScript: ${allDeps.typescript}`);

  // 部署目标
  if (existsSync(join(projectRoot, "vercel.json"))) {
    facts.push("部署: Vercel");
  } else if (existsSync(join(projectRoot, "netlify.toml"))) {
    facts.push("部署: Netlify");
  }

  // next.config 类型
  for (const cfg of ["next.config.ts", "next.config.mjs", "next.config.js"]) {
    if (existsSync(join(projectRoot, cfg))) {
      facts.push(`配置文件: ${cfg}`);
      break;
    }
  }

  // 关键依赖
  const notable = [];
  if (allDeps["next-auth"] || allDeps["@auth/nextjs"]) notable.push("NextAuth");
  if (allDeps.prisma || allDeps["@prisma/client"]) notable.push("Prisma");
  if (allDeps.drizzle || allDeps["drizzle-orm"]) notable.push("Drizzle");
  if (allDeps.tailwindcss) notable.push("Tailwind CSS");
  if (allDeps.trpc || allDeps["@trpc/server"]) notable.push("tRPC");
  if (notable.length > 0) facts.push(`关键库: ${notable.join(", ")}`);

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Next.js Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
