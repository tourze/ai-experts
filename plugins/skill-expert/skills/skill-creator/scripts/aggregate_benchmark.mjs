#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function calculateStats(values) {
  if (!values.length) return { mean: 0.0, stddev: 0.0, min: 0.0, max: 0.0 };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.length > 1
    ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
    : 0;
  const round4 = (value) => Math.round(value * 10000) / 10000;
  return {
    mean: round4(mean),
    stddev: round4(Math.sqrt(variance)),
    min: round4(Math.min(...values)),
    max: round4(Math.max(...values)),
  };
}

function listDirs(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(path, entry.name))
    .sort();
}

export function loadRunResults(benchmarkDir) {
  const runsDir = join(benchmarkDir, "runs");
  let searchDir = null;
  if (existsSync(runsDir)) searchDir = runsDir;
  else if (listDirs(benchmarkDir).some((path) => basename(path).startsWith("eval-"))) searchDir = benchmarkDir;
  else {
    console.log(`No eval directories found in ${benchmarkDir} or ${runsDir}`);
    return {};
  }

  const results = {};
  const evalDirs = listDirs(searchDir).filter((path) => basename(path).startsWith("eval-"));
  evalDirs.forEach((evalDir, evalIndex) => {
    let evalId = evalIndex;
    const metadataPath = join(evalDir, "eval_metadata.json");
    if (existsSync(metadataPath)) {
      try {
        evalId = readJson(metadataPath).eval_id ?? evalIndex;
      } catch {
        evalId = evalIndex;
      }
    } else {
      const parsed = Number(basename(evalDir).split("-")[1]);
      if (Number.isFinite(parsed)) evalId = parsed;
    }

    for (const configDir of listDirs(evalDir)) {
      const runDirs = listDirs(configDir).filter((path) => basename(path).startsWith("run-"));
      if (!runDirs.length) continue;
      const config = basename(configDir);
      results[config] ??= [];

      for (const runDir of runDirs) {
        const runNumber = Number(basename(runDir).split("-")[1]);
        const gradingFile = join(runDir, "grading.json");
        if (!existsSync(gradingFile)) {
          console.log(`Warning: grading.json not found in ${runDir}`);
          continue;
        }

        let grading;
        try {
          grading = readJson(gradingFile);
        } catch (error) {
          console.log(`Warning: Invalid JSON in ${gradingFile}: ${error.message}`);
          continue;
        }

        const summary = grading.summary ?? {};
        const timing = grading.timing ?? {};
        const metrics = grading.execution_metrics ?? {};
        const result = {
          eval_id: evalId,
          run_number: runNumber,
          pass_rate: summary.pass_rate ?? 0.0,
          passed: summary.passed ?? 0,
          failed: summary.failed ?? 0,
          total: summary.total ?? 0,
          time_seconds: timing.total_duration_seconds ?? 0.0,
          tokens: metrics.output_chars ?? 0,
          tool_calls: metrics.total_tool_calls ?? 0,
          errors: metrics.errors_encountered ?? 0,
          expectations: grading.expectations ?? [],
          notes: [],
        };

        const timingFile = join(runDir, "timing.json");
        if (result.time_seconds === 0.0 && existsSync(timingFile)) {
          try {
            const timingData = readJson(timingFile);
            result.time_seconds = timingData.total_duration_seconds ?? 0.0;
            result.tokens = timingData.total_tokens ?? result.tokens;
          } catch {
            // Ignore optional timing data.
          }
        }

        for (const expectation of result.expectations) {
          if (!("text" in expectation) || !("passed" in expectation)) {
            console.log(`Warning: expectation in ${gradingFile} missing required fields (text, passed, evidence): ${JSON.stringify(expectation)}`);
          }
        }

        const notesSummary = grading.user_notes_summary ?? {};
        result.notes.push(...(notesSummary.uncertainties ?? []));
        result.notes.push(...(notesSummary.needs_review ?? []));
        result.notes.push(...(notesSummary.workarounds ?? []));
        results[config].push(result);
      }
    }
  });

  return results;
}

export function aggregateResults(results) {
  const runSummary = {};
  const configs = Object.keys(results);

  for (const config of configs) {
    const runs = results[config] ?? [];
    runSummary[config] = {
      pass_rate: calculateStats(runs.map((run) => run.pass_rate)),
      time_seconds: calculateStats(runs.map((run) => run.time_seconds)),
      tokens: calculateStats(runs.map((run) => run.tokens ?? 0)),
    };
  }

  const primary = configs.length ? runSummary[configs[0]] ?? {} : {};
  const baseline = configs.length >= 2 ? runSummary[configs[1]] ?? {} : {};
  const deltaPassRate = (primary.pass_rate?.mean ?? 0) - (baseline.pass_rate?.mean ?? 0);
  const deltaTime = (primary.time_seconds?.mean ?? 0) - (baseline.time_seconds?.mean ?? 0);
  const deltaTokens = (primary.tokens?.mean ?? 0) - (baseline.tokens?.mean ?? 0);

  runSummary.delta = {
    pass_rate: `${deltaPassRate >= 0 ? "+" : ""}${deltaPassRate.toFixed(2)}`,
    time_seconds: `${deltaTime >= 0 ? "+" : ""}${deltaTime.toFixed(1)}`,
    tokens: `${deltaTokens >= 0 ? "+" : ""}${deltaTokens.toFixed(0)}`,
  };

  return runSummary;
}

export function generateBenchmark(benchmarkDir, skillName = "", skillPath = "") {
  const results = loadRunResults(benchmarkDir);
  const runSummary = aggregateResults(results);
  const runs = [];

  for (const [config, configResults] of Object.entries(results)) {
    for (const result of configResults) {
      runs.push({
        eval_id: result.eval_id,
        configuration: config,
        run_number: result.run_number,
        result: {
          pass_rate: result.pass_rate,
          passed: result.passed,
          failed: result.failed,
          total: result.total,
          time_seconds: result.time_seconds,
          tokens: result.tokens ?? 0,
          tool_calls: result.tool_calls ?? 0,
          errors: result.errors ?? 0,
        },
        expectations: result.expectations,
        notes: result.notes,
      });
    }
  }

  const evalIds = [...new Set(runs.map((run) => run.eval_id))].sort((left, right) => left - right);
  return {
    metadata: {
      skill_name: skillName || "<skill-name>",
      skill_path: skillPath || "<path/to/skill>",
      executor_model: "<model-name>",
      analyzer_model: "<model-name>",
      timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      evals_run: evalIds,
      runs_per_configuration: 3,
    },
    runs,
    run_summary: runSummary,
    notes: [],
  };
}

export function generateMarkdown(benchmark) {
  const metadata = benchmark.metadata;
  const runSummary = benchmark.run_summary;
  const configs = Object.keys(runSummary).filter((key) => key !== "delta");
  const configA = configs[0] ?? "config_a";
  const configB = configs[1] ?? "config_b";
  const label = (value) => value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const aSummary = runSummary[configA] ?? {};
  const bSummary = runSummary[configB] ?? {};
  const delta = runSummary.delta ?? {};
  const aPass = aSummary.pass_rate ?? {};
  const bPass = bSummary.pass_rate ?? {};
  const aTime = aSummary.time_seconds ?? {};
  const bTime = bSummary.time_seconds ?? {};
  const aTokens = aSummary.tokens ?? {};
  const bTokens = bSummary.tokens ?? {};

  const lines = [
    `# Skill Benchmark: ${metadata.skill_name}`,
    "",
    `**Model**: ${metadata.executor_model}`,
    `**Date**: ${metadata.timestamp}`,
    `**Evals**: ${metadata.evals_run.join(", ")} (${metadata.runs_per_configuration} runs each per configuration)`,
    "",
    "## Summary",
    "",
    `| Metric | ${label(configA)} | ${label(configB)} | Delta |`,
    "|--------|------------|---------------|-------|",
    `| Pass Rate | ${((aPass.mean ?? 0) * 100).toFixed(0)}% +/- ${((aPass.stddev ?? 0) * 100).toFixed(0)}% | ${((bPass.mean ?? 0) * 100).toFixed(0)}% +/- ${((bPass.stddev ?? 0) * 100).toFixed(0)}% | ${delta.pass_rate ?? "-"} |`,
    `| Time | ${(aTime.mean ?? 0).toFixed(1)}s +/- ${(aTime.stddev ?? 0).toFixed(1)}s | ${(bTime.mean ?? 0).toFixed(1)}s +/- ${(bTime.stddev ?? 0).toFixed(1)}s | ${delta.time_seconds ?? "-"}s |`,
    `| Tokens | ${(aTokens.mean ?? 0).toFixed(0)} +/- ${(aTokens.stddev ?? 0).toFixed(0)} | ${(bTokens.mean ?? 0).toFixed(0)} +/- ${(bTokens.stddev ?? 0).toFixed(0)} | ${delta.tokens ?? "-"} |`,
  ];

  if (benchmark.notes?.length) {
    lines.push("", "## Notes", "", ...benchmark.notes.map((note) => `- ${note}`));
  }
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = { skillName: "", skillPath: "", output: null };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--skill-name") args.skillName = argv[++index] ?? "";
    else if (arg === "--skill-path") args.skillPath = argv[++index] ?? "";
    else if (arg === "--output" || arg === "-o") args.output = argv[++index] ?? null;
    else positional.push(arg);
  }
  if (!positional.length) throw new Error("Usage: node aggregate_benchmark.mjs <benchmark_dir> [--skill-name name] [--skill-path path] [--output benchmark.json]");
  return { ...args, benchmarkDir: positional[0] };
}

export function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    const benchmarkDir = resolve(args.benchmarkDir);
    if (!existsSync(benchmarkDir)) {
      console.log(`Directory not found: ${benchmarkDir}`);
      return 1;
    }
    const benchmark = generateBenchmark(benchmarkDir, args.skillName, args.skillPath);
    const outputJson = args.output ? resolve(args.output) : join(benchmarkDir, "benchmark.json");
    const outputMd = outputJson.replace(/\.json$/i, ".md");
    writeFileSync(outputJson, JSON.stringify(benchmark, null, 2), "utf8");
    console.log(`Generated: ${outputJson}`);
    writeFileSync(outputMd, generateMarkdown(benchmark), "utf8");
    console.log(`Generated: ${outputMd}`);

    const configs = Object.keys(benchmark.run_summary).filter((key) => key !== "delta");
    console.log("\nSummary:");
    for (const config of configs) {
      const rate = benchmark.run_summary[config].pass_rate.mean;
      const label = config.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
      console.log(`  ${label}: ${(rate * 100).toFixed(1)}% pass rate`);
    }
    console.log(`  Delta:         ${benchmark.run_summary.delta?.pass_rate ?? "-"}`);
    return 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
