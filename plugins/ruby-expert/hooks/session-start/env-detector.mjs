/**
 * env-detector (SessionStart) — 探测 Ruby 项目环境
 *
 * 检测 Ruby 版本、Bundler 与 Rails 框架，
 * 帮助 Claude 从第一条消息起就使用正确的 gem 命令和框架约定。
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

  const gemfile = findUp("Gemfile", cwd);
  const rubyVer = findUp(".ruby-version", cwd);

  if (!gemfile && !rubyVer) return null;

  const facts = [];

  // Ruby 版本
  if (rubyVer) {
    const ver = readText(rubyVer);
    if (ver) facts.push(`Ruby 版本: ${ver}`);
  }

  // Gemfile 分析
  if (gemfile) {
    facts.push("包管理: Bundler");
    const content = readText(gemfile);

    // Ruby 版本约束 (Gemfile 内)
    if (!rubyVer) {
      const rubyMatch = content.match(/^ruby\s+['"]([^'"]+)/m);
      if (rubyMatch) facts.push(`Ruby 版本约束: ${rubyMatch[1]}`);
    }

    // Rails
    const railsMatch = content.match(/gem\s+['"]rails['"](?:\s*,\s*['"]([^'"]+))?/);
    if (railsMatch) {
      facts.push(`框架: Rails${railsMatch[1] ? " " + railsMatch[1] : ""}`);
    }

    // Sinatra
    if (!railsMatch && content.includes("sinatra")) {
      facts.push("框架: Sinatra");
    }

    // Gemfile.lock 存在性
    const projectRoot = dirname(gemfile);
    if (existsSync(join(projectRoot, "Gemfile.lock"))) {
      facts.push("Gemfile.lock: 有");
    }
  }

  if (facts.length === 0) return null;

  return {
    decision: "context",
    reason: [
      "[Ruby Env] 项目环境探测",
      "",
      ...facts.map((f) => `  ${f}`),
    ].join("\n"),
  };
}
