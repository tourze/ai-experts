#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";

function parseArgs(argv) {
  const args = {
    input: null,
    format: "text",
    weights: null,
    output: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--format") {
      args.format = requireValue(argv, ++i, arg);
      if (!["json", "text"].includes(args.format)) {
        throw new Error("--format must be one of: json, text");
      }
    } else if (arg === "--weights") {
      args.weights = requireValue(argv, ++i, arg);
    } else if (arg === "--output") {
      args.output = requireValue(argv, ++i, arg);
    } else if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (!args.input) {
      args.input = arg;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (!args.input) {
    throw new Error("input is required");
  }
  return args;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function printHelp() {
  console.log("Usage: competitive_matrix_builder.mjs competitors.json [--format json|text] [--weights pricing=2,ux=1.5] [--output file]");
}

function loadCompetitors(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdev(values) {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function normalizeScore(value, minVal = 1.0, maxVal = 10.0) {
  return Math.max(0.0, Math.min(100.0, ((value - minVal) / (maxVal - minVal)) * 100));
}

function classifyTier(score) {
  if (score >= 80) return "Leader";
  if (score >= 60) return "Strong Competitor";
  if (score >= 40) return "Viable Alternative";
  if (score >= 20) return "Niche Player";
  return "Weak";
}

function calculateWeightedScores(competitors, dimensions, weights = null) {
  const effectiveWeights = weights ?? Object.fromEntries(dimensions.map((dimension) => [dimension, 1.0]));
  const results = [];

  for (const competitor of competitors) {
    const scores = competitor.scores ?? {};
    let weightedTotal = 0.0;
    let weightSum = 0.0;
    const dimensionResults = {};

    for (const dimension of dimensions) {
      const raw = scores[dimension] ?? 0;
      const weight = effectiveWeights[dimension] ?? 1.0;
      const normalized = normalizeScore(raw);
      const weighted = normalized * weight;
      weightedTotal += weighted;
      weightSum += weight;
      dimensionResults[dimension] = {
        raw,
        normalized: round(normalized, 1),
        weight,
        weighted: round(weighted, 1),
      };
    }

    const overall = weightSum > 0 ? round(weightedTotal / weightSum, 1) : 0;
    results.push({
      name: competitor.name,
      overall_score: overall,
      dimensions: dimensionResults,
      tier: classifyTier(overall),
      pricing: competitor.pricing ?? {},
      strengths: competitor.strengths ?? [],
      weaknesses: competitor.weaknesses ?? [],
      is_you: Boolean(competitor.is_you),
    });
  }

  results.sort((a, b) => b.overall_score - a.overall_score);
  return results;
}

function gapAnalysis(yourScores, competitorScores, dimensions) {
  const gaps = {};

  for (const dimension of dimensions) {
    const yourValue = yourScores[dimension] ?? 0;
    const competitorValues = competitorScores
      .filter((competitor) => !competitor.is_you && competitor.dimensions?.[dimension])
      .map((competitor) => competitor.dimensions[dimension].raw);

    if (competitorValues.length === 0) continue;

    const avgComp = mean(competitorValues);
    const bestComp = Math.max(...competitorValues);
    const gapToAvg = round(yourValue - avgComp, 1);
    const gapToBest = round(yourValue - bestComp, 1);
    gaps[dimension] = {
      your_score: yourValue,
      competitor_avg: round(avgComp, 1),
      competitor_best: bestComp,
      gap_to_avg: gapToAvg,
      gap_to_best: gapToBest,
      status: gapToAvg > 0.5 ? "ahead" : (gapToAvg < -0.5 ? "behind" : "parity"),
      priority: gapToBest < -2 ? "high" : (gapToBest < -1 ? "medium" : "low"),
    };
  }

  return {
    gaps,
    biggest_opportunities: Object.entries(gaps)
      .filter(([, value]) => value.status === "behind")
      .map(([dimension, value]) => ({ dimension, ...value }))
      .sort((a, b) => a.gap_to_best - b.gap_to_best)
      .slice(0, 5),
    competitive_advantages: Object.entries(gaps)
      .filter(([, value]) => value.status === "ahead")
      .map(([dimension, value]) => ({ dimension, ...value }))
      .sort((a, b) => b.gap_to_avg - a.gap_to_avg)
      .slice(0, 5),
  };
}

function positioningAnalysis(scored) {
  const scores = scored.map((competitor) => competitor.overall_score);
  const yourIndex = scored.findIndex((competitor) => competitor.is_you);

  return {
    market_leaders: scored.filter((competitor) => competitor.tier === "Leader").map((competitor) => competitor.name),
    your_rank: yourIndex >= 0 ? yourIndex + 1 : null,
    total_competitors: scored.length,
    score_distribution: {
      mean: scores.length > 0 ? round(mean(scores), 1) : 0,
      stdev: scores.length > 1 ? round(stdev(scores), 1) : 0,
      min: scores.length > 0 ? round(Math.min(...scores), 1) : 0,
      max: scores.length > 0 ? round(Math.max(...scores), 1) : 0,
    },
    tier_distribution: Object.fromEntries(
      ["Leader", "Strong Competitor", "Viable Alternative", "Niche Player", "Weak"]
        .map((tier) => [tier, scored.filter((competitor) => competitor.tier === tier).length]),
    ),
  };
}

function pad(value, width) {
  return String(value).padEnd(width, " ");
}

function formatText(result) {
  const lines = [];
  lines.push("=".repeat(70));
  lines.push("COMPETITIVE MATRIX ANALYSIS");
  lines.push(`Generated: ${result.generated_at}`);
  lines.push("=".repeat(70));
  lines.push("\n## COMPETITIVE RANKING\n");
  lines.push(`${pad("Rank", 6)}${pad("Competitor", 25)}${pad("Score", 10)}${pad("Tier", 20)}`);
  lines.push("-".repeat(61));

  result.scored_competitors.forEach((competitor, index) => {
    const marker = competitor.is_you ? " ← YOU" : "";
    lines.push(`${pad(index + 1, 6)}${pad(competitor.name, 25)}${pad(competitor.overall_score, 10)}${pad(competitor.tier, 20)}${marker}`);
  });

  lines.push("\n## DIMENSION BREAKDOWN\n");
  const header = `${pad("Dimension", 20)}${result.scored_competitors.map((competitor) => pad(competitor.name.slice(0, 12), 14)).join("")}`;
  lines.push(header);
  lines.push("-".repeat(header.length));
  for (const dimension of result.dimensions) {
    let row = pad(dimension, 20);
    for (const competitor of result.scored_competitors) {
      row += pad(competitor.dimensions?.[dimension]?.raw ?? "N/A", 14);
    }
    lines.push(row);
  }

  const analysis = result.gap_analysis;
  if (analysis) {
    if (analysis.biggest_opportunities.length > 0) {
      lines.push("\n## BIGGEST OPPORTUNITIES (where you're behind)\n");
      for (const opportunity of analysis.biggest_opportunities) {
        lines.push(`  • ${opportunity.dimension}: You=${opportunity.your_score}, Best=${opportunity.competitor_best}, Gap=${opportunity.gap_to_best} [${opportunity.priority.toUpperCase()} priority]`);
      }
    }

    if (analysis.competitive_advantages.length > 0) {
      lines.push("\n## COMPETITIVE ADVANTAGES (where you lead)\n");
      for (const advantage of analysis.competitive_advantages) {
        lines.push(`  • ${advantage.dimension}: You=${advantage.your_score}, Avg=${advantage.competitor_avg}, Lead=+${advantage.gap_to_avg}`);
      }
    }
  }

  const positioning = result.positioning ?? {};
  if (Object.keys(positioning).length > 0) {
    lines.push("\n## MARKET POSITIONING\n");
    lines.push(`  Market Leaders: ${(positioning.market_leaders ?? ["None"]).join(", ")}`);
    if (positioning.your_rank) {
      lines.push(`  Your Rank: #${positioning.your_rank} of ${positioning.total_competitors}`);
    }
    const distribution = positioning.score_distribution ?? {};
    lines.push(`  Score Range: ${distribution.min ?? 0} - ${distribution.max ?? 0} (avg: ${distribution.mean ?? 0}, stdev: ${distribution.stdev ?? 0})`);
  }

  lines.push(`\n${"=".repeat(70)}`);
  return lines.join("\n");
}

function buildMatrix(data, weightOverrides = null) {
  const competitors = data.competitors ?? [];
  let dimensions = data.dimensions ?? [];
  const yourProduct = data.your_product ?? {};

  if (competitors.length === 0) {
    return { error: "No competitors provided" };
  }
  if (dimensions.length === 0) {
    dimensions = Object.keys(competitors[0].scores ?? {});
  }

  const weights = { ...(data.weights ?? {}) };
  if (weightOverrides) {
    Object.assign(weights, weightOverrides);
  }

  const allEntries = [...competitors];
  if (Object.keys(yourProduct).length > 0) {
    allEntries.unshift({ ...yourProduct, is_you: true });
  }

  const scored = calculateWeightedScores(allEntries, dimensions, weights);
  const resultWeights = Object.keys(weights).length > 0
    ? weights
    : Object.fromEntries(dimensions.map((dimension) => [dimension, 1.0]));

  const result = {
    generated_at: new Date().toISOString(),
    dimensions,
    weights: resultWeights,
    scored_competitors: scored,
    positioning: positioningAnalysis(scored),
  };

  if (Object.keys(yourProduct).length > 0) {
    result.gap_analysis = gapAnalysis(yourProduct.scores ?? {}, scored, dimensions);
  }

  return result;
}

function parseWeights(weightString) {
  const weights = {};
  for (const pair of weightString.split(",")) {
    if (!pair.includes("=")) continue;
    const [key, value] = pair.split("=", 2);
    const parsed = Number.parseFloat(value.trim());
    if (Number.isNaN(parsed)) {
      throw new Error(`invalid weight for ${key.trim()}: ${value.trim()}`);
    }
    weights[key.trim()] = parsed;
  }
  return weights;
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const data = loadCompetitors(args.input);
  const weightOverrides = args.weights ? parseWeights(args.weights) : null;
  const result = buildMatrix(data, weightOverrides);
  const output = args.format === "json" ? JSON.stringify(result, null, 2) : formatText(result);

  if (args.output) {
    writeFileSync(args.output, output, "utf-8");
    console.log(`Output written to ${args.output}`);
  } else {
    console.log(output);
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
