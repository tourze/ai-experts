import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const skillRoot = resolve("plugins/finance-expert/skills/kelly-sizing");
const kellyScript = resolve(skillRoot, "scripts/kelly_sizer.mjs");
const sampleData = resolve(skillRoot, "assets/kelly_sizing_sample.json");
const expectedOutput = resolve(skillRoot, "assets/expected_output.json");

function runKelly(args = []) {
  const result = spawnSync("node", [kellyScript, sampleData, ...args], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function runWithPayload(payload, args = []) {
  const dir = mkdtempSync(join(tmpdir(), "kelly-sizing-"));
  const inputFile = join(dir, "input.json");

  try {
    writeFileSync(inputFile, JSON.stringify(payload), "utf-8");
    return spawnSync("node", [kellyScript, inputFile, ...args], {
      encoding: "utf-8",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("kelly_sizer.mjs 通过语法检查", () => {
  const result = spawnSync("node", ["--check", kellyScript], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
});

test("kelly_sizer.mjs 接受聚合样例并输出稳定 JSON", () => {
  const output = runKelly(["--format", "json"]);
  const expected = JSON.parse(readFileSync(expectedOutput, "utf-8"));

  assert.deepEqual(output, expected);
});

test("kelly_sizer.mjs 支持单 section 输出", () => {
  const output = runKelly(["--section", "multi", "--format", "json"]);

  assert.deepEqual(Object.keys(output), ["multi"]);
  assert.equal(output.multi.dependence_haircut, 0.5);
  assert.equal(output.multi.total_allocation_fraction, 0.071875);
});

test("kelly_sizer.mjs 对负期望二元机会输出 no_allocation", () => {
  const result = runWithPayload({
    capital_base: 10000,
    binary: {
      win_probability: 0.4,
      win_return_multiple: 1,
      loss_multiple: 1,
    },
  }, ["--section", "binary", "--format", "json"]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.binary.action, "no_allocation");
  assert.equal(output.binary.allocation_fraction, 0);
  assert.deepEqual(output.binary.warnings, ["expected_edge_non_positive"]);
});

test("kelly_sizer.mjs 拒绝缺失资金池输入", () => {
  const result = runWithPayload({
    binary: {
      win_probability: 0.58,
      win_return_multiple: 1.2,
      loss_multiple: 1,
    },
  }, ["--section", "binary", "--format", "json"]);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /required field "capital_base" must be a finite number/);
});

test("kelly_sizer.mjs 拒绝概率和不等于 1 的情景输入", () => {
  const result = runWithPayload({
    capital_base: 10000,
    scenario: {
      scenarios: [
        { probability: 0.4, return_multiple: -0.3 },
        { probability: 0.4, return_multiple: 0.5 },
      ],
    },
  }, ["--section", "scenario", "--format", "json"]);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /scenario probabilities must sum to 1/);
});
