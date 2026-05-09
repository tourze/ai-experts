#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
/**
 * DCF Valuation Model
 *
 * Discounted Cash Flow enterprise and equity valuation with WACC calculation,
 * terminal value estimation, and two-way sensitivity analysis.
 *
 * Usage:
 *   node dcf_valuation.mjs assets/dcf_valuation_sample.json
 *   node dcf_valuation.mjs assets/dcf_valuation_sample.json --format json
 *   node dcf_valuation.mjs assets/dcf_valuation_sample.json --projection-years 7
 */
import { readFileSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "financial-analyst-dcf-valuation",
  entry: procedureEntry(import.meta.url),
  description:
    "折现现金流企业价值与股权价值估值，含 WACC 计算、终值估算和双变量敏感性分析。",
  owners: { skillIds: ["financial-analyst"] },
  target: "scripts/dcf_valuation.mjs",
  runtime: "node",
  params: [
    {
      flag: "--format",
      type: "text|json",
      description: "输出格式（默认 text）",
      required: false,
    },
    {
      flag: "--projection-years",
      type: "数字",
      description:
        "预测年数（默认从输入 assumptions.projection_years 读取，否则 5）",
      required: false,
    },
  ],

  exampleArgs: {
    args: ["assets/dcf_valuation_sample.json", "--projection-years", "7"],
  },
});

const VALID_FORMATS = new Set(["text", "json"]);
function safeDivide(
  numerator: any,
  denominator: any,
  defaultValue: any = 0.0,
): any {
  if (denominator === 0 || denominator === null || denominator === undefined) {
    return defaultValue;
  }
  return numerator / denominator;
}
function round(value: any, places: any = 0): any {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
function normalizeInputData(data: any): any {
  if ("historical" in data || "assumptions" in data) {
    return data;
  }
  const wrapped = data.dcf_valuation;
  if (wrapped && typeof wrapped === "object" && !Array.isArray(wrapped)) {
    return wrapped;
  }
  return data;
}
class DCFModel {
  assumptions: any;
  enterpriseValueExitMultiple: any;
  enterpriseValuePerpetuity: any;
  equityValueExitMultiple: any;
  equityValuePerpetuity: any;
  historical: any;
  projectedFcf: any;
  projectedRevenue: any;
  projectionYears: any;
  terminalValueExitMultiple: any;
  terminalValuePerpetuity: any;
  valuePerShareExitMultiple: any;
  valuePerSharePerpetuity: any;
  wacc: any;
  constructor() {
    this.historical = {};
    this.assumptions = {};
    this.wacc = 0.0;
    this.projectedRevenue = [];
    this.projectedFcf = [];
    this.projectionYears = 5;
    this.terminalValuePerpetuity = 0.0;
    this.terminalValueExitMultiple = 0.0;
    this.enterpriseValuePerpetuity = 0.0;
    this.enterpriseValueExitMultiple = 0.0;
    this.equityValuePerpetuity = 0.0;
    this.equityValueExitMultiple = 0.0;
    this.valuePerSharePerpetuity = 0.0;
    this.valuePerShareExitMultiple = 0.0;
  }
  setHistoricalFinancials(historical: any): any {
    this.historical = historical;
  }
  setAssumptions(assumptions: any): any {
    this.assumptions = assumptions;
    this.projectionYears = assumptions.projection_years ?? 5;
  }
  calculateWacc(): any {
    const waccInputs = this.assumptions.wacc_inputs ?? {};
    const riskFreeRate = waccInputs.risk_free_rate ?? 0.04;
    const equityRiskPremium = waccInputs.equity_risk_premium ?? 0.06;
    const beta = waccInputs.beta ?? 1.0;
    const costOfDebt = waccInputs.cost_of_debt ?? 0.05;
    const taxRate = waccInputs.tax_rate ?? 0.25;
    const debtWeight = waccInputs.debt_weight ?? 0.3;
    const equityWeight = waccInputs.equity_weight ?? 0.7;
    const costOfEquity = riskFreeRate + beta * equityRiskPremium;
    const afterTaxCostOfDebt = costOfDebt * (1 - taxRate);
    this.wacc = equityWeight * costOfEquity + debtWeight * afterTaxCostOfDebt;
    return this.wacc;
  }
  projectCashFlows(): any {
    const baseRevenue = this.historical.revenue ?? [];
    if (baseRevenue.length === 0) {
      throw new Error("Historical revenue data is required");
    }
    const revenueGrowthRates = this.assumptions.revenue_growth_rates ?? [];
    const fcfMargins = this.assumptions.fcf_margins ?? [];
    const defaultGrowth = this.assumptions.default_revenue_growth ?? 0.05;
    const defaultFcfMargin = this.assumptions.default_fcf_margin ?? 0.1;
    this.projectedRevenue = [];
    this.projectedFcf = [];
    let currentRevenue = baseRevenue.at(-1);
    for (let year = 0; year < this.projectionYears; year += 1) {
      const growth =
        year < revenueGrowthRates.length
          ? revenueGrowthRates[year]
          : defaultGrowth;
      const fcfMargin =
        year < fcfMargins.length ? fcfMargins[year] : defaultFcfMargin;
      currentRevenue *= 1 + growth;
      const fcf = currentRevenue * fcfMargin;
      this.projectedRevenue.push(currentRevenue);
      this.projectedFcf.push(fcf);
    }
    return [this.projectedRevenue, this.projectedFcf];
  }
  calculateTerminalValue(): any {
    if (this.projectedFcf.length === 0) {
      throw new Error("Must project cash flows before terminal value");
    }
    const terminalFcf = this.projectedFcf.at(-1);
    const terminalGrowth = this.assumptions.terminal_growth_rate ?? 0.025;
    const exitMultiple = this.assumptions.exit_ev_ebitda_multiple ?? 12.0;
    if (this.wacc > terminalGrowth) {
      this.terminalValuePerpetuity =
        (terminalFcf * (1 + terminalGrowth)) / (this.wacc - terminalGrowth);
    } else {
      this.terminalValuePerpetuity = 0.0;
    }
    const terminalRevenue = this.projectedRevenue.at(-1);
    const ebitdaMargin = this.assumptions.terminal_ebitda_margin ?? 0.2;
    const terminalEbitda = terminalRevenue * ebitdaMargin;
    this.terminalValueExitMultiple = terminalEbitda * exitMultiple;
    return [this.terminalValuePerpetuity, this.terminalValueExitMultiple];
  }
  calculateEnterpriseValue(): any {
    if (this.projectedFcf.length === 0) {
      throw new Error("Must project cash flows first");
    }
    let pvFcf = 0.0;
    for (let index = 0; index < this.projectedFcf.length; index += 1) {
      const discountFactor = (1 + this.wacc) ** (index + 1);
      pvFcf += this.projectedFcf[index] / discountFactor;
    }
    const terminalDiscount = (1 + this.wacc) ** this.projectionYears;
    const pvTvPerpetuity = this.terminalValuePerpetuity / terminalDiscount;
    const pvTvExit = this.terminalValueExitMultiple / terminalDiscount;
    this.enterpriseValuePerpetuity = pvFcf + pvTvPerpetuity;
    this.enterpriseValueExitMultiple = pvFcf + pvTvExit;
    return [this.enterpriseValuePerpetuity, this.enterpriseValueExitMultiple];
  }
  calculateEquityValue(): any {
    const netDebt = this.historical.net_debt ?? 0;
    const sharesOutstanding = this.historical.shares_outstanding ?? 1;
    this.equityValuePerpetuity = this.enterpriseValuePerpetuity - netDebt;
    this.equityValueExitMultiple = this.enterpriseValueExitMultiple - netDebt;
    this.valuePerSharePerpetuity = safeDivide(
      this.equityValuePerpetuity,
      sharesOutstanding,
    );
    this.valuePerShareExitMultiple = safeDivide(
      this.equityValueExitMultiple,
      sharesOutstanding,
    );
    return [this.equityValuePerpetuity, this.equityValueExitMultiple];
  }
  sensitivityAnalysis(waccRange: any = null, growthRange: any = null): any {
    let resolvedWaccRange = waccRange;
    let resolvedGrowthRange = growthRange;
    if (resolvedWaccRange === null) {
      const baseWacc = this.wacc;
      resolvedWaccRange = [
        round(baseWacc - 0.02, 4),
        round(baseWacc - 0.01, 4),
        round(baseWacc, 4),
        round(baseWacc + 0.01, 4),
        round(baseWacc + 0.02, 4),
      ];
    }
    if (resolvedGrowthRange === null) {
      const baseGrowth = this.assumptions.terminal_growth_rate ?? 0.025;
      resolvedGrowthRange = [
        round(baseGrowth - 0.01, 4),
        round(baseGrowth - 0.005, 4),
        round(baseGrowth, 4),
        round(baseGrowth + 0.005, 4),
        round(baseGrowth + 0.01, 4),
      ];
    }
    const evTable = Array.from({ length: resolvedWaccRange.length }, () =>
      Array(resolvedGrowthRange.length).fill(0.0),
    );
    const sharePriceTable = Array.from(
      { length: resolvedWaccRange.length },
      () => Array(resolvedGrowthRange.length).fill(0.0),
    );
    const terminalFcf =
      this.projectedFcf.length > 0 ? this.projectedFcf.at(-1) : 0;
    for (let row = 0; row < resolvedWaccRange.length; row += 1) {
      const waccVal = resolvedWaccRange[row];
      for (let col = 0; col < resolvedGrowthRange.length; col += 1) {
        const growthVal = resolvedGrowthRange[col];
        if (waccVal <= growthVal) {
          evTable[row][col] = Infinity;
          sharePriceTable[row][col] = Infinity;
          continue;
        }
        let pvFcf = 0.0;
        for (let index = 0; index < this.projectedFcf.length; index += 1) {
          pvFcf += this.projectedFcf[index] / (1 + waccVal) ** (index + 1);
        }
        const tv = (terminalFcf * (1 + growthVal)) / (waccVal - growthVal);
        const pvTv = tv / (1 + waccVal) ** this.projectionYears;
        const ev = pvFcf + pvTv;
        evTable[row][col] = round(ev, 2);
        const netDebt = this.historical.net_debt ?? 0;
        const shares = this.historical.shares_outstanding ?? 1;
        const equity = ev - netDebt;
        sharePriceTable[row][col] = round(safeDivide(equity, shares), 2);
      }
    }
    return {
      wacc_values: resolvedWaccRange,
      growth_values: resolvedGrowthRange,
      enterprise_value_table: evTable,
      share_price_table: sharePriceTable,
    };
  }
  runFullValuation(): any {
    this.calculateWacc();
    this.projectCashFlows();
    this.calculateTerminalValue();
    this.calculateEnterpriseValue();
    this.calculateEquityValue();
    const sensitivity = this.sensitivityAnalysis();
    return {
      wacc: this.wacc,
      projected_revenue: this.projectedRevenue,
      projected_fcf: this.projectedFcf,
      terminal_value: {
        perpetuity_growth: this.terminalValuePerpetuity,
        exit_multiple: this.terminalValueExitMultiple,
      },
      enterprise_value: {
        perpetuity_growth: this.enterpriseValuePerpetuity,
        exit_multiple: this.enterpriseValueExitMultiple,
      },
      equity_value: {
        perpetuity_growth: this.equityValuePerpetuity,
        exit_multiple: this.equityValueExitMultiple,
      },
      value_per_share: {
        perpetuity_growth: this.valuePerSharePerpetuity,
        exit_multiple: this.valuePerShareExitMultiple,
      },
      sensitivity_analysis: sensitivity,
    };
  }
  formatText(results: any): any {
    const lines: any[] = [];
    lines.push("=".repeat(70));
    lines.push("DCF VALUATION ANALYSIS");
    lines.push("=".repeat(70));
    lines.push("\n--- WACC ---");
    lines.push(
      `  Weighted Average Cost of Capital: ${(results.wacc * 100).toFixed(2)}%`,
    );
    lines.push("\n--- REVENUE PROJECTIONS ---");
    results.projected_revenue.forEach((revenue: any, index: any) => {
      lines.push(`  Year ${index + 1}: ${formatMoney(revenue)}`);
    });
    lines.push("\n--- FREE CASH FLOW PROJECTIONS ---");
    results.projected_fcf.forEach((fcf: any, index: any) => {
      lines.push(`  Year ${index + 1}: ${formatMoney(fcf)}`);
    });
    lines.push("\n--- TERMINAL VALUE ---");
    lines.push(
      `  Perpetuity Growth Method: ${formatMoney(results.terminal_value.perpetuity_growth)}`,
    );
    lines.push(
      `  Exit Multiple Method:     ${formatMoney(results.terminal_value.exit_multiple)}`,
    );
    lines.push("\n--- ENTERPRISE VALUE ---");
    lines.push(
      `  Perpetuity Growth Method: ${formatMoney(results.enterprise_value.perpetuity_growth)}`,
    );
    lines.push(
      `  Exit Multiple Method:     ${formatMoney(results.enterprise_value.exit_multiple)}`,
    );
    lines.push("\n--- EQUITY VALUE ---");
    lines.push(
      `  Perpetuity Growth Method: ${formatMoney(results.equity_value.perpetuity_growth)}`,
    );
    lines.push(
      `  Exit Multiple Method:     ${formatMoney(results.equity_value.exit_multiple)}`,
    );
    lines.push("\n--- VALUE PER SHARE ---");
    lines.push(
      `  Perpetuity Growth Method: $${formatNumber(results.value_per_share.perpetuity_growth, 2)}`,
    );
    lines.push(
      `  Exit Multiple Method:     $${formatNumber(results.value_per_share.exit_multiple, 2)}`,
    );
    const sensitivity = results.sensitivity_analysis;
    lines.push("\n--- SENSITIVITY ANALYSIS (Enterprise Value) ---");
    lines.push("  WACC vs Terminal Growth Rate");
    lines.push("");
    let header = `  ${"WACC \\ g".padStart(10)}`;
    for (const growth of sensitivity.growth_values) {
      header += `  ${`${(growth * 100).toFixed(1)}%`.padStart(8)}`;
    }
    lines.push(header);
    lines.push(`  ${"-".repeat(10 + 10 * sensitivity.growth_values.length)}`);
    for (let row = 0; row < sensitivity.wacc_values.length; row += 1) {
      let line = `  ${`${(sensitivity.wacc_values[row] * 100).toFixed(1)}%`.padStart(9)}`;
      for (let col = 0; col < sensitivity.growth_values.length; col += 1) {
        const value = sensitivity.enterprise_value_table[row][col];
        line += `  ${(value === Infinity ? "N/A" : formatMoney(value)).padStart(8)}`;
      }
      lines.push(line);
    }
    lines.push(`\n${"=".repeat(70)}`);
    return lines.join("\n");
  }
}
function formatMoney(value: any): any {
  if (value === Infinity) {
    return "N/A (WACC <= growth)";
  }
  if (Math.abs(value) >= 1e9) {
    return `$${formatNumber(value / 1e9, 2)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `$${formatNumber(value / 1e6, 2)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `$${formatNumber(value / 1e3, 1)}K`;
  }
  return `$${formatNumber(value, 2)}`;
}
function formatNumber(value: any, places: any): any {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
}
function sanitizeForJson(value: any): any {
  if (typeof value === "number" && !Number.isFinite(value)) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.map((item: any) => sanitizeForJson(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]: any) => [
        key,
        sanitizeForJson(item),
      ]),
    );
  }
  return value;
}
function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    inputFile: null,
    format: "text",
    projectionYears: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--format") {
      const value = argv[index + 1];
      if (!VALID_FORMATS.has(value)) {
        throw new Error("argument --format: invalid choice");
      }
      args.format = value;
      index += 1;
    } else if (arg === "--projection-years") {
      const value = Number.parseInt(argv[index + 1], 10);
      if (!Number.isInteger(value)) {
        throw new Error("argument --projection-years: invalid int value");
      }
      args.projectionYears = value;
      index += 1;
    } else if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else if (!arg.startsWith("-") && args.inputFile === null) {
      args.inputFile = arg;
    } else {
      throw new Error(`unrecognized arguments: ${arg}`);
    }
  }
  return args;
}
function usage(): any {
  return [
    "Usage: dcf_valuation.mjs <input_file> [--format text|json] [--projection-years N]",
    "",
    "DCF Valuation Model - Enterprise and equity valuation.",
  ].join("\n");
}
export function main(argv: readonly string[]): any {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 2;
    return;
  }
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.inputFile) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }
  let data;
  try {
    data = JSON.parse(readFileSync(args.inputFile, "utf-8"));
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      console.error(`Error: File '${args.inputFile}' not found.`);
      process.exitCode = 1;
      return;
    }
    if (error instanceof SyntaxError) {
      console.error(
        `Error: Invalid JSON in '${args.inputFile}': ${error.message}`,
      );
      process.exitCode = 1;
      return;
    }
    throw error;
  }
  const normalized = normalizeInputData(data);
  const model = new DCFModel();
  model.setHistoricalFinancials(normalized.historical ?? {});
  const assumptions: Record<string, any> = {
    ...(normalized.assumptions ?? {}),
  };
  if (args.projectionYears !== null) {
    assumptions.projection_years = args.projectionYears;
  }
  model.setAssumptions(assumptions);
  let results;
  try {
    results = model.runFullValuation();
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  if (args.format === "json") {
    console.log(JSON.stringify(sanitizeForJson(results), null, 2));
  } else {
    console.log(model.formatText(results));
  }
}
