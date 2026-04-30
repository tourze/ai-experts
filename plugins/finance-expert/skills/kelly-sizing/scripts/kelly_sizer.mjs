#!/usr/bin/env node
import { readFileSync } from "node:fs";

const VALID_FORMATS = new Set(["text", "json"]);
const VALID_SECTIONS = new Set(["all", "binary", "scenario", "multi"]);

const FRACTIONAL_KELLY = {
  high: 0.5,
  medium: 0.25,
  low: 0.1,
  very_low: 0.05,
};

const DEPENDENCE_HAIRCUT = {
  independent: 1,
  low: 0.85,
  medium: 0.65,
  high: 0.5,
  unknown: 0.5,
  exclusive: 0.5,
};

function round(value, places = 6) {
  if (value === null || value === undefined) return value;
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function validateNumber(value, path) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`required field "${path}" must be a finite number`);
  }
}

function validateGreaterThan(value, path, minimum) {
  validateNumber(value, path);
  if (value <= minimum) {
    throw new Error(`required field "${path}" must be greater than ${minimum}`);
  }
}

function validateRatio(value, path) {
  validateNumber(value, path);
  if (value < 0 || value > 1) {
    throw new Error(`required field "${path}" must be between 0 and 1`);
  }
}

function normalizeConfidence(level, path) {
  const normalized = level ?? "medium";
  if (!Object.hasOwn(FRACTIONAL_KELLY, normalized)) {
    throw new Error(`required field "${path}" must be one of high, medium, low, very_low`);
  }
  return normalized;
}

function normalizeConstraints(input = {}) {
  const totalExposureCap = input.total_exposure_cap ?? 0.25;
  const singleOpportunityCap = input.single_opportunity_cap ?? 0.1;
  const minCashReserveRatio = input.min_cash_reserve_ratio ?? 0;

  validateRatio(totalExposureCap, "constraints.total_exposure_cap");
  validateRatio(singleOpportunityCap, "constraints.single_opportunity_cap");
  validateRatio(minCashReserveRatio, "constraints.min_cash_reserve_ratio");

  const reserveAdjustedCap = Math.max(0, 1 - minCashReserveRatio);
  const effectiveTotalExposureCap = Math.min(totalExposureCap, reserveAdjustedCap);
  const effectiveSingleOpportunityCap = Math.min(singleOpportunityCap, effectiveTotalExposureCap);

  return {
    total_exposure_cap: round(totalExposureCap),
    single_opportunity_cap: round(singleOpportunityCap),
    min_cash_reserve_ratio: round(minCashReserveRatio),
    effective_total_exposure_cap: round(effectiveTotalExposureCap),
    effective_single_opportunity_cap: round(effectiveSingleOpportunityCap),
  };
}

function normalizeContext(input) {
  validateGreaterThan(input.capital_base, "capital_base", 0);
  const confidenceLevel = normalizeConfidence(input.confidence_level, "confidence_level");
  return {
    capitalBase: input.capital_base,
    confidenceLevel,
    constraints: normalizeConstraints(input.constraints ?? {}),
  };
}

function calculateBinaryCore(input, path) {
  validateNumber(input.win_probability, `${path}.win_probability`);
  if (input.win_probability <= 0 || input.win_probability >= 1) {
    throw new Error(`required field "${path}.win_probability" must be greater than 0 and less than 1`);
  }

  let winReturnMultiple = input.win_return_multiple;
  if (winReturnMultiple === undefined && input.decimal_odds !== undefined) {
    validateGreaterThan(input.decimal_odds, `${path}.decimal_odds`, 1);
    winReturnMultiple = input.decimal_odds - 1;
  }
  validateGreaterThan(winReturnMultiple, `${path}.win_return_multiple`, 0);

  const lossMultiple = input.loss_multiple ?? 1;
  validateNumber(lossMultiple, `${path}.loss_multiple`);
  if (lossMultiple <= 0 || lossMultiple > 1) {
    throw new Error(`required field "${path}.loss_multiple" must be greater than 0 and less than or equal to 1`);
  }

  const p = input.win_probability;
  const q = 1 - p;
  const expectedEdge = p * winReturnMultiple - q * lossMultiple;
  const fullKelly = expectedEdge > 0 ? expectedEdge / (lossMultiple * winReturnMultiple) : 0;

  return {
    name: input.name ?? path,
    win_probability: round(p),
    win_return_multiple: round(winReturnMultiple),
    loss_multiple: round(lossMultiple),
    expected_edge: round(expectedEdge),
    full_kelly_fraction: round(fullKelly),
  };
}

function actionForFraction(fraction) {
  if (fraction <= 0) return "no_allocation";
  if (fraction < 0.005) return "observe";
  if (fraction < 0.02) return "tiny_test";
  if (fraction < 0.05) return "small";
  if (fraction < 0.1) return "medium";
  return "large";
}

function constraintWarnings(rawFraction, cappedFraction, constraints) {
  const warnings = [];
  if (constraints.effective_total_exposure_cap < constraints.total_exposure_cap) {
    warnings.push("cash_reserve_cap_applied");
  }
  if (constraints.effective_single_opportunity_cap < constraints.single_opportunity_cap) {
    warnings.push("single_cap_reduced_by_total_exposure_cap");
  }
  if (cappedFraction < rawFraction) {
    warnings.push("allocation_capped_by_constraints");
  }
  return warnings;
}

function applySingleOpportunitySizing(core, input, context, formulaPath) {
  const confidenceLevel = normalizeConfidence(input.confidence_level ?? context.confidenceLevel, `${formulaPath}.confidence_level`);
  const fractionalFactor = FRACTIONAL_KELLY[confidenceLevel];
  const fractionalKelly = core.full_kelly_fraction * fractionalFactor;
  const cappedFraction = Math.min(
    fractionalKelly,
    context.constraints.effective_single_opportunity_cap,
    context.constraints.effective_total_exposure_cap,
  );
  const allocationFraction = Math.max(0, cappedFraction);
  const warnings = constraintWarnings(fractionalKelly, allocationFraction, context.constraints);

  if (core.expected_edge <= 0 || core.full_kelly_fraction <= 0) {
    warnings.push("expected_edge_non_positive");
  }
  if (confidenceLevel === "very_low" && allocationFraction > 0) {
    warnings.push("very_low_confidence_treat_as_tiny_test");
  }

  return {
    ...core,
    formula_path: formulaPath,
    action: actionForFraction(allocationFraction),
    confidence_level: confidenceLevel,
    fractional_kelly_factor: round(fractionalFactor),
    fractional_kelly_fraction: round(fractionalKelly),
    allocation_fraction: round(allocationFraction),
    allocation_amount: round(allocationFraction * context.capitalBase, 2),
    constraints_applied: context.constraints,
    warnings,
  };
}

function calculateBinarySizing(input, context) {
  const core = calculateBinaryCore(input, "binary");
  return applySingleOpportunitySizing(core, input, context, "binary-bet");
}

function validateScenarios(scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length < 2) {
    throw new Error('required field "scenario.scenarios" must contain at least 2 scenarios');
  }

  const normalized = scenarios.map((scenario, index) => {
    const path = `scenario.scenarios[${index}]`;
    validateRatio(scenario.probability, `${path}.probability`);
    validateNumber(scenario.return_multiple, `${path}.return_multiple`);
    if (scenario.return_multiple < -1) {
      throw new Error(`required field "${path}.return_multiple" must be greater than or equal to -1`);
    }
    return {
      name: scenario.name ?? `scenario_${index + 1}`,
      probability: scenario.probability,
      return_multiple: scenario.return_multiple,
    };
  });
  const total = normalized.reduce((sum, item) => sum + item.probability, 0);
  if (Math.abs(total - 1) > 1e-6) {
    throw new Error(`scenario probabilities must sum to 1; got ${round(total, 6)}`);
  }
  return normalized;
}

function derivativeAt(fraction, scenarios) {
  return scenarios.reduce((total, scenario) => {
    const denominator = 1 + fraction * scenario.return_multiple;
    return total + (scenario.probability * scenario.return_multiple) / denominator;
  }, 0);
}

function solveScenarioKelly(scenarios) {
  const expectedReturn = scenarios.reduce(
    (total, scenario) => total + scenario.probability * scenario.return_multiple,
    0,
  );
  if (expectedReturn <= 0 || derivativeAt(0, scenarios) <= 0) {
    return { expectedReturn, fullKelly: 0 };
  }

  let upper = 1;
  for (const scenario of scenarios) {
    if (scenario.return_multiple < 0) {
      upper = Math.min(upper, -1 / scenario.return_multiple);
    }
  }
  upper *= 0.999999;

  if (derivativeAt(upper, scenarios) > 0) {
    return { expectedReturn, fullKelly: upper };
  }

  let low = 0;
  let high = upper;
  for (let index = 0; index < 100; index += 1) {
    const mid = (low + high) / 2;
    if (derivativeAt(mid, scenarios) > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return { expectedReturn, fullKelly: (low + high) / 2 };
}

function calculateScenarioSizing(input, context) {
  const scenarios = validateScenarios(input.scenarios);
  const { expectedReturn, fullKelly } = solveScenarioKelly(scenarios);
  const core = {
    name: input.name ?? "scenario",
    expected_edge: round(expectedReturn),
    full_kelly_fraction: round(fullKelly),
    scenarios: scenarios.map((scenario) => ({
      name: scenario.name,
      probability: round(scenario.probability),
      return_multiple: round(scenario.return_multiple),
    })),
  };

  const result = applySingleOpportunitySizing(core, input, context, "scenario-sizing");
  if (!scenarios.some((scenario) => scenario.return_multiple < 0)) {
    result.warnings.push("no_downside_scenario_modeled");
  }
  return result;
}

function calculateMultiSizing(input, context) {
  const opportunities = input.opportunities;
  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    throw new Error('required field "multi.opportunities" must contain at least 1 opportunity');
  }

  const confidenceLevel = normalizeConfidence(input.confidence_level ?? context.confidenceLevel, "multi.confidence_level");
  const fractionalFactor = FRACTIONAL_KELLY[confidenceLevel];
  const dependence = input.dependence ?? "unknown";
  if (!Object.hasOwn(DEPENDENCE_HAIRCUT, dependence)) {
    throw new Error('required field "multi.dependence" must be one of independent, low, medium, high, unknown, exclusive');
  }
  const dependenceHaircut = DEPENDENCE_HAIRCUT[dependence];

  const sized = opportunities.map((opportunity, index) => {
    const core = calculateBinaryCore(opportunity, `multi.opportunities[${index}]`);
    const fractionalKelly = core.full_kelly_fraction * fractionalFactor;
    const dependenceAdjusted = fractionalKelly * dependenceHaircut;
    const cappedStandalone = Math.min(dependenceAdjusted, context.constraints.effective_single_opportunity_cap);
    const warnings = [];
    if (core.expected_edge <= 0 || core.full_kelly_fraction <= 0) {
      warnings.push("expected_edge_non_positive");
    }
    if (cappedStandalone < dependenceAdjusted) {
      warnings.push("single_opportunity_cap_applied");
    }

    return {
      ...core,
      action: actionForFraction(cappedStandalone),
      fractional_kelly_fraction: round(fractionalKelly),
      dependence_adjusted_fraction: round(dependenceAdjusted),
      pre_scaling_allocation_fraction: round(Math.max(0, cappedStandalone)),
      warnings,
    };
  });

  const totalBeforeScaling = sized.reduce((total, item) => total + item.pre_scaling_allocation_fraction, 0);
  const totalCap = context.constraints.effective_total_exposure_cap;
  const scalingFactor = totalBeforeScaling > totalCap && totalBeforeScaling > 0 ? totalCap / totalBeforeScaling : 1;
  const warnings = constraintWarnings(totalBeforeScaling, totalBeforeScaling * scalingFactor, context.constraints);
  if (dependence === "unknown") warnings.push("unknown_dependence_haircut_applied");
  if (dependence === "exclusive") warnings.push("exclusive_opportunities_should_be_ranked_or_staged");

  const finalOpportunities = sized.map((item) => {
    const allocationFraction = item.pre_scaling_allocation_fraction * scalingFactor;
    return {
      ...item,
      action: actionForFraction(allocationFraction),
      allocation_fraction: round(allocationFraction),
      allocation_amount: round(allocationFraction * context.capitalBase, 2),
    };
  });
  const totalAllocationFraction = finalOpportunities.reduce((total, item) => total + item.allocation_fraction, 0);

  return {
    formula_path: "multi-opportunity-allocation",
    action: actionForFraction(totalAllocationFraction),
    confidence_level: confidenceLevel,
    fractional_kelly_factor: round(fractionalFactor),
    dependence,
    dependence_haircut: round(dependenceHaircut),
    total_scaling_factor: round(scalingFactor),
    total_allocation_fraction: round(totalAllocationFraction),
    total_allocation_amount: round(totalAllocationFraction * context.capitalBase, 2),
    constraints_applied: context.constraints,
    opportunities: finalOpportunities,
    warnings,
  };
}

function normalizeInputData(data) {
  if (data.kelly_sizing && typeof data.kelly_sizing === "object" && !Array.isArray(data.kelly_sizing)) {
    return data.kelly_sizing;
  }
  if (data.win_probability !== undefined) {
    return { ...data, binary: data };
  }
  if (Array.isArray(data.scenarios)) {
    return { ...data, scenario: data };
  }
  if (Array.isArray(data.opportunities)) {
    return { ...data, multi: data };
  }
  return data;
}

function runAnalysis(data, section) {
  const normalized = normalizeInputData(data);
  const context = normalizeContext(normalized);
  const results = {};

  if ((section === "all" || section === "binary") && normalized.binary) {
    results.binary = calculateBinarySizing(normalized.binary, context);
  }
  if ((section === "all" || section === "scenario") && normalized.scenario) {
    results.scenario = calculateScenarioSizing(normalized.scenario, context);
  }
  if ((section === "all" || section === "multi") && normalized.multi) {
    results.multi = calculateMultiSizing(normalized.multi, context);
  }
  if (Object.keys(results).length === 0) {
    throw new Error(`no data found for section "${section}"`);
  }

  return results;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatText(results) {
  const lines = ["=".repeat(70), "KELLY SIZING ANALYSIS", "=".repeat(70)];
  if (results.binary) {
    appendSingle(lines, "BINARY BET", results.binary);
  }
  if (results.scenario) {
    appendSingle(lines, "SCENARIO SIZING", results.scenario);
  }
  if (results.multi) {
    lines.push("\n--- MULTI-OPPORTUNITY ALLOCATION ---");
    lines.push(`  Action: ${results.multi.action}`);
    lines.push(`  Total Allocation: ${formatPercent(results.multi.total_allocation_fraction)}`);
    lines.push(`  Total Amount: ${results.multi.total_allocation_amount.toFixed(2)}`);
    lines.push(`  Dependence: ${results.multi.dependence} (${results.multi.dependence_haircut.toFixed(2)} haircut)`);
    for (const item of results.multi.opportunities) {
      lines.push(`  - ${item.name}: ${formatPercent(item.allocation_fraction)} (${item.action})`);
    }
  }
  lines.push("=".repeat(70));
  return lines.join("\n");
}

function appendSingle(lines, title, result) {
  lines.push(`\n--- ${title} ---`);
  lines.push(`  Name: ${result.name}`);
  lines.push(`  Action: ${result.action}`);
  lines.push(`  Full Kelly: ${formatPercent(result.full_kelly_fraction)}`);
  lines.push(`  Fractional Kelly: ${formatPercent(result.fractional_kelly_fraction)}`);
  lines.push(`  Allocation: ${formatPercent(result.allocation_fraction)}`);
  lines.push(`  Amount: ${result.allocation_amount.toFixed(2)}`);
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
    "Usage: kelly_sizer.mjs <input_file> [--format text|json] [--section all|binary|scenario|multi]",
    "",
    "Calculate conservative Kelly sizing for capped capital or resource pools.",
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
