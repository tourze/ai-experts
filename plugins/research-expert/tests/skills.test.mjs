import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/research-expert");
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
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bTBD\b/i,
  /\/projects\/\.openclaw/i,
  /\btechnology-news-search\b/i,
  /\bsite-analyzer\b/i,
];

function getTopLevelSkillDirs() {
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function collectSkillFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSkillFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name === "SKILL.md") {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function expectedSkillName(skillPath) {
  const rel = relative(skillsRoot, dirname(skillPath));
  const parts = rel.split("/");
  if (parts.length === 1) {
    return parts[0];
  }
  if (parts.length === 3 && parts[1] === "sub") {
    return `${parts[0]}/${parts[2]}`;
  }
  throw new Error(`无法从路径推导 skill 名称：${skillPath}`);
}

function extractRelativeLinks(markdown) {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter((href) => !href.startsWith("#") && !/^[a-z]+:/i.test(href));
}

function getSectionBody(markdown, title) {
  const heading = `## ${title}`;
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1, `${readmePath} 缺少 ${heading}`);

  const bodyStart = start + heading.length;
  const nextHeadingOffset = markdown.slice(bodyStart).search(/\n##\s+/);
  if (nextHeadingOffset < 0) {
    return markdown.slice(bodyStart);
  }
  return markdown.slice(bodyStart, bodyStart + nextHeadingOffset);
}

test("README 技能列表与实际顶级 skill 目录一致", () => {
  const expected = getTopLevelSkillDirs();
  const readme = readFileSync(readmePath, "utf-8");
  const listed = getSectionBody(readme, "Skills")
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) => line.match(/\| `([^`]+)` \|/)?.[1])
    .filter(Boolean)
    .sort();

  assert.deepEqual(listed, expected);
});

for (const skillPath of collectSkillFiles(skillsRoot)) {
  test(`skill ${relative(pluginRoot, skillPath)} 具备统一结构且交叉引用有效`, () => {
    const content = readFileSync(skillPath, "utf-8");
    let previousIndex = -1;
    const expectedName = expectedSkillName(skillPath);

    assert.ok(content.includes(`name: ${expectedName}`), `${skillPath} frontmatter.name 应为 ${expectedName}`);

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
      assert.ok(target.startsWith(pluginRoot), `${skillPath} 中 ${href} 越界`);
      assert.ok(existsSync(target), `${skillPath} 中交叉引用不存在：${href}`);
    }
  });
}
