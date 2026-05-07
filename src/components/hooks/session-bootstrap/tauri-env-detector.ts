import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const tauriEnvDetectorHook = defineHook({
  id: "tauri-env-detector",
  description: "检测 Tauri 项目的版本、应用标识、前端框架与构建目标。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./tauri-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * env-detector (SessionStart) — Tauri 项目环境探测
 *
 * 检测 Tauri 版本（v1 / v2）、应用标识、前端框架与 Rust 依赖，
 * 帮助 Claude 从第一条消息起就使用正确的 Tauri API 和配置路径。
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

function readText(p: string) {
  try {
    return readFileSync(p, "utf-8").trim();
  } catch {
    return "";
  }
}

export async function run(payload: NormalizedHookPayload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  // 定位 tauri.conf.json（v2: src-tauri/tauri.conf.json）
  const confPath =
    findUp("src-tauri/tauri.conf.json", cwd) ||
    findUp("tauri.conf.json", cwd);
  if (!confPath) return null;

  const conf = readJSON(confPath);
  if (!conf) return null;

  const tauriRoot = dirname(confPath);
  const projectRoot = dirname(tauriRoot.endsWith("src-tauri") ? tauriRoot : confPath);
  const facts = [];

  // Tauri 版本（从 Cargo.toml 的 tauri 依赖推断）
  const cargoPath = join(tauriRoot, "Cargo.toml");
  if (existsSync(cargoPath)) {
    const cargo = readText(cargoPath);
    const tauriVer = cargo.match(/tauri\s*=\s*\{[^}]*version\s*=\s*"([^"]+)"/);
    if (tauriVer) {
      const major = tauriVer[1].startsWith("2") ? "v2" : "v1";
      facts.push(`Tauri: ${major} (${tauriVer[1]})`);
    } else {
      const simpleDep = cargo.match(/tauri\s*=\s*"([^"]+)"/);
      if (simpleDep) {
        const major = simpleDep[1].startsWith("2") ? "v2" : "v1";
        facts.push(`Tauri: ${major} (${simpleDep[1]})`);
      }
    }
  }

  // 应用标识
  const identifier =
    conf.identifier ||                    // v2
    conf.tauri?.bundle?.identifier;        // v1
  if (identifier) facts.push(`标识: ${identifier}`);

  // 应用名
  const appName =
    conf.productName ||                    // v2
    conf.package?.productName;             // v1
  if (appName) facts.push(`应用名: ${appName}`);

  // 前端框架（从项目根 package.json 检测）
  const pkgPath = join(projectRoot, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = readJSON(pkgPath);
    if (pkg) {
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      const fw = [];
      if (allDeps.react) fw.push(`React ${allDeps.react}`);
      if (allDeps.vue) fw.push(`Vue ${allDeps.vue}`);
      if (allDeps.svelte) fw.push("Svelte");
      if (allDeps["solid-js"]) fw.push("Solid");
      if (fw.length > 0) facts.push(`前端: ${fw.join(", ")}`);
    }
  }

  // 构建目标（v2 bundle targets）
  const targets =
    conf.bundle?.targets ||               // v2
    conf.tauri?.bundle?.targets;           // v1
  if (Array.isArray(targets) && targets.length > 0) {
    facts.push(`打包目标: ${targets.join(", ")}`);
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Tauri Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
