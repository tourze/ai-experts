import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/database-expert");
const skillsRoot = resolve(pluginRoot, "skills");
const readmePath = resolve(pluginRoot, "README.md");
const requiredSections = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];
const forbiddenPatterns = [
  /\$\{selection\}/,
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bTBD\b/i,
  /70%_of_RAM/,
  /SHOW SLAVE STATUS/i,
  /SETNX\s+\S+\s+\S+\s+EX\s+\d+/,
  /\bbalance\s*=\s*GET\b/,
];

function getSkillDirs() {
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function extractRelativeLinks(markdown) {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter((href) => !href.startsWith("#") && !/^[a-z]+:/i.test(href));
}

function extractCodeBlocks(markdown, language) {
  return [...markdown.matchAll(new RegExp(`\\\`\\\`\\\`${language}\\n([\\s\\S]*?)\\\`\\\`\\\``, "g"))]
    .map((match) => match[1]);
}

test("README 技能列表与实际 skill 目录一致", () => {
  const expected = getSkillDirs();
  const readme = readFileSync(readmePath, "utf-8");
  const listed = readme
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) => line.match(/\| `([^`]+)` \|/)?.[1])
    .filter(Boolean)
    .sort();

  assert.deepEqual(listed, expected);
});

for (const skillName of getSkillDirs()) {
  test(`skill ${skillName} 具备统一结构、无占位符且交叉引用有效`, () => {
    const skillPath = resolve(skillsRoot, skillName, "SKILL.md");
    const content = readFileSync(skillPath, "utf-8");
    let previousIndex = -1;

    assert.match(content, new RegExp(`name:\\s+${skillName}`));

    for (const heading of requiredSections) {
      const index = content.indexOf(heading);
      assert.notEqual(index, -1, `${skillPath} 缺少 ${heading}`);
      assert.ok(index > previousIndex, `${skillPath} 中 ${heading} 顺序不正确`);
      previousIndex = index;
    }

    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(content, pattern, `${skillPath} 仍包含禁用模式 ${pattern}`);
    }

    for (const href of extractRelativeLinks(content)) {
      const target = resolve(dirname(skillPath), href);
      assert.ok(target.startsWith(resolve("plugins")), `${skillPath} 中 ${href} 越界`);
      assert.ok(existsSync(target), `${skillPath} 中交叉引用不存在：${href}`);
      assert.ok(readFileSync(target, "utf-8").length > 0, `${skillPath} 中交叉引用为空：${href}`);
    }
  });
}

test("Redis skill 中的 Python 示例可通过 py_compile", () => {
  const skillPath = resolve(skillsRoot, "redis-best-practices", "SKILL.md");
  const content = readFileSync(skillPath, "utf-8");
  const codeBlocks = extractCodeBlocks(content, "python");
  const tempDir = mkdtempSync(join(tmpdir(), "database-expert-skill-"));

  try {
    assert.ok(codeBlocks.length > 0, `${skillPath} 缺少 Python 示例`);

    codeBlocks.forEach((code, index) => {
      const tempFile = join(tempDir, `${index}.py`);
      writeFileSync(tempFile, code, "utf8");

      const result = spawnSync("python3", ["-m", "py_compile", tempFile], {
        encoding: "utf-8",
      });

      assert.equal(
        result.status,
        0,
        `${skillPath} 第 ${index + 1} 个 Python 示例语法错误：${result.stderr || result.stdout}`,
      );
    });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
