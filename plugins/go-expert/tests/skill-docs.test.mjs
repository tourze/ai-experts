import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { assertBasicSkillDocQuality, getSkillFiles } from "../../../tests/skill-doc-test-utils.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(__dirname, "..");
const skillFiles = getSkillFiles(pluginRoot);
const expectedSkillNames = [
  "go-cli",
  "go-code-style",
  "go-concurrency-patterns",
  "go-data-structures",
  "go-database",
  "go-design-patterns",
  "go-error-handling",
  "go-grpc",
  "go-lint",
  "go-observability",
  "go-performance",
  "go-security",
  "go-structs-interfaces",
  "go-testing-patterns",
  "go-troubleshooting",
];

function readSkill(name) {
  return readFileSync(resolve(pluginRoot, "skills", name, "SKILL.md"), "utf-8");
}

test("Go skill 文档具备 frontmatter、无占位符且本地链接有效", () => {
  assert.ok(skillFiles.length > 0, "go-expert 缺少 SKILL.md");

  for (const file of skillFiles) {
    assertBasicSkillDocQuality(assert, pluginRoot, file);
  }
});

test("Go P0 技能集合与目录保持一致", () => {
  const actual = skillFiles
    .map((file) => file.match(/skills\/([^/]+)\/SKILL\.md$/)?.[1])
    .filter(Boolean)
    .sort();

  assert.deepEqual(actual, expectedSkillNames);
});

test("Go 并发技能文档保留关键并发治理约束", () => {
  const content = readSkill("go-concurrency-patterns");

  assert.match(content, /errgroup\.SetLimit/);
  assert.match(content, /go test -race \.\/\.\.\./);
  assert.match(content, /ctx\.Done\(\)/);
});

test("Go P0 技能文档覆盖风格、错误、安全、context、测试和性能基线", () => {
  assert.match(readSkill("go-code-style"), /早返回/);
  assert.match(readSkill("go-code-style"), /命名字段/);

  assert.match(readSkill("go-error-handling"), /errors\.Is/);
  assert.match(readSkill("go-error-handling"), /%w/);

  assert.match(readSkill("go-testing-patterns"), /table-driven tests/);
  assert.match(readSkill("go-testing-patterns"), /go test -race/);

  assert.match(readSkill("go-performance"), /benchstat/);
  assert.match(readSkill("go-performance"), /pprof/);
});
