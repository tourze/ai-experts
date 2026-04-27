import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGINS_DIR = join(ROOT, "plugins");
const README = join(ROOT, "README.md");

const SECTION_HEADING = "## 已声明的插件依赖";

// 允许语言层各自保留特化版的基座 guard。
// 与 README.md "插件层次结构" 段落口径一致：通用 file-budget / encoding /
// merge-conflict 等必须复用 coding-expert，仅 debug-statement 因不同语言
// 的"调试残留"语义差异保留语言专属版本。新增白名单条目必须在 README 同步
// 解释保留理由。
const COPY_ALLOWLIST = new Set(["debug-statement-guard.mjs"]);

// 基座插件名 — 当其他插件声明依赖它时，禁止在自己的 hooks/<event>/<sub>/
// 下复刻同名 guard 文件（白名单除外）。
const BASE_PLUGIN = "coding-expert";

function parseDependencyDeclarations() {
  const text = readFileSync(README, "utf8");
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.startsWith(SECTION_HEADING));
  if (start === -1) {
    throw new Error(`README.md 中未找到 \"${SECTION_HEADING}\" 段落`);
  }

  const declarations = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) break;
    const trimmed = line.trim();
    if (!trimmed.startsWith("- ")) continue;
    const match = trimmed.match(/^- ([\w-]+) → (.+)$/);
    if (!match) continue;
    declarations.push({
      plugin: match[1],
      deps: match[2].split(",").map((s) => s.trim()).filter(Boolean),
    });
  }
  return declarations;
}

const declarations = parseDependencyDeclarations();

function isPluginDir(name) {
  const path = join(PLUGINS_DIR, name);
  return existsSync(path) && statSync(path).isDirectory();
}

test("解析依赖段落至少识别到一条声明（防止格式漂移导致测试空过）", () => {
  assert.ok(
    declarations.length > 0,
    "未解析到任何依赖声明；可能 README 段落格式已变更，请同步本测试的解析逻辑"
  );
});

test("依赖声明里每个源插件都存在于 plugins/", () => {
  for (const { plugin } of declarations) {
    assert.ok(
      isPluginDir(plugin),
      `依赖声明里的源插件 ${plugin} 不存在于 plugins/`
    );
  }
});

test("依赖声明里每个目标插件都存在于 plugins/", () => {
  for (const { plugin, deps } of declarations) {
    for (const dep of deps) {
      assert.ok(
        isPluginDir(dep),
        `${plugin} 声明依赖 ${dep}，但 plugins/${dep}/ 不存在`
      );
    }
  }
});

test("依赖关系无自指（不会出现 X → X）", () => {
  for (const { plugin, deps } of declarations) {
    assert.ok(
      !deps.includes(plugin),
      `${plugin} 声明依赖了自身`
    );
  }
});

// ── 循环检测 ───────────────────────────────────────────────
// 用 Tarjan-lite DFS 在依赖图上找强连通分量；任何 size>1 的 SCC 都意味着
// 存在循环依赖。size==1 的 SCC 仅在节点自指时才是循环（已被上一条用例覆盖）。
function buildAdjacency() {
  const adj = new Map();
  for (const { plugin, deps } of declarations) {
    adj.set(plugin, deps.slice());
  }
  return adj;
}

function findCycles(adj) {
  const cycles = [];
  const visited = new Set();
  const stack = new Set();
  const path = [];

  function dfs(node) {
    if (stack.has(node)) {
      const idx = path.indexOf(node);
      if (idx >= 0) cycles.push(path.slice(idx).concat(node));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    path.push(node);
    for (const next of adj.get(node) ?? []) {
      dfs(next);
    }
    path.pop();
    stack.delete(node);
  }

  for (const node of adj.keys()) dfs(node);
  return cycles;
}

test("依赖图无循环（DFS 检测）", () => {
  const cycles = findCycles(buildAdjacency());
  assert.equal(
    cycles.length,
    0,
    `检测到循环依赖：\n  ${cycles.map((c) => c.join(" → ")).join("\n  ")}`,
  );
});

// ── 传递闭包稳定性 ─────────────────────────────────────────
// 每个声明插件的传递闭包不仅必须可计算（findCycles 已保证无环故不会无限循环），
// 还必须满足"闭包内每个节点都对应到现实存在的插件目录"——这能在依赖目标被
// 改名 / 删除而 README 未同步时立即红，等价于"反断链"校验。
function transitiveClosure(plugin, adj) {
  const seen = new Set();
  const queue = [plugin];
  while (queue.length > 0) {
    const node = queue.shift();
    if (seen.has(node)) continue;
    seen.add(node);
    for (const next of adj.get(node) ?? []) queue.push(next);
  }
  return seen;
}

test("依赖图传递闭包稳定可计算且仅含已存在插件（无断链 / 无悬空依赖）", () => {
  const adj = buildAdjacency();
  for (const { plugin } of declarations) {
    let closure;
    assert.doesNotThrow(() => {
      closure = transitiveClosure(plugin, adj);
    }, `${plugin} 的传递闭包计算抛错`);

    assert.ok(closure.size >= 1, `${plugin} 的传递闭包应至少包含起点自身`);

    for (const node of closure) {
      assert.ok(
        isPluginDir(node),
        `${plugin} 的传递闭包包含不存在插件 ${node}（依赖目标被删除？）`,
      );
    }
  }
});

// ── 反向校验：声明依赖基座后不得复刻基座 guard ──────────────
// 收集 coding-expert/hooks/<event>/<sub>/<file>.mjs 的相对路径集合（去掉 _ 前缀
// 工具模块）。任何已声明依赖 coding-expert（直接或传递）的插件，其 hooks/ 下
// 出现同相对路径的 guard 文件 = 违反 "复用基座，不复制" 原则。
function listGuardRelPaths(pluginRoot) {
  const hooksRoot = join(pluginRoot, "hooks");
  if (!existsSync(hooksRoot)) return [];
  const out = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith("_")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".mjs") && entry.name !== "dispatch.mjs") {
        out.push(relative(hooksRoot, full));
      }
    }
  }
  walk(hooksRoot);
  return out;
}

function dependsOnBase(plugin, adj) {
  const seen = new Set();
  const queue = [plugin];
  while (queue.length > 0) {
    const node = queue.shift();
    if (seen.has(node)) continue;
    seen.add(node);
    if (node === BASE_PLUGIN) return true;
    for (const next of adj.get(node) ?? []) queue.push(next);
  }
  return false;
}

test(`声明依赖 ${BASE_PLUGIN} 的插件不应在自己的 hooks/ 下复刻基座 guard（白名单：${[...COPY_ALLOWLIST].join(", ")}）`, () => {
  const adj = buildAdjacency();
  const baseRoot = join(PLUGINS_DIR, BASE_PLUGIN);
  const baseGuards = new Set(listGuardRelPaths(baseRoot));
  const violations = [];

  for (const { plugin } of declarations) {
    if (plugin === BASE_PLUGIN) continue;
    if (!dependsOnBase(plugin, adj)) continue;

    const pluginRoot = join(PLUGINS_DIR, plugin);
    for (const rel of listGuardRelPaths(pluginRoot)) {
      if (!baseGuards.has(rel)) continue;
      const fileName = rel.split(/[\\/]/).pop();
      if (COPY_ALLOWLIST.has(fileName)) continue;
      violations.push(`${plugin} :: hooks/${rel} 与基座 ${BASE_PLUGIN} 同路径同名，应复用基座而不是复刻`);
    }
  }

  assert.equal(
    violations.length,
    0,
    `检测到基座 guard 复刻违例：\n  ${violations.join("\n  ")}`,
  );
});
