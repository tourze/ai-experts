import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const pluginRoot = resolve("plugins/typescript-expert");
const skillsRoot = resolve(pluginRoot, "skills");
const skillFiles = readdirSync(skillsRoot)
  .map((dir) => resolve(skillsRoot, dir, "SKILL.md"))
  .filter((file) => existsSync(file));

const REQUIRED_HEADINGS = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];

function extractLinks(markdown) {
  return Array.from(markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g))
    .map((match) => match[1])
    .filter((target) => !target.startsWith("#") && !/^[a-z]+:/i.test(target));
}

function extractTypeScriptBlocks(markdown) {
  return Array.from(
    markdown.matchAll(/```(?:ts|typescript)\n([\s\S]*?)```/g),
    (match) => match[1],
  );
}

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "typescript-expert-skill-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("所有 SKILL.md 都采用统一章节结构", () => {
  for (const file of skillFiles) {
    const markdown = readFileSync(file, "utf-8");

    assert.match(markdown, /^---\nname:/m, `${file} 缺少 name frontmatter`);
    assert.match(markdown, /\ndescription:/m, `${file} 缺少 description frontmatter`);
    assert.doesNotMatch(markdown, /\b(TODO|FIXME|TBD|HACK|XXX)\b/, `${file} 存在遗留占位符`);
    assert.doesNotMatch(markdown, /## When to use|## Instructions|## Quick Examples|Core Philosophy/i, `${file} 仍残留英文模板`);

    let previousIndex = -1;
    for (const heading of REQUIRED_HEADINGS) {
      const index = markdown.indexOf(heading);
      assert.notEqual(index, -1, `${file} 缺少 ${heading}`);
      assert.ok(index > previousIndex, `${file} 中 ${heading} 顺序不正确`);
      previousIndex = index;
    }
  }
});

test("所有 SKILL.md 的相对链接都能解析到真实文件", () => {
  for (const file of skillFiles) {
    const markdown = readFileSync(file, "utf-8");
    const skillDir = dirname(file);

    for (const target of extractLinks(markdown)) {
      const resolved = resolve(skillDir, target);
      assert.ok(existsSync(resolved), `${file} 的链接不存在：${target}`);
    }
  }
});

test("所有 SKILL.md 的 TypeScript 示例都能通过内置转换执行", () => {
  withTempDir((tempDir) => {
    for (const file of skillFiles) {
      const markdown = readFileSync(file, "utf-8");
      const blocks = extractTypeScriptBlocks(markdown);
      assert.ok(blocks.length > 0, `${file} 缺少 TypeScript 示例`);

      blocks.forEach((code, index) => {
        const tempFile = join(tempDir, `${index + 1}.ts`);
        writeFileSync(tempFile, code, "utf-8");

        const result = spawnSync("node", ["--experimental-transform-types", tempFile], {
          encoding: "utf-8",
        });

        assert.equal(
          result.status,
          0,
          `${file} 第 ${index + 1} 个示例执行失败：${result.stderr || result.stdout}`,
        );
      });
    }
  });
});
