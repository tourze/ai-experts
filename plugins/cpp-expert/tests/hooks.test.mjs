import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { run as runDebugGuard } from "../hooks/post-tool-use/edit-write/debug-statement-guard.mjs";
import { run as runEncodingGuard } from "../hooks/post-tool-use/edit-write/encoding-guard.mjs";
import { run as runFileBudgetGuard } from "../hooks/post-tool-use/edit-write/file-budget-guard.mjs";

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "cpp-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function payload(filePath, extra = {}) {
  return { tool_input: { file_path: filePath, ...extra } };
}

test("encoding-guard 正确识别 UTF-32 LE BOM", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "CMakeLists.txt");
    writeFileSync(filePath, Buffer.from([0xff, 0xfe, 0x00, 0x00, 0x41]));

    const result = await runEncodingGuard(payload(filePath));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /UTF-32 LE BOM/);
  });
});

test("encoding-guard 会检查 .clang-tidy 这类命名文件", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, ".clang-tidy");
    writeFileSync(filePath, Buffer.from([0xef, 0xbb, 0xbf, 0x41]));

    const result = await runEncodingGuard(payload(filePath));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /UTF-8 BOM/);
  });
});

test("debug-statement-guard 只检查 C/C++ 文件", async () => {
  await withTempDir(async (dir) => {
    const pyPath = join(dir, "script.py");
    writeFileSync(pyPath, "print('debug')\n", "utf8");
    assert.equal(await runDebugGuard(payload(pyPath)), null);

    const cppPath = join(dir, "main.cpp");
    writeFileSync(cppPath, "printf(\"debug value=%d\", value);\n", "utf8");
    const result = await runDebugGuard(
      payload(cppPath, {
        old_string: "",
        new_string: "printf(\"debug value=%d\", value);\n",
      }),
    );
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /printf/);
  });
});

test("debug-statement-guard 跳过测试文件", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "foo_test.cpp");
    writeFileSync(filePath, "printf(\"debug\");\n", "utf8");

    assert.equal(
      await runDebugGuard(
        payload(filePath, {
          old_string: "",
          new_string: "printf(\"debug\");\n",
        }),
      ),
      null,
    );
  });
});

test("file-budget-guard 不会把末尾换行误算成额外一行", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "budget.hpp");
    const content = `${Array.from({ length: 500 }, (_, i) => `int v${i};`).join("\n")}\n`;
    writeFileSync(filePath, content, "utf8");

    assert.equal(await runFileBudgetGuard(payload(filePath)), null);
  });
});
