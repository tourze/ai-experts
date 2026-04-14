import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { run as runDebugStatementGuard } from "../hooks/post-tool-use/edit-write/debug-statement-guard.mjs";
import { run as runEncodingGuard } from "../hooks/post-tool-use/edit-write/encoding-guard.mjs";
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

test("encoding-guard 会检查 .env.local 这类点文件", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, ".env.local");
    writeFileSync(filePath, Buffer.from([0xef, 0xbb, 0xbf, 0x41]));

    const result = await runEncodingGuard(payload(filePath));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /UTF-8 BOM/);
  });
});

test("encoding-guard 优先识别 UTF-32 LE BOM", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "config.txt");
    writeFileSync(filePath, Buffer.from([0xff, 0xfe, 0x00, 0x00, 0x41]));

    const result = await runEncodingGuard(payload(filePath));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /UTF-32 LE BOM/);
  });
});

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

test("debug-statement-guard 会报告新增的 System.out.println", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "Demo.java");
    writeFileSync(filePath, "class Demo {\n  void print() {\n    System.out.println(\"debug\");\n  }\n}\n", "utf8");

    const result = await runDebugStatementGuard(payload(filePath, {
      old_string: "",
      new_string: "class Demo {\n  void print() {\n    System.out.println(\"debug\");\n  }\n}\n",
    }));

    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /System\.out\.print/);
  });
});
