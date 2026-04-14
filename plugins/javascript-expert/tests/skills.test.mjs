import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const pluginRoot = resolve("plugins/javascript-expert");
const skillFiles = [
  resolve(pluginRoot, "skills/javascript-typescript-jest/SKILL.md"),
  resolve(pluginRoot, "skills/modern-javascript-patterns/SKILL.md"),
];

const requiredSections = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];

function extractRelativeLinks(markdown) {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter((href) => !href.startsWith("#") && !/^[a-z]+:/i.test(href));
}

function extractJavaScriptBlocks(markdown) {
  return [...markdown.matchAll(/```(?:javascript|js)\n([\s\S]*?)```/g)].map((match) => match[1]);
}

test("SKILL.md 采用统一章节结构", () => {
  for (const skillPath of skillFiles) {
    const markdown = readFileSync(skillPath, "utf-8");
    let previousIndex = -1;

    for (const heading of requiredSections) {
      const index = markdown.indexOf(heading);
      assert.notEqual(index, -1, `${skillPath} 缺少 ${heading}`);
      assert.ok(index > previousIndex, `${skillPath} 中 ${heading} 顺序不正确`);
      previousIndex = index;
    }
  }
});

test("SKILL.md 中的交叉引用路径有效", () => {
  for (const skillPath of skillFiles) {
    const markdown = readFileSync(skillPath, "utf-8");
    const skillDir = dirname(skillPath);

    for (const href of extractRelativeLinks(markdown)) {
      const target = resolve(skillDir, href);
      assert.ok(target.startsWith(resolve("plugins")), `${skillPath} 中 ${href} 越界`);
      assert.ok(
        readFileSync(target, "utf-8").length > 0,
        `${skillPath} 中交叉引用不存在或为空：${href}`,
      );
    }
  }
});

test("SKILL.md 中的 JavaScript 示例通过 node --check", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "javascript-expert-skill-"));

  try {
    for (const skillPath of skillFiles) {
      const markdown = readFileSync(skillPath, "utf-8");
      const codeBlocks = extractJavaScriptBlocks(markdown);
      assert.ok(codeBlocks.length > 0, `${skillPath} 缺少 JavaScript 示例`);

      codeBlocks.forEach((code, index) => {
        const tempFile = join(tempDir, `${index}.mjs`);
        writeFileSync(tempFile, code, "utf8");

        const result = spawnSync("node", ["--check", tempFile], { encoding: "utf-8" });
        assert.equal(
          result.status,
          0,
          `${skillPath} 第 ${index + 1} 个示例语法错误：${result.stderr || result.stdout}`,
        );
      });
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
