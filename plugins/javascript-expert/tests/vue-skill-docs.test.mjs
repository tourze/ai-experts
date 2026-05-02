import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/vue-expert");
const skillPath = resolve(pluginRoot, "skills/vue-expert-js/SKILL.md");

test("SKILL.md 使用统一中文结构并移除失效交叉引用", () => {
  const content = readFileSync(skillPath, "utf-8");

  assert.match(content, /## 适用场景/);
  assert.match(content, /## 核心约束/);
  assert.match(content, /## 代码模式/);
  assert.match(content, /## 检查清单/);
  assert.match(content, /## 反模式/);

  assert.doesNotMatch(content, /\bjavascript-pro\b/);
  assert.doesNotMatch(content, /vue-expert\/references\//);
  assert.doesNotMatch(content, /\b(TODO|FIXME|TBD|HACK|XXX)\b/);
});

test("SKILL.md 中引用的本地参考文档和技能都存在", () => {
  const content = readFileSync(skillPath, "utf-8");
  const relativeDocs = [...content.matchAll(/\((references\/[^)]+\.md)\)/g)].map((match) => match[1]);
  const relativeSkills = [...content.matchAll(/\((\.\.\/[^)]+\/SKILL\.md)\)/g)].map((match) => match[1]);

  for (const relativePath of [...relativeDocs, ...relativeSkills]) {
    assert.ok(existsSync(resolve(pluginRoot, "skills/vue-expert-js", relativePath)), `缺少引用目标：${relativePath}`);
  }
});
