import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { run as runDebugGuard } from "../hooks/post-tool-use/edit-write/debug-statement-guard.mjs";

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
