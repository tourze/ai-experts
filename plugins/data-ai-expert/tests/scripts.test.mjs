import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const pluginRoot = resolve("plugins/data-ai-expert");
const validateModelScript = resolve(pluginRoot, "skills/model-first-reasoning/scripts/validate-model.mjs");
const optimizePromptScript = resolve(pluginRoot, "skills/prompt-engineering-patterns/scripts/optimize-prompt.mjs");
const modelTemplate = resolve(pluginRoot, "skills/model-first-reasoning/MODEL_TEMPLATE.json");

test("data-ai skill Node 脚本都能通过语法检查", () => {
  for (const script of [validateModelScript, optimizePromptScript]) {
    const result = spawnSync(process.execPath, ["--check", script], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
  }
});

test("validate-model.mjs 对含 unknowns 的模板返回 Phase 1 停止码", () => {
  const result = spawnSync(process.execPath, [validateModelScript, modelTemplate], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 2);
  assert.match(result.stdout, /WARNING: 1 unknowns remain - STOP after Phase 1/);
  assert.match(result.stdout, /Do NOT proceed to implementation until unknowns are resolved/);
});

test("validate-model.mjs 对缺失结构返回明确错误", () => {
  const dir = mkdtempSync(join(tmpdir(), "data-ai-model-"));
  const invalidPath = join(dir, "invalid.json");

  try {
    writeFileSync(invalidPath, JSON.stringify({ deliverable: {} }), "utf-8");
    const result = spawnSync(process.execPath, [validateModelScript, invalidPath], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /VALIDATION FAILED/);
    assert.match(result.stdout, /Missing top-level keys/);
    assert.match(result.stdout, /'deliverable' missing 'description'/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("optimize-prompt.mjs 运行本地 mock 演示并写出结果历史", () => {
  const dir = mkdtempSync(join(tmpdir(), "data-ai-prompt-"));

  try {
    const result = spawnSync(process.execPath, [optimizePromptScript], {
      cwd: dir,
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Optimization Complete/);
    assert.match(result.stdout, /Best Accuracy: 1\.00/);

    const history = JSON.parse(readFileSync(join(dir, "optimization_results.json"), "utf-8"));
    assert.equal(history.length, 1);
    assert.equal(history[0].iteration, 0);
    assert.equal(history[0].metrics.avg_accuracy, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
