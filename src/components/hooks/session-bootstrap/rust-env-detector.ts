import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export const rustEnvDetectorHook = defineHook({
  id: "rust-env-detector",
  description: "检测 Rust 项目的 edition、workspace 结构与工具链配置。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./rust-env-detector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * env-detector (SessionStart) — 探测 Rust 项目环境
 *
 * 检测 Cargo.toml 的 edition、workspace 结构与工具链，
 * 帮助 Claude 从第一条消息起就使用正确的 Rust 版本和项目布局。
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

function readText(p: string) {
  try {
    return readFileSync(p, "utf-8").trim();
  } catch {
    return "";
  }
}

export async function run(payload: LegacyHookPayload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  const cargoPath = findUp("Cargo.toml", cwd);
  if (!cargoPath) return null;

  const content = readText(cargoPath);
  if (!content) return null;

  const facts = [];

  // 项目名
  const nameMatch = content.match(/^name\s*=\s*"([^"]+)"/m);
  if (nameMatch) facts.push(`项目名: ${nameMatch[1]}`);

  // edition
  const editionMatch = content.match(/^edition\s*=\s*"([^"]+)"/m);
  if (editionMatch) facts.push(`edition: ${editionMatch[1]}`);

  // workspace 检测
  if (content.includes("[workspace]")) {
    const membersMatch = content.match(/members\s*=\s*\[([\s\S]*?)\]/);
    if (membersMatch) {
      const members = membersMatch[1].match(/"([^"]+)"/g);
      const count = members ? members.length : 0;
      facts.push(`workspace: ${count} 个成员`);
    } else {
      facts.push("workspace: 是");
    }
  }

  // rust-toolchain.toml
  const projectRoot = dirname(cargoPath);
  const toolchainPath = join(projectRoot, "rust-toolchain.toml");
  if (existsSync(toolchainPath)) {
    const tc = readText(toolchainPath);
    const channelMatch = tc.match(/channel\s*=\s*"([^"]+)"/);
    if (channelMatch) facts.push(`toolchain: ${channelMatch[1]}`);
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Rust Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
