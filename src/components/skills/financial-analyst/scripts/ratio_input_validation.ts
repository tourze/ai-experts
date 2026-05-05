const REQUIRED_FIELDS_BY_CATEGORY = {
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

function getPath(data, path) {
  return path.split(".").reduce((value, key) => value?.[key], data);
}

function formatPathList(paths) {
  return paths.map((path) => `"${path}"`).join(", ");
}

export function validateRatioInput(data, category = null) {
  const paths = category
    ? REQUIRED_FIELDS_BY_CATEGORY[category]
    : [...new Set(Object.values(REQUIRED_FIELDS_BY_CATEGORY).flat())];
  const missing = [];
  const invalid = [];

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

  const messages = [];
  if (missing.length > 0) {
    messages.push(`missing required ${missing.length === 1 ? "field" : "fields"} ${formatPathList(missing)}`);
  }
  if (invalid.length > 0) {
    messages.push(
      `required ${invalid.length === 1 ? "field" : "fields"} ${formatPathList(invalid)} must be finite ${invalid.length === 1 ? "number" : "numbers"}`,
    );
  }
  throw new Error(messages.join("; "));
}
