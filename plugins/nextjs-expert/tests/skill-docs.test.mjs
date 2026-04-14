import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";

const skillFile = resolve("plugins/nextjs-expert/skills/nextjs-developer/SKILL.md");
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

function collectSkillNames() {
  const pluginRoot = resolve("plugins");
  const names = new Set();

  for (const pluginDir of readdirSync(pluginRoot)) {
    const skillsRoot = resolve(pluginRoot, pluginDir, "skills");
    if (!existsSync(skillsRoot)) {
      continue;
    }

    for (const skillDir of readdirSync(skillsRoot)) {
      const skillPath = resolve(skillsRoot, skillDir, "SKILL.md");
      if (!existsSync(skillPath)) {
        continue;
      }

      const content = readFileSync(skillPath, "utf-8");
      const match = content.match(/^name:\s*([^\n]+)$/m);
      if (match) {
        names.add(match[1].trim());
      }
    }
  }

  return names;
}

test("SKILL 文档使用统一结构且没有遗留英文模板段落", () => {
  const content = readFileSync(skillFile, "utf-8");

  let lastIndex = -1;
  for (const heading of requiredHeadings) {
    const index = content.indexOf(heading);
    assert.notEqual(index, -1, `${skillFile} 缺少 ${heading}`);
    assert.ok(index > lastIndex, `${skillFile} 中 ${heading} 顺序错误`);
    lastIndex = index;
  }

  assert.doesNotMatch(content, /\b(TODO|FIXME|TBD|HACK|XXX)\b/, "SKILL 文档存在遗留占位符");
  assert.doesNotMatch(content, /## When to use|## Core Workflow|## Output Templates|Senior Next\.js developer/i, "SKILL 文档仍残留英文模板");
});

test("SKILL 文档中的相对链接与相关技能引用都有效", () => {
  const content = readFileSync(skillFile, "utf-8");

  for (const link of extractLinks(content)) {
    const target = resolve(dirname(skillFile), link);
    assert.ok(existsSync(target), `${skillFile} 引用了不存在的文件：${link}`);
  }

  const relatedMatch = content.match(/related-skills:\s*(.+)$/m);
  assert.ok(relatedMatch, "缺少 related-skills 元数据");

  const knownSkills = collectSkillNames();
  const relatedSkills = relatedMatch[1]
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const skillName of relatedSkills) {
    assert.ok(knownSkills.has(skillName), `related-skills 引用了不存在的技能：${skillName}`);
  }
});

test("SKILL 主示例使用当前约定的 Next.js / React API", () => {
  const content = readFileSync(skillFile, "utf-8");

  assert.match(content, /useActionState/);
  assert.match(content, /params: Promise<\{ id: string \}>/);
  assert.doesNotMatch(content, /\buseFormState\b/);
  assert.doesNotMatch(content, /\bexperimental_useOptimistic\b/);
  assert.doesNotMatch(content, /params\s*}:\s*\{\s*params:\s*\{/);
});
