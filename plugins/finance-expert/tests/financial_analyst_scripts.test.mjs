import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/finance-expert");
const financialAnalystRoot = resolve(pluginRoot, "skills/financial-analyst");
const ratioScript = resolve(financialAnalystRoot, "scripts/ratio_calculator.mjs");
const sampleData = resolve(financialAnalystRoot, "assets/sample_financial_data.json");

function runRatio(args = []) {
  const result = spawnSync("node", [ratioScript, sampleData, ...args], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("ratio_calculator.mjs 通过语法检查", () => {
  const result = spawnSync("node", ["--check", ratioScript], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
});

test("ratio_calculator.mjs 接受聚合样例并输出稳定 JSON", () => {
  const output = runRatio(["--format", "json"]);

  assert.equal(output.categories.profitability.roe.value, 0.25);
  assert.equal(output.categories.profitability.roe.interpretation, "Good - above average performance");
  assert.equal(output.categories.liquidity.current_ratio.value, 1.875);
  assert.equal(output.categories.leverage.debt_to_equity.value, 0.5454545454545454);
  assert.equal(output.categories.efficiency.dso.value, 43.8);
  assert.equal(output.categories.valuation.ev_ebitda.value, 45.7);
});

test("ratio_calculator.mjs 支持单分类输出", () => {
  const output = runRatio(["--category", "profitability", "--format", "json"]);

  assert.equal(output.category, "profitability");
  assert.deepEqual(Object.keys(output.ratios), ["roe", "roa", "gross_margin", "operating_margin", "net_margin"]);
});
