import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const skillRoot = resolve("plugins/finance-expert/skills/risk-metrics-calculation");
const riskScript = resolve(skillRoot, "scripts/risk_metrics_calculator.mjs");
const sampleData = resolve(skillRoot, "assets/risk_metrics_sample.json");
const expectedOutput = resolve(skillRoot, "assets/expected_output.json");

function runRisk(args = []) {
  const result = spawnSync("node", [riskScript, sampleData, ...args], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function runWithPayload(payload, args = []) {
  const dir = mkdtempSync(join(tmpdir(), "risk-metrics-"));
  const inputFile = join(dir, "input.json");

  try {
    writeFileSync(inputFile, JSON.stringify(payload), "utf-8");
    return spawnSync("node", [riskScript, inputFile, ...args], {
      encoding: "utf-8",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("risk_metrics_calculator.mjs 通过语法检查", () => {
  const result = spawnSync("node", ["--check", riskScript], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
});

test("risk_metrics_calculator.mjs 接受聚合样例并输出稳定 JSON", () => {
  const output = runRisk(["--format", "json"]);
  const expected = JSON.parse(readFileSync(expectedOutput, "utf-8"));

  assert.deepEqual(output, expected);
});

test("risk_metrics_calculator.mjs 支持单 section 输出", () => {
  const output = runRisk(["--section", "portfolio", "--format", "json"]);

  assert.deepEqual(Object.keys(output), ["portfolio"]);
  assert.equal(output.portfolio.assets.length, 3);
  assert.equal(output.portfolio.diversification_ratio, 1.181654);
});

test("risk_metrics_calculator.mjs 拒绝百分数收益率输入", () => {
  const result = runWithPayload({ returns: [1.2, -0.8, 0.5] }, ["--format", "json"]);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /must use decimal returns, not percentages/);
});

test("risk_metrics_calculator.mjs 拒绝权重不等于 1 的组合", () => {
  const result = runWithPayload({
    portfolio: {
      returns: {
        equity: [0.01, 0.02, -0.01],
        bond: [0.001, 0.002, 0.001],
      },
      weights: {
        equity: 0.7,
        bond: 0.2,
      },
    },
  }, ["--section", "portfolio", "--format", "json"]);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /portfolio weights must sum to 1/);
});
