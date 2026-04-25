#!/usr/bin/env node
/**
 * Attribution Analyzer - Multi-touch attribution modeling for marketing campaigns.
 *
 * Usage:
 *   node attribution_analyzer.mjs data.json
 *   node attribution_analyzer.mjs data.json --model time-decay
 *   node attribution_analyzer.mjs data.json --model time-decay --half-life 14
 *   node attribution_analyzer.mjs data.json --format json
 */

import { readFileSync } from "node:fs";

const MODELS = ["first-touch", "last-touch", "linear", "time-decay", "position-based"];

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

function addCredit(credits, channel, amount) {
  credits[channel] = (credits[channel] ?? 0.0) + amount;
}

function parseTimestamp(timestamp) {
  const value = String(timestamp);
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2}))?$/);
  if (!match) {
    throw new Error(`Cannot parse timestamp: ${timestamp}`);
  }

  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
}

function sortedTouchpoints(touchpoints) {
  return [...touchpoints].sort((left, right) => parseTimestamp(left.timestamp) - parseTimestamp(right.timestamp));
}

function firstTouchAttribution(journeys) {
  const credits = {};
  for (const journey of journeys) {
    if (!journey?.converted) continue;
    const touchpoints = Array.isArray(journey.touchpoints) ? journey.touchpoints : [];
    if (touchpoints.length === 0) continue;

    const sorted = sortedTouchpoints(touchpoints);
    addCredit(credits, sorted[0].channel, journey.revenue ?? 1.0);
  }
  return credits;
}

function lastTouchAttribution(journeys) {
  const credits = {};
  for (const journey of journeys) {
    if (!journey?.converted) continue;
    const touchpoints = Array.isArray(journey.touchpoints) ? journey.touchpoints : [];
    if (touchpoints.length === 0) continue;

    const sorted = sortedTouchpoints(touchpoints);
    addCredit(credits, sorted.at(-1).channel, journey.revenue ?? 1.0);
  }
  return credits;
}

function linearAttribution(journeys) {
  const credits = {};
  for (const journey of journeys) {
    if (!journey?.converted) continue;
    const touchpoints = Array.isArray(journey.touchpoints) ? journey.touchpoints : [];
    if (touchpoints.length === 0) continue;

    const revenue = journey.revenue ?? 1.0;
    const share = safeDivide(revenue, touchpoints.length);
    for (const touchpoint of touchpoints) {
      addCredit(credits, touchpoint.channel, share);
    }
  }
  return credits;
}

function timeDecayAttribution(journeys, halfLifeDays = 7.0) {
  const credits = {};
  const decayRate = Math.log(2) / halfLifeDays;

  for (const journey of journeys) {
    if (!journey?.converted) continue;
    const touchpoints = Array.isArray(journey.touchpoints) ? journey.touchpoints : [];
    if (touchpoints.length === 0) continue;

    const revenue = journey.revenue ?? 1.0;
    const sorted = sortedTouchpoints(touchpoints);
    const conversionTime = parseTimestamp(sorted.at(-1).timestamp);
    const weights = sorted.map((touchpoint) => {
      const daysBefore = (conversionTime - parseTimestamp(touchpoint.timestamp)) / 86400000.0;
      return Math.exp(-decayRate * daysBefore);
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0.0);
    if (totalWeight === 0) continue;

    sorted.forEach((touchpoint, index) => {
      addCredit(credits, touchpoint.channel, safeDivide(weights[index], totalWeight) * revenue);
    });
  }

  return credits;
}

function positionBasedAttribution(journeys) {
  const credits = {};
  for (const journey of journeys) {
    if (!journey?.converted) continue;
    const touchpoints = Array.isArray(journey.touchpoints) ? journey.touchpoints : [];
    if (touchpoints.length === 0) continue;

    const revenue = journey.revenue ?? 1.0;
    const sorted = sortedTouchpoints(touchpoints);

    if (sorted.length === 1) {
      addCredit(credits, sorted[0].channel, revenue);
    } else if (sorted.length === 2) {
      addCredit(credits, sorted[0].channel, revenue * 0.5);
      addCredit(credits, sorted.at(-1).channel, revenue * 0.5);
    } else {
      addCredit(credits, sorted[0].channel, revenue * 0.4);
      addCredit(credits, sorted.at(-1).channel, revenue * 0.4);

      const middleShare = safeDivide(revenue * 0.2, sorted.length - 2);
      for (const touchpoint of sorted.slice(1, -1)) {
        addCredit(credits, touchpoint.channel, middleShare);
      }
    }
  }
  return credits;
}

function runModel(modelName, journeys, halfLife = 7.0) {
  if (modelName === "first-touch") return firstTouchAttribution(journeys);
  if (modelName === "last-touch") return lastTouchAttribution(journeys);
  if (modelName === "linear") return linearAttribution(journeys);
  if (modelName === "time-decay") return timeDecayAttribution(journeys, halfLife);
  if (modelName === "position-based") return positionBasedAttribution(journeys);
  throw new Error(`Unknown model: ${modelName}. Choose from: ${MODELS.join(", ")}`);
}

function computeSummary(journeys) {
  const totalJourneys = journeys.length;
  const converted = journeys.filter((journey) => journey?.converted).length;
  const totalRevenue = journeys
    .filter((journey) => journey?.converted)
    .reduce((sum, journey) => sum + (journey.revenue ?? 0.0), 0.0);
  const channels = new Set();

  for (const journey of journeys) {
    const touchpoints = Array.isArray(journey?.touchpoints) ? journey.touchpoints : [];
    for (const touchpoint of touchpoints) {
      channels.add(touchpoint.channel);
    }
  }

  return {
    total_journeys: totalJourneys,
    converted_journeys: converted,
    conversion_rate: round2(safeDivide(converted, totalJourneys) * 100),
    total_revenue: round2(totalRevenue),
    channels_observed: [...channels].sort(),
  };
}

function formatText(results) {
  const lines = [];
  lines.push("=".repeat(70));
  lines.push("MULTI-TOUCH ATTRIBUTION ANALYSIS");
  lines.push("=".repeat(70));

  const summary = results.summary;
  lines.push("");
  lines.push("SUMMARY");
  lines.push(`  Total Journeys:     ${summary.total_journeys}`);
  lines.push(`  Converted:          ${summary.converted_journeys}`);
  lines.push(`  Conversion Rate:    ${summary.conversion_rate}%`);
  lines.push(`  Total Revenue:      $${money(summary.total_revenue)}`);
  lines.push(`  Channels Observed:  ${summary.channels_observed.join(", ")}`);

  for (const [modelName, credits] of Object.entries(results.models)) {
    lines.push("");
    lines.push("-".repeat(70));
    lines.push(`MODEL: ${modelName.toUpperCase()}`);
    lines.push("-".repeat(70));

    const entries = Object.entries(credits);
    if (entries.length === 0) {
      lines.push("  No conversions to attribute.");
      continue;
    }

    const totalCredit = entries.reduce((sum, [, credit]) => sum + credit, 0.0);
    const sortedChannels = entries.sort(([, left], [, right]) => right - left);

    lines.push(`  ${padRight("Channel", 25)} ${padLeft("Revenue Credit", 15)} ${padLeft("Share", 10)}`);
    lines.push(`  ${"-".repeat(25)} ${"-".repeat(15)} ${"-".repeat(10)}`);

    for (const [channel, credit] of sortedChannels) {
      const pct = safeDivide(credit, totalCredit) * 100;
      lines.push(`  ${padRight(channel, 25)} $${padLeft(money(credit), 13)} ${padLeft(`${pct.toFixed(1)}%`, 10)}`);
    }

    lines.push(`  ${padRight("TOTAL", 25)} $${padLeft(money(totalCredit), 13)} ${padLeft("100.0%", 10)}`);
  }

  if (Object.keys(results.models).length > 1) {
    lines.push("");
    lines.push("=".repeat(70));
    lines.push("CROSS-MODEL COMPARISON");
    lines.push("=".repeat(70));

    const allChannels = new Set();
    for (const credits of Object.values(results.models)) {
      for (const channel of Object.keys(credits)) {
        allChannels.add(channel);
      }
    }

    const modelNames = Object.keys(results.models);
    let header = `  ${padRight("Channel", 20)}`;
    for (const modelName of modelNames) {
      const short = modelName
        .split("-")
        .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
        .join(" ");
      header += ` ${padLeft(short, 14)}`;
    }
    lines.push(header);
    lines.push(`  ${"-".repeat(20)}${` ${"-".repeat(14)}`.repeat(modelNames.length)}`);

    for (const channel of [...allChannels].sort()) {
      let row = `  ${padRight(channel, 20)}`;
      for (const modelName of modelNames) {
        row += ` $${padLeft(money(results.models[modelName][channel] ?? 0.0), 12)}`;
      }
      lines.push(row);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = {
    inputFile: null,
    model: null,
    halfLife: 7.0,
    outputFormat: "text",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--model") {
      const value = argv[index + 1];
      if (!MODELS.includes(value)) {
        throw new Error(`argument --model: invalid choice: expected one of ${MODELS.join(", ")}`);
      }
      args.model = value;
      index += 1;
    } else if (arg === "--half-life") {
      const value = Number(argv[index + 1]);
      if (!Number.isFinite(value)) {
        throw new Error("argument --half-life: expected a number");
      }
      args.halfLife = value;
      index += 1;
    } else if (arg === "--format") {
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
    "Multi-touch attribution analyzer for marketing campaigns.",
    "",
    "Usage:",
    "  node attribution_analyzer.mjs data.json",
    "  node attribution_analyzer.mjs data.json --model time-decay",
    "  node attribution_analyzer.mjs data.json --model time-decay --half-life 14",
    "  node attribution_analyzer.mjs data.json --format json",
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

function analyze(data, options) {
  const journeys = Array.isArray(data?.journeys) ? data.journeys : [];
  if (journeys.length === 0) {
    throw new Error("Error: No 'journeys' array found in input data.");
  }

  const modelsToRun = options.model ? [options.model] : MODELS;
  const modelResults = {};
  for (const modelName of modelsToRun) {
    const credits = runModel(modelName, journeys, options.halfLife);
    modelResults[modelName] = Object.fromEntries(
      Object.entries(credits).map(([channel, value]) => [channel, round2(value)]),
    );
  }

  return {
    summary: computeSummary(journeys),
    models: modelResults,
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

  const results = analyze(loadJson(args.inputFile), args);
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
