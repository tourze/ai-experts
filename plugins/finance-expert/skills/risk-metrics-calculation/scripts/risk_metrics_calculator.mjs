#!/usr/bin/env node
/**
 * Risk Metrics Calculator
 *
 * Calculates VaR, CVaR, Sharpe, Sortino, drawdown, portfolio volatility,
 * diversification ratio, and rolling risk metrics from decimal return series.
 */

import { readFileSync } from "node:fs";

const VALID_FORMATS = new Set(["text", "json"]);
const VALID_SECTIONS = new Set(["all", "single", "portfolio", "rolling"]);

function round(value, places = 6) {
  if (value === null || value === undefined) return value;
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function mean(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function sampleStd(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((total, value) => total + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function percentile(values, q) {
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function covariance(left, right) {
  if (left.length !== right.length || left.length < 2) return 0;
  const leftMean = mean(left);
  const rightMean = mean(right);
  let sum = 0;
  for (let index = 0; index < left.length; index += 1) {
    sum += (left[index] - leftMean) * (right[index] - rightMean);
  }
  return sum / (left.length - 1);
}

function validateNumber(value, path) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`required field "${path}" must be a finite number`);
  }
}

function validateReturns(values, path) {
  if (!Array.isArray(values) || values.length < 2) {
    throw new Error(`required field "${path}" must contain at least 2 returns`);
  }
  values.forEach((value, index) => validateNumber(value, `${path}[${index}]`));
  const percentLike = values.find((value) => Math.abs(value) > 1);
  if (percentLike !== undefined) {
    throw new Error(`field "${path}" must use decimal returns, not percentages; got ${percentLike}`);
  }
}

function normalizeConfig(config = {}) {
  const annualizationFactor = config.annualization_factor ?? 252;
  const riskFreeRate = config.risk_free_rate ?? 0;
  const confidenceLevel = config.confidence_level ?? 0.95;

  validateNumber(annualizationFactor, "annualization_factor");
  validateNumber(riskFreeRate, "risk_free_rate");
  validateNumber(confidenceLevel, "confidence_level");
  if (annualizationFactor <= 0) {
    throw new Error('required field "annualization_factor" must be greater than 0');
  }
  if (confidenceLevel <= 0 || confidenceLevel >= 1) {
    throw new Error('required field "confidence_level" must be between 0 and 1');
  }
  return { annualizationFactor, riskFreeRate, confidenceLevel };
}

function calculateCoreMetrics(returns, config = {}) {
  validateReturns(returns, "returns");
  const { annualizationFactor, riskFreeRate, confidenceLevel } = normalizeConfig(config);
  const annualizedReturn = mean(returns) * annualizationFactor;
  const annualizedVolatility = sampleStd(returns) * Math.sqrt(annualizationFactor);
  const downside = returns.filter((value) => value < 0);
  const downsideDeviation = downside.length > 1 ? sampleStd(downside) * Math.sqrt(annualizationFactor) : 0;
  const threshold = percentile(returns, 1 - confidenceLevel);
  const tail = returns.filter((value) => value <= threshold);
  const varValue = Math.max(0, -threshold);
  const cvarValue = tail.length > 0 ? Math.max(0, -mean(tail)) : null;
  const maxDrawdown = calculateMaxDrawdown(returns);
  const excessReturn = annualizedReturn - riskFreeRate;

  return {
    sample_size: returns.length,
    annualization_factor: annualizationFactor,
    confidence_level: confidenceLevel,
    annualized_return: round(annualizedReturn),
    annualized_volatility: round(annualizedVolatility),
    downside_deviation: round(downsideDeviation),
    var: round(varValue),
    cvar: round(cvarValue),
    max_drawdown: round(maxDrawdown),
    sharpe_ratio: round(annualizedVolatility > 0 ? excessReturn / annualizedVolatility : 0),
    sortino_ratio: round(downsideDeviation > 0 ? excessReturn / downsideDeviation : 0),
    observations: returns.length < 60 ? ["sample_size_below_60_directional_only"] : [],
  };
}

function calculateMaxDrawdown(returns) {
  let cumulative = 1;
  let runningMax = 1;
  let maxDrawdown = 0;
  for (const value of returns) {
    cumulative *= 1 + value;
    runningMax = Math.max(runningMax, cumulative);
    maxDrawdown = Math.min(maxDrawdown, (cumulative - runningMax) / runningMax);
  }
  return maxDrawdown;
}

function calculatePortfolioMetrics(input) {
  const assetReturns = input.returns ?? {};
  const weights = input.weights ?? {};
  const assets = Object.keys(assetReturns);
  if (assets.length === 0) {
    throw new Error('required field "portfolio.returns" must contain at least one asset');
  }
  for (const asset of assets) {
    validateReturns(assetReturns[asset], `portfolio.returns.${asset}`);
    validateNumber(weights[asset], `portfolio.weights.${asset}`);
  }

  const length = assetReturns[assets[0]].length;
  for (const asset of assets) {
    if (assetReturns[asset].length !== length) {
      throw new Error("all portfolio return series must have the same length");
    }
  }

  const weightSum = assets.reduce((total, asset) => total + weights[asset], 0);
  if (Math.abs(weightSum - 1) > 1e-9) {
    throw new Error(`portfolio weights must sum to 1; got ${round(weightSum, 6)}`);
  }

  const portfolioReturns = [];
  for (let row = 0; row < length; row += 1) {
    portfolioReturns.push(assets.reduce((total, asset) => total + assetReturns[asset][row] * weights[asset], 0));
  }

  const core = calculateCoreMetrics(portfolioReturns, input);
  const { annualizationFactor } = normalizeConfig(input);
  const covarianceMatrix = {};
  const correlationMatrix = {};
  const assetVolatility = {};

  for (const left of assets) {
    covarianceMatrix[left] = {};
    correlationMatrix[left] = {};
    const leftStd = sampleStd(assetReturns[left]);
    assetVolatility[left] = sampleStd(assetReturns[left]) * Math.sqrt(annualizationFactor);
    for (const right of assets) {
      const cov = covariance(assetReturns[left], assetReturns[right]);
      const rightStd = sampleStd(assetReturns[right]);
      covarianceMatrix[left][right] = round(cov * annualizationFactor);
      correlationMatrix[left][right] = round(leftStd > 0 && rightStd > 0 ? cov / (leftStd * rightStd) : 0);
    }
  }

  const weightedAssetVol = assets.reduce((total, asset) => total + weights[asset] * assetVolatility[asset], 0);
  const diversificationRatio = core.annualized_volatility > 0 ? weightedAssetVol / core.annualized_volatility : 1;

  return {
    ...core,
    assets,
    weights: Object.fromEntries(assets.map((asset) => [asset, weights[asset]])),
    diversification_ratio: round(diversificationRatio),
    asset_volatility: Object.fromEntries(assets.map((asset) => [asset, round(assetVolatility[asset])])),
    covariance_matrix: covarianceMatrix,
    correlation_matrix: correlationMatrix,
  };
}

function calculateRollingMetrics(input) {
  const returns = input.returns ?? [];
  validateReturns(returns, "rolling.returns");
  const window = input.window ?? 21;
  validateNumber(window, "rolling.window");
  if (!Number.isInteger(window) || window < 2 || window > returns.length) {
    throw new Error('required field "rolling.window" must be an integer between 2 and returns.length');
  }
  const { annualizationFactor, confidenceLevel } = normalizeConfig(input);
  const windows = [];

  for (let end = window; end <= returns.length; end += 1) {
    const slice = returns.slice(end - window, end);
    const threshold = percentile(slice, 1 - confidenceLevel);
    windows.push({
      end_index: end - 1,
      annualized_volatility: round(sampleStd(slice) * Math.sqrt(annualizationFactor)),
      var: round(Math.max(0, -threshold)),
      max_drawdown: round(calculateMaxDrawdown(slice)),
    });
  }

  return {
    sample_size: returns.length,
    window,
    annualization_factor: annualizationFactor,
    confidence_level: confidenceLevel,
    windows,
    latest: windows.at(-1),
  };
}

function normalizeInputData(data) {
  if (data.risk_metrics && typeof data.risk_metrics === "object" && !Array.isArray(data.risk_metrics)) {
    return data.risk_metrics;
  }
  if (Array.isArray(data.returns)) {
    return { single_asset: data };
  }
  return data;
}

function runAnalysis(data, section) {
  const normalized = normalizeInputData(data);
  const results = {};

  if ((section === "all" || section === "single") && normalized.single_asset) {
    results.single_asset = calculateCoreMetrics(normalized.single_asset.returns, normalized.single_asset);
  }
  if ((section === "all" || section === "portfolio") && normalized.portfolio) {
    results.portfolio = calculatePortfolioMetrics(normalized.portfolio);
  }
  if ((section === "all" || section === "rolling") && normalized.rolling) {
    results.rolling = calculateRollingMetrics(normalized.rolling);
  }
  if (Object.keys(results).length === 0) {
    throw new Error(`no data found for section "${section}"`);
  }

  return results;
}

function formatText(results) {
  const lines = ["=".repeat(70), "RISK METRICS ANALYSIS", "=".repeat(70)];
  if (results.single_asset) {
    appendCore(lines, "SINGLE ASSET", results.single_asset);
  }
  if (results.portfolio) {
    appendCore(lines, "PORTFOLIO", results.portfolio);
    lines.push(`  Diversification Ratio: ${results.portfolio.diversification_ratio.toFixed(3)}`);
  }
  if (results.rolling) {
    const latest = results.rolling.latest;
    lines.push("\n--- ROLLING RISK ---");
    lines.push(`  Window: ${results.rolling.window}`);
    lines.push(`  Latest Volatility: ${(latest.annualized_volatility * 100).toFixed(2)}%`);
    lines.push(`  Latest VaR: ${(latest.var * 100).toFixed(2)}%`);
    lines.push(`  Latest Max Drawdown: ${(latest.max_drawdown * 100).toFixed(2)}%`);
  }
  lines.push("=".repeat(70));
  return lines.join("\n");
}

function appendCore(lines, title, metrics) {
  lines.push(`\n--- ${title} ---`);
  lines.push(`  Sample Size: ${metrics.sample_size}`);
  lines.push(`  Annualized Return: ${(metrics.annualized_return * 100).toFixed(2)}%`);
  lines.push(`  Annualized Volatility: ${(metrics.annualized_volatility * 100).toFixed(2)}%`);
  lines.push(`  VaR: ${(metrics.var * 100).toFixed(2)}%`);
  lines.push(`  CVaR: ${(metrics.cvar * 100).toFixed(2)}%`);
  lines.push(`  Max Drawdown: ${(metrics.max_drawdown * 100).toFixed(2)}%`);
  lines.push(`  Sharpe: ${metrics.sharpe_ratio.toFixed(3)}`);
  lines.push(`  Sortino: ${metrics.sortino_ratio.toFixed(3)}`);
}

function parseArgs(argv) {
  const args = { inputFile: null, format: "text", section: "all", help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--format") {
      args.format = argv[index + 1];
      index += 1;
    } else if (arg === "--section") {
      args.section = argv[index + 1];
      index += 1;
    } else if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else if (!arg.startsWith("-") && args.inputFile === null) {
      args.inputFile = arg;
    } else {
      throw new Error(`unrecognized arguments: ${arg}`);
    }
  }
  if (!VALID_FORMATS.has(args.format)) {
    throw new Error("argument --format: invalid choice");
  }
  if (!VALID_SECTIONS.has(args.section)) {
    throw new Error("argument --section: invalid choice");
  }
  return args;
}

function usage() {
  return [
    "Usage: risk_metrics_calculator.mjs <input_file> [--format text|json] [--section all|single|portfolio|rolling]",
    "",
    "Calculate risk metrics from decimal return series.",
  ].join("\n");
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
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
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.error(`Error: File '${args.inputFile}' not found.`);
      process.exitCode = 1;
      return;
    }
    if (error instanceof SyntaxError) {
      console.error(`Error: Invalid JSON in '${args.inputFile}': ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  try {
    const results = runAnalysis(data, args.section);
    console.log(args.format === "json" ? JSON.stringify(results, null, 2) : formatText(results));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
