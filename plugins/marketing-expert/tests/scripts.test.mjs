import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/marketing-expert");
const campaignAnalyticsRoot = `${pluginRoot}/skills/campaign-analytics`;

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: resolve("."),
    encoding: "utf-8",
    ...options,
  });
}

function parseJsonAfterReport(stdout) {
  const start = stdout.indexOf("{\n");
  assert.notEqual(start, -1, stdout);
  return JSON.parse(stdout.slice(start));
}

test("Node 脚本通过语法检查", () => {
  const scripts = [
    `${pluginRoot}/skills/copy-editing/scripts/readability_scorer.mjs`,
    `${pluginRoot}/skills/analytics-tracking/scripts/tracking_plan_generator.mjs`,
    `${pluginRoot}/skills/competitor-alternatives/scripts/comparison_matrix_builder.mjs`,
    `${campaignAnalyticsRoot}/scripts/attribution_analyzer.mjs`,
    `${campaignAnalyticsRoot}/scripts/campaign_roi_calculator.mjs`,
    `${campaignAnalyticsRoot}/scripts/funnel_analyzer.mjs`,
  ];

  for (const script of scripts) {
    const result = run("node", ["--check", script]);

    assert.equal(result.status, 0, result.stderr);
  }
});

test("readability_scorer.mjs 输出稳定 JSON 指标", () => {
  const result = run("node", [
    `${pluginRoot}/skills/copy-editing/scripts/readability_scorer.mjs`,
    "--json",
  ], {
    input: "Clear copy sells. Customers act fast.\n",
  });

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.stats.word_count, 6);
  assert.equal(output.stats.sentence_count, 2);
  assert.equal(output.flesch_reading_ease.score, 91);
  assert.equal(output.flesch_kincaid_grade.grade_level, 1.3);
  assert.equal(output.overall_score, 91);
});

test("comparison_matrix_builder.mjs 输出稳定 JSON 矩阵", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "marketing-comparison-"));
  const inputPath = join(tempDir, "matrix.json");

  try {
    writeFileSync(
      inputPath,
      `${JSON.stringify({
        your_product: "NovaCRM",
        features: [
          {
            name: "Workflow automation",
            category: "Automation",
            your_status: "full",
            competitors: { AcmeSuite: "partial", LegacyFlow: "no" },
            notes: "All paid plans",
          },
          {
            name: "Audit logs",
            category: "Security",
            your_status: "no",
            competitors: { AcmeSuite: "full", LegacyFlow: "no" },
          },
          {
            name: "Mobile app",
            category: "Access",
            your_status: "planned",
            competitors: { AcmeSuite: "no", LegacyFlow: "partial" },
          },
          {
            name: "Unknown status fallback",
            category: "Reliability",
            your_status: "beta",
            competitors: { AcmeSuite: "full", LegacyFlow: "unknown" },
          },
        ],
      })}\n`,
      "utf-8",
    );

    const result = run("node", [
      `${pluginRoot}/skills/competitor-alternatives/scripts/comparison_matrix_builder.mjs`,
      "--input",
      inputPath,
      "--json",
    ]);

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.deepEqual(output.meta, {
      your_product: "NovaCRM",
      competitors: ["AcmeSuite", "LegacyFlow"],
      categories: ["Access", "Automation", "Reliability", "Security"],
      total_features: 4,
      overall_win_pct: 25,
      verdict: "Trailing",
    });
    assert.deepEqual(output.competitor_scores.AcmeSuite, {
      wins: 1,
      ties: 1,
      losses: 2,
      win_pct: 25,
      verdict: "Trailing",
    });
    assert.deepEqual(output.competitor_scores.LegacyFlow, {
      wins: 1,
      ties: 2,
      losses: 1,
      win_pct: 25,
      verdict: "Trailing",
    });
    assert.deepEqual(output.advantages, ["Workflow automation"]);
    assert.deepEqual(output.gaps, ["Audit logs", "Mobile app", "Unknown status fallback"]);
    assert.deepEqual(output.parity, []);
    assert.equal(output.features[2].your_status, "planned");
    assert.equal(output.features[3].your_status, "no");
    assert.equal(output.features[3].competitors.LegacyFlow, "no");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("funnel_analyzer.mjs 输出稳定 JSON 漏斗分段结果", () => {
  const result = run("node", [
    `${campaignAnalyticsRoot}/scripts/funnel_analyzer.mjs`,
    `${campaignAnalyticsRoot}/assets/sample_campaign_data.json`,
    "--format",
    "json",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(output.rankings, [
    {
      rank: 1,
      segment: "organic",
      overall_conversion_rate: 5.6,
      total_entries: 5000,
      total_conversions: 280,
    },
    {
      rank: 2,
      segment: "paid",
      overall_conversion_rate: 3,
      total_entries: 3000,
      total_conversions: 90,
    },
    {
      rank: 3,
      segment: "email",
      overall_conversion_rate: 2.5,
      total_entries: 2000,
      total_conversions: 50,
    },
  ]);
  assert.deepEqual(output.segment_results.organic.bottleneck_absolute, {
    transition: "Awareness -> Interest",
    dropoff_count: 2200,
  });
  assert.deepEqual(output.segment_results.organic.bottleneck_relative, {
    transition: "Intent -> Purchase",
    dropoff_rate: 67.06,
  });
  assert.deepEqual(output.stage_comparison.at(-1), {
    stage: "Purchase",
    organic: { count: 280, conversion_rate: 32.94 },
    paid: { count: 90, conversion_rate: 25.71 },
    email: { count: 50, conversion_rate: 25 },
  });
});

test("attribution_analyzer.mjs 输出稳定 JSON 归因结果", () => {
  const samplePath = `${campaignAnalyticsRoot}/assets/sample_campaign_data.json`;
  const result = run("node", [
    `${campaignAnalyticsRoot}/scripts/attribution_analyzer.mjs`,
    samplePath,
    "--format",
    "json",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.deepEqual(output.summary, {
    total_journeys: 8,
    converted_journeys: 6,
    conversion_rate: 75,
    total_revenue: 3700,
    channels_observed: [
      "direct",
      "display",
      "email",
      "organic_search",
      "organic_social",
      "paid_search",
      "paid_social",
      "referral",
    ],
  });
  assert.equal(output.models["first-touch"].paid_social, 1200);
  assert.equal(output.models["last-touch"].direct, 2000);
  assert.equal(output.models.linear.email, 1003.33);
  assert.equal(output.models["time-decay"].paid_search, 881.03);
  assert.equal(output.models["position-based"].direct, 800);

  const linearOnly = run("node", [
    `${campaignAnalyticsRoot}/scripts/attribution_analyzer.mjs`,
    samplePath,
    "--model",
    "linear",
    "--format",
    "json",
  ]);

  assert.equal(linearOnly.status, 0, linearOnly.stderr);
  const linearOutput = JSON.parse(linearOnly.stdout);
  assert.deepEqual(Object.keys(linearOutput.models), ["linear"]);
  assert.equal(linearOutput.models.linear.organic_search, 666.67);
});

test("campaign_roi_calculator.mjs 输出稳定 JSON ROI 指标", () => {
  const result = run("node", [
    `${campaignAnalyticsRoot}/scripts/campaign_roi_calculator.mjs`,
    `${campaignAnalyticsRoot}/assets/sample_campaign_data.json`,
    "--format",
    "json",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.portfolio_summary.total_campaigns, 5);
  assert.equal(output.portfolio_summary.total_spend, 34000);
  assert.equal(output.portfolio_summary.total_revenue, 99000);
  assert.equal(output.portfolio_summary.portfolio_roi_pct, 191.18);
  assert.equal(output.portfolio_summary.blended_cpa, 161.9);
  assert.deepEqual(output.portfolio_summary.underperforming_campaigns, [
    "Spring Email Campaign",
    "Facebook Awareness Q1",
    "LinkedIn B2B Outreach",
  ]);
  assert.deepEqual(output.portfolio_summary.channel_summary.paid_social, {
    spend: 14000,
    revenue: 17000,
    roi_pct: 21.43,
    roas: 1.21,
    leads: 250,
    customers: 30,
  });

  const springEmail = output.campaigns.find((campaign) => campaign.name === "Spring Email Campaign");
  assert.equal(springEmail.metrics.roas, 5);
  assert.equal(springEmail.metrics.cpa, 111.11);
  assert.deepEqual(springEmail.flags, [
    "ROAS (5.00x) is below industry low (30.0x) for email",
    "CPA ($111.11) exceeds industry high ($40.00) for email",
  ]);

  const linkedin = output.campaigns.find((campaign) => campaign.name === "LinkedIn B2B Outreach");
  assert.equal(linkedin.metrics.profit, -1000);
  assert.ok(linkedin.flags.includes("Campaign is unprofitable: $-1,000.00 net loss"));
});

test("tracking_plan_generator.mjs 输出稳定 JSON 埋点方案", () => {
  const result = run("node", [
    `${pluginRoot}/skills/analytics-tracking/scripts/tracking_plan_generator.mjs`,
    "--json",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const output = parseJsonAfterReport(result.stdout);
  assert.equal(output.event_taxonomy.length, 15);
  assert.deepEqual([...output.conversion_events].sort(), [
    "checkout_completed",
    "demo_requested",
    "signup_completed",
    "trial_started",
  ]);
  assert.equal(output.gtm_configuration.tags.length, 20);
  assert.equal(output.gtm_configuration.variable_count, 29);
  assert.equal(output.gtm_configuration.trigger_count, 15);
  assert.equal(output.consent_mode.mode, "advanced");
  assert.equal(output.ga4_custom_dimensions.user_scoped.length, 5);
});
