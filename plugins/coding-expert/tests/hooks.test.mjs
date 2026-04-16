import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { run as runFileBudgetGuard } from "../hooks/post-tool-use/edit-write/file-budget-guard.mjs";

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "coding-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function payload(filePath) {
  return { tool_input: { file_path: filePath } };
}

test("file-budget-guard 不会把末尾换行误算成额外一行", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "budget.hpp");
    const content = `${Array.from({ length: 500 }, (_, i) => `int v${i};`).join("\n")}\n`;
    writeFileSync(filePath, content, "utf8");

    assert.equal(await runFileBudgetGuard(payload(filePath)), null);
  });
});

test("file-budget-guard 会阻止超过预算的新 shell 文件", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "too-long.sh");
    writeFileSync(filePath, "echo x\n".repeat(301), "utf8");

    const result = await runFileBudgetGuard(payload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /新文件必须在预算内/);
  });
});

test("file-budget-guard 会识别 CMakeLists.txt 的命名预算", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "CMakeLists.txt");
    writeFileSync(filePath, "set(VAR ON)\n".repeat(301), "utf8");

    const result = await runFileBudgetGuard(payload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /预算: 300 行/);
  });
});

test("file-budget-guard 会识别 Ruby 命名文件预算", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "Rakefile");
    const content = `${Array.from({ length: 300 }, (_, i) => `task :job_${i}`).join("\n")}\n`;
    writeFileSync(filePath, content, "utf8");

    assert.equal(await runFileBudgetGuard(payload(filePath)), null);
  });
});

test("file-budget-guard 会识别 Perl 命名文件预算", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "Build.PL");
    writeFileSync(filePath, "print \"ok\";\n".repeat(301), "utf8");

    const result = await runFileBudgetGuard(payload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /预算: 300 行/);
  });
});
