#!/usr/bin/env node
/**
 * Financial Ratio Calculator
 *
 * Calculates and interprets financial ratios across 5 categories:
 * profitability, liquidity, leverage, efficiency, and valuation.
 *
 * Usage:
 *   node ratio_calculator.mjs assets/ratio_analysis_sample.json
 *   node ratio_calculator.mjs assets/ratio_analysis_sample.json --format json
 *   node ratio_calculator.mjs assets/ratio_analysis_sample.json --category profitability
 */
import { readFileSync } from "node:fs";
import { validateRatioInput } from "./ratio_input_validation";
const BENCHMARKS: Record<string, any> = {
    roe: [0.08, 0.15, 0.25],
    roa: [0.03, 0.06, 0.12],
    gross_margin: [0.25, 0.40, 0.60],
    operating_margin: [0.05, 0.15, 0.25],
    net_margin: [0.03, 0.10, 0.20],
    current_ratio: [1.0, 1.5, 3.0],
    quick_ratio: [0.8, 1.0, 2.0],
    cash_ratio: [0.2, 0.5, 1.0],
    debt_to_equity: [0.3, 0.8, 2.0],
    interest_coverage: [2.0, 5.0, 10.0],
    dscr: [1.0, 1.5, 2.5],
    asset_turnover: [0.5, 1.0, 2.0],
    inventory_turnover: [4.0, 8.0, 12.0],
    receivables_turnover: [6.0, 10.0, 15.0],
    dso: [30.0, 45.0, 60.0],
    pe_ratio: [10.0, 20.0, 35.0],
    pb_ratio: [1.0, 2.5, 5.0],
    ps_ratio: [1.0, 3.0, 8.0],
    ev_ebitda: [6.0, 12.0, 20.0],
    peg_ratio: [0.5, 1.0, 2.0],
};
const VALID_FORMATS = new Set(["text", "json"]);
const VALID_CATEGORIES = new Set(["profitability", "liquidity", "leverage", "efficiency", "valuation"]);
function safeDivide(numerator: any, denominator: any, defaultValue: any = 0.0): any {
    if (denominator === 0 || denominator === null || denominator === undefined) {
        return defaultValue;
    }
    return numerator / denominator;
}
function getNumber(data: any, key: any): any {
    return data[key] ?? 0;
}
function normalizeInputData(data: any): any {
    if ("income_statement" in data || "balance_sheet" in data) {
        return data;
    }
    const wrapped = data.ratio_analysis;
    if (wrapped && typeof wrapped === "object" && !Array.isArray(wrapped)) {
        return wrapped;
    }
    return data;
}
function interpretRatio(ratioKey: any, value: any): any {
    if (value === 0.0) {
        return "Insufficient data to calculate";
    }
    const benchmarks = BENCHMARKS[ratioKey];
    if (!benchmarks) {
        return "No benchmark available";
    }
    const [low, typical, high] = benchmarks;
    if (ratioKey === "dso") {
        if (value <= low) {
            return "Excellent - collections well above average";
        }
        if (value <= typical) {
            return "Good - collections within normal range";
        }
        if (value <= high) {
            return "Acceptable - monitor collection trends";
        }
        return "Concern - collections significantly slower than peers";
    }
    if (ratioKey === "debt_to_equity") {
        if (value <= low) {
            return "Conservative leverage - strong equity position";
        }
        if (value <= typical) {
            return "Moderate leverage - well balanced";
        }
        if (value <= high) {
            return "Elevated leverage - monitor debt levels";
        }
        return "High leverage - potential financial risk";
    }
    if (value < low) {
        return "Below average - needs improvement";
    }
    if (value <= typical) {
        return "Acceptable - within normal range";
    }
    if (value <= high) {
        return "Good - above average performance";
    }
    return "Excellent - significantly above peers";
}
function withInterpretation(ratios: any): any {
    for (const [key, ratio] of Object.entries(ratios as Record<string, any>)) {
        ratio.interpretation = interpretRatio(key, ratio.value);
    }
    return ratios;
}
class FinancialRatioCalculator {
    balance: any;
    cashFlow: any;
    income: any;
    market: any;
    results: any;
    constructor(data: any) {
        this.income = data.income_statement ?? {};
        this.balance = data.balance_sheet ?? {};
        this.cashFlow = data.cash_flow ?? {};
        this.market = data.market_data ?? {};
        this.results = {};
    }
    calculateProfitability(): any {
        const revenue = getNumber(this.income, "revenue");
        const cogs = getNumber(this.income, "cost_of_goods_sold");
        const operatingIncome = getNumber(this.income, "operating_income");
        const netIncome = getNumber(this.income, "net_income");
        const totalEquity = getNumber(this.balance, "total_equity");
        const totalAssets = getNumber(this.balance, "total_assets");
        const grossProfit = revenue - cogs;
        const ratios = withInterpretation({
            roe: {
                value: safeDivide(netIncome, totalEquity),
                formula: "Net Income / Total Equity",
                name: "Return on Equity",
            },
            roa: {
                value: safeDivide(netIncome, totalAssets),
                formula: "Net Income / Total Assets",
                name: "Return on Assets",
            },
            gross_margin: {
                value: safeDivide(grossProfit, revenue),
                formula: "(Revenue - COGS) / Revenue",
                name: "Gross Margin",
            },
            operating_margin: {
                value: safeDivide(operatingIncome, revenue),
                formula: "Operating Income / Revenue",
                name: "Operating Margin",
            },
            net_margin: {
                value: safeDivide(netIncome, revenue),
                formula: "Net Income / Revenue",
                name: "Net Margin",
            },
        });
        this.results.profitability = ratios;
        return ratios;
    }
    calculateLiquidity(): any {
        const currentAssets = getNumber(this.balance, "current_assets");
        const currentLiabilities = getNumber(this.balance, "current_liabilities");
        const inventory = getNumber(this.balance, "inventory");
        const cash = getNumber(this.balance, "cash_and_equivalents");
        const ratios = withInterpretation({
            current_ratio: {
                value: safeDivide(currentAssets, currentLiabilities),
                formula: "Current Assets / Current Liabilities",
                name: "Current Ratio",
            },
            quick_ratio: {
                value: safeDivide(currentAssets - inventory, currentLiabilities),
                formula: "(Current Assets - Inventory) / Current Liabilities",
                name: "Quick Ratio",
            },
            cash_ratio: {
                value: safeDivide(cash, currentLiabilities),
                formula: "Cash & Equivalents / Current Liabilities",
                name: "Cash Ratio",
            },
        });
        this.results.liquidity = ratios;
        return ratios;
    }
    calculateLeverage(): any {
        const totalDebt = getNumber(this.balance, "total_debt");
        const totalEquity = getNumber(this.balance, "total_equity");
        const operatingIncome = getNumber(this.income, "operating_income");
        const interestExpense = getNumber(this.income, "interest_expense");
        const operatingCashFlow = getNumber(this.cashFlow, "operating_cash_flow");
        const totalDebtService = this.cashFlow.total_debt_service ?? interestExpense;
        const ratios = withInterpretation({
            debt_to_equity: {
                value: safeDivide(totalDebt, totalEquity),
                formula: "Total Debt / Total Equity",
                name: "Debt-to-Equity Ratio",
            },
            interest_coverage: {
                value: safeDivide(operatingIncome, interestExpense),
                formula: "Operating Income / Interest Expense",
                name: "Interest Coverage Ratio",
            },
            dscr: {
                value: safeDivide(operatingCashFlow, totalDebtService),
                formula: "Operating Cash Flow / Total Debt Service",
                name: "Debt Service Coverage Ratio",
            },
        });
        this.results.leverage = ratios;
        return ratios;
    }
    calculateEfficiency(): any {
        const revenue = getNumber(this.income, "revenue");
        const cogs = getNumber(this.income, "cost_of_goods_sold");
        const totalAssets = getNumber(this.balance, "total_assets");
        const inventory = getNumber(this.balance, "inventory");
        const accountsReceivable = getNumber(this.balance, "accounts_receivable");
        const receivablesTurnoverVal = safeDivide(revenue, accountsReceivable);
        const ratios = withInterpretation({
            asset_turnover: {
                value: safeDivide(revenue, totalAssets),
                formula: "Revenue / Total Assets",
                name: "Asset Turnover",
            },
            inventory_turnover: {
                value: safeDivide(cogs, inventory),
                formula: "COGS / Inventory",
                name: "Inventory Turnover",
            },
            receivables_turnover: {
                value: receivablesTurnoverVal,
                formula: "Revenue / Accounts Receivable",
                name: "Receivables Turnover",
            },
            dso: {
                value: receivablesTurnoverVal > 0 ? safeDivide(365, receivablesTurnoverVal) : 0.0,
                formula: "365 / Receivables Turnover",
                name: "Days Sales Outstanding",
            },
        });
        this.results.efficiency = ratios;
        return ratios;
    }
    calculateValuation(): any {
        let marketCap = getNumber(this.market, "market_cap");
        const sharePrice = getNumber(this.market, "share_price");
        const sharesOutstanding = getNumber(this.market, "shares_outstanding");
        const earningsGrowthRate = getNumber(this.market, "earnings_growth_rate");
        const netIncome = getNumber(this.income, "net_income");
        const revenue = getNumber(this.income, "revenue");
        const totalEquity = getNumber(this.balance, "total_equity");
        const totalDebt = getNumber(this.balance, "total_debt");
        const cash = getNumber(this.balance, "cash_and_equivalents");
        const ebitda = getNumber(this.income, "ebitda");
        if (marketCap === 0 && sharePrice > 0 && sharesOutstanding > 0) {
            marketCap = sharePrice * sharesOutstanding;
        }
        const eps = safeDivide(netIncome, sharesOutstanding);
        const bookValuePerShare = safeDivide(totalEquity, sharesOutstanding);
        const enterpriseValue = marketCap + totalDebt - cash;
        const pe = safeDivide(sharePrice, eps);
        const ratios = withInterpretation({
            pe_ratio: {
                value: pe,
                formula: "Share Price / Earnings Per Share",
                name: "Price-to-Earnings Ratio",
            },
            pb_ratio: {
                value: safeDivide(sharePrice, bookValuePerShare),
                formula: "Share Price / Book Value Per Share",
                name: "Price-to-Book Ratio",
            },
            ps_ratio: {
                value: safeDivide(marketCap, revenue),
                formula: "Market Cap / Revenue",
                name: "Price-to-Sales Ratio",
            },
            ev_ebitda: {
                value: safeDivide(enterpriseValue, ebitda),
                formula: "Enterprise Value / EBITDA",
                name: "EV/EBITDA",
            },
            peg_ratio: {
                value: earningsGrowthRate > 0 ? safeDivide(pe, earningsGrowthRate * 100) : 0.0,
                formula: "P/E Ratio / Earnings Growth Rate (%)",
                name: "PEG Ratio",
            },
        });
        this.results.valuation = ratios;
        return ratios;
    }
    calculateAll(): any {
        this.calculateProfitability();
        this.calculateLiquidity();
        this.calculateLeverage();
        this.calculateEfficiency();
        this.calculateValuation();
        return this.results;
    }
    formatText(category: any = null): any {
        const lines: any[] = [];
        lines.push("=".repeat(70));
        lines.push("FINANCIAL RATIO ANALYSIS");
        lines.push("=".repeat(70));
        const categories = category && this.results[category] ? { [category]: this.results[category] } : this.results;
        const percentageRatios = new Set(["roe", "roa", "gross_margin", "operating_margin", "net_margin"]);
        for (const [catName, ratios] of Object.entries(categories as Record<string, any>)) {
            lines.push(`\n--- ${catName.toUpperCase()} ---`);
            for (const [key, ratio] of Object.entries(ratios as Record<string, any>)) {
                const formatted = formatRatio(ratio.value, percentageRatios.has(key));
                lines.push(`  ${ratio.name}: ${formatted}`);
                lines.push(`    Formula: ${ratio.formula}`);
                lines.push(`    Assessment: ${ratio.interpretation}`);
            }
        }
        lines.push(`\n${"=".repeat(70)}`);
        return lines.join("\n");
    }
    toJson(category: any = null): any {
        if (category && this.results[category]) {
            return { category, ratios: this.results[category] };
        }
        return { categories: this.results };
    }
}
function formatRatio(value: any, isPercentage: any = false): any {
    if (isPercentage) {
        return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(2);
}
function parseArgs(argv: any): any {
    const args: Record<string, any> = {
        inputFile: null,
        format: "text",
        category: null,
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
        }
        else if (arg === "--category") {
            const value = argv[index + 1];
            if (!VALID_CATEGORIES.has(value)) {
                throw new Error("argument --category: invalid choice");
            }
            args.category = value;
            index += 1;
        }
        else if (arg === "-h" || arg === "--help") {
            args.help = true;
        }
        else if (!arg.startsWith("-") && args.inputFile === null) {
            args.inputFile = arg;
        }
        else {
            throw new Error(`unrecognized arguments: ${arg}`);
        }
    }
    return args;
}
function usage(): any {
    return [
        "Usage: ratio_calculator.mjs <input_file> [--format text|json] [--category profitability|liquidity|leverage|efficiency|valuation]",
        "",
        "Calculate and interpret financial ratios.",
    ].join("\n");
}
function main(): any {
    let args;
    try {
        args = parseArgs(process.argv.slice(2));
    }
    catch (error: any) {
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
    }
    catch (error: any) {
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
    const normalized = normalizeInputData(data);
    try {
        validateRatioInput(normalized, args.category);
    }
    catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
        return;
    }
    const calculator = new FinancialRatioCalculator(normalized);
    if (args.category) {
        const methodMap: Record<string, any> = {
            profitability: () => calculator.calculateProfitability(),
            liquidity: () => calculator.calculateLiquidity(),
            leverage: () => calculator.calculateLeverage(),
            efficiency: () => calculator.calculateEfficiency(),
            valuation: () => calculator.calculateValuation(),
        };
        methodMap[args.category]();
    }
    else {
        calculator.calculateAll();
    }
    if (args.format === "json") {
        console.log(JSON.stringify(calculator.toJson(args.category), null, 2));
    }
    else {
        console.log(calculator.formatText(args.category));
    }
}
main();
