#!/usr/bin/env node
/**
 * Campaign ROI Calculator - Comprehensive campaign ROI and performance metrics.
 *
 * Usage:
 *   node campaign_roi_calculator.mjs campaign_data.json
 *   node campaign_roi_calculator.mjs campaign_data.json --format json
 */

import { readFileSync } from "node:fs";

const BENCHMARKS = {
  ctr: {
    email: [1.0, 2.5, 5.0],
    paid_search: [1.5, 3.5, 7.0],
    paid_social: [0.5, 1.2, 3.0],
    display: [0.05, 0.1, 0.5],
    organic_search: [1.5, 3.0, 8.0],
    organic_social: [0.5, 1.5, 4.0],
    referral: [1.0, 3.0, 6.0],
    direct: [2.0, 4.0, 8.0],
    default: [0.5, 2.0, 5.0],
  },
  roas: {
    email: [30.0, 42.0, 60.0],
    paid_search: [2.0, 4.0, 8.0],
    paid_social: [1.5, 3.0, 6.0],
    display: [0.5, 1.5, 3.0],
    organic_search: [5.0, 10.0, 20.0],
    organic_social: [3.0, 6.0, 12.0],
    referral: [3.0, 5.0, 10.0],
    direct: [4.0, 8.0, 15.0],
    default: [2.0, 4.0, 8.0],
  },
  cpa: {
    email: [5.0, 15.0, 40.0],
    paid_search: [20.0, 50.0, 150.0],
    paid_social: [15.0, 40.0, 100.0],
    display: [30.0, 75.0, 200.0],
    organic_search: [5.0, 20.0, 60.0],
    organic_social: [10.0, 30.0, 80.0],
    referral: [10.0, 25.0, 70.0],
    direct: [5.0, 15.0, 50.0],
    default: [15.0, 45.0, 120.0],
  },
};

function safeDivide(numerator, denominator, defaultValue = 0.0) {
  if (denominator === 0) {
    return defaultValue;
  }
  return numerator / denominator;
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function money(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function padLeft(value, width) {
  return String(value).padStart(width);
}

function padRight(value, width) {
  return String(value).padEnd(width);
}

function pythonFloat(value) {
  return Number.isInteger(value) ? Number(value).toFixed(1) : String(value);
}

function getBenchmark(metric, channel) {
  const metricBenchmarks = BENCHMARKS[metric] ?? {};
  return metricBenchmarks[channel] ?? metricBenchmarks.default ?? [0, 0, 0];
}

function assessPerformance(value, benchmark, higherIsBetter = true) {
  const [low, target, high] = benchmark;

  if (higherIsBetter) {
    if (value >= high) return "excellent";
    if (value >= target) return "good";
    if (value >= low) return "below_target";
    return "underperforming";
  }

  if (value <= low) return "excellent";
  if (value <= target) return "good";
  if (value <= high) return "below_target";
  return "underperforming";
}

function calculateCampaignMetrics(campaign) {
  const name = campaign?.name ?? "Unnamed Campaign";
  const channel = campaign?.channel ?? "default";
  const spend = campaign?.spend ?? 0.0;
  const revenue = campaign?.revenue ?? 0.0;
  const impressions = campaign?.impressions ?? 0;
  const clicks = campaign?.clicks ?? 0;
  const leads = campaign?.leads ?? 0;
  const customers = campaign?.customers ?? 0;

  const roi = safeDivide(revenue - spend, spend) * 100;
  const roas = safeDivide(revenue, spend);
  const cpa = customers > 0 ? safeDivide(spend, customers) : null;
  const cpl = leads > 0 ? safeDivide(spend, leads) : null;
  const cac = customers > 0 ? safeDivide(spend, customers) : null;
  const ctr = impressions > 0 ? safeDivide(clicks, impressions) * 100 : null;
  const cvr = leads > 0 ? safeDivide(customers, leads) * 100 : null;
  const cpc = clicks > 0 ? safeDivide(spend, clicks) : null;
  const cpm = impressions > 0 ? safeDivide(spend, impressions) * 1000 : null;
  const leadConversionRate = clicks > 0 ? safeDivide(leads, clicks) * 100 : null;
  const profit = revenue - spend;
  const assessments = {};
  const flags = [];

  if (ctr !== null) {
    const benchmark = getBenchmark("ctr", channel);
    const assessment = assessPerformance(ctr, benchmark, true);
    assessments.ctr = {
      value: round2(ctr),
      benchmark_range: { low: benchmark[0], target: benchmark[1], high: benchmark[2] },
      assessment,
    };
    if (assessment === "underperforming") {
      flags.push(`CTR (${ctr.toFixed(2)}%) is below industry low (${pythonFloat(benchmark[0])}%) for ${channel}`);
    }
  }

  if (roas > 0) {
    const benchmark = getBenchmark("roas", channel);
    const assessment = assessPerformance(roas, benchmark, true);
    assessments.roas = {
      value: round2(roas),
      benchmark_range: { low: benchmark[0], target: benchmark[1], high: benchmark[2] },
      assessment,
    };
    if (assessment === "underperforming") {
      flags.push(`ROAS (${roas.toFixed(2)}x) is below industry low (${pythonFloat(benchmark[0])}x) for ${channel}`);
    }
  }

  if (cpa !== null) {
    const benchmark = getBenchmark("cpa", channel);
    const assessment = assessPerformance(cpa, benchmark, false);
    assessments.cpa = {
      value: round2(cpa),
      benchmark_range: { low: benchmark[0], target: benchmark[1], high: benchmark[2] },
      assessment,
    };
    if (assessment === "underperforming") {
      flags.push(`CPA ($${cpa.toFixed(2)}) exceeds industry high ($${benchmark[2].toFixed(2)}) for ${channel}`);
    }
  }

  if (profit < 0) {
    flags.push(`Campaign is unprofitable: $${money(profit)} net loss`);
  }

  const recommendations = [];
  if (ctr !== null && ["below_target", "underperforming"].includes(assessments.ctr?.assessment)) {
    recommendations.push("Improve ad creative and targeting to increase CTR");
  }
  if (["below_target", "underperforming"].includes(assessments.roas?.assessment)) {
    recommendations.push("Review targeting and bid strategy to improve ROAS");
  }
  if (["below_target", "underperforming"].includes(assessments.cpa?.assessment)) {
    recommendations.push("Optimize landing pages and conversion flow to reduce CPA");
  }
  if (cvr !== null && cvr < 10) {
    recommendations.push("Lead-to-customer conversion is low; review sales process and lead quality");
  }
  if (leadConversionRate !== null && leadConversionRate < 2) {
    recommendations.push("Click-to-lead rate is low; improve landing page relevance and form experience");
  }
  if (profit > 0 && ["good", "excellent"].includes(assessments.roas?.assessment)) {
    recommendations.push("Campaign performing well; consider scaling budget");
  }

  return {
    name,
    channel,
    metrics: {
      spend: round2(spend),
      revenue: round2(revenue),
      profit: round2(profit),
      roi_pct: round2(roi),
      roas: round2(roas),
      cpa: cpa !== null ? round2(cpa) : null,
      cpl: cpl !== null ? round2(cpl) : null,
      cac: cac !== null ? round2(cac) : null,
      ctr_pct: ctr !== null ? round2(ctr) : null,
      cvr_pct: cvr !== null ? round2(cvr) : null,
      cpc: cpc !== null ? round2(cpc) : null,
      cpm: cpm !== null ? round2(cpm) : null,
      lead_conversion_rate_pct: leadConversionRate !== null ? round2(leadConversionRate) : null,
      impressions,
      clicks,
      leads,
      customers,
    },
    assessments,
    flags,
    recommendations,
  };
}

function calculatePortfolioSummary(campaignResults) {
  const totalSpend = campaignResults.reduce((sum, campaign) => sum + campaign.metrics.spend, 0.0);
  const totalRevenue = campaignResults.reduce((sum, campaign) => sum + campaign.metrics.revenue, 0.0);
  const totalImpressions = campaignResults.reduce((sum, campaign) => sum + campaign.metrics.impressions, 0);
  const totalClicks = campaignResults.reduce((sum, campaign) => sum + campaign.metrics.clicks, 0);
  const totalLeads = campaignResults.reduce((sum, campaign) => sum + campaign.metrics.leads, 0);
  const totalCustomers = campaignResults.reduce((sum, campaign) => sum + campaign.metrics.customers, 0);
  const totalProfit = totalRevenue - totalSpend;
  const underperforming = campaignResults.filter((campaign) => campaign.flags.length > 0).map((campaign) => campaign.name);
  const topPerformers = [...campaignResults].sort((left, right) => right.metrics.roi_pct - left.metrics.roi_pct);
  const channelTotals = {};

  for (const campaign of campaignResults) {
    const channel = campaign.channel;
    if (!channelTotals[channel]) {
      channelTotals[channel] = { spend: 0, revenue: 0, leads: 0, customers: 0 };
    }
    channelTotals[channel].spend += campaign.metrics.spend;
    channelTotals[channel].revenue += campaign.metrics.revenue;
    channelTotals[channel].leads += campaign.metrics.leads;
    channelTotals[channel].customers += campaign.metrics.customers;
  }

  const channelSummary = {};
  for (const [channel, totals] of Object.entries(channelTotals)) {
    channelSummary[channel] = {
      spend: round2(totals.spend),
      revenue: round2(totals.revenue),
      roi_pct: round2(safeDivide(totals.revenue - totals.spend, totals.spend) * 100),
      roas: round2(safeDivide(totals.revenue, totals.spend)),
      leads: Math.trunc(totals.leads),
      customers: Math.trunc(totals.customers),
    };
  }

  return {
    total_campaigns: campaignResults.length,
    total_spend: round2(totalSpend),
    total_revenue: round2(totalRevenue),
    total_profit: round2(totalProfit),
    portfolio_roi_pct: round2(safeDivide(totalProfit, totalSpend) * 100),
    portfolio_roas: round2(safeDivide(totalRevenue, totalSpend)),
    total_impressions: totalImpressions,
    total_clicks: totalClicks,
    total_leads: totalLeads,
    total_customers: totalCustomers,
    blended_ctr_pct: round2(safeDivide(totalClicks, totalImpressions) * 100),
    blended_cpl: totalLeads > 0 ? round2(safeDivide(totalSpend, totalLeads)) : null,
    blended_cpa: totalCustomers > 0 ? round2(safeDivide(totalSpend, totalCustomers)) : null,
    underperforming_campaigns: underperforming,
    top_performer: topPerformers.length > 0 ? topPerformers[0].name : null,
    channel_summary: channelSummary,
  };
}

function formatText(results) {
  const lines = [];
  lines.push("=".repeat(70));
  lines.push("CAMPAIGN ROI ANALYSIS");
  lines.push("=".repeat(70));

  const summary = results.portfolio_summary;
  lines.push("");
  lines.push("PORTFOLIO SUMMARY");
  lines.push(`  Total Campaigns:    ${summary.total_campaigns}`);
  lines.push(`  Total Spend:        $${padLeft(money(summary.total_spend), 12)}`);
  lines.push(`  Total Revenue:      $${padLeft(money(summary.total_revenue), 12)}`);
  lines.push(`  Total Profit:       $${padLeft(money(summary.total_profit), 12)}`);
  lines.push(`  Portfolio ROI:      ${summary.portfolio_roi_pct}%`);
  lines.push(`  Portfolio ROAS:     ${summary.portfolio_roas}x`);
  lines.push(`  Blended CTR:        ${summary.blended_ctr_pct}%`);
  if (summary.blended_cpl !== null) {
    lines.push(`  Blended CPL:        $${padLeft(money(summary.blended_cpl), 12)}`);
  }
  if (summary.blended_cpa !== null) {
    lines.push(`  Blended CPA:        $${padLeft(money(summary.blended_cpa), 12)}`);
  }

  if (summary.top_performer) {
    lines.push(`  Top Performer:      ${summary.top_performer}`);
  }
  if (summary.underperforming_campaigns.length > 0) {
    lines.push(`  Flagged:            ${summary.underperforming_campaigns.join(", ")}`);
  }

  if (Object.keys(summary.channel_summary).length > 0) {
    lines.push("");
    lines.push("-".repeat(70));
    lines.push("CHANNEL SUMMARY");
    lines.push(`  ${padRight("Channel", 20)} ${padLeft("Spend", 12)} ${padLeft("Revenue", 12)} ${padLeft("ROI", 10)} ${padLeft("ROAS", 8)}`);
    lines.push(`  ${"-".repeat(20)} ${"-".repeat(12)} ${"-".repeat(12)} ${"-".repeat(10)} ${"-".repeat(8)}`);
    for (const [channel, channelSummary] of Object.entries(summary.channel_summary).sort(([left], [right]) => left.localeCompare(right))) {
      lines.push(
        `  ${padRight(channel, 20)} $${padLeft(money(channelSummary.spend), 10)} $${padLeft(money(channelSummary.revenue), 10)} ${padLeft(`${channelSummary.roi_pct.toFixed(1)}%`, 10)} ${padLeft(`${channelSummary.roas.toFixed(2)}x`, 8)}`,
      );
    }
  }

  for (const campaign of results.campaigns) {
    lines.push("");
    lines.push("-".repeat(70));
    lines.push(`CAMPAIGN: ${campaign.name}`);
    lines.push(`Channel: ${campaign.channel}`);
    lines.push("-".repeat(70));

    const metrics = campaign.metrics;
    lines.push(`  ${padRight("Metric", 25)} ${padLeft("Value", 15)}`);
    lines.push(`  ${"-".repeat(25)} ${"-".repeat(15)}`);
    lines.push(`  ${padRight("Spend", 25)} $${padLeft(money(metrics.spend), 13)}`);
    lines.push(`  ${padRight("Revenue", 25)} $${padLeft(money(metrics.revenue), 13)}`);
    lines.push(`  ${padRight("Profit", 25)} $${padLeft(money(metrics.profit), 13)}`);
    lines.push(`  ${padRight("ROI", 25)} ${padLeft(metrics.roi_pct.toFixed(2), 13)}%`);
    lines.push(`  ${padRight("ROAS", 25)} ${padLeft(metrics.roas.toFixed(2), 13)}x`);

    if (metrics.cpa !== null) lines.push(`  ${padRight("CPA", 25)} $${padLeft(money(metrics.cpa), 13)}`);
    if (metrics.cpl !== null) lines.push(`  ${padRight("CPL", 25)} $${padLeft(money(metrics.cpl), 13)}`);
    if (metrics.cac !== null) lines.push(`  ${padRight("CAC", 25)} $${padLeft(money(metrics.cac), 13)}`);
    if (metrics.ctr_pct !== null) lines.push(`  ${padRight("CTR", 25)} ${padLeft(metrics.ctr_pct.toFixed(2), 13)}%`);
    if (metrics.cpc !== null) lines.push(`  ${padRight("CPC", 25)} $${padLeft(money(metrics.cpc), 13)}`);
    if (metrics.cpm !== null) lines.push(`  ${padRight("CPM", 25)} $${padLeft(money(metrics.cpm), 13)}`);
    if (metrics.cvr_pct !== null) lines.push(`  ${padRight("Lead-to-Customer CVR", 25)} ${padLeft(metrics.cvr_pct.toFixed(2), 13)}%`);
    if (metrics.lead_conversion_rate_pct !== null) {
      lines.push(`  ${padRight("Click-to-Lead Rate", 25)} ${padLeft(metrics.lead_conversion_rate_pct.toFixed(2), 13)}%`);
    }

    if (Object.keys(campaign.assessments).length > 0) {
      lines.push("");
      lines.push("  BENCHMARK ASSESSMENT");
      for (const [metricName, assessment] of Object.entries(campaign.assessments)) {
        const range = assessment.benchmark_range;
        const status = assessment.assessment.toUpperCase().replaceAll("_", " ");
        lines.push(
          `    ${metricName.toUpperCase()}: ${assessment.value} [low=${range.low}, target=${range.target}, high=${range.high}] -> ${status}`,
        );
      }
    }

    if (campaign.flags.length > 0) {
      lines.push("");
      lines.push("  WARNING FLAGS");
      for (const flag of campaign.flags) {
        lines.push(`    ! ${flag}`);
      }
    }

    if (campaign.recommendations.length > 0) {
      lines.push("");
      lines.push("  RECOMMENDATIONS");
      campaign.recommendations.forEach((recommendation, index) => {
        lines.push(`    ${index + 1}. ${recommendation}`);
      });
    }
  }

  lines.push("");
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = {
    inputFile: null,
    outputFormat: "text",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--format") {
      const value = argv[index + 1];
      if (!["json", "text"].includes(value)) {
        throw new Error("argument --format: invalid choice: expected 'json' or 'text'");
      }
      args.outputFormat = value;
      index += 1;
    } else if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else if (!arg.startsWith("-") && args.inputFile === null) {
      args.inputFile = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function usage() {
  return [
    "Calculate campaign ROI, ROAS, CPA, CPL, CAC with industry benchmarking.",
    "",
    "Usage:",
    "  node campaign_roi_calculator.mjs campaign_data.json",
    "  node campaign_roi_calculator.mjs campaign_data.json --format json",
  ].join("\n");
}

function loadJson(inputFile) {
  try {
    return JSON.parse(readFileSync(inputFile, "utf-8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`Error: File not found: ${inputFile}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Error: Invalid JSON in ${inputFile}: ${error.message}`);
    }
    throw error;
  }
}

function analyze(data) {
  const campaigns = Array.isArray(data?.campaigns) ? data.campaigns : [];
  if (campaigns.length === 0) {
    throw new Error("Error: No 'campaigns' array found in input data.");
  }

  const campaignResults = campaigns.map((campaign) => calculateCampaignMetrics(campaign));
  return {
    portfolio_summary: calculatePortfolioSummary(campaignResults),
    campaigns: campaignResults,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.inputFile) {
    throw new Error("Error: input_file is required.");
  }

  const results = analyze(loadJson(args.inputFile));
  if (args.outputFormat === "json") {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(formatText(results));
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
