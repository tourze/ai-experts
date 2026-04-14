import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve("plugins/product-expert");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: resolve("."),
    encoding: "utf-8",
    ...options,
  });
}

test("Python 脚本通过 py_compile", () => {
  const result = run("python3", [
    "-m",
    "py_compile",
    `${root}/skills/agile-product-owner/scripts/user_story_generator.py`,
    `${root}/skills/competitive-teardown/scripts/competitive_matrix_builder.py`,
  ]);

  assert.equal(result.status, 0, result.stderr);
});

test("competitive_matrix_builder 的 gap 分析排除自身样本", () => {
  const dir = mkdtempSync(join(tmpdir(), "product-expert-"));

  try {
    const inputPath = join(dir, "competitors.json");
    writeFileSync(
      inputPath,
      JSON.stringify({
        dimensions: ["pricing", "ux"],
        competitors: [
          { name: "CompA", scores: { pricing: 8, ux: 8 } },
          { name: "CompB", scores: { pricing: 9, ux: 7 } },
        ],
        your_product: { name: "You", scores: { pricing: 5, ux: 6 } },
      }),
      "utf-8",
    );

    const result = run("python3", [
      `${root}/skills/competitive-teardown/scripts/competitive_matrix_builder.py`,
      inputPath,
      "--format",
      "json",
    ]);

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.gap_analysis.gaps.pricing.competitor_avg, 8.5);
    assert.equal(output.gap_analysis.gaps.ux.competitor_avg, 7.5);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("user_story_generator 在无效 sprint capacity 下给出明确错误", () => {
  const result = run("python3", [
    `${root}/skills/agile-product-owner/scripts/user_story_generator.py`,
    "sprint",
    "0",
  ]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /capacity must be a positive integer/i);
});
