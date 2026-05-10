import { describe, expect, test } from "vitest";
import { parseArgs as parseBudgetVarianceArgs } from "../../src/components/procedures/sources/financial-analyst/budget_variance_analyzer.ts";
import { parseArgs as parseDcfValuationArgs } from "../../src/components/procedures/sources/financial-analyst/dcf_valuation.ts";
import { parseArgs as parseForecastBuilderArgs } from "../../src/components/procedures/sources/financial-analyst/forecast_builder.ts";
import { parseArgs as parseRatioCalculatorArgs } from "../../src/components/procedures/sources/financial-analyst/ratio_calculator.ts";
import { parseArgs as parseRatioInputArgs } from "../../src/components/procedures/sources/financial-analyst/ratio_input_validation.ts";
import { parseArgs as parseCsoAuditArgs } from "../../src/components/procedures/sources/skill-activation-analyzer/cso_audit.ts";

describe("procedure argument parsers", () => {
  test("reject option flags without values", () => {
    expect(() => parseCsoAuditArgs(["--skills-dir", "--json"]))
      .toThrow(/--skills-dir requires a value/);
    expect(() => parseCsoAuditArgs(["--severity"]))
      .toThrow(/--severity requires a value/);

    expect(() => parseRatioInputArgs(["--input", "--category"]))
      .toThrow(/--input requires a value/);
    expect(() => parseRatioInputArgs(["--input", "ratios.json", "--category", "--help"]))
      .toThrow(/--category requires a value/);

    expect(() => parseRatioCalculatorArgs(["ratios.json", "--format", "--category"]))
      .toThrow(/--format requires a value/);
    expect(() => parseBudgetVarianceArgs(["budget.json", "--threshold-pct", "--format"]))
      .toThrow(/--threshold-pct requires a value/);
    expect(() => parseDcfValuationArgs(["valuation.json", "--projection-years", "--format"]))
      .toThrow(/--projection-years requires a value/);
    expect(() => parseForecastBuilderArgs(["forecast.json", "--scenarios", "--format"]))
      .toThrow(/--scenarios requires a value/);
  });
});
