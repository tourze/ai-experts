import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/marketing-expert");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: resolve("."),
    encoding: "utf-8",
    ...options,
  });
}

test("Node 脚本通过语法检查", () => {
  const result = run("node", [
    "--check",
    `${pluginRoot}/skills/copy-editing/scripts/readability_scorer.mjs`,
  ]);

  assert.equal(result.status, 0, result.stderr);
});

test("readability_scorer.mjs 输出稳定 JSON 指标", () => {
  const result = run("node", [
    `${pluginRoot}/skills/copy-editing/scripts/readability_scorer.mjs`,
    "--json",
  ], {
    input: "Clear copy sells. Customers act fast.\n",
  });

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.stats.word_count, 6);
  assert.equal(output.stats.sentence_count, 2);
  assert.equal(output.flesch_reading_ease.score, 91);
  assert.equal(output.flesch_kincaid_grade.grade_level, 1.3);
  assert.equal(output.overall_score, 91);
});
