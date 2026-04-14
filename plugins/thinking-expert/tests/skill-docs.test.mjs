import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/thinking-expert");
const skillsRoot = resolve(pluginRoot, "skills");
const requiredHeadings = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];

function getSkillFiles() {
  return readdirSync(skillsRoot)
    .map((name) => resolve(skillsRoot, name, "SKILL.md"))
    .filter((file) => existsSync(file));
}

function extractLinks(content) {
  return Array.from(content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g))
    .map((match) => match[1])
    .filter(
      (target) =>
        !target.startsWith("http://") &&
        !target.startsWith("https://") &&
        !target.startsWith("#"),
    );
}

test("SKILL 文档使用统一结构且 description 为中文", () => {
  for (const file of getSkillFiles()) {
    const content = readFileSync(file, "utf-8");

    assert.match(content, /description:\s*.*[\u4e00-\u9fff]/u, `${file} description 仍非中文`);

    let lastIndex = -1;
    for (const heading of requiredHeadings) {
      const index = content.indexOf(heading);
      assert.notEqual(index, -1, `${file} 缺少 ${heading}`);
      assert.ok(index > lastIndex, `${file} 中 ${heading} 顺序错误`);
      lastIndex = index;
    }

    assert.doesNotMatch(content, /\b(TODO|FIXME|TBD|HACK|XXX)\b/, `${file} 存在遗留占位符`);
    assert.doesNotMatch(content, /\$ARGUMENTS|\$[A-Z_]+/, `${file} 存在未替换的参数占位符`);
  }
});

test("SKILL 文档中的相对链接都能解析到现有文件", () => {
  for (const file of getSkillFiles()) {
    const content = readFileSync(file, "utf-8");
    for (const link of extractLinks(content)) {
      const target = resolve(dirname(file), link);
      assert.ok(existsSync(target), `${file} 引用了不存在的文件：${link}`);
    }
  }
});
