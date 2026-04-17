import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { assertBasicSkillDocQuality, getSkillFiles } from "../../../tests/skill-doc-test-utils.mjs";

const pluginRoot = resolve("plugins/go-expert");
const skillFiles = getSkillFiles(pluginRoot);
const mainSkillPath = resolve(pluginRoot, "skills/go-concurrency-patterns/SKILL.md");

test("Go skill 文档具备 frontmatter、无占位符且本地链接有效", () => {
  assert.ok(skillFiles.length > 0, "go-expert 缺少 SKILL.md");

  for (const file of skillFiles) {
    assertBasicSkillDocQuality(assert, pluginRoot, file);
  }
});

test("Go 并发技能文档保留关键并发治理约束", () => {
  const content = readFileSync(mainSkillPath, "utf-8");

  assert.match(content, /errgroup\.SetLimit/);
  assert.match(content, /go test -race \.\/\.\.\./);
  assert.match(content, /ctx\.Done\(\)/);
});
