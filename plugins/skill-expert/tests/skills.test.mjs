import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/skill-expert");
const skillsRoot = resolve(pluginRoot, "skills");
const readmePath = resolve(pluginRoot, "README.md");
const expectedResources = [
  "skill-creator/agents/grader.md",
  "skill-creator/references/schemas.md",
  "skill-creator/assets/eval_review.html",
  "skill-creator/eval-viewer/generate_review.py",
  "skills-prune-and-sync-readme/scripts/curate_skills.py",
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

test("README 技能列表与实际顶级 skill 目录一致", () => {
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
  test(`skill ${skillName} 保留 frontmatter，且相对链接有效`, () => {
    const skillPath = resolve(skillsRoot, skillName, "SKILL.md");
    const content = readFileSync(skillPath, "utf-8");
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);

    assert.ok(frontmatter, `${skillPath} 缺少 frontmatter`);
    assert.match(frontmatter[1], new RegExp(`name:\\s+${skillName}`), `${skillPath} frontmatter.name 不匹配`);
    assert.match(frontmatter[1], /^\s*description:\s+/m, `${skillPath} frontmatter.description 缺失`);

    for (const href of extractRelativeLinks(content)) {
      const target = resolve(dirname(skillPath), href);
      assert.ok(target.startsWith(pluginRoot), `${skillPath} 中 ${href} 越界`);
      assert.ok(existsSync(target), `${skillPath} 中相对链接不存在：${href}`);
    }
  });
}

test("关键配套资源已随 skill 一起复制", () => {
  for (const relativePath of expectedResources) {
    assert.ok(existsSync(resolve(skillsRoot, relativePath)), `${relativePath} 缺失`);
  }
});
