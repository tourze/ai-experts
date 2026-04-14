import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { run as runEncodingGuard } from "../hooks/post-tool-use/edit-write/encoding-guard.mjs";
import { run as runTestOutputTruncationGuard } from "../hooks/pre-tool-use/bash/test-output-truncation-guard.mjs";

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "php-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function filePayload(filePath) {
  return { tool_input: { file_path: filePath } };
}

function commandPayload(command) {
  return { tool_input: { command } };
}

test("encoding-guard 会检查 .env.local 这类点文件", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, ".env.local");
    writeFileSync(filePath, Buffer.from([0xEF, 0xBB, 0xBF, 0x41]));

    const result = await runEncodingGuard(filePayload(filePath));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /UTF-8 BOM/);
  });
});

test("test-output-truncation-guard 会报告 pest \\| tail -2", async () => {
  const result = await runTestOutputTruncationGuard(commandPayload("./vendor/bin/pest | tail -2"));
  assert.equal(result?.decision, "report");
  assert.match(result?.reason ?? "", /tail\/head -2/);
});

test("test-output-truncation-guard 允许 tail -1 摘要", async () => {
  const result = await runTestOutputTruncationGuard(commandPayload("./vendor/bin/phpunit | tail -1"));
  assert.equal(result, null);
});

test("dispatch 对空 stdin fail-open", () => {
  const result = spawnSync("node", ["hooks/dispatch.mjs", "post-tool-use/edit-write"], {
    cwd: resolve("plugins/php-expert"),
    encoding: "utf-8",
    input: "",
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "");
});

test("dispatch 对非法 JSON 输出 report 而不是崩溃", () => {
  const result = spawnSync("node", ["hooks/dispatch.mjs", "post-tool-use/edit-write"], {
    cwd: resolve("plugins/php-expert"),
    encoding: "utf-8",
    input: "{not-json",
  });

  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.decision, "report");
  assert.match(payload.reason, /stdin 不是合法 JSON/);
});
