import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { run as runSyntaxJava } from "../hooks/post-tool-use/edit-write/syntax-java.mjs";

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "java-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function withPath(dir, fn) {
  const originalPath = process.env.PATH;
  process.env.PATH = dir;
  try {
    return await fn();
  } finally {
    process.env.PATH = originalPath;
  }
}

function payload(filePath, extraToolInput = {}) {
  return {
    tool_input: {
      file_path: filePath,
      ...extraToolInput,
    },
  };
}

test("syntax-java 在 javac 不可用时会回退到本地语法检查", async () => {
  await withTempDir(async (dir) => {
    const emptyBinDir = join(dir, "empty-bin");
    mkdirSync(emptyBinDir, { recursive: true });

    const filePath = join(dir, "Broken.java");
    writeFileSync(
      filePath,
      "class Broken {\n  String text = \"oops;\n}\n",
      "utf8",
    );

    await withPath(emptyBinDir, async () => {
      const result = await runSyntaxJava(payload(filePath));
      assert.equal(result?.decision, "block");
      assert.match(result?.reason ?? "", /未闭合的字符串字面量/);
    });
  });
});
