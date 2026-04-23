import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/rust-expert");
const dispatchSource = resolve(pluginRoot, "hooks/dispatch.mjs");

function withTempDispatch(fn) {
  const root = mkdtempSync(join(tmpdir(), "rust-dispatch-"));
  const hooksRoot = join(root, "hooks");
  mkdirSync(hooksRoot, { recursive: true });
  writeFileSync(join(hooksRoot, "dispatch.mjs"), readFileSync(dispatchSource, "utf-8"));

  try {
    return fn(hooksRoot);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("dispatch 对不存在的 hook 子目录直接退出", () => {
  withTempDispatch((hooksRoot) => {
    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "not-found"], {
      cwd: pluginRoot,
      input: "",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), "");
  });
});

test("dispatch 对越界子目录返回 report", () => {
  withTempDispatch((hooksRoot) => {
    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "../outside"], {
      cwd: pluginRoot,
      input: "",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.decision, "report");
    assert.match(output.reason, /非法 hook 子目录/);
  });
});

test("dispatch 在空 stdin 下不崩溃", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "post-tool-use", "edit-write");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(join(hookDir, "noop.mjs"), "export async function run() { return null; }\n", "utf-8");

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "post-tool-use/edit-write"], {
      cwd: pluginRoot,
      input: "",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), "");
  });
});

test("dispatch 在非法 JSON stdin 下返回 report", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "post-tool-use", "edit-write");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(join(hookDir, "noop.mjs"), "export async function run() { return null; }\n", "utf-8");

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "post-tool-use/edit-write"], {
      cwd: pluginRoot,
      input: "{not-json",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.decision, "report");
    assert.match(output.reason, /stdin 不是合法 JSON/);
  });
});

test("dispatch 优先输出 block 并终止后续聚合", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "post-tool-use", "edit-write");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(
      join(hookDir, "a-report.mjs"),
      "export async function run() { return { decision: 'report', reason: 'report-a' }; }\n",
      "utf-8",
    );
    writeFileSync(
      join(hookDir, "b-block.mjs"),
      "export async function run() { return { decision: 'block', reason: 'stop-now' }; }\n",
      "utf-8",
    );
    writeFileSync(
      join(hookDir, "c-report.mjs"),
      "export async function run() { return { decision: 'report', reason: 'report-c' }; }\n",
      "utf-8",
    );

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "post-tool-use/edit-write"], {
      cwd: pluginRoot,
      input: "{}",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.decision, "block");
    assert.equal(output.reason, "stop-now");
  });
});

test("dispatch 会把 apply_patch Add File 标准化为 file_path", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "pre-tool-use", "edit-write");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(
      join(hookDir, "path-report.mjs"),
      "export async function run(payload) { return { decision: 'report', reason: `path=${payload?.tool_input?.file_path ?? 'none'}` }; }\n",
      "utf-8",
    );

    const patch = [
      "*** Begin Patch",
      "*** Add File: src/new-file.ts",
      "+export const ok = true;",
      "*** End Patch",
      "",
    ].join("\n");

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "pre-tool-use/edit-write"], {
      cwd: pluginRoot,
      input: JSON.stringify({ tool_name: "apply_patch", tool_input: patch }),
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.decision, "report");
    assert.match(output.reason, /path=src\/new-file\.ts/);
  });
});

test("dispatch 会对 apply_patch 多文件逐个执行 hooks", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "pre-tool-use", "edit-write");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(
      join(hookDir, "multi-file-guard.mjs"),
      [
        "export async function run(payload) {",
        "  const filePath = payload?.tool_input?.file_path ?? 'none';",
        "  if (filePath.endsWith('.env')) {",
        "    return { decision: 'block', reason: `blocked=${filePath}` };",
        "  }",
        "  return { decision: 'report', reason: `seen=${filePath}` };",
        "}",
        "",
      ].join("\n"),
      "utf-8",
    );

    const patch = [
      "*** Begin Patch",
      "*** Update File: src/app.ts",
      "@@",
      "-export const app = 1;",
      "+export const app = 2;",
      "*** Add File: .env",
      "+OPENAI_API_KEY=sk-test",
      "*** End Patch",
      "",
    ].join("\n");

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "pre-tool-use/edit-write"], {
      cwd: pluginRoot,
      input: JSON.stringify({ tool_name: "apply_patch", tool_input: patch }),
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.decision, "block");
    assert.match(output.reason, /blocked=\.env/);
  });
});
