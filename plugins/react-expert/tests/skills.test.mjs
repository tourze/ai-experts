import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";

const skillsRoot = resolve("plugins/react-expert/skills");
const skillFiles = readdirSync(skillsRoot)
  .map((dir) => resolve(skillsRoot, dir, "SKILL.md"))
  .filter((file) => existsSync(file));

const expectedSections = [
  "适用场景",
  "核心约束",
  "代码模式",
  "检查清单",
  "反模式",
];

test("所有 SKILL.md 都使用统一章节结构", () => {
  for (const file of skillFiles) {
    const text = readFileSync(file, "utf-8");

    assert.match(text, /^---\nname:/m, `${file} 缺少 name frontmatter`);
    assert.match(text, /\ndescription:/m, `${file} 缺少 description frontmatter`);
    assert.doesNotMatch(text, /^dependsOn:/m, `${file} 仍包含非标准 dependsOn frontmatter`);

    const positions = expectedSections.map((section) => text.indexOf(`## ${section}`));
    for (const [index, position] of positions.entries()) {
      assert.notEqual(position, -1, `${file} 缺少章节：${expectedSections[index]}`);
    }
    assert.deepEqual([...positions].sort((a, b) => a - b), positions, `${file} 章节顺序不正确`);
  }
});

test("所有 SKILL.md 已移除失效 skill 引用与非中文遗留触发语", () => {
  for (const file of skillFiles) {
    const text = readFileSync(file, "utf-8");

    assert.doesNotMatch(text, /react-19|react-context|react-testing|react-forms|react-hook-form/, `${file} 仍引用失效 skill`);
    assert.doesNotMatch(text, /USE WHEN|DO NOT USE FOR|When to Apply|When NOT to Use This Skill/i, `${file} 仍保留旧英文结构`);
    assert.doesNotMatch(text, /[\u0400-\u04FF]/, `${file} 仍包含俄文内容`);
  }
});

test("所有 SKILL.md 的相对链接都能解析到真实文件", () => {
  const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const file of skillFiles) {
    const text = readFileSync(file, "utf-8");

    for (const match of text.matchAll(markdownLinkPattern)) {
      const target = match[1];
      if (target.includes("://") || target.startsWith("#")) {
        continue;
      }

      // existsSync 不识别 #fragment，剥离锚点只校验文件路径
      const [pathPart] = target.split("#");
      const resolved = resolve(dirname(file), pathPart);
      assert.ok(existsSync(resolved), `${file} 的链接不存在：${target}`);
    }
  }
});
