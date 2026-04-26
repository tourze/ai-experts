#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { generateHtml } from "./generate_report.mjs";
import { improveDescription } from "./improve_description.mjs";
import { findProjectRoot, runEval } from "./run_eval.mjs";
import { parseSkillMd } from "./utils.mjs";

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(values, seed) {
  const random = seededRandom(seed);
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function splitEvalSet(evalSet, holdout, seed = 42) {
  const trigger = shuffle(evalSet.filter((item) => item.should_trigger), seed);
  const noTrigger = shuffle(evalSet.filter((item) => !item.should_trigger), seed + 1);
  const triggerTestCount = Math.max(1, Math.trunc(trigger.length * holdout));
  const noTriggerTestCount = Math.max(1, Math.trunc(noTrigger.length * holdout));
  return {
    trainSet: trigger.slice(triggerTestCount).concat(noTrigger.slice(noTriggerTestCount)),
    testSet: trigger.slice(0, triggerTestCount).concat(noTrigger.slice(0, noTriggerTestCount)),
  };
}

function printEvalStats(label, results, elapsed) {
  const positives = results.filter((result) => result.should_trigger);
  const negatives = results.filter((result) => !result.should_trigger);
  const tp = positives.reduce((sum, result) => sum + result.triggers, 0);
  const posRuns = positives.reduce((sum, result) => sum + result.runs, 0);
  const fn = posRuns - tp;
  const fp = negatives.reduce((sum, result) => sum + result.triggers, 0);
  const negRuns = negatives.reduce((sum, result) => sum + result.runs, 0);
  const tn = negRuns - fp;
  const total = tp + tn + fp + fn;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 1.0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 1.0;
  const accuracy = total > 0 ? (tp + tn) / total : 0.0;
  console.error(`${label}: ${tp + tn}/${total} 正确，precision=${Math.round(precision * 100)}% recall=${Math.round(recall * 100)}% accuracy=${Math.round(accuracy * 100)}%（${elapsed.toFixed(1)}s）`);
  for (const result of results) {
    const status = result.pass ? "PASS" : "FAIL";
    console.error(`  [${status}] rate=${result.triggers}/${result.runs} expected=${result.should_trigger}: ${result.query.slice(0, 60)}`);
  }
}

function openFile(path) {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", path] : [path];
  try {
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.unref();
  } catch {
    // Opening the browser is best-effort.
  }
}

export async function runLoop({
  evalSet,
  skillPath,
  descriptionOverride,
  numWorkers,
  timeout,
  maxIterations,
  runsPerQuery,
  triggerThreshold,
  holdout,
  model,
  verbose,
  liveReportPath = null,
  logDir = null,
}) {
  const projectRoot = findProjectRoot();
  const { name, description: originalDescription, content } = parseSkillMd(skillPath);
  let currentDescription = descriptionOverride ?? originalDescription;
  const { trainSet, testSet } = holdout > 0 ? splitEvalSet(evalSet, holdout) : { trainSet: evalSet, testSet: [] };
  if (verbose && holdout > 0) console.error(`拆分：${trainSet.length} train，${testSet.length} test（holdout=${holdout}）`);

  const history = [];
  let exitReason = "unknown";

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    if (verbose) {
      console.error(`\n${"=".repeat(60)}`);
      console.error(`迭代 ${iteration}/${maxIterations}`);
      console.error(`Description: ${currentDescription}`);
      console.error("=".repeat(60));
    }

    const allQueries = trainSet.concat(testSet);
    const started = Date.now();
    const allResults = await runEval({
      evalSet: allQueries,
      skillName: name,
      description: currentDescription,
      numWorkers,
      timeout,
      projectRoot,
      runsPerQuery,
      triggerThreshold,
      model,
    });
    const evalElapsed = (Date.now() - started) / 1000;
    const trainQueries = new Set(trainSet.map((item) => item.query));
    const trainResultList = allResults.results.filter((result) => trainQueries.has(result.query));
    const testResultList = allResults.results.filter((result) => !trainQueries.has(result.query));
    const trainPassed = trainResultList.filter((result) => result.pass).length;
    const trainSummary = { passed: trainPassed, failed: trainResultList.length - trainPassed, total: trainResultList.length };
    const testPassed = testResultList.filter((result) => result.pass).length;
    const testSummary = testSet.length ? { passed: testPassed, failed: testResultList.length - testPassed, total: testResultList.length } : null;
    const trainResults = { results: trainResultList, summary: trainSummary };
    const testResults = testSummary ? { results: testResultList, summary: testSummary } : null;

    history.push({
      iteration,
      description: currentDescription,
      train_passed: trainSummary.passed,
      train_failed: trainSummary.failed,
      train_total: trainSummary.total,
      train_results: trainResults.results,
      test_passed: testSummary?.passed ?? null,
      test_failed: testSummary?.failed ?? null,
      test_total: testSummary?.total ?? null,
      test_results: testResults?.results ?? null,
      passed: trainSummary.passed,
      failed: trainSummary.failed,
      total: trainSummary.total,
      results: trainResults.results,
    });

    if (liveReportPath) {
      const partialOutput = {
        original_description: originalDescription,
        best_description: currentDescription,
        best_score: "in progress",
        iterations_run: history.length,
        holdout,
        train_size: trainSet.length,
        test_size: testSet.length,
        history,
      };
      writeFileSync(liveReportPath, generateHtml(partialOutput, true, name), "utf8");
    }

    if (verbose) {
      printEvalStats("Train", trainResults.results, evalElapsed);
      if (testSummary) printEvalStats("Test ", testResults.results, 0);
    }

    if (trainSummary.failed === 0) {
      exitReason = `all_passed（iteration ${iteration}）`;
      if (verbose) console.error(`\n第 ${iteration} 轮所有 train queries 均通过！`);
      break;
    }

    if (iteration === maxIterations) {
      exitReason = `max_iterations（${maxIterations}）`;
      if (verbose) console.error(`\n已达到最大迭代次数（${maxIterations}）。`);
      break;
    }

    if (verbose) console.error("\n正在改进 description...");
    const improveStarted = Date.now();
    const blindedHistory = history.map((item) => Object.fromEntries(Object.entries(item).filter(([key]) => !key.startsWith("test_"))));
    const newDescription = improveDescription({
      skillName: name,
      skillContent: content,
      currentDescription,
      evalResults: trainResults,
      history: blindedHistory,
      model,
      logDir,
      iteration,
    });
    if (verbose) console.error(`候选结果（${((Date.now() - improveStarted) / 1000).toFixed(1)}s）：${newDescription}`);
    currentDescription = newDescription;
  }

  const best = testSet.length
    ? [...history].sort((left, right) => (right.test_passed ?? 0) - (left.test_passed ?? 0))[0]
    : [...history].sort((left, right) => right.train_passed - left.train_passed)[0];
  const bestScore = testSet.length ? `${best.test_passed}/${best.test_total}` : `${best.train_passed}/${best.train_total}`;
  if (verbose) {
    console.error(`\n退出原因：${exitReason}`);
    console.error(`最佳分数：${bestScore}（iteration ${best.iteration}）`);
  }

  return {
    exit_reason: exitReason,
    original_description: originalDescription,
    best_description: best.description,
    best_score: bestScore,
    best_train_score: `${best.train_passed}/${best.train_total}`,
    best_test_score: testSet.length ? `${best.test_passed}/${best.test_total}` : null,
    final_description: currentDescription,
    iterations_run: history.length,
    holdout,
    train_size: trainSet.length,
    test_size: testSet.length,
    history,
  };
}

function parseArgs(argv) {
  const args = {
    description: null,
    numWorkers: 10,
    timeout: 30,
    maxIterations: 5,
    runsPerQuery: 3,
    triggerThreshold: 0.5,
    holdout: 0.4,
    verbose: false,
    report: "auto",
    resultsDir: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--eval-set") args.evalSet = argv[++index];
    else if (arg === "--skill-path") args.skillPath = argv[++index];
    else if (arg === "--description") args.description = argv[++index];
    else if (arg === "--num-workers") args.numWorkers = Number(argv[++index]);
    else if (arg === "--timeout") args.timeout = Number(argv[++index]);
    else if (arg === "--max-iterations") args.maxIterations = Number(argv[++index]);
    else if (arg === "--runs-per-query") args.runsPerQuery = Number(argv[++index]);
    else if (arg === "--trigger-threshold") args.triggerThreshold = Number(argv[++index]);
    else if (arg === "--holdout") args.holdout = Number(argv[++index]);
    else if (arg === "--model") args.model = argv[++index];
    else if (arg === "--verbose") args.verbose = true;
    else if (arg === "--report") args.report = argv[++index];
    else if (arg === "--results-dir") args.resultsDir = argv[++index];
  }
  if (!args.evalSet || !args.skillPath || !args.model) {
    throw new Error("用法：node run_loop.mjs --eval-set evals.json --skill-path skill-dir --model model [--max-iterations 5]");
  }
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    const evalSet = JSON.parse(readFileSync(args.evalSet, "utf8"));
    if (!existsSync(join(args.skillPath, "SKILL.md"))) {
      console.error(`错误：${args.skillPath} 中未找到 SKILL.md`);
      return 1;
    }
    const { name } = parseSkillMd(args.skillPath);
    let liveReportPath = null;
    if (args.report !== "none") {
      const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
      liveReportPath = args.report === "auto"
        ? join(tmpdir(), `skill_description_report_${name}_${timestamp}.html`)
        : args.report;
      writeFileSync(liveReportPath, "<html lang='zh-CN'><body><h1>正在启动优化循环...</h1><meta http-equiv='refresh' content='5'></body></html>", "utf8");
      openFile(liveReportPath);
    }

    let resultsDir = null;
    if (args.resultsDir) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      resultsDir = join(args.resultsDir, timestamp);
      mkdirSync(resultsDir, { recursive: true });
    }
    const output = await runLoop({
      evalSet,
      skillPath: args.skillPath,
      descriptionOverride: args.description,
      numWorkers: args.numWorkers,
      timeout: args.timeout,
      maxIterations: args.maxIterations,
      runsPerQuery: args.runsPerQuery,
      triggerThreshold: args.triggerThreshold,
      holdout: args.holdout,
      model: args.model,
      verbose: args.verbose,
      liveReportPath,
      logDir: resultsDir ? join(resultsDir, "logs") : null,
    });

    const jsonOutput = JSON.stringify(output, null, 2);
    console.log(jsonOutput);
    if (resultsDir) writeFileSync(join(resultsDir, "results.json"), jsonOutput, "utf8");
    if (liveReportPath) {
      const finalReport = generateHtml(output, false, name);
      writeFileSync(liveReportPath, finalReport, "utf8");
      console.error(`\n报告：${liveReportPath}`);
      if (resultsDir) writeFileSync(join(resultsDir, "report.html"), finalReport, "utf8");
    }
    if (resultsDir) console.error(`结果已保存到：${resultsDir}`);
    return 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
