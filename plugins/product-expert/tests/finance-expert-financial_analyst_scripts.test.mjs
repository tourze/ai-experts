import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/finance-expert");
const financialAnalystRoot = resolve(pluginRoot, "skills/financial-analyst");
const ratioScript = resolve(financialAnalystRoot, "scripts/ratio_calculator.mjs");
const ratioValidationScript = resolve(financialAnalystRoot, "scripts/ratio_input_validation.mjs");
const dcfScript = resolve(financialAnalystRoot, "scripts/dcf_valuation.mjs");
const budgetScript = resolve(financialAnalystRoot, "scripts/budget_variance_analyzer.mjs");
const forecastScript = resolve(financialAnalystRoot, "scripts/forecast_builder.mjs");
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

function runBudget(args = []) {
  const result = spawnSync("node", [budgetScript, sampleData, ...args], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function runForecast(args = []) {
  const result = spawnSync("node", [forecastScript, sampleData, ...args], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function runScriptWithPayload(script, payload, args = []) {
  const dir = mkdtempSync(join(tmpdir(), "financial-analyst-"));
  const inputFile = join(dir, "input.json");

  try {
    writeFileSync(inputFile, JSON.stringify(payload), "utf-8");
    return spawnSync("node", [script, inputFile, ...args], {
      encoding: "utf-8",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("financial analyst Node CLI 通过语法检查", () => {
  for (const script of [ratioScript, ratioValidationScript, dcfScript, budgetScript, forecastScript]) {
    const result = spawnSync("node", ["--check", script], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
  }
});

test("forecast_builder.mjs 接受聚合样例并输出稳定 JSON", () => {
  const output = runForecast(["--format", "json"]);

  assert.deepEqual(output.trend_analysis.trend, {
    slope: 670238.1,
    intercept: 9746428.57,
    r_squared: 0.9666,
    direction: "upward",
  });
  assert.equal(output.scenario_comparison.scenarios.base.total_revenue, 172121973.32);
  assert.equal(output.scenario_comparison.scenarios.bull.total_operating_income, 31664847.09);
  assert.equal(output.rolling_cash_flow.closing_balance, 2647500);
  assert.equal(output.rolling_cash_flow.minimum_balance_week, 3);
  assert.equal(output.rolling_cash_flow.cash_runway_weeks, 11);
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

test("ratio_calculator.mjs 拒绝缺失必填字段", () => {
  const result = runScriptWithPayload(ratioScript, { "Net Revenue": 1000 }, ["--category", "profitability", "--format", "json"]);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /missing required fields/);
  assert.match(result.stderr, /income_statement\.revenue/);
  assert.match(result.stderr, /balance_sheet\.total_equity/);
});

test("ratio_calculator.mjs 拒绝非数值必填字段", () => {
  const result = runScriptWithPayload(ratioScript, {
    income_statement: {
      revenue: "1000",
      cost_of_goods_sold: 500,
      operating_income: 100,
      net_income: 80,
    },
    balance_sheet: {
      total_equity: 400,
      total_assets: 1000,
    },
  }, ["--category", "profitability", "--format", "json"]);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /required field "income_statement\.revenue" must be finite number/);
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

test("budget_variance_analyzer.mjs 接受聚合样例并输出稳定 JSON", () => {
  const output = runBudget(["--format", "json"]);

  assert.equal(output.executive_summary.total_line_items, 10);
  assert.equal(output.executive_summary.material_variances_count, 9);
  assert.equal(output.executive_summary.net_impact, -535000);
  assert.equal(output.all_variances[0].budget_variance_amount, 500000);
  assert.equal(output.all_variances[5].is_material, false);
  assert.equal(output.department_summary.Sales.total_variance, 175000);
  assert.equal(output.category_summary["Sales & Marketing"].variance_pct, 8.62);
});

test("budget_variance_analyzer.mjs 支持自定义重要性阈值", () => {
  const output = runBudget(["--threshold-pct", "5", "--threshold-amt", "25000", "--format", "json"]);

  assert.equal(output.executive_summary.material_variances_count, 10);
  assert.equal(output.executive_summary.materiality_thresholds.percentage, 5);
  assert.equal(output.executive_summary.materiality_thresholds.amount, 25000);
  assert.equal(output.material_variances[5].name, "Software & Technology");
});
