import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import test from "node:test";

const pluginRoot = resolve("plugins/php-expert");
const skillRoot = resolve(pluginRoot, "skills");
const skillDirs = readdirSync(skillRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const REQUIRED_HEADINGS = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];

function extractCodeBlocks(markdown, language) {
  const pattern = new RegExp(`^\\\`\\\`\\\`${language}\\n([\\s\\S]*?)^\\\`\\\`\\\`$`, "gm");
  return Array.from(markdown.matchAll(pattern), (match) => match[1]);
}

function extractMarkdownLinks(markdown) {
  const pattern = /\[[^\]]+\]\(([^)]+)\)/g;
  return Array.from(markdown.matchAll(pattern), (match) => match[1]);
}

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "php-expert-skill-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("所有 SKILL.md 使用统一章节顺序", () => {
  for (const skillDir of skillDirs) {
    const skillPath = resolve(skillRoot, skillDir, "SKILL.md");
    const markdown = readFileSync(skillPath, "utf-8");

    let lastIndex = -1;
    for (const heading of REQUIRED_HEADINGS) {
      const index = markdown.indexOf(heading);
      assert.notEqual(index, -1, `${skillDir} 缺少章节 ${heading}`);
      assert.ok(index > lastIndex, `${skillDir} 章节顺序错误：${heading}`);
      lastIndex = index;
    }
  }
});

test("所有 SKILL.md 的本地交叉引用可解析", () => {
  for (const skillDir of skillDirs) {
    const skillPath = resolve(skillRoot, skillDir, "SKILL.md");
    const markdown = readFileSync(skillPath, "utf-8");
    const links = extractMarkdownLinks(markdown);

    for (const link of links) {
      if (link.includes("://") || link.startsWith("#")) continue;
      const target = resolve(resolve(skillPath, ".."), link);
      assert.ok(existsSync(target), `${skillDir} 存在失效链接: ${link}`);
    }
  }
});

test("所有 SKILL.md 的 PHP 示例通过 php -l", () => {
  const phpCheck = spawnSync("php", ["-v"], { encoding: "utf-8" });
  if (phpCheck.status !== 0) {
    return;
  }

  for (const skillDir of skillDirs) {
    const skillPath = resolve(skillRoot, skillDir, "SKILL.md");
    const markdown = readFileSync(skillPath, "utf-8");
    const codeBlocks = extractCodeBlocks(markdown, "php");

    withTempDir((dir) => {
      codeBlocks.forEach((code, index) => {
        const filePath = join(dir, `${skillDir}-${index + 1}.php`);
        writeFileSync(filePath, code, "utf-8");
        const result = spawnSync("php", ["-l", filePath], { encoding: "utf-8" });
        assert.equal(result.status, 0, `${skillDir} 的 PHP 示例语法错误:\n${result.stdout}${result.stderr}`);
      });
    });
  }
});
