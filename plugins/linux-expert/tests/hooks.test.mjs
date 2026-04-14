import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { run as runDebugStatementGuard } from "../hooks/post-tool-use/edit-write/debug-statement-guard.mjs";
import { run as runEncodingGuard } from "../hooks/post-tool-use/edit-write/encoding-guard.mjs";
import { run as runFileBudgetGuard } from "../hooks/post-tool-use/edit-write/file-budget-guard.mjs";
import { run as runLintShellcheck } from "../hooks/post-tool-use/edit-write/lint-shellcheck.mjs";

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "linux-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function filePayload(filePath) {
  return { tool_input: { file_path: filePath } };
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

test("lint-shellcheck 会阻止缺少 set -euo pipefail 的新脚本", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "deploy.sh");
    writeFileSync(filePath, "#!/usr/bin/env bash\necho ok\n", "utf-8");

    const result = await runLintShellcheck(filePayload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /set -euo pipefail/);
  });
});

test("file-budget-guard 会阻止超过预算的新 shell 文件", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "too-long.sh");
    writeFileSync(filePath, `${"echo x\n".repeat(301)}`, "utf-8");

    const result = await runFileBudgetGuard(filePayload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /新文件必须在预算内/);
  });
});

test("debug-statement-guard 会报告新增的 set -x", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "trace.sh");
    writeFileSync(filePath, "#!/usr/bin/env bash\nset -x\necho ok\n", "utf-8");

    const result = await runDebugStatementGuard(filePayload(filePath));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /set -x/);
  });
});
