import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/data-ai-expert");
const skillsRoot = resolve(pluginRoot, "skills");
const readmePath = resolve(pluginRoot, "README.md");
const requiredSections = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];

function getSkillDirs() {
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
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
  test(`skill ${skillName} 具备统一结构且交叉引用有效`, () => {
    const skillPath = resolve(skillsRoot, skillName, "SKILL.md");
    const content = readFileSync(skillPath, "utf-8");

    assert.match(content, new RegExp(`name:\\s+${skillName}`));
    for (const heading of requiredSections) {
      assert.match(content, new RegExp(heading));
    }

    const links = Array.from(content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g), (match) => match[1]);
    for (const link of links) {
      if (/^(https?:|mailto:|#)/.test(link)) {
        continue;
      }

      // T8 语法中的实体标注看起来像 Markdown 链接，但并不是文件路径。
      if (/[=,]/.test(link)) {
        continue;
      }

      if (
        !/^(?:\.{1,2}\/|[A-Za-z0-9_.-]+\/|[A-Za-z0-9_.-]+\.(?:md|json|py|yaml))/.test(
          link,
        )
      ) {
        continue;
      }

      const target = resolve(skillsRoot, skillName, link);
      assert.ok(existsSync(target), `${skillName} 引用了不存在的路径: ${link}`);
    }
  });
}
