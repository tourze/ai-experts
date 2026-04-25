import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/finance-expert");
const financialAnalystRoot = resolve(pluginRoot, "skills/financial-analyst");
const ratioScript = resolve(financialAnalystRoot, "scripts/ratio_calculator.mjs");
const dcfScript = resolve(financialAnalystRoot, "scripts/dcf_valuation.mjs");
const sampleData = resolve(financialAnalystRoot, "assets/sample_financial_data.json");

function runRatio(args = []) {
  const result = spawnSync("node", [ratioScript, sampleData, ...args], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function runDcf(args = []) {
  const result = spawnSync("node", [dcfScript, sampleData, ...args], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("financial analyst Node CLI 通过语法检查", () => {
  for (const script of [ratioScript, dcfScript]) {
    const result = spawnSync("node", ["--check", script], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
  }
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

test("dcf_valuation.mjs 接受聚合样例并输出稳定 JSON", () => {
  const output = runDcf(["--format", "json"]);

  assert.equal(output.wacc, 0.086575);
  assert.equal(output.projected_revenue.length, 5);
  assert.equal(output.projected_revenue[0], 55000000.00000001);
  assert.equal(output.terminal_value.perpetuity_growth, 171139424.18514016);
  assert.equal(output.enterprise_value.exit_multiple, 149345263.4269544);
  assert.equal(output.value_per_share.perpetuity_growth, 13.897515874028999);
  assert.equal(output.sensitivity_analysis.enterprise_value_table[2][2], 145913991.11);
});

test("dcf_valuation.mjs 支持覆盖预测年数", () => {
  const output = runDcf(["--projection-years", "7", "--format", "json"]);

  assert.equal(output.projected_revenue.length, 7);
  assert.equal(output.projected_fcf.length, 7);
  assert.equal(output.value_per_share.exit_multiple, 14.385616410356635);
  assert.equal(output.sensitivity_analysis.share_price_table[4][4], 9);
});
