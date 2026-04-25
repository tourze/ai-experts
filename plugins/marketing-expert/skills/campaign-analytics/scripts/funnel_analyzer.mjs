#!/usr/bin/env node
/**
 * Funnel Analyzer - Conversion funnel analysis with bottleneck detection.
 *
 * Usage:
 *   node funnel_analyzer.mjs funnel_data.json
 *   node funnel_analyzer.mjs funnel_data.json --format json
 */

import { readFileSync } from "node:fs";

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeDivide(numerator, denominator, defaultValue = 0.0) {
  if (denominator === 0) {
    return defaultValue;
  }
  return numerator / denominator;
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatInteger(value) {
  return Number(value).toLocaleString("en-US");
}

function padLeft(value, width) {
  return String(value).padStart(width);
}

function padRight(value, width) {
  return String(value).padEnd(width);
}

function analyzeFunnel(stages, counts) {
  if (stages.length !== counts.length) {
    throw new Error("Number of stages must match number of counts.");
  }
  if (stages.length === 0) {
    throw new Error("Funnel must have at least one stage.");
  }

  const stageMetrics = [];
  let maxDropoffAbs = 0;
  let maxDropoffRel = 0.0;
  let bottleneckAbs = null;
  let bottleneckRel = null;

  for (let index = 0; index < stages.length; index += 1) {
    const stage = stages[index];
    const count = counts[index];
    const metric = {
      stage,
      count,
      cumulative_conversion: round2(safeDivide(count, counts[0]) * 100),
    };

    if (index > 0) {
      const previousCount = counts[index - 1];
      const dropoff = previousCount - count;
      const conversionRate = safeDivide(count, previousCount) * 100;
      const dropoffRate = 100 - conversionRate;

      metric.from_previous = stages[index - 1];
      metric.conversion_rate = round2(conversionRate);
      metric.dropoff_count = dropoff;
      metric.dropoff_rate = round2(dropoffRate);

      if (dropoff > maxDropoffAbs) {
        maxDropoffAbs = dropoff;
        bottleneckAbs = `${stages[index - 1]} -> ${stage}`;
      }

      if (dropoffRate > maxDropoffRel) {
        maxDropoffRel = dropoffRate;
        bottleneckRel = `${stages[index - 1]} -> ${stage}`;
      }
    } else {
      metric.conversion_rate = 100.0;
      metric.dropoff_count = 0;
      metric.dropoff_rate = 0.0;
    }

    stageMetrics.push(metric);
  }

  const overallConversion = safeDivide(counts.at(-1), counts[0]) * 100;

  return {
    stage_metrics: stageMetrics,
    overall_conversion_rate: round2(overallConversion),
    total_entries: counts[0],
    total_conversions: counts.at(-1),
    total_lost: counts[0] - counts.at(-1),
    bottleneck_absolute: {
      transition: bottleneckAbs,
      dropoff_count: maxDropoffAbs,
    },
    bottleneck_relative: {
      transition: bottleneckRel,
      dropoff_rate: round2(maxDropoffRel),
    },
  };
}

function compareSegments(segments, stages) {
  const segmentResults = {};

  for (const [segmentName, segmentData] of Object.entries(segments)) {
    const counts = Array.isArray(segmentData?.counts) ? segmentData.counts : [];
    if (counts.length !== stages.length) {
      throw new Error(`Segment '${segmentName}' has ${counts.length} counts but ${stages.length} stages.`);
    }
    segmentResults[segmentName] = analyzeFunnel(stages, counts);
  }

  const ranked = Object.entries(segmentResults).sort(
    ([, left], [, right]) => right.overall_conversion_rate - left.overall_conversion_rate,
  );
  const rankings = ranked.map(([name, result], index) => ({
    rank: index + 1,
    segment: name,
    overall_conversion_rate: result.overall_conversion_rate,
    total_entries: result.total_entries,
    total_conversions: result.total_conversions,
  }));

  const stageComparison = stages.map((stage, index) => {
    const stageData = { stage };
    for (const segmentName of Object.keys(segments)) {
      const metrics = segmentResults[segmentName].stage_metrics[index];
      stageData[segmentName] = {
        count: metrics.count,
        conversion_rate: metrics.conversion_rate,
      };
    }
    return stageData;
  });

  return {
    segment_results: segmentResults,
    rankings,
    stage_comparison: stageComparison,
  };
}

function formatSingleFunnelText(analysis, title = "FUNNEL") {
  const lines = [];
  lines.push(`  ${title}`);
  lines.push(`  ${"=".repeat(60)}`);
  lines.push(`  Total Entries:      ${formatInteger(analysis.total_entries)}`);
  lines.push(`  Total Conversions:  ${formatInteger(analysis.total_conversions)}`);
  lines.push(`  Total Lost:         ${formatInteger(analysis.total_lost)}`);
  lines.push(`  Overall Conversion: ${analysis.overall_conversion_rate}%`);
  lines.push("");

  lines.push(`  ${padRight("Stage", 20)} ${padLeft("Count", 10)} ${padLeft("Conv Rate", 12)} ${padLeft("Drop-off", 12)} ${padLeft("Cumulative", 12)}`);
  lines.push(`  ${"-".repeat(20)} ${"-".repeat(10)} ${"-".repeat(12)} ${"-".repeat(12)} ${"-".repeat(12)}`);

  for (const metric of analysis.stage_metrics) {
    const count = formatInteger(metric.count);
    const conversion = `${Number(metric.conversion_rate).toFixed(1)}%`;
    const dropoff = metric.dropoff_count > 0
      ? `-${formatInteger(metric.dropoff_count)} (${Number(metric.dropoff_rate).toFixed(1)}%)`
      : "-";
    const cumulative = `${Number(metric.cumulative_conversion).toFixed(1)}%`;
    lines.push(
      `  ${padRight(metric.stage, 20)} ${padLeft(count, 10)} ${padLeft(conversion, 12)} ${padLeft(dropoff, 12)} ${padLeft(cumulative, 12)}`,
    );
  }

  lines.push("");
  lines.push(
    `  BOTTLENECK (Absolute): ${analysis.bottleneck_absolute.transition} (lost ${formatInteger(analysis.bottleneck_absolute.dropoff_count)})`,
  );
  lines.push(
    `  BOTTLENECK (Relative): ${analysis.bottleneck_relative.transition} (${analysis.bottleneck_relative.dropoff_rate}% drop-off)`,
  );

  return lines.join("\n");
}

function formatText(results) {
  const lines = [];
  lines.push("=".repeat(70));
  lines.push("FUNNEL CONVERSION ANALYSIS");
  lines.push("=".repeat(70));

  if (hasOwn(results, "stage_comparison")) {
    lines.push("");
    lines.push("SEGMENT RANKINGS");
    lines.push(`  ${padLeft("Rank", 4)} ${padRight("Segment", 25)} ${padLeft("Conversion", 12)} ${padLeft("Entries", 10)} ${padLeft("Conversions", 12)}`);
    lines.push(`  ${"-".repeat(4)} ${"-".repeat(25)} ${"-".repeat(12)} ${"-".repeat(10)} ${"-".repeat(12)}`);
    for (const ranking of results.rankings) {
      lines.push(
        `  ${padLeft(ranking.rank, 4)} ${padRight(ranking.segment, 25)} ${padLeft(`${Number(ranking.overall_conversion_rate).toFixed(2)}%`, 12)} ${padLeft(formatInteger(ranking.total_entries), 10)} ${padLeft(formatInteger(ranking.total_conversions), 12)}`,
      );
    }

    lines.push("");
    for (const [segmentName, segmentResult] of Object.entries(results.segment_results)) {
      lines.push("");
      lines.push(formatSingleFunnelText(segmentResult, `SEGMENT: ${segmentName.toUpperCase()}`));
    }

    lines.push("");
    lines.push("-".repeat(70));
    lines.push("STAGE-BY-STAGE COMPARISON");
    lines.push("-".repeat(70));
    const segmentNames = Object.keys(results.segment_results);
    let header = `  ${padRight("Stage", 20)}`;
    for (const segmentName of segmentNames) {
      header += ` ${padLeft(segmentName, 20)}`;
    }
    lines.push(header);
    lines.push(`  ${"-".repeat(20)}${` ${"-".repeat(20)}`.repeat(segmentNames.length)}`);

    for (const stageComparison of results.stage_comparison) {
      let row = `  ${padRight(stageComparison.stage, 20)}`;
      for (const segmentName of segmentNames) {
        const data = stageComparison[segmentName];
        row += ` ${padLeft(formatInteger(data.count), 8)} (${padLeft(`${Number(data.conversion_rate).toFixed(1)}%`, 5)})`;
      }
      lines.push(row);
    }
  } else {
    lines.push("");
    lines.push(formatSingleFunnelText(results));
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
    "Analyze conversion funnels with bottleneck detection and segment comparison.",
    "",
    "Usage:",
    "  node funnel_analyzer.mjs funnel_data.json",
    "  node funnel_analyzer.mjs funnel_data.json --format json",
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

function run(data) {
  if (hasOwn(data, "segments")) {
    const funnel = objectOrEmpty(data.funnel);
    const stages = Array.isArray(funnel.stages)
      ? funnel.stages
      : (Array.isArray(data.stages) ? data.stages : []);
    if (stages.length === 0) {
      throw new Error("Error: 'stages' list required for segment comparison.");
    }

    const segments = objectOrEmpty(data.segments);
    if (Object.keys(segments).length === 0) {
      throw new Error("Error: 'segments' dict is empty.");
    }
    return compareSegments(segments, stages);
  }

  if (hasOwn(data, "funnel")) {
    const funnel = objectOrEmpty(data.funnel);
    const stages = Array.isArray(funnel.stages) ? funnel.stages : [];
    const counts = Array.isArray(funnel.counts) ? funnel.counts : [];
    if (stages.length === 0 || counts.length === 0) {
      throw new Error("Error: 'funnel' must contain 'stages' and 'counts' arrays.");
    }
    return analyzeFunnel(stages, counts);
  }

  throw new Error("Error: Input must contain 'funnel' or 'segments' key.");
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

  const results = run(loadJson(args.inputFile));
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
