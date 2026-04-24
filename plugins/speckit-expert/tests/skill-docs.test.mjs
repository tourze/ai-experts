import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const skillsRoot = resolve("plugins/speckit-expert/skills");

function skillFiles() {
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(skillsRoot, entry.name, "SKILL.md"));
}

function frontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match?.[1] ?? "";
}

test("skill frontmatter does not declare unsupported handoff metadata", () => {
  for (const file of skillFiles()) {
    const metadata = frontmatter(readFileSync(file, "utf8"));
    assert.doesNotMatch(metadata, /^depends-on:/m, file);
    assert.doesNotMatch(metadata, /^handoffs:/m, file);
    assert.doesNotMatch(metadata, /^\s+agent:/m, file);
  }
});
