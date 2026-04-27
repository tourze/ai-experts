import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { run as runDebugStatementGuard } from "../hooks/post-tool-use/edit-write/debug-statement-guard.mjs";
import { run as runSuppressionGuard } from "../hooks/post-tool-use/edit-write/suppression-guard.mjs";
import { run as runFileBudgetGuard } from "../hooks/post-tool-use/edit-write/file-budget-guard.mjs";
import { run as runEditLoopDetector } from "../hooks/post-tool-use/edit-write/edit-loop-detector.mjs";
import { run as runMergeConflictGuard } from "../hooks/post-tool-use/edit-write/merge-conflict-guard.mjs";
import { run as runLargeEditChunkGuard } from "../hooks/post-tool-use/edit-write/large-edit-chunk-guard.mjs";
import { run as runEncodingGuard } from "../hooks/post-tool-use/edit-write/encoding-guard.mjs";
import { run as runMarkdownBudgetGuard } from "../hooks/post-tool-use/edit-write/markdown-budget-guard.mjs";
import { run as runSyntaxJson } from "../hooks/post-tool-use/edit-write/syntax-json.mjs";
import { run as runSyntaxXml } from "../hooks/post-tool-use/edit-write/syntax-xml.mjs";
import { run as runGarbledTextGuard } from "../hooks/pre-tool-use/edit-write/garbled-text-guard.mjs";
import { run as runDangerousCommandGuard } from "../hooks/pre-tool-use/bash/dangerous-command-guard.mjs";
import { run as runCatWriteGuard } from "../hooks/pre-tool-use/bash/cat-write-guard.mjs";
import { run as runSedInplaceGuard } from "../hooks/pre-tool-use/bash/sed-inplace-guard.mjs";
import { run as runErrorRetryGuard } from "../hooks/pre-tool-use/bash/error-retry-guard.mjs";
import { run as runCompactionStrategy } from "../hooks/pre-compact/compaction-strategy.mjs";

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "coding-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
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

function bashPayload(command) {
  return { tool_input: { command } };
}

// ════════════════════════════════════════════════════════════════
//  file-budget-guard — 正向测试（block / report）
// ════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════
//  file-budget-guard — 对抗测试（must-pass / TN）
// ════════════════════════════════════════════════════════════════

test("file-budget-guard TN: 500 行 .js 文件刚好在预算内不应拦截", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "exactly-budget.js");
    writeFileSync(filePath, "const x = 1;\n".repeat(500), "utf8");
    assert.equal(await runFileBudgetGuard(payload(filePath)), null);
  });
});

test("file-budget-guard TN: 无扩展名文件不纳管", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "Dockerfile");
    writeFileSync(filePath, "RUN echo ok\n".repeat(1000), "utf8");
    assert.equal(await runFileBudgetGuard(payload(filePath)), null);
  });
});

test("file-budget-guard TN: 测试文件享有 1200 行上限", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "feature.test.js");
    writeFileSync(filePath, "test('ok', () => {});\n".repeat(1200), "utf8");
    assert.equal(await runFileBudgetGuard(payload(filePath)), null);
  });
});

test("file-budget-guard TN: .md 文件不受行数预算约束", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "README.md");
    writeFileSync(filePath, "# Title\n".repeat(2000), "utf8");
    assert.equal(await runFileBudgetGuard(payload(filePath)), null);
  });
});

test("file-budget-guard TN: tests/ 目录下的文件享有测试预算", async () => {
  await withTempDir(async (dir) => {
    const testsDir = join(dir, "tests");
    mkdirSync(testsDir, { recursive: true });
    const filePath = join(testsDir, "big.py");
    writeFileSync(filePath, "assert True\n".repeat(1200), "utf8");
    assert.equal(await runFileBudgetGuard(payload(filePath)), null);
  });
});

// ════════════════════════════════════════════════════════════════
//  debug-statement-guard — 正向测试（block / report）
// ════════════════════════════════════════════════════════════════

test("debug-statement-guard 会报告新增的 System.out.println", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "Demo.java");
    const content = "class Demo {\n  void print() {\n    System.out.println(\"debug\");\n  }\n}\n";
    writeFileSync(filePath, content, "utf8");

    const result = await runDebugStatementGuard(
      payload(filePath, {
        old_string: "",
        new_string: content,
      }),
    );

    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /System\.out\.print/);
  });
});

test("debug-statement-guard 会阻止新增的 breakpoint()", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "worker.py");
    const content = "def main():\n    breakpoint()\n";
    writeFileSync(filePath, content, "utf8");

    const result = await runDebugStatementGuard(
      payload(filePath, {
        old_string: "",
        new_string: content,
      }),
    );

    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /breakpoint\(\)/);
  });
});

test("debug-statement-guard 会报告新增的 set -x", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "trace.sh");
    writeFileSync(filePath, "#!/usr/bin/env bash\nset -x\necho ok\n", "utf8");

    const result = await runDebugStatementGuard(payload(filePath));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /set -x/);
  });
});

test("debug-statement-guard 会跳过测试文件中的调试输出", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "demo.test.js");
    const content = "test('demo', () => {\n  console.log('ok');\n});\n";
    writeFileSync(filePath, content, "utf8");

    const result = await runDebugStatementGuard(
      payload(filePath, {
        old_string: "",
        new_string: content,
      }),
    );

    assert.equal(result, null);
  });
});

// ════════════════════════════════════════════════════════════════
//  debug-statement-guard — 对抗测试（must-pass / TN）
// ════════════════════════════════════════════════════════════════

test("debug-statement-guard TN: logger.info() 不应被当作调试语句", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "app.js");
    const content = "const logger = require('pino')();\nlogger.info('started');\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runDebugStatementGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result, null);
  });
});

test("debug-statement-guard TN: 注释中的 console.log 不应触发", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "utils.js");
    const content = "// console.log('debug info')\nfunction ok() { return 1; }\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runDebugStatementGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result, null);
  });
});

test("debug-statement-guard TN: hook 文件本身应被跳过", async () => {
  await withTempDir(async (dir) => {
    const hooksDir = join(dir, "hooks", "post-tool-use");
    mkdirSync(hooksDir, { recursive: true });
    const filePath = join(hooksDir, "my-guard.js");
    const content = "console.log('hook debug');\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runDebugStatementGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result, null);
  });
});

test("debug-statement-guard TN: 已存在的调试语句未新增不应触发", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "legacy.py");
    const existingCode = "print('hello')\ndef run():\n    pass\n";
    writeFileSync(filePath, existingCode, "utf8");
    // old_string 和 new_string 都包含 print → 净新增为 0
    const result = await runDebugStatementGuard(
      payload(filePath, { old_string: existingCode, new_string: existingCode }),
    );
    assert.equal(result, null);
  });
});

test("debug-statement-guard TN: 不认识的扩展名应跳过", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "config.toml");
    const content = "debug = true\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runDebugStatementGuard(payload(filePath));
    assert.equal(result, null);
  });
});

// ════════════════════════════════════════════════════════════════
//  suppression-guard — 正向测试（block）
// ════════════════════════════════════════════════════════════════

test("suppression-guard 会阻止新增的 // eslint-disable-next-line（无理由）", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "app.ts");
    const content = "// eslint-disable-next-line no-console\nconsole.log('debug');\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /eslint-disable/);
  });
});

test("suppression-guard 会阻止行尾 // eslint-disable-line（无理由）", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "app.js");
    const content = "const x = anyValue; // eslint-disable-line no-explicit-any\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result?.decision, "block");
  });
});

test("suppression-guard 会阻止块级 /* eslint-disable */（无理由）", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "legacy.ts");
    const content = "/* eslint-disable */\nexport const x = 1;\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result?.decision, "block");
  });
});

test("suppression-guard 会阻止新增的 @ts-ignore（无理由）", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "demo.ts");
    const content = "// @ts-ignore\nconst x: string = 1 as any;\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /@ts-ignore/);
  });
});

test("suppression-guard 会阻止新增的 @ts-expect-error（无理由）", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "demo.ts");
    const content = "// @ts-expect-error\nconst x: string = 1 as any;\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result?.decision, "block");
  });
});

test("suppression-guard 会阻止新增的 @ts-nocheck（无理由）", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "wholefile.ts");
    const content = "// @ts-nocheck\nexport const broken: number = 'str';\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /@ts-nocheck/);
  });
});

// ════════════════════════════════════════════════════════════════
//  suppression-guard — 放行测试（带 justification）
// ════════════════════════════════════════════════════════════════

test("suppression-guard 放行带 -- 原因 的 eslint-disable-next-line", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "cli.ts");
    const content = "// eslint-disable-next-line no-console -- CLI 入口需直接打印\nconsole.log('hi');\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result, null);
  });
});

test("suppression-guard 放行带冒号说明的 @ts-expect-error", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "compat.ts");
    const content = "// @ts-expect-error: 上游类型未导出，跟踪 issue #123\nconst x: string = 1 as any;\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result, null);
  });
});

test("suppression-guard 放行带全角冒号说明的 @ts-ignore", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "compat.ts");
    const content = "// @ts-ignore：第三方库 d.ts 缺失\nimport foo from 'legacy-pkg';\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result, null);
  });
});

// ════════════════════════════════════════════════════════════════
//  suppression-guard — 对抗测试（must-pass / TN）
// ════════════════════════════════════════════════════════════════

test("suppression-guard TN: 测试文件中的 disable 应跳过", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "feature.test.ts");
    const content = "// eslint-disable-next-line no-console\nconsole.log('test setup');\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result, null);
  });
});

test("suppression-guard TN: tests/ 目录下的 disable 应跳过", async () => {
  await withTempDir(async (dir) => {
    const testsDir = join(dir, "tests");
    mkdirSync(testsDir, { recursive: true });
    const filePath = join(testsDir, "fixture.ts");
    const content = "// @ts-ignore\nconst x: string = 1 as any;\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result, null);
  });
});

test("suppression-guard TN: 非 JS/TS 扩展名应跳过", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "notes.md");
    const content = "我在文档里写到 `// @ts-ignore` 这个用法\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result, null);
  });
});

test("suppression-guard TN: 已存在的 disable 未新增不应触发", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "legacy.ts");
    const existing = "// eslint-disable-next-line no-console\nconsole.log('hi');\n";
    writeFileSync(filePath, existing, "utf8");
    // old_string 和 new_string 完全相同 → 净新增 = 0
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: existing, new_string: existing }),
    );
    assert.equal(result, null);
  });
});

test("suppression-guard TN: hook 文件本身应跳过", async () => {
  await withTempDir(async (dir) => {
    const hooksDir = join(dir, "hooks", "post-tool-use");
    mkdirSync(hooksDir, { recursive: true });
    const filePath = join(hooksDir, "my-guard.js");
    const content = "// @ts-ignore\nconst payload = arg;\n";
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result, null);
  });
});

test("suppression-guard TN: Vue 单文件组件中的合规 disable 应放行", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "App.vue");
    const content = [
      "<script setup lang='ts'>",
      "// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 第三方库回调签名",
      "const handler = (e: any) => e;",
      "</script>",
      "",
    ].join("\n");
    writeFileSync(filePath, content, "utf8");
    const result = await runSuppressionGuard(
      payload(filePath, { old_string: "", new_string: content }),
    );
    assert.equal(result, null);
  });
});

// ════════════════════════════════════════════════════════════════
//  merge-conflict-guard — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("merge-conflict-guard 会阻止包含冲突标记的文件", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "conflict.js");
    writeFileSync(filePath, [
      "const a = 1;",
      "<<<<<<< HEAD",
      "const b = 2;",
      "=======",
      "const b = 3;",
      ">>>>>>> feature",
      "",
    ].join("\n"), "utf8");
    const result = await runMergeConflictGuard(payload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /冲突/);
  });
});

test("merge-conflict-guard TN: 正常代码中的比较运算符不应误报", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "compare.js");
    // 包含 < 和 > 但不是冲突标记（不是行首 7 个连续字符）
    writeFileSync(filePath, "if (a < b && c > d) { console.log('ok'); }\n", "utf8");
    assert.equal(await runMergeConflictGuard(payload(filePath)), null);
  });
});

test("merge-conflict-guard TN: 二进制文件应跳过", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "image.png");
    writeFileSync(filePath, Buffer.from([0x89, 0x50, 0x4E, 0x47]));
    assert.equal(await runMergeConflictGuard(payload(filePath)), null);
  });
});

test("merge-conflict-guard TN: Markdown 中的分隔线不应误报", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "doc.md");
    // === 分隔线只有 3-6 个，不是 7 个
    writeFileSync(filePath, "# Title\n======\nContent\n", "utf8");
    assert.equal(await runMergeConflictGuard(payload(filePath)), null);
  });
});

// ════════════════════════════════════════════════════════════════
//  large-edit-chunk-guard — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("large-edit-chunk-guard 会阻止超大 old_string", async () => {
  const result = await runLargeEditChunkGuard({
    tool_name: "Edit",
    tool_input: {
      file_path: "/tmp/big.js",
      old_string: "x".repeat(10001),
      new_string: "y",
    },
  });
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /Large Edit/);
});

test("large-edit-chunk-guard 会报告较大的 Edit 块", async () => {
  const result = await runLargeEditChunkGuard({
    tool_name: "Edit",
    tool_input: {
      file_path: "/tmp/medium.js",
      old_string: "x".repeat(5001),
      new_string: "y",
    },
  });
  assert.equal(result?.decision, "report");
});

test("large-edit-chunk-guard TN: 4999 字符的 Edit 不应触发", async () => {
  const result = await runLargeEditChunkGuard({
    tool_name: "Edit",
    tool_input: {
      file_path: "/tmp/ok.js",
      old_string: "x".repeat(4999),
      new_string: "y".repeat(4999),
    },
  });
  assert.equal(result, null);
});

test("large-edit-chunk-guard TN: Write 工具不受限制", async () => {
  const result = await runLargeEditChunkGuard({
    tool_name: "Write",
    tool_input: {
      file_path: "/tmp/big.js",
      content: "x".repeat(20000),
    },
  });
  assert.equal(result, null);
});

test("large-edit-chunk-guard TN: 空 old_string/new_string 不应触发", async () => {
  const result = await runLargeEditChunkGuard({
    tool_name: "Edit",
    tool_input: {
      file_path: "/tmp/empty.js",
      old_string: "",
      new_string: "",
    },
  });
  assert.equal(result, null);
});

// ════════════════════════════════════════════════════════════════
//  encoding-guard — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("encoding-guard 会报告 UTF-16 BOM 文件", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "bom.js");
    const buf = Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from("var x;\n", "utf-8")]);
    writeFileSync(filePath, buf);
    const result = await runEncodingGuard(payload(filePath));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /BOM/);
  });
});

test("encoding-guard TN: 正常 UTF-8 文件不应触发", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "clean.py");
    writeFileSync(filePath, "# 正常的中文注释\ndef hello():\n    pass\n", "utf8");
    assert.equal(await runEncodingGuard(payload(filePath)), null);
  });
});

test("encoding-guard TN: 二进制扩展名应跳过", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "data.zip");
    writeFileSync(filePath, Buffer.from([0xFF, 0xFE, 0x00, 0x01]));
    assert.equal(await runEncodingGuard(payload(filePath)), null);
  });
});

test("encoding-guard TN: 空文件不应触发", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "empty.ts");
    writeFileSync(filePath, "", "utf8");
    assert.equal(await runEncodingGuard(payload(filePath)), null);
  });
});

// ════════════════════════════════════════════════════════════════
//  garbled-text-guard — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("garbled-text-guard 会阻止包含连续 U+FFFD 的写入", async () => {
  const result = await runGarbledTextGuard({
    tool_input: { new_string: "hello \uFFFD\uFFFD world" },
  });
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /乱码/);
});

test("garbled-text-guard TN: 正常中文内容不应触发", async () => {
  const result = await runGarbledTextGuard({
    tool_input: { new_string: "这是正常的中文内容，包含标点符号！" },
  });
  assert.equal(result, null);
});

test("garbled-text-guard TN: 单个 U+FFFD 不应触发", async () => {
  const result = await runGarbledTextGuard({
    tool_input: { new_string: "some text \uFFFD here" },
  });
  assert.equal(result, null);
});

test("garbled-text-guard TN: 空 content 不应触发", async () => {
  const result = await runGarbledTextGuard({
    tool_input: {},
  });
  assert.equal(result, null);
});

// ════════════════════════════════════════════════════════════════
//  dangerous-command-guard — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("dangerous-command-guard 会阻止 rm -rf /", async () => {
  const result = await runDangerousCommandGuard(bashPayload("rm -rf /"));
  assert.equal(result?.decision, "block");
});

test("dangerous-command-guard 会阻止 rm -r ~", async () => {
  const result = await runDangerousCommandGuard(bashPayload("rm -r ~/"));
  assert.equal(result?.decision, "block");
});

test("dangerous-command-guard 会阻止 rm -rf .", async () => {
  const result = await runDangerousCommandGuard(bashPayload("rm -rf ."));
  assert.equal(result?.decision, "block");
});

test("dangerous-command-guard TN: rm 单个文件不应拦截", async () => {
  assert.equal(await runDangerousCommandGuard(bashPayload("rm file.txt")), null);
});

test("dangerous-command-guard TN: rm -rf node_modules（深层路径）不应拦截", async () => {
  assert.equal(await runDangerousCommandGuard(bashPayload("rm -rf ./node_modules")), null);
});

test("dangerous-command-guard TN: rm -rf /a/b/c（深层绝对路径）不应拦截", async () => {
  assert.equal(await runDangerousCommandGuard(bashPayload("rm -rf /Users/me/project/dist")), null);
});

test("dangerous-command-guard TN: 无关命令不应拦截", async () => {
  assert.equal(await runDangerousCommandGuard(bashPayload("npm install")), null);
  assert.equal(await runDangerousCommandGuard(bashPayload("git status")), null);
  assert.equal(await runDangerousCommandGuard(bashPayload("ls -la")), null);
});

// ════════════════════════════════════════════════════════════════
//  cat-write-guard — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("cat-write-guard 会阻止 cat heredoc 写文件", async () => {
  const result = await runCatWriteGuard(
    bashPayload("cat > /home/user/app.js << 'EOF'\nconsole.log('hi');\nEOF"),
  );
  assert.equal(result?.decision, "block");
});

test("cat-write-guard 会对 /tmp 写入降级为 report", async () => {
  const result = await runCatWriteGuard(
    bashPayload("cat > /tmp/script.sh << 'EOF'\necho hi\nEOF"),
  );
  assert.equal(result?.decision, "report");
});

test("cat-write-guard TN: cat 只读命令不应拦截", async () => {
  assert.equal(await runCatWriteGuard(bashPayload("cat README.md")), null);
});

test("cat-write-guard TN: cat 管道输入不应拦截", async () => {
  assert.equal(await runCatWriteGuard(bashPayload("cat << EOF | grep hello\nhello world\nEOF")), null);
});

test("cat-write-guard TN: echo 重定向不在此 guard 的管辖范围", async () => {
  assert.equal(await runCatWriteGuard(bashPayload('echo "hello" > output.txt')), null);
});

// ════════════════════════════════════════════════════════════════
//  sed-inplace-guard — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("sed-inplace-guard 会阻止无备份的 sed -i", async () => {
  const result = await runSedInplaceGuard(bashPayload("sed -i 's/foo/bar/g' file.txt"));
  assert.equal(result?.decision, "block");
});

test("sed-inplace-guard TN: sed 不带 -i 不应拦截", async () => {
  assert.equal(await runSedInplaceGuard(bashPayload("sed 's/foo/bar/g' file.txt")), null);
});

test("sed-inplace-guard TN: sed -i.bak 有备份不应拦截", async () => {
  assert.equal(await runSedInplaceGuard(bashPayload("sed -i.bak 's/foo/bar/g' file.txt")), null);
});

test("sed-inplace-guard TN: macOS sed -i '' 空后缀不应拦截", async () => {
  assert.equal(await runSedInplaceGuard(bashPayload("sed -i '' 's/foo/bar/g' file.txt")), null);
});

test("sed-inplace-guard TN: git commit -m 中包含 sed -i 字面量不应拦截", async () => {
  assert.equal(
    await runSedInplaceGuard(bashPayload('git commit -m "fix: replace sed -i with Edit tool"')),
    null,
  );
});

// ════════════════════════════════════════════════════════════════
//  edit-loop-detector — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("edit-loop-detector 会在达到警告阈值后报告", async () => {
  await withTempDir(async (dir) => {
    // 使用唯一路径避免与其他测试的 tracker 冲突
    const filePath = join(dir, `loop-test-${Date.now()}.js`);
    writeFileSync(filePath, "const x = 1;\n", "utf8");

    // 编辑 5 次 → 触发 report
    for (let i = 0; i < 4; i++) {
      await runEditLoopDetector(payload(filePath));
    }
    const result = await runEditLoopDetector(payload(filePath));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /Edit Loop/);
  });
});

test("edit-loop-detector TN: 首次编辑不应触发", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, `first-edit-${Date.now()}.ts`);
    writeFileSync(filePath, "export const y = 2;\n", "utf8");
    assert.equal(await runEditLoopDetector(payload(filePath)), null);
  });
});

test("edit-loop-detector TN: .md 文件应被豁免", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, `doc-${Date.now()}.md`);
    writeFileSync(filePath, "# Hello\n", "utf8");
    // 即使编辑多次也不应触发
    for (let i = 0; i < 12; i++) {
      await runEditLoopDetector(payload(filePath));
    }
    // .md 被豁免，总是 null
    const result = await runEditLoopDetector(payload(filePath));
    assert.equal(result, null);
  });
});

test("edit-loop-detector TN: 无 file_path 不应触发", async () => {
  assert.equal(await runEditLoopDetector({ tool_input: {} }), null);
});

// ════════════════════════════════════════════════════════════════
//  markdown-budget-guard — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("markdown-budget-guard 会阻止超预算的新 SKILL.md", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "SKILL.md");
    // 1500 token 预算，写入大量内容超出
    writeFileSync(filePath, "# Skill\n\n".repeat(1) + "详细说明 ".repeat(2000), "utf8");
    const result = await runMarkdownBudgetGuard(payload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /Markdown Budget/);
  });
});

test("markdown-budget-guard 会阻止超预算的新 MEMORY.md", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "MEMORY.md");
    writeFileSync(filePath, "# Memory\n\n" + "长期规则 ".repeat(4000), "utf8");
    const result = await runMarkdownBudgetGuard(payload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /记忆文件/);
  });
});

test("markdown-budget-guard TN: 普通 README.md 不受管控", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "README.md");
    writeFileSync(filePath, "# Project\n\n" + "这是一个很长的描述。".repeat(500), "utf8");
    assert.equal(await runMarkdownBudgetGuard(payload(filePath)), null);
  });
});

test("markdown-budget-guard TN: 预算内的 SKILL.md 不应触发", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "SKILL.md");
    // ~100 tokens 左右，远在 1500 预算内
    writeFileSync(filePath, "# My Skill\n\nDo something useful.\n\n## Rules\n\n- Rule 1\n- Rule 2\n", "utf8");
    assert.equal(await runMarkdownBudgetGuard(payload(filePath)), null);
  });
});

test("markdown-budget-guard TN: .txt 文件不受管控", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "notes.txt");
    writeFileSync(filePath, "Some notes\n".repeat(5000), "utf8");
    assert.equal(await runMarkdownBudgetGuard(payload(filePath)), null);
  });
});

// ════════════════════════════════════════════════════════════════
//  syntax-json — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("syntax-json 会阻止无效 JSON", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "bad.json");
    writeFileSync(filePath, '{"key": value}', "utf8");
    const result = await runSyntaxJson(payload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /JSON Syntax/);
  });
});

test("syntax-json TN: 有效 JSON 不应触发", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "ok.json");
    writeFileSync(filePath, '{"name": "test", "version": "1.0.0"}', "utf8");
    assert.equal(await runSyntaxJson(payload(filePath)), null);
  });
});

test("syntax-json TN: 非 .json 文件不应检查", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "config.yaml");
    writeFileSync(filePath, "key: value: broken", "utf8");
    assert.equal(await runSyntaxJson(payload(filePath)), null);
  });
});

// ════════════════════════════════════════════════════════════════
//  syntax-xml — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("syntax-xml 会阻止无效 XML（需要 xmllint）", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "bad.xml");
    writeFileSync(filePath, "<root><unclosed>\n", "utf8");
    const result = await runSyntaxXml(payload(filePath));
    // xmllint 不可用时返回 null，可用时应 block
    if (result !== null) {
      assert.equal(result?.decision, "block");
      assert.match(result?.reason ?? "", /XML Syntax/);
    }
  });
});

test("syntax-xml TN: 有效 XML 不应触发", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "valid.xml");
    writeFileSync(filePath, '<?xml version="1.0"?>\n<root><item>ok</item></root>\n', "utf8");
    assert.equal(await runSyntaxXml(payload(filePath)), null);
  });
});

test("syntax-xml TN: 非 XML 文件不应检查", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "data.csv");
    writeFileSync(filePath, "a,b,c\n1,2,3\n", "utf8");
    assert.equal(await runSyntaxXml(payload(filePath)), null);
  });
});

// ════════════════════════════════════════════════════════════════
//  error-retry-guard — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("error-retry-guard 会报告连续执行相同命令", async () => {
  // 先重置状态：执行一个不同的命令
  await runErrorRetryGuard(bashPayload("echo reset-state-" + Date.now()));
  // fixedCmd 连续三次：streak 1 → 2 → 3，第三次达到 REPORT_THRESHOLD=3 触发 report
  const fixedCmd = "npm run error-retry-tp-test-" + Date.now();
  await runErrorRetryGuard(bashPayload(fixedCmd));
  await runErrorRetryGuard(bashPayload(fixedCmd));
  const result = await runErrorRetryGuard(bashPayload(fixedCmd));
  assert.equal(result?.decision, "report");
  assert.match(result?.reason ?? "", /连续执行/);
  // 清理：执行不同命令重置
  await runErrorRetryGuard(bashPayload("echo cleanup-" + Date.now()));
});

test("error-retry-guard TN: 只读命令（git status）重复不应拦截", async () => {
  // 只读命令在白名单中，重复是正常的
  assert.equal(await runErrorRetryGuard(bashPayload("git status")), null);
  assert.equal(await runErrorRetryGuard(bashPayload("git status")), null);
  assert.equal(await runErrorRetryGuard(bashPayload("git status")), null);
});

test("error-retry-guard TN: 不同命令交替不应触发", async () => {
  await runErrorRetryGuard(bashPayload("npm run build"));
  await runErrorRetryGuard(bashPayload("npm run test"));
  // 交替执行，不是重复 → 不应触发
  const result = await runErrorRetryGuard(bashPayload("npm run lint"));
  assert.equal(result, null);
});

test("error-retry-guard TN: 空命令不应触发", async () => {
  assert.equal(await runErrorRetryGuard(bashPayload("")), null);
});

// ════════════════════════════════════════════════════════════════
//  compaction-strategy (PreCompact) — 正向 + 对抗测试
// ════════════════════════════════════════════════════════════════

test("compaction-strategy 会注入保留策略上下文", async () => {
  const result = await runCompactionStrategy({});
  assert.equal(result?.decision, "context");
  assert.match(result?.reason ?? "", /压缩保留策略/);
  assert.match(result?.reason ?? "", /必须保留/);
  assert.match(result?.reason ?? "", /优先丢弃/);
});

test("compaction-strategy TN: 空 payload 也应正常返回（不崩溃）", async () => {
  const result = await runCompactionStrategy(null);
  assert.equal(result?.decision, "context");
});

test("compaction-strategy 返回内容包含压缩后自检指引", async () => {
  const result = await runCompactionStrategy({});
  assert.match(result?.reason ?? "", /压缩后自检/);
});
