#!/usr/bin/env node
/**
 * Forecast Builder
 *
 * Driver-based revenue forecasting with 13-week rolling cash flow projection,
 * scenario modeling, and trend analysis using simple linear regression.
 *
 * Usage:
 *   node forecast_builder.mjs assets/forecast_sample.json
 *   node forecast_builder.mjs assets/forecast_sample.json --format json
 *   node forecast_builder.mjs assets/forecast_sample.json --scenarios base,bull,bear
 */

import { existsSync, readFileSync } from "node:fs";

const VALID_FORMATS = new Set(["text", "json"]);

function safeDivide(numerator, denominator, defaultValue = 0.0) {
  if (denominator === 0 || denominator === null || denominator === undefined) {
    return defaultValue;
  }
  return numerator / denominator;
}

function mean(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function round(value, places = 0) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function normalizeInputData(data) {
  if ("historical_periods" in data || "cash_flow_inputs" in data) {
    return data;
  }

  const wrapped = data.forecast;
  if (wrapped && typeof wrapped === "object" && !Array.isArray(wrapped)) {
    return wrapped;
  }

  return data;
}

function simpleLinearRegression(xValues, yValues) {
  const n = xValues.length;
  if (n < 2 || n !== yValues.length) {
    return [0.0, 0.0, 0.0];
  }

  const xMean = mean(xValues);
  const yMean = mean(yValues);

  let ssXy = 0.0;
  let ssXx = 0.0;
  let ssYy = 0.0;

  for (let i = 0; i < n; i += 1) {
    ssXy += (xValues[i] - xMean) * (yValues[i] - yMean);
    ssXx += (xValues[i] - xMean) ** 2;
    ssYy += (yValues[i] - yMean) ** 2;
  }

  const slope = safeDivide(ssXy, ssXx);
  const intercept = yMean - slope * xMean;
  const rSquared = ssYy > 0 ? safeDivide(ssXy ** 2, ssXx * ssYy) : 0.0;

  return [slope, intercept, rSquared];
}

class ForecastBuilder {
  constructor(data) {
    this.historical = data.historical_periods ?? [];
    this.drivers = data.drivers ?? {};
    this.assumptions = data.assumptions ?? {};
    this.cashFlowInputs = data.cash_flow_inputs ?? {};
    this.scenariosConfig = data.scenarios ?? {};
    this.forecastPeriods = data.forecast_periods ?? 12;
  }

  analyzeTrends() {
    if (this.historical.length === 0) {
      return { error: "No historical data available" };
    }

    const revenues = this.historical.map((period) => period.revenue ?? 0);
    const periods = revenues.map((_, index) => index + 1);
    const [slope, intercept, rSquared] = simpleLinearRegression(
      periods.map((period) => Number(period)),
      revenues.map((revenue) => Number(revenue)),
    );

    const growthRates = [];
    for (let i = 1; i < revenues.length; i += 1) {
      if (revenues[i - 1] > 0) {
        growthRates.push((revenues[i] - revenues[i - 1]) / revenues[i - 1]);
      }
    }

    const avgGrowth = growthRates.length > 0 ? mean(growthRates) : 0.0;

    let seasonalityIndex = [];
    if (revenues.length >= 4) {
      const overallAvg = mean(revenues);
      if (overallAvg > 0) {
        seasonalityIndex = revenues.slice(-4).map((revenue) => revenue / overallAvg);
      }
    }

    return {
      trend: {
        slope: round(slope, 2),
        intercept: round(intercept, 2),
        r_squared: round(rSquared, 4),
        direction: slope > 0 ? "upward" : slope < 0 ? "downward" : "flat",
      },
      growth_rates: growthRates.map((growth) => round(growth, 4)),
      average_growth_rate: round(avgGrowth, 4),
      seasonality_index: seasonalityIndex.map((seasonality) => round(seasonality, 4)),
      historical_revenues: revenues,
    };
  }

  buildDriverBasedForecast(scenario = "base") {
    const scenarioAdjustments = this.scenariosConfig[scenario] ?? {};
    const growthAdjustment = scenarioAdjustments.growth_adjustment ?? 0.0;
    const marginAdjustment = scenarioAdjustments.margin_adjustment ?? 0.0;

    let baseRevenue = 0.0;
    if (this.historical.length > 0) {
      baseRevenue = this.historical[this.historical.length - 1].revenue ?? 0;
    }

    const unitDrivers = this.drivers.units ?? {};
    const priceDrivers = this.drivers.pricing ?? {};
    const baseGrowth = this.assumptions.revenue_growth_rate ?? 0.05;
    const adjustedGrowth = baseGrowth + growthAdjustment;
    const baseMargin = this.assumptions.gross_margin ?? 0.40;
    const adjustedMargin = baseMargin + marginAdjustment;
    const cogsPct = 1.0 - adjustedMargin;
    const opexPct = this.assumptions.opex_pct_revenue ?? 0.25;
    const forecastPeriods = [];
    let currentRevenue = baseRevenue;

    const hasUnitDrivers = Object.keys(unitDrivers).length > 0 && Object.keys(priceDrivers).length > 0;

    if (hasUnitDrivers) {
      const baseUnits = unitDrivers.base_units ?? 1000;
      const unitGrowth = (unitDrivers.growth_rate ?? 0.03) + growthAdjustment;
      const basePrice = priceDrivers.base_price ?? 100;
      const priceGrowth = priceDrivers.annual_increase ?? 0.02;

      let currentUnits = baseUnits;
      let currentPrice = basePrice;

      for (let period = 1; period <= this.forecastPeriods; period += 1) {
        currentUnits *= 1 + unitGrowth / 12;
        if (period % 12 === 0) {
          currentPrice *= 1 + priceGrowth;
        }

        const periodRevenue = currentUnits * currentPrice;
        const cogs = periodRevenue * cogsPct;
        const grossProfit = periodRevenue - cogs;
        const opex = periodRevenue * opexPct;
        const operatingIncome = grossProfit - opex;

        forecastPeriods.push({
          period,
          revenue: round(periodRevenue, 2),
          units: round(currentUnits, 0),
          price: round(currentPrice, 2),
          cogs: round(cogs, 2),
          gross_profit: round(grossProfit, 2),
          gross_margin: round(adjustedMargin, 4),
          opex: round(opex, 2),
          operating_income: round(operatingIncome, 2),
        });
      }
    } else {
      const monthlyGrowth = (1 + adjustedGrowth) ** (1 / 12) - 1;

      for (let period = 1; period <= this.forecastPeriods; period += 1) {
        currentRevenue *= 1 + monthlyGrowth;
        const cogs = currentRevenue * cogsPct;
        const grossProfit = currentRevenue - cogs;
        const opex = currentRevenue * opexPct;
        const operatingIncome = grossProfit - opex;

        forecastPeriods.push({
          period,
          revenue: round(currentRevenue, 2),
          cogs: round(cogs, 2),
          gross_profit: round(grossProfit, 2),
          gross_margin: round(adjustedMargin, 4),
          opex: round(opex, 2),
          operating_income: round(operatingIncome, 2),
        });
      }
    }

    const totalRevenue = forecastPeriods.reduce((total, period) => total + period.revenue, 0);
    const totalOperatingIncome = forecastPeriods.reduce((total, period) => total + period.operating_income, 0);

    return {
      scenario,
      growth_rate: round(adjustedGrowth, 4),
      gross_margin: round(adjustedMargin, 4),
      forecast_periods: forecastPeriods,
      total_revenue: round(totalRevenue, 2),
      total_operating_income: round(totalOperatingIncome, 2),
      average_monthly_revenue: round(safeDivide(totalRevenue, forecastPeriods.length), 2),
    };
  }

  buildRollingCashFlow(weeks = 13) {
    const cfi = this.cashFlowInputs;
    const openingBalance = cfi.opening_cash_balance ?? 0;
    const weeklyRevenue = cfi.weekly_revenue ?? 0;
    const collectionRate = cfi.collection_rate ?? 0.85;
    const collectionLagWeeks = cfi.collection_lag_weeks ?? 2;
    const weeklyPayroll = cfi.weekly_payroll ?? 0;
    const weeklyRent = cfi.weekly_rent ?? 0;
    const weeklyOperating = cfi.weekly_operating ?? 0;
    const weeklyOther = cfi.weekly_other ?? 0;
    const totalWeeklyExpenses = weeklyPayroll + weeklyRent + weeklyOperating + weeklyOther;
    const oneTimeItems = cfi.one_time_items ?? [];
    const weeklyProjections = [];
    const revenuePipeline = Array(collectionLagWeeks).fill(0.0);
    let runningBalance = openingBalance;

    for (let week = 1; week <= weeks; week += 1) {
      revenuePipeline.push(weeklyRevenue);
      const collections = revenuePipeline.shift() * collectionRate;

      let oneTimeInflows = 0.0;
      let oneTimeOutflows = 0.0;
      const oneTimeLabels = [];

      for (const item of oneTimeItems) {
        if (item.week === week) {
          const amount = item.amount ?? 0;
          if (amount > 0) {
            oneTimeInflows += amount;
          } else {
            oneTimeOutflows += Math.abs(amount);
          }
          oneTimeLabels.push(item.description ?? "");
        }
      }

      const totalInflows = collections + oneTimeInflows;
      const totalOutflows = totalWeeklyExpenses + oneTimeOutflows;
      const netCashFlow = totalInflows - totalOutflows;
      runningBalance += netCashFlow;

      weeklyProjections.push({
        week,
        collections: round(collections, 2),
        one_time_inflows: round(oneTimeInflows, 2),
        total_inflows: round(totalInflows, 2),
        payroll: round(weeklyPayroll, 2),
        rent: round(weeklyRent, 2),
        operating: round(weeklyOperating, 2),
        other_expenses: round(weeklyOther, 2),
        one_time_outflows: round(oneTimeOutflows, 2),
        total_outflows: round(totalOutflows, 2),
        net_cash_flow: round(netCashFlow, 2),
        closing_balance: round(runningBalance, 2),
        notes: oneTimeLabels.length > 0 ? oneTimeLabels.join(", ") : "",
      });
    }

    const totalInflows = weeklyProjections.reduce((total, week) => total + week.total_inflows, 0);
    const totalOutflows = weeklyProjections.reduce((total, week) => total + week.total_outflows, 0);
    const minBalance = Math.min(...weeklyProjections.map((week) => week.closing_balance));
    const minBalanceWeek = weeklyProjections.find((week) => week.closing_balance === minBalance).week;

    return {
      weeks,
      opening_balance: openingBalance,
      closing_balance: round(runningBalance, 2),
      total_inflows: round(totalInflows, 2),
      total_outflows: round(totalOutflows, 2),
      net_change: round(totalInflows - totalOutflows, 2),
      minimum_balance: round(minBalance, 2),
      minimum_balance_week: minBalanceWeek,
      cash_runway_weeks: totalWeeklyExpenses > 0 ? round(safeDivide(runningBalance, totalWeeklyExpenses)) : null,
      weekly_projections: weeklyProjections,
    };
  }

  buildScenarioComparison(scenarios = null) {
    const scenarioList = scenarios ?? ["base", "bull", "bear"];
    const scenarioResults = {};

    for (const scenario of scenarioList) {
      scenarioResults[scenario] = this.buildDriverBasedForecast(scenario);
    }

    const comparison = scenarioList.map((scenario) => {
      const result = scenarioResults[scenario];
      return {
        scenario,
        total_revenue: result.total_revenue,
        total_operating_income: result.total_operating_income,
        growth_rate: result.growth_rate,
        gross_margin: result.gross_margin,
        avg_monthly_revenue: result.average_monthly_revenue,
      };
    });

    return {
      scenarios: scenarioResults,
      comparison,
    };
  }

  runFullForecast(scenarios = null) {
    return {
      trend_analysis: this.analyzeTrends(),
      scenario_comparison: this.buildScenarioComparison(scenarios),
      rolling_cash_flow: this.buildRollingCashFlow(),
    };
  }

  formatText(results) {
    const lines = [];
    lines.push("=".repeat(70));
    lines.push("FINANCIAL FORECAST REPORT");
    lines.push("=".repeat(70));

    const fmtMoney = (value) => {
      if (Math.abs(value) >= 1e9) {
        return `$${(value / 1e9).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
      }
      if (Math.abs(value) >= 1e6) {
        return `$${(value / 1e6).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
      }
      if (Math.abs(value) >= 1e3) {
        return `$${(value / 1e3).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`;
      }
      return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const trend = results.trend_analysis;
    if (!("error" in trend)) {
      lines.push("\n--- TREND ANALYSIS ---");
      const t = trend.trend;
      lines.push(`  Direction: ${t.direction}`);
      lines.push(`  R-squared: ${t.r_squared.toFixed(4)}`);
      lines.push(`  Average Historical Growth: ${(trend.average_growth_rate * 100).toFixed(1)}%`);
      if (trend.seasonality_index.length > 0) {
        lines.push(`  Seasonality Index (last 4): ${trend.seasonality_index.map((s) => s.toFixed(2)).join(", ")}`);
      }
    }

    const comp = results.scenario_comparison.comparison;
    lines.push("\n--- SCENARIO COMPARISON ---");
    lines.push(`  ${"Scenario".padEnd(10)}  ${"Revenue".padStart(14)}  ${"Op. Income".padStart(14)}  ${"Growth".padStart(8)}  ${"Margin".padStart(8)}`);
    lines.push(`  ${"-".repeat(62)}`);
    for (const c of comp) {
      lines.push(
        `  ${c.scenario.padEnd(10)}  ${fmtMoney(c.total_revenue).padStart(14)}  `
        + `${fmtMoney(c.total_operating_income).padStart(14)}  `
        + `${`${(c.growth_rate * 100).toFixed(1)}%`.padStart(8)}  `
        + `${`${(c.gross_margin * 100).toFixed(1)}%`.padStart(8)}`,
      );
    }

    const base = results.scenario_comparison.scenarios.base ?? {};
    if (base.forecast_periods?.length > 0) {
      lines.push("\n--- BASE CASE MONTHLY FORECAST ---");
      lines.push(`  ${"Period".padStart(6)}  ${"Revenue".padStart(12)}  ${"Gross Profit".padStart(12)}  ${"Op. Income".padStart(12)}`);
      lines.push(`  ${"-".repeat(48)}`);
      for (const period of base.forecast_periods) {
        lines.push(
          `  ${String(period.period).padStart(6)}  ${fmtMoney(period.revenue).padStart(12)}  `
          + `${fmtMoney(period.gross_profit).padStart(12)}  ${fmtMoney(period.operating_income).padStart(12)}`,
        );
      }
    }

    const cf = results.rolling_cash_flow;
    lines.push("\n--- 13-WEEK ROLLING CASH FLOW ---");
    lines.push(`  Opening Balance: ${fmtMoney(cf.opening_balance)}`);
    lines.push(`  Closing Balance: ${fmtMoney(cf.closing_balance)}`);
    lines.push(`  Net Change:      ${fmtMoney(cf.net_change)}`);
    lines.push(`  Minimum Balance: ${fmtMoney(cf.minimum_balance)} (Week ${cf.minimum_balance_week})`);
    if (cf.cash_runway_weeks) {
      lines.push(`  Cash Runway:     ${cf.cash_runway_weeks.toFixed(0)} weeks`);
    }

    lines.push("\n  Weekly Detail:");
    lines.push(`  ${"Wk".padStart(3)}  ${"Inflows".padStart(10)}  ${"Outflows".padStart(10)}  ${"Net".padStart(10)}  ${"Balance".padStart(12)}`);
    lines.push(`  ${"-".repeat(50)}`);
    for (const week of cf.weekly_projections) {
      const notes = week.notes ? `  ${week.notes}` : "";
      lines.push(
        `  ${String(week.week).padStart(3)}  ${fmtMoney(week.total_inflows).padStart(10)}  `
        + `${fmtMoney(week.total_outflows).padStart(10)}  ${fmtMoney(week.net_cash_flow).padStart(10)}  `
        + `${fmtMoney(week.closing_balance).padStart(12)}${notes}`,
      );
    }

    lines.push(`\n${"=".repeat(70)}`);
    return lines.join("\n");
  }
}

function usage() {
  return `Usage:
  node forecast_builder.mjs <input_file> [--format text|json] [--scenarios base,bull,bear]`;
}

function parseArgs(argv) {
  const args = {
    inputFile: null,
    format: "text",
    scenarios: "base,bull,bear",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }

    if (arg === "--format") {
      args.format = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--format=")) {
      args.format = arg.slice("--format=".length);
      continue;
    }

    if (arg === "--scenarios") {
      args.scenarios = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--scenarios=")) {
      args.scenarios = arg.slice("--scenarios=".length);
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (args.inputFile !== null) {
      throw new Error(`Unexpected argument: ${arg}`);
    }
    args.inputFile = arg;
  }

  if (!args.inputFile) {
    throw new Error("Missing input file.");
  }
  if (!VALID_FORMATS.has(args.format)) {
    throw new Error(`Invalid --format '${args.format}'. Expected text or json.`);
  }

  return args;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(usage());
    process.exit(2);
  }

  if (!existsSync(args.inputFile)) {
    console.error(`Error: File '${args.inputFile}' not found.`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(readFileSync(args.inputFile, "utf8"));
  } catch (error) {
    console.error(`Error: Invalid JSON in '${args.inputFile}': ${error.message}`);
    process.exit(1);
  }

  const builder = new ForecastBuilder(normalizeInputData(data));
  const scenarios = args.scenarios.split(",").map((scenario) => scenario.trim());
  const results = builder.runFullForecast(scenarios);

  if (args.format === "json") {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(builder.formatText(results));
  }
}

main();
