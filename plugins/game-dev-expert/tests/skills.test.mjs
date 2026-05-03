import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PLUGIN_DIR = new URL("..", import.meta.url).pathname;

test("README.md 存在", () => {
  assert.ok(existsSync(join(PLUGIN_DIR, "README.md")));
});

test("skills/godot-gdscript-patterns/SKILL.md 存在", () => {
  assert.ok(
    existsSync(join(PLUGIN_DIR, "skills", "godot-gdscript-patterns", "SKILL.md"))
  );
});

test("godot-gdscript-patterns SKILL.md 有有效 frontmatter", () => {
  const content = readFileSync(
    join(PLUGIN_DIR, "skills", "godot-gdscript-patterns", "SKILL.md"),
    "utf8"
  );
  assert.ok(content.includes("name:"));
  assert.ok(content.includes("description:"));
});
