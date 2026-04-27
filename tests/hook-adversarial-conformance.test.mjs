/**
 * Hook 对抗测试覆盖率合规检查
 *
 * 确保每个 guard hook（产生 block/report 决策的 hook）在对应的
 * tests/hooks.test.mjs 中同时拥有：
 *   - 至少 1 个 block/report 正向用例（TP：该拦的能拦住）
 *   - 至少 1 个 must-pass 对抗用例（TN：不该拦的确实放行）
 *
 * TN 用例的识别规则：测试名中包含 "TN" 且包含该 guard 的名称前缀。
 *
 * 排除项：
 *   - _ 前缀工具模块或目录（如 _utils.mjs, _shared/）
 *   - session-start hooks（环境检测，不产生 block/report）
 *   - user-prompt-submit hooks（context 注入，不产生 block/report）
 *   - notification hooks
 *   - stop hooks
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { resolve, join, basename, dirname } from "node:path";
import test from "node:test";

const pluginsRoot = resolve("plugins");
const repoRoot = resolve(".");

// Hook 事件类型中，只有这些会产生 block/report 决策
const GUARD_EVENTS = ["pre-tool-use", "post-tool-use"];

// 不需要对抗测试的目录
const SKIP_DIRS = new Set(["session-start", "user-prompt-submit", "notification", "stop"]);

// plugin 目录的存在标记从 .claude-plugin/plugin.json（marketplace 时代）改为
// README.md。原过滤条件命中 0 文件后整个 for-of 循环零次执行，所有 TP/TN 检查
// 形同虚设。每个插件强制有 README.md（plugin-readme-conformance.test.mjs 自身
// 即验证此前提），用它兜底安全。
function getPluginRoots() {
  return execFileSync("git", ["ls-files", "plugins/*/README.md"], {
    cwd: repoRoot,
    encoding: "utf-8",
  })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => resolve(pluginsRoot, line.split("/")[1]))
    .sort();
}

const pluginRoots = getPluginRoots();

// 防漂移哨兵：如果 README.md pattern 再次失效（例如插件结构调整），让本测试
// 立刻红，而不是悄悄空跑。
test("hook-adversarial-conformance 能枚举到至少 1 个插件根（防再次空跑）", () => {
  assert.ok(
    pluginRoots.length > 0,
    "未能从 git 跟踪的 plugins/*/README.md 解析到任何插件，请检查 getPluginRoots()",
  );
});

/**
 * 递归查找某个 hooks/ 子目录下的所有 guard 文件。
 * 返回 { guardName, guardPath } 列表。
 */
function findGuards(hooksDir) {
  const guards = [];

  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith("_")) continue;
        walk(join(dir, entry.name));
      } else if (
        entry.name.endsWith(".mjs") &&
        !entry.name.startsWith("_") &&
        entry.name !== "dispatch.mjs"
      ) {
        guards.push({
          guardName: entry.name.replace(".mjs", ""),
          guardPath: join(dir, entry.name),
        });
      }
    }
  }

  walk(hooksDir);
  return guards;
}

/**
 * 从 hooks.test.mjs 中提取测试名称列表。
 */
function extractTestNames(testFilePath) {
  if (!existsSync(testFilePath)) return [];
  const content = readFileSync(testFilePath, "utf-8");
  const matches = [...content.matchAll(/test\(\s*["'`]([^"'`]+)["'`]/g)];
  return matches.map((m) => m[1]);
}

// ── 主测试 ───────────────────────────────────────────────

for (const pluginRoot of pluginRoots) {
  const pluginName = basename(pluginRoot);
  const hooksDir = join(pluginRoot, "hooks");
  if (!existsSync(hooksDir)) continue;

  const guards = findGuards(hooksDir);
  if (guards.length === 0) continue;

  const testFile = join(pluginRoot, "tests", "hooks.test.mjs");
  const testNames = extractTestNames(testFile);

  // coding-expert 是基座层，必须严格通过；其他插件渐进补齐，仅警告
  const isBaseLayer = pluginName === "coding-expert";

  for (const { guardName } of guards) {
    // 查找包含该 guard 名称的测试
    const relatedTests = testNames.filter((name) =>
      name.toLowerCase().includes(guardName.replace(/-/g, "-").toLowerCase()),
    );

    const hasTP = relatedTests.some((name) => !name.includes("TN"));
    const hasTN = relatedTests.some((name) => name.includes("TN"));

    test(`${pluginName}/${guardName} 应同时有 TP 和 TN 测试`, () => {
      if (relatedTests.length === 0) {
        // 无测试：基座层严格要求，其他层只警告
        if (isBaseLayer) {
          assert.fail(
            `${pluginName}/${guardName} 无任何测试，基座层 guard 必须有 TP + TN 测试`,
          );
        }
        return; // 其他插件暂无测试 → pass（允许渐进补齐）
      }

      if (isBaseLayer) {
        // 基座层严格检查
        if (!hasTP) {
          assert.fail(
            `${pluginName}/${guardName} 缺少正向测试（TP）：` +
            `至少需要一个验证 block/report 的用例`,
          );
        }
        if (!hasTN) {
          assert.fail(
            `${pluginName}/${guardName} 缺少对抗测试（TN）：` +
            `至少需要一个名称含 "TN" 的 must-pass 用例，验证正常输入不被误拦`,
          );
        }
      }
      // 非基座层：有测试但缺 TP/TN → 仅 pass（未来可收紧）
    });
  }
}
