import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";

const skillFile = resolve("plugins/godot-expert/skills/godot-gdscript-patterns/SKILL.md");
const requiredHeadings = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];

function extractLinks(content) {
  return Array.from(content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g))
    .map((match) => match[1])
    .filter((target) => !target.startsWith("http://") && !target.startsWith("https://") && !target.startsWith("#"));
}

test("SKILL 文档使用统一结构且没有遗留占位符", () => {
  const content = readFileSync(skillFile, "utf-8");

  let lastIndex = -1;
  for (const heading of requiredHeadings) {
    const index = content.indexOf(heading);
    assert.notEqual(index, -1, `${skillFile} 缺少 ${heading}`);
    assert.ok(index > lastIndex, `${skillFile} 中 ${heading} 顺序错误`);
    lastIndex = index;
  }

  assert.doesNotMatch(content, /\b(TODO|FIXME|TBD|HACK|XXX)\b/, "SKILL 文档存在遗留占位符");
  assert.doesNotMatch(content, /## When to Use This Skill|## Core Concepts|For advanced Godot patterns/i, "SKILL 文档仍有未中文化段落");
});

test("SKILL 文档中的相对链接都能解析到现有文件", () => {
  const content = readFileSync(skillFile, "utf-8");

  for (const link of extractLinks(content)) {
    const target = resolve(dirname(skillFile), link);
    assert.ok(existsSync(target), `${skillFile} 引用了不存在的文件：${link}`);
  }
});

test("关键代码示例不再包含已知回归片段", () => {
  const content = readFileSync(skillFile, "utf-8");

  assert.match(content, /var _score: int = 0/);
  assert.match(content, /var _current_health: int = 0/);
  assert.doesNotMatch(content, /var score: int = 0:\s+set\(\s*value\s*\):\s+score = value/s, "仍存在 score 递归 setter");
  assert.doesNotMatch(content, /var current_health: int:\s+set\(\s*value\s*\):\s+var old := current_health\s+current_health = clampi/s, "仍存在 current_health 递归 setter");
  assert.doesNotMatch(content, /instance\.visible = false/, "对象池示例仍直接假设所有节点都有 visible");
});
