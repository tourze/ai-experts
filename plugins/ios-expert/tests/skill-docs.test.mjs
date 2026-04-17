import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import { assertBasicSkillDocQuality, getSkillFiles } from "../../../tests/skill-doc-test-utils.mjs";

const pluginRoot = resolve("plugins/ios-expert");
const skillFiles = getSkillFiles(pluginRoot);

test("iOS skill 文档具备 frontmatter、无占位符且本地链接有效", () => {
  assert.ok(skillFiles.length > 0, "ios-expert 缺少 SKILL.md");

  for (const file of skillFiles) {
    assertBasicSkillDocQuality(assert, pluginRoot, file);
  }
});
