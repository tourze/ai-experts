/**
 * cleanup-legacy 专属回归测试
 *
 * 覆盖之前只靠 install-script 旁路触发的高危改写路径：
 *   - history.jsonl 含 ai-experts namespaced 调用片段时被 rewrite
 *   - codex 进程在跑时拒绝 rewrite history.jsonl，并以 exit code 2 报错
 *   - --dry-run 不实际写盘
 *   - 无残留时静默退出（除非 --verbose）
 *
 * 通过 PATH 注入 fake `pgrep` / `claude` / `codex` 二进制，通过 CODEX_HOME
 * 隔离用户目录。
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(".");
const cleanupScript = join(repoRoot, "scripts/cleanup-legacy.mjs");

function writeExecutable(path, content) {
  writeFileSync(path, content, "utf-8");
  chmodSync(path, 0o755);
}

/**
 * @param {{ pgrepExit?: number, claudeListJson?: string }} opts
 */
function makeSandbox(opts = {}) {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-cleanup-"));
  const binDir = join(tmp, "bin");
  const codexHome = join(tmp, "codex-home");
  mkdirSync(binDir);
  mkdirSync(codexHome);
  symlinkSync(process.execPath, join(binDir, "node"));

  // pgrep -x codex：默认 exit 1 + 无输出（无进程）；测试可指定 exit 0 + 输出
  // PID 模拟 "codex 在跑"。cleanup-legacy 的 codexIsRunning() 用 stdout 判活
  // 而非 exit code，所以两者必须同步。
  const pgrepExit = typeof opts.pgrepExit === "number" ? opts.pgrepExit : 1;
  const pgrepOut = pgrepExit === 0 ? "12345" : "";
  writeExecutable(
    join(binDir, "pgrep"),
    `#!/usr/bin/env bash\necho '${pgrepOut}'\nexit ${pgrepExit}\n`,
  );

  // claude plugin list --json：默认空数组（无 marketplace 残留）
  const claudeListJson = opts.claudeListJson ?? "[]";
  writeExecutable(
    join(binDir, "claude"),
    `#!/usr/bin/env bash\nif [ "$1" = "plugin" ] && [ "$2" = "list" ]; then\n  echo '${claudeListJson}'\n  exit 0\nfi\nexit 0\n`,
  );
  // codex 二进制本身在 cleanup-legacy 中不会被调用（只用 pgrep 探测进程），
  // 但保留 fake 以防未来增加调用路径。
  writeExecutable(join(binDir, "codex"), `#!/usr/bin/env bash\nexit 0\n`);

  return { tmp, binDir, codexHome };
}

function runCleanup(env, args = []) {
  return spawnSync(process.execPath, [cleanupScript, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      CODEX_HOME: env.codexHome,
      PATH: `${env.binDir}:/usr/bin:/bin`,
    },
    encoding: "utf-8",
  });
}

test("cleanup-legacy 改写 history.jsonl 中的 ai-experts namespaced 调用", () => {
  const env = makeSandbox();
  try {
    const histPath = join(env.codexHome, "history.jsonl");
    const lines = [
      JSON.stringify({ id: 1, text: "请用 $product-expert:create-prd 来生成需求文档" }),
      JSON.stringify({ id: 2, text: "无关 prompt，不应被改写" }),
      JSON.stringify({ id: 3, text: "$marketing-expert:copywriting 写文案" }),
    ];
    writeFileSync(histPath, lines.join("\n") + "\n", "utf-8");

    const r = runCleanup(env, ["--target=codex"]);
    assert.equal(r.status, 0, `cleanup 应正常退出，实际 stdout=${r.stdout} stderr=${r.stderr}`);

    const after = readFileSync(histPath, "utf-8").trim().split("\n").map((l) => JSON.parse(l));
    assert.equal(after[0].text, "请用 $create-prd 来生成需求文档");
    assert.equal(after[1].text, "无关 prompt，不应被改写");
    assert.equal(after[2].text, "$copywriting 写文案");
  } finally {
    rmSync(env.tmp, { recursive: true, force: true });
  }
});

test("cleanup-legacy 在 codex 进程在跑时拒绝改写并以 exit 2 报错", () => {
  const env = makeSandbox({ pgrepExit: 0 });
  try {
    const histPath = join(env.codexHome, "history.jsonl");
    const original = JSON.stringify({ id: 1, text: "$product-expert:create-prd" }) + "\n";
    writeFileSync(histPath, original, "utf-8");

    const r = runCleanup(env, ["--target=codex"]);
    assert.equal(r.status, 2, `期望 exit 2，实际 ${r.status}; stdout=${r.stdout}`);
    assert.match(r.stderr, /Codex 进程在运行|拒绝/);
    assert.equal(readFileSync(histPath, "utf-8"), original, "拒绝改写时文件必须保持原状");
  } finally {
    rmSync(env.tmp, { recursive: true, force: true });
  }
});

test("cleanup-legacy --dry-run 不实际写入 history.jsonl", () => {
  const env = makeSandbox();
  try {
    const histPath = join(env.codexHome, "history.jsonl");
    const original = JSON.stringify({ id: 1, text: "$product-expert:create-prd" }) + "\n";
    writeFileSync(histPath, original, "utf-8");

    const r = runCleanup(env, ["--target=codex", "--dry-run"]);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /would: 在.*改写 1 条/);
    assert.equal(readFileSync(histPath, "utf-8"), original, "dry-run 必须保持文件原状");
  } finally {
    rmSync(env.tmp, { recursive: true, force: true });
  }
});

test("cleanup-legacy 无残留时静默退出", () => {
  const env = makeSandbox();
  try {
    // 故意不创建 history.jsonl / config.toml / cache 目录
    const r = runCleanup(env, ["--target=codex"]);
    assert.equal(r.status, 0);
    // 默认非 verbose：应无主业务输出（仅可能有 spawn 杂音）
    assert.doesNotMatch(r.stdout, /清理旧版|rewrote|stripped/);
  } finally {
    rmSync(env.tmp, { recursive: true, force: true });
  }
});

test("cleanup-legacy 改写 history 后保留非 JSON 行原样", () => {
  const env = makeSandbox();
  try {
    const histPath = join(env.codexHome, "history.jsonl");
    const lines = [
      JSON.stringify({ id: 1, text: "$product-expert:create-prd" }),
      "", // 空行应保留
      "this is not valid json", // 非法 JSON 应保留
      JSON.stringify({ id: 2, text: "$marketing-expert:copywriting" }),
    ];
    writeFileSync(histPath, lines.join("\n") + "\n", "utf-8");

    const r = runCleanup(env, ["--target=codex"]);
    assert.equal(r.status, 0);
    const after = readFileSync(histPath, "utf-8").split("\n");
    assert.equal(after[1], "");
    assert.equal(after[2], "this is not valid json");
  } finally {
    rmSync(env.tmp, { recursive: true, force: true });
  }
});

test("cleanup-legacy --target=codex 跳过 Claude Code 端", () => {
  const env = makeSandbox();
  try {
    // 让 claude plugin list 返回非空，模拟有 cc 端残留
    const env2 = makeSandbox({ claudeListJson: '[{"id":"foo@ai-experts","scope":"user"}]' });
    try {
      const r = runCleanup(env2, ["--target=codex"]);
      assert.equal(r.status, 0);
      // 因为只 target codex，不应触发 claude plugin uninstall
      assert.doesNotMatch(r.stdout, /claude plugin uninstall/);
    } finally {
      rmSync(env2.tmp, { recursive: true, force: true });
    }
  } finally {
    rmSync(env.tmp, { recursive: true, force: true });
  }
});
