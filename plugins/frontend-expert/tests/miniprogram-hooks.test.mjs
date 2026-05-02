import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { run as runTaroDomGuard } from "../hooks/post-tool-use/edit-write/syntax-taro-dom.mjs";
import { run as runWxmlGuard } from "../hooks/post-tool-use/edit-write/syntax-wxml.mjs";
import { run as runWxssGuard } from "../hooks/post-tool-use/edit-write/syntax-wxss.mjs";

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "miniprogram-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function payload(filePath) {
  return { tool_input: { file_path: filePath } };
}

test("syntax-wxml 会拦截自闭合容器标签", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "index.wxml");
    writeFileSync(filePath, "<view />", "utf8");

    const result = await runWxmlGuard(payload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /不应自闭合/);
  });
});

test("syntax-wxml 会报告缺失结束符", async () => {
  await withTempDir(async (dir) => {
    const filePath = join(dir, "broken.wxml");
    writeFileSync(filePath, "<view class='page'", "utf8");

    const result = await runWxmlGuard(payload(filePath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /缺少结束符/);
  });
});

test("syntax-wxss 忽略注释中的中文标点，但拦截真实声明错误", async () => {
  await withTempDir(async (dir) => {
    const okPath = join(dir, "comment.wxss");
    writeFileSync(okPath, "/* width： 10rpx； */\n.page { width: 10rpx; }\n", "utf8");
    assert.equal(await runWxssGuard(payload(okPath)), null);

    const badPath = join(dir, "broken.wxss");
    writeFileSync(badPath, ".page {\n  width： 10rpx；\n}\n", "utf8");
    const result = await runWxssGuard(payload(badPath));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /中文分号|中文冒号/);
  });
});

test("syntax-taro-dom 只在 Taro 文件中拦截 DOM API", async () => {
  await withTempDir(async (dir) => {
    const taroFile = join(dir, "page.tsx");
    writeFileSync(
      taroFile,
      "import Taro from '@tarojs/taro';\nconst node = document.querySelector('.page');\nexport default node;\n",
      "utf8",
    );

    const taroResult = await runTaroDomGuard(payload(taroFile));
    assert.equal(taroResult?.decision, "block");
    assert.match(taroResult?.reason ?? "", /document/);

    const plainFile = join(dir, "plain.ts");
    writeFileSync(plainFile, "const node = document.querySelector('.page');\n", "utf8");
    assert.equal(await runTaroDomGuard(payload(plainFile)), null);
  });
});
