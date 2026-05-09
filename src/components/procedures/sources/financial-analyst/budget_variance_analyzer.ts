#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
/**
 * Budget Variance Analyzer
 *
 * Analyzes actual vs budget vs prior year performance with materiality
 * threshold filtering, favorable/unfavorable classification, and
 * department/category breakdown.
 *
 * Usage:
 *   node budget_variance_analyzer.mjs assets/budget_variance_sample.json
 *   node budget_variance_analyzer.mjs assets/budget_variance_sample.json --format json
 *   node budget_variance_analyzer.mjs assets/budget_variance_sample.json --threshold-pct 5 --threshold-amt 25000
 */
import { readFileSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "financial-analyst-budget-variance-analyzer",
  entry: procedureEntry(import.meta.url),
  description:
    "分析实际 vs 预算 vs 上年同期偏差，按重要性阈值过滤、有利/不利分类，支持部门/类别明细汇总。",
  owners: { skillIds: ["financial-analyst"] },
  target: "scripts/budget_variance_analyzer.mjs",
  runtime: "node",
  params: [
    {
      flag: "--format",
      type: "text|json",
      description: "输出格式（默认 text）",
      required: false,
    },
    {
      flag: "--threshold-pct",
      type: "数字",
      description: "重要性阈值百分比（默认 10.0）",
      required: false,
    },
    {
      flag: "--threshold-amt",
      type: "数字",
      description: "重要性阈值金额（默认 50000.0）",
      required: false,
    },
    {
      flag: "[input-file]",
      type: "路径",
      description: "包含 actual/budget/prior 数据的 JSON 输入文件（必填）",
      required: true,
    },
  ],

  exampleArgs: {
    args: [
      "assets/budget_variance_sample.json",
      "--threshold-pct",
      "5",
      "--threshold-amt",
      "25000",
    ],
  },
});

const VALID_FORMATS = new Set(["text", "json"]);
const REVENUE_TYPES = new Set(["revenue", "income", "sales"]);
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
  if ("line_items" in data) {
    return data;
  }
  const wrapped = data.budget_variance;
  if (wrapped && typeof wrapped === "object" && !Array.isArray(wrapped)) {
    return wrapped;
  }
  return data;
}
function isRevenueType(lineType: any): any {
  return REVENUE_TYPES.has(String(lineType).toLowerCase());
}
class BudgetVarianceAnalyzer {
  company: any;
  lineItems: any;
  materialVariances: any;
  period: any;
  summary: any;
  thresholdAmt: any;
  thresholdPct: any;
  variances: any;
  constructor(
    data: any,
    thresholdPct: any = 10.0,
    thresholdAmt: any = 50000.0,
  ) {
    this.lineItems = data.line_items ?? [];
    this.period = data.period ?? "Current Period";
    this.company = data.company ?? "Company";
    this.thresholdPct = thresholdPct;
    this.thresholdAmt = thresholdAmt;
    this.variances = [];
    this.materialVariances = [];
    this.summary = {};
  }
  classifyFavorability(lineType: any, varianceAmount: any): any {
    if (isRevenueType(lineType)) {
      return varianceAmount > 0 ? "Favorable" : "Unfavorable";
    }
    return varianceAmount < 0 ? "Favorable" : "Unfavorable";
  }
  calculateVariances(): any {
    this.variances = [];
    for (const item of this.lineItems) {
      const name = item.name ?? "Unknown";
      const lineType = item.type ?? "expense";
      const department = item.department ?? "General";
      const category = item.category ?? "Other";
      const actual = item.actual ?? 0;
      const budget = item.budget ?? 0;
      const priorYear = item.prior_year ?? null;
      const budgetVarAmt = actual - budget;
      const budgetVarPct = safeDivide(budgetVarAmt, budget) * 100;
      const pyVarAmt = priorYear !== null ? actual - priorYear : null;
      const pyVarPct =
        priorYear !== null ? safeDivide(pyVarAmt, priorYear) * 100 : null;
      const favorability = this.classifyFavorability(lineType, budgetVarAmt);
      const isMaterial =
        Math.abs(budgetVarPct) >= this.thresholdPct ||
        Math.abs(budgetVarAmt) >= this.thresholdAmt;
      this.variances.push({
        name,
        type: lineType,
        department,
        category,
        actual,
        budget,
        prior_year: priorYear,
        budget_variance_amount: budgetVarAmt,
        budget_variance_pct: round(budgetVarPct, 2),
        prior_year_variance_amount: pyVarAmt,
        prior_year_variance_pct: pyVarPct !== null ? round(pyVarPct, 2) : null,
        favorability,
        is_material: isMaterial,
      });
    }
    this.materialVariances = this.variances.filter(
      (variance: any) => variance.is_material,
    );
    return this.variances;
  }
  departmentSummary(): any {
    const departments: Record<string, any> = {};
    for (const variance of this.variances) {
      const department = variance.department;
      if (!(department in departments)) {
        departments[department] = {
          total_actual: 0.0,
          total_budget: 0.0,
          total_variance: 0.0,
          favorable_count: 0,
          unfavorable_count: 0,
          line_count: 0,
        };
      }
      const summary = departments[department];
      summary.total_actual += variance.actual;
      summary.total_budget += variance.budget;
      summary.total_variance += variance.budget_variance_amount;
      summary.line_count += 1;
      if (variance.favorability === "Favorable") {
        summary.favorable_count += 1;
      } else {
        summary.unfavorable_count += 1;
      }
    }
    for (const summary of Object.values(departments)) {
      summary.variance_pct = round(
        safeDivide(summary.total_variance, summary.total_budget) * 100,
        2,
      );
    }
    return departments;
  }
  categorySummary(): any {
    const categories: Record<string, any> = {};
    for (const variance of this.variances) {
      const category = variance.category;
      if (!(category in categories)) {
        categories[category] = {
          total_actual: 0.0,
          total_budget: 0.0,
          total_variance: 0.0,
          line_count: 0,
        };
      }
      const summary = categories[category];
      summary.total_actual += variance.actual;
      summary.total_budget += variance.budget;
      summary.total_variance += variance.budget_variance_amount;
      summary.line_count += 1;
    }
    for (const summary of Object.values(categories)) {
      summary.variance_pct = round(
        safeDivide(summary.total_variance, summary.total_budget) * 100,
        2,
      );
    }
    return categories;
  }
  generateExecutiveSummary(): any {
    const revenueVariances = this.variances.filter((variance: any) =>
      isRevenueType(variance.type),
    );
    const expenseVariances = this.variances.filter(
      (variance: any) => !isRevenueType(variance.type),
    );
    const totalActual = sumBy(revenueVariances, "actual");
    const totalBudget = sumBy(revenueVariances, "budget");
    const totalExpenseActual = sumBy(expenseVariances, "actual");
    const totalExpenseBudget = sumBy(expenseVariances, "budget");
    const revenueVariance = totalActual - totalBudget;
    const expenseVariance = totalExpenseActual - totalExpenseBudget;
    const favorableCount = this.variances.filter(
      (variance: any) => variance.favorability === "Favorable",
    ).length;
    const unfavorableCount = this.variances.filter(
      (variance: any) => variance.favorability === "Unfavorable",
    ).length;
    this.summary = {
      period: this.period,
      company: this.company,
      total_line_items: this.variances.length,
      material_variances_count: this.materialVariances.length,
      favorable_count: favorableCount,
      unfavorable_count: unfavorableCount,
      revenue: {
        actual: totalActual,
        budget: totalBudget,
        variance_amount: revenueVariance,
        variance_pct: round(safeDivide(revenueVariance, totalBudget) * 100, 2),
      },
      expenses: {
        actual: totalExpenseActual,
        budget: totalExpenseBudget,
        variance_amount: expenseVariance,
        variance_pct: round(
          safeDivide(expenseVariance, totalExpenseBudget) * 100,
          2,
        ),
      },
      net_impact: revenueVariance - expenseVariance,
      materiality_thresholds: {
        percentage: this.thresholdPct,
        amount: this.thresholdAmt,
      },
    };
    return this.summary;
  }
  runAnalysis(): any {
    this.calculateVariances();
    const deptSummary = this.departmentSummary();
    const catSummary = this.categorySummary();
    const execSummary = this.generateExecutiveSummary();
    return {
      executive_summary: execSummary,
      all_variances: this.variances,
      material_variances: this.materialVariances,
      department_summary: deptSummary,
      category_summary: catSummary,
    };
  }
  formatText(results: any): any {
    const lines: any[] = [];
    lines.push("=".repeat(70));
    lines.push("BUDGET VARIANCE ANALYSIS");
    lines.push("=".repeat(70));
    const summary = results.executive_summary;
    lines.push(`\n  Company: ${summary.company}`);
    lines.push(`  Period:  ${summary.period}`);
    lines.push("\n--- EXECUTIVE SUMMARY ---");
    const revenue = summary.revenue;
    const expenses = summary.expenses;
    lines.push(
      `  Revenue:  Actual ${formatMoney(revenue.actual)} vs Budget ${formatMoney(revenue.budget)} ` +
        `(${formatMoney(revenue.variance_amount)}, ${formatSignedPct(revenue.variance_pct)})`,
    );
    lines.push(
      `  Expenses: Actual ${formatMoney(expenses.actual)} vs Budget ${formatMoney(expenses.budget)} ` +
        `(${formatMoney(expenses.variance_amount)}, ${formatSignedPct(expenses.variance_pct)})`,
    );
    lines.push(`  Net Impact: ${formatMoney(summary.net_impact)}`);
    lines.push(
      `  Total Items: ${summary.total_line_items}  |  Material: ${summary.material_variances_count}  |  ` +
        `Favorable: ${summary.favorable_count}  |  Unfavorable: ${summary.unfavorable_count}`,
    );
    if (results.material_variances.length > 0) {
      lines.push("\n--- MATERIAL VARIANCES ---");
      lines.push(
        `  (Threshold: ${this.thresholdPct}% or $${formatNumber(this.thresholdAmt, 0)})`,
      );
      for (const variance of results.material_variances) {
        lines.push(`\n  ${variance.name} (${variance.department})`);
        lines.push(
          `    Actual: ${formatMoney(variance.actual)} | Budget: ${formatMoney(variance.budget)}`,
        );
        lines.push(
          `    Variance: ${formatMoney(variance.budget_variance_amount)} ` +
            `(${formatSignedPct(variance.budget_variance_pct)}) - ${variance.favorability}`,
        );
      }
    }
    if (Object.keys(results.department_summary).length > 0) {
      lines.push("\n--- DEPARTMENT SUMMARY ---");
      for (const [department, summaryData] of Object.entries(
        results.department_summary as Record<string, any>,
      )) {
        lines.push(
          `  ${department}: Variance ${formatMoney(summaryData.total_variance)} ` +
            `(${formatSignedPct(summaryData.variance_pct)}) | Fav: ${summaryData.favorable_count} / ` +
            `Unfav: ${summaryData.unfavorable_count}`,
        );
      }
    }
    if (Object.keys(results.category_summary).length > 0) {
      lines.push("\n--- CATEGORY SUMMARY ---");
      for (const [category, summaryData] of Object.entries(
        results.category_summary as Record<string, any>,
      )) {
        lines.push(
          `  ${category}: Variance ${formatMoney(summaryData.total_variance)} (${formatSignedPct(summaryData.variance_pct)})`,
        );
      }
    }
    lines.push(`\n${"=".repeat(70)}`);
    return lines.join("\n");
  }
}
function sumBy(items: any, key: any): any {
  return items.reduce((sum: any, item: any) => sum + item[key], 0);
}
function formatMoney(value: any): any {
  const sign = value > 0 ? "+" : "";
  if (Math.abs(value) >= 1e6) {
    return `${sign}$${formatNumber(value / 1e6, 2)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `${sign}$${formatNumber(value / 1e3, 1)}K`;
  }
  return `${sign}$${formatNumber(value, 2)}`;
}
function formatNumber(value: any, places: any): any {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
}
function formatSignedPct(value: any): any {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    inputFile: null,
    format: "text",
    thresholdPct: 10.0,
    thresholdAmt: 50000.0,
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
    } else if (arg === "--threshold-pct") {
      const value = Number.parseFloat(argv[index + 1]);
      if (!Number.isFinite(value)) {
        throw new Error("argument --threshold-pct: invalid float value");
      }
      args.thresholdPct = value;
      index += 1;
    } else if (arg === "--threshold-amt") {
      const value = Number.parseFloat(argv[index + 1]);
      if (!Number.isFinite(value)) {
        throw new Error("argument --threshold-amt: invalid float value");
      }
      args.thresholdAmt = value;
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
    "Usage: budget_variance_analyzer.mjs <input_file> [--format text|json] [--threshold-pct N] [--threshold-amt N]",
    "",
    "Analyze budget variances with materiality filtering.",
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
  const analyzer = new BudgetVarianceAnalyzer(
    normalizeInputData(data),
    args.thresholdPct,
    args.thresholdAmt,
  );
  const results = analyzer.runAnalysis();
  if (args.format === "json") {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(analyzer.formatText(results));
  }
}
