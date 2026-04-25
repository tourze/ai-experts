#!/usr/bin/env node
/**
 * comparison_matrix_builder.mjs - Competitive Feature Comparison Matrix Builder.
 * 100% Node.js stdlib, no npm installs required.
 *
 * Usage:
 *   node comparison_matrix_builder.mjs
 *   node comparison_matrix_builder.mjs --input matrix.json
 *   node comparison_matrix_builder.mjs --input matrix.json --json
 *   node comparison_matrix_builder.mjs --input matrix.json --markdown > comparison.md
 */

import { readFileSync } from "node:fs";

const STATUS_SCORE = {
  full: 2,
  partial: 1,
  no: 0,
  planned: 0,
};

const STATUS_LABEL = {
  full: "✅",
  partial: "🔶",
  no: "❌",
  planned: "🗓",
};

const STATUS_TEXT = {
  full: "Full",
  partial: "Partial",
  no: "No",
  planned: "Planned",
};

const DEMO_DATA = {
  your_product: "SwiftBase",
  features: [
    {
      name: "SSO / SAML",
      category: "Security",
      weight: 3,
      your_status: "full",
      competitors: { AcmeSaaS: "no", ProStack: "partial" },
      notes: "All plans",
    },
    {
      name: "2FA / MFA",
      category: "Security",
      weight: 3,
      your_status: "full",
      competitors: { AcmeSaaS: "full", ProStack: "full" },
      notes: "",
    },
    {
      name: "SOC 2 Type II",
      category: "Security",
      weight: 3,
      your_status: "planned",
      competitors: { AcmeSaaS: "full", ProStack: "no" },
      notes: "Q3 target",
    },
    {
      name: "Role-based access",
      category: "Security",
      weight: 2,
      your_status: "full",
      competitors: { AcmeSaaS: "partial", ProStack: "full" },
      notes: "",
    },
    {
      name: "REST API",
      category: "Integrations",
      weight: 3,
      your_status: "full",
      competitors: { AcmeSaaS: "full", ProStack: "full" },
      notes: "",
    },
    {
      name: "GraphQL API",
      category: "Integrations",
      weight: 2,
      your_status: "full",
      competitors: { AcmeSaaS: "no", ProStack: "partial" },
      notes: "",
    },
    {
      name: "Zapier Integration",
      category: "Integrations",
      weight: 2,
      your_status: "partial",
      competitors: { AcmeSaaS: "full", ProStack: "full" },
      notes: "10 zaps only",
    },
    {
      name: "Webhooks",
      category: "Integrations",
      weight: 2,
      your_status: "full",
      competitors: { AcmeSaaS: "full", ProStack: "no" },
      notes: "",
    },
    {
      name: "Custom domain",
      category: "Branding",
      weight: 2,
      your_status: "full",
      competitors: { AcmeSaaS: "partial", ProStack: "full" },
      notes: "",
    },
    {
      name: "White-label / rebrand",
      category: "Branding",
      weight: 2,
      your_status: "full",
      competitors: { AcmeSaaS: "no", ProStack: "partial" },
      notes: "Agency plan",
    },
    {
      name: "Priority support",
      category: "Support",
      weight: 2,
      your_status: "full",
      competitors: { AcmeSaaS: "partial", ProStack: "full" },
      notes: "24/7",
    },
    {
      name: "Dedicated CSM",
      category: "Support",
      weight: 2,
      your_status: "no",
      competitors: { AcmeSaaS: "full", ProStack: "full" },
      notes: "Enterprise only",
    },
    {
      name: "SLA guarantee",
      category: "Support",
      weight: 3,
      your_status: "no",
      competitors: { AcmeSaaS: "full", ProStack: "no" },
      notes: "Roadmap",
    },
  ],
};

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normaliseStatus(value) {
  const status = String(value || "no").trim().toLowerCase();
  return hasOwn(STATUS_SCORE, status) ? status : "no";
}

function verdict(winPct) {
  if (winPct >= 70) return "Strong advantage";
  if (winPct >= 50) return "Slight advantage";
  if (winPct >= 35) return "Competitive parity";
  return "Trailing";
}

function buildMatrix(data) {
  const input = objectOrEmpty(data);
  const yourProduct = input.your_product ?? "Your Product";
  const features = Array.isArray(input.features) ? input.features : [];

  if (features.length === 0) {
    throw new Error("No features provided in input.");
  }

  const competitors = [];
  const seen = new Set();
  for (const feature of features) {
    for (const competitor of Object.keys(objectOrEmpty(feature?.competitors))) {
      if (!seen.has(competitor)) {
        competitors.push(competitor);
        seen.add(competitor);
      }
    }
  }

  const categories = [...new Set(features.map((feature) => feature?.category ?? "General"))].sort();

  const featureRows = features.map((feature) => {
    const item = objectOrEmpty(feature);
    const name = item.name ?? "?";
    const category = item.category ?? "General";
    const weight = hasOwn(item, "weight") ? item.weight : 1;
    const yourStatus = normaliseStatus(item.your_status ?? "no");
    const yourScore = STATUS_SCORE[yourStatus];
    const featureCompetitors = objectOrEmpty(item.competitors);
    const compRaw = {};
    const compScores = {};

    for (const competitor of competitors) {
      compRaw[competitor] = normaliseStatus(featureCompetitors[competitor] ?? "no");
      compScores[competitor] = STATUS_SCORE[compRaw[competitor]];
    }

    const compScoreValues = Object.values(compScores);
    const youWin = competitors.length > 0 && competitors.every((competitor) => yourScore > compScores[competitor]);
    const youLose = competitors.some((competitor) => yourScore < compScores[competitor]);
    const yourMax = compScoreValues.length > 0 ? Math.max(...compScoreValues) : 0;
    const advantage = yourScore - yourMax;

    return {
      name,
      category,
      weight,
      your_status: yourStatus,
      your_score: yourScore,
      competitors: compRaw,
      comp_scores: compScores,
      you_win: youWin,
      you_lose: youLose,
      advantage,
      notes: item.notes ?? "",
    };
  });

  const competitorScores = {};
  for (const competitor of competitors) {
    const wins = featureRows.filter((row) => row.your_score > (row.comp_scores[competitor] ?? 0)).length;
    const ties = featureRows.filter((row) => row.your_score === (row.comp_scores[competitor] ?? 0)).length;
    const losses = featureRows.filter((row) => row.your_score < (row.comp_scores[competitor] ?? 0)).length;
    const total = featureRows.length;
    const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;

    competitorScores[competitor] = {
      wins,
      ties,
      losses,
      win_pct: winPct,
      verdict: verdict(winPct),
    };
  }

  const scoreValues = Object.values(competitorScores);
  const overallWinPct = scoreValues.length > 0
    ? Math.round(scoreValues.reduce((sum, score) => sum + score.win_pct, 0) / scoreValues.length)
    : 0;

  return {
    meta: {
      your_product: yourProduct,
      competitors,
      categories,
      total_features: featureRows.length,
      overall_win_pct: overallWinPct,
      verdict: verdict(overallWinPct),
    },
    competitor_scores: competitorScores,
    advantages: featureRows.filter((row) => row.advantage > 0).map((row) => row.name),
    gaps: featureRows.filter((row) => row.advantage < 0).map((row) => row.name),
    parity: featureRows.filter((row) => row.advantage === 0).map((row) => row.name),
    features: featureRows,
  };
}

function buildMarkdown(result) {
  const meta = result.meta;
  const rows = result.features;
  const competitors = meta.competitors;
  const lines = [];

  lines.push(`# Feature Comparison: ${meta.your_product} vs Competitors\n`);
  lines.push(
    `_Generated by comparison_matrix_builder.mjs — ${meta.total_features} features, ${competitors.length} competitor(s)_\n`,
  );

  lines.push("## Competitive Score Summary\n");
  lines.push("| Competitor | You Win | Tie | You Lose | Win % | Verdict |");
  lines.push("|---|---|---|---|---|---|");
  for (const [competitor, score] of Object.entries(result.competitor_scores)) {
    lines.push(
      `| ${competitor} | ${score.wins} | ${score.ties} | ${score.losses} | **${score.win_pct}%** | ${score.verdict} |`,
    );
  }
  lines.push(`\n**Overall win rate: ${meta.overall_win_pct}% — ${meta.verdict}**\n`);

  lines.push("## Feature Matrix\n");
  lines.push(`| Feature | ${meta.your_product} | ${competitors.join(" | ")} | Notes |`);
  lines.push(`|---|---|${Array.from({ length: competitors.length }, () => "---").join("|")}|---|`);

  let currentCategory = null;
  for (const row of rows) {
    if (row.category !== currentCategory) {
      lines.push(`| **${row.category}** | | ${Array.from({ length: competitors.length }, () => "").join(" | ")} |  |`);
      currentCategory = row.category;
    }

    const youIcon = STATUS_LABEL[row.your_status];
    const competitorIcons = competitors.map((competitor) => STATUS_LABEL[row.competitors[competitor] ?? "no"]).join(" | ");
    const featureName = row.advantage > 0 ? `**${row.name}**` : row.name;
    lines.push(`| ${featureName} | ${youIcon} | ${competitorIcons} | ${row.notes || ""} |`);
  }
  lines.push("");

  if (result.advantages.length > 0) {
    lines.push("## ✅ Your Advantages\n");
    for (const advantage of result.advantages) {
      lines.push(`- ${advantage}`);
    }
    lines.push("");
  }

  if (result.gaps.length > 0) {
    lines.push("## ⚠️ Feature Gaps (competitors ahead)\n");
    for (const gap of result.gaps) {
      lines.push(`- ${gap}`);
    }
    lines.push("");
  }

  lines.push("## Legend\n");
  for (const [status, icon] of Object.entries(STATUS_LABEL)) {
    lines.push(`- ${icon} ${STATUS_TEXT[status]}`);
  }
  lines.push("");

  return lines.join("\n");
}

function prettyPrint(result) {
  const meta = result.meta;

  console.log(`\n${"=".repeat(70)}`);
  console.log(`  COMPETITIVE MATRIX: ${meta.your_product.toUpperCase()} vs ${meta.competitors.join(", ")}`);
  console.log("=".repeat(70));
  console.log(`\n  Total features analysed : ${meta.total_features}`);
  console.log(`  Overall win rate        : ${meta.overall_win_pct}%  (${meta.verdict})`);

  console.log(`\n${"─".repeat(70)}`);
  console.log(`  ${"COMPETITOR".padEnd(22)}  ${"WIN%".padStart(5)}  ${"WINS".padStart(5)}  ${"TIES".padStart(5)}  ${"LOSSES".padStart(7)}  VERDICT`);
  console.log("─".repeat(70));
  for (const [competitor, score] of Object.entries(result.competitor_scores)) {
    const bar = "█".repeat(Math.floor(score.win_pct / 10)) + "░".repeat(10 - Math.floor(score.win_pct / 10));
    console.log(
      `  ${competitor.padEnd(22)}  ${`${score.win_pct}%`.padStart(5)}  ${String(score.wins).padStart(5)}  ${String(score.ties).padStart(5)}  ${String(score.losses).padStart(7)}  ${bar}  ${score.verdict}`,
    );
  }

  console.log(`\n${"─".repeat(70)}`);
  let header = `  ${"FEATURE".padEnd(28)} | ${"YOU".padStart(5).padEnd(8)}`;
  for (const competitor of meta.competitors) {
    header += ` | ${competitor.slice(0, 8).padStart(5).padEnd(8)}`;
  }
  console.log(header);
  console.log("─".repeat(30 + 11 * (1 + meta.competitors.length)));

  let currentCategory = null;
  for (const row of result.features) {
    if (row.category !== currentCategory) {
      console.log(`\n  [${row.category}]`);
      currentCategory = row.category;
    }

    let line = `  ${`  ${row.name}`.padEnd(28)} | ${STATUS_LABEL[row.your_status].padStart(5).padEnd(8)}`;
    for (const competitor of meta.competitors) {
      line += ` | ${STATUS_LABEL[row.competitors[competitor] ?? "no"].padStart(5).padEnd(8)}`;
    }
    if (row.advantage > 0) {
      line += "  ← advantage";
    } else if (row.advantage < 0) {
      line += "  ← gap";
    }
    console.log(line);
  }

  console.log(`\n  ✅ YOUR ADVANTAGES  (${result.advantages.length} features)`);
  for (const advantage of result.advantages) {
    console.log(`    • ${advantage}`);
  }

  console.log(`\n  ⚠️  FEATURE GAPS  (${result.gaps.length} features)`);
  for (const gap of result.gaps) {
    console.log(`    • ${gap}`);
  }

  console.log(
    `\n  Legend: ${STATUS_LABEL.full} Full  ${STATUS_LABEL.partial} Partial  ${STATUS_LABEL.no} No  ${STATUS_LABEL.planned} Planned\n`,
  );
}

function parseArgs(argv) {
  const args = {
    input: null,
    json: false,
    markdown: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") {
      args.input = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg === "--markdown") {
      args.markdown = true;
    } else if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function usage() {
  return [
    "Build a competitive feature comparison matrix (Node.js stdlib only).",
    "",
    "Usage:",
    "  node comparison_matrix_builder.mjs",
    "  node comparison_matrix_builder.mjs --input matrix.json",
    "  node comparison_matrix_builder.mjs --input matrix.json --json",
    "  node comparison_matrix_builder.mjs --input matrix.json --markdown",
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(usage());
    return;
  }

  let data;
  if (args.input) {
    data = JSON.parse(readFileSync(args.input, "utf-8"));
  } else {
    console.error("🔬  DEMO MODE — using sample SaaS product matrix\n");
    data = DEMO_DATA;
  }

  const result = buildMatrix(data);
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (args.markdown) {
    console.log(buildMarkdown(result));
  } else {
    prettyPrint(result);
    console.log("\n💡  TIP: Re-run with --markdown to get a copyable Markdown table.\n");
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
