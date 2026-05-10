import { defineCliProcedure, procedureEntry } from "../../definition";
import { readFileSync } from "node:fs";

export const procedure = defineCliProcedure({
  id: "financial-analyst-ratio-input-validation",
  entry: procedureEntry(import.meta.url),
  description:
    "校验财务比率计算所需的输入字段完整性，确保 income_statement/balance_sheet/cash_flow/market_data 中必要字段存在且为有限数值。",
  owners: { skillIds: ["financial-analyst"] },
  target: "scripts/ratio_input_validation.mjs",
  runtime: "node",
  params: [
    {
      flag: "--input",
      type: "路径",
      description: "输入 JSON 文件路径",
      required: false,
    },
    {
      flag: "--category",
      type: "profitability|liquidity|leverage|efficiency|valuation",
      description: "指定校验单一类别的字段",
      required: false,
    },
  ],

  exampleArgs: {
    args: [
      "--input",
      "assets/ratio_analysis_sample.json",
      "--category",
      "profitability",
    ],
  },
});

const REQUIRED_FIELDS_BY_CATEGORY: Record<string, any> = {
  profitability: [
    "income_statement.revenue",
    "income_statement.cost_of_goods_sold",
    "income_statement.operating_income",
    "income_statement.net_income",
    "balance_sheet.total_equity",
    "balance_sheet.total_assets",
  ],
  liquidity: [
    "balance_sheet.current_assets",
    "balance_sheet.current_liabilities",
    "balance_sheet.inventory",
    "balance_sheet.cash_and_equivalents",
  ],
  leverage: [
    "balance_sheet.total_debt",
    "balance_sheet.total_equity",
    "income_statement.operating_income",
    "income_statement.interest_expense",
    "cash_flow.operating_cash_flow",
  ],
  efficiency: [
    "income_statement.revenue",
    "income_statement.cost_of_goods_sold",
    "balance_sheet.total_assets",
    "balance_sheet.inventory",
    "balance_sheet.accounts_receivable",
  ],
  valuation: [
    "market_data.share_price",
    "market_data.shares_outstanding",
    "market_data.earnings_growth_rate",
    "income_statement.net_income",
    "income_statement.revenue",
    "income_statement.ebitda",
    "balance_sheet.total_equity",
    "balance_sheet.total_debt",
    "balance_sheet.cash_and_equivalents",
  ],
};
function getPath(data: any, path: any): any {
  return path.split(".").reduce((value: any, key: any) => value?.[key], data);
}
function formatPathList(paths: any): any {
  return paths.map((path: any) => `"${path}"`).join(", ");
}
export function validateRatioInput(data: any, category: any = null): any {
  const paths = category
    ? REQUIRED_FIELDS_BY_CATEGORY[category]
    : [...new Set(Object.values(REQUIRED_FIELDS_BY_CATEGORY).flat())];
  const missing: any[] = [];
  const invalid: any[] = [];
  for (const path of paths) {
    const value = getPath(data, path);
    if (value === undefined || value === null) {
      missing.push(path);
    } else if (typeof value !== "number" || !Number.isFinite(value)) {
      invalid.push(path);
    }
  }
  if (missing.length === 0 && invalid.length === 0) {
    return;
  }
  const messages: any[] = [];
  if (missing.length > 0) {
    messages.push(
      `missing required ${missing.length === 1 ? "field" : "fields"} ${formatPathList(missing)}`,
    );
  }
  if (invalid.length > 0) {
    messages.push(
      `required ${invalid.length === 1 ? "field" : "fields"} ${formatPathList(invalid)} must be finite ${invalid.length === 1 ? "number" : "numbers"}`,
    );
  }
  throw new Error(messages.join("; "));
}

function readOptionValue(argv: readonly string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (value == null || value.startsWith("-")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

export function parseArgs(argv: readonly string[]): {
  inputFile?: string;
  category?: string;
  help: boolean;
} {
  const args: { inputFile?: string; category?: string; help: boolean } = {
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--input" || arg === "-i") {
      args.inputFile = readOptionValue(argv, index, arg);
      index += 1;
    } else if (arg === "--category" || arg === "-c") {
      args.category = readOptionValue(argv, index, arg);
      index += 1;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return args;
}

function readInputData(args: { inputFile?: string }): any {
  if (args.inputFile) {
    return JSON.parse(readFileSync(args.inputFile, "utf-8"));
  }
  throw new Error("missing input data; pass --input <json-file>");
}

export function main(argv: readonly string[]): number {
  try {
    const args = parseArgs(argv);
    if (args.help) {
      console.log(
        "Usage: ratio_input_validation.mjs --input <json-file> [--category <name>]",
      );
      return 0;
    }
    const category = args.category ?? null;
    validateRatioInput(readInputData(args), category);
    console.log(JSON.stringify({ ok: true, category }, null, 2));
    return 0;
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
}
