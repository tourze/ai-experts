#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function aggregateRuns(results) {
  let correct = 0;
  let total = 0;
  for (const result of results ?? []) {
    const runs = result.runs ?? 0;
    const triggers = result.triggers ?? 0;
    total += runs;
    correct += result.should_trigger ?? true ? triggers : runs - triggers;
  }
  return { correct, total };
}

function scoreClass(correct, total) {
  if (total > 0) {
    const ratio = correct / total;
    if (ratio >= 0.8) return "score-good";
    if (ratio >= 0.5) return "score-ok";
  }
  return "score-bad";
}

function resultCell(result, test = false) {
  const didPass = result?.pass ?? false;
  const icon = didPass ? "&#10003;" : "&#10007;";
  const cssClass = didPass ? "pass" : "fail";
  const triggers = result?.triggers ?? 0;
  const runs = result?.runs ?? 0;
  return `<td class="result ${test ? "test-result " : ""}${cssClass}">${icon}<span class="rate">${triggers}/${runs}</span></td>`;
}

export function generateHtml(data, autoRefresh = false, skillName = "") {
  const history = data.history ?? [];
  const titlePrefix = skillName ? `${escapeHtml(skillName)} - ` : "";
  const first = history[0] ?? {};
  const trainQueries = (first.train_results ?? first.results ?? []).map((result) => ({
    query: result.query,
    should_trigger: result.should_trigger ?? true,
  }));
  const testQueries = (first.test_results ?? []).map((result) => ({
    query: result.query,
    should_trigger: result.should_trigger ?? true,
  }));
  const bestIter = history.length
    ? [...history].sort((left, right) => {
      const leftScore = testQueries.length ? left.test_passed ?? 0 : left.train_passed ?? left.passed ?? 0;
      const rightScore = testQueries.length ? right.test_passed ?? 0 : right.train_passed ?? right.passed ?? 0;
      return rightScore - leftScore;
    })[0].iteration
    : null;

  const rows = history.map((item) => {
    const trainResults = item.train_results ?? item.results ?? [];
    const testResults = item.test_results ?? [];
    const trainByQuery = new Map(trainResults.map((result) => [result.query, result]));
    const testByQuery = new Map(testResults.map((result) => [result.query, result]));
    const trainRuns = aggregateRuns(trainResults);
    const testRuns = aggregateRuns(testResults);
    const rowClass = item.iteration === bestIter ? "best-row" : "";

    return `            <tr class="${rowClass}">
                <td>${escapeHtml(item.iteration ?? "?")}</td>
                <td><span class="score ${scoreClass(trainRuns.correct, trainRuns.total)}">${trainRuns.correct}/${trainRuns.total}</span></td>
                <td><span class="score ${scoreClass(testRuns.correct, testRuns.total)}">${testRuns.correct}/${testRuns.total}</span></td>
                <td class="description">${escapeHtml(item.description ?? "")}</td>
${trainQueries.map((query) => `                ${resultCell(trainByQuery.get(query.query))}`).join("\n")}
${testQueries.map((query) => `                ${resultCell(testByQuery.get(query.query), true)}`).join("\n")}
            </tr>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
${autoRefresh ? '    <meta http-equiv="refresh" content="5">\n' : ""}    <title>${titlePrefix}Skill Description 优化</title>
    <style>
        body { font-family: Georgia, serif; margin: 0 auto; padding: 20px; background: #faf9f5; color: #141413; }
        h1 { font-family: system-ui, sans-serif; }
        .summary, .explainer { background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #e8e6dc; }
        .explainer { color: #666; font-size: 0.875rem; line-height: 1.6; }
        .table-container { overflow-x: auto; width: 100%; }
        table { border-collapse: collapse; background: white; border: 1px solid #e8e6dc; font-size: 12px; min-width: 100%; }
        th, td { padding: 8px; text-align: left; border: 1px solid #e8e6dc; white-space: normal; word-wrap: break-word; }
        th { font-family: system-ui, sans-serif; background: #141413; color: #faf9f5; font-weight: 500; }
        th.test-col { background: #6a9bcc; }
        th.query-col { min-width: 200px; }
        td.description { font-family: monospace; font-size: 11px; max-width: 400px; }
        td.result { text-align: center; font-size: 16px; min-width: 40px; }
        td.test-result { background: #f0f6fc; }
        .pass { color: #788c5d; }
        .fail { color: #c44; }
        .rate { font-size: 9px; color: #777; display: block; }
        .score { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; }
        .score-good { background: #eef2e8; color: #788c5d; }
        .score-ok { background: #fef3c7; color: #d97706; }
        .score-bad { background: #fceaea; color: #c44; }
        .best-row { background: #f5f8f2; }
        th.positive-col { border-bottom: 3px solid #788c5d; }
        th.negative-col { border-bottom: 3px solid #c44; }
    </style>
</head>
<body>
    <h1>${titlePrefix}Skill Description 优化</h1>
    <div class="explainer">此页面展示每轮 description 迭代，以及每个 train/test query 是否正确触发。</div>
    <div class="summary">
        <p><strong>原始：</strong> ${escapeHtml(data.original_description ?? "N/A")}</p>
        <p><strong>最佳：</strong> ${escapeHtml(data.best_description ?? "N/A")}</p>
        <p><strong>最佳分数：</strong> ${escapeHtml(data.best_score ?? "N/A")} ${data.best_test_score ? "(test)" : "(train)"}</p>
        <p><strong>迭代轮数：</strong> ${escapeHtml(data.iterations_run ?? 0)} | <strong>Train：</strong> ${escapeHtml(data.train_size ?? "?")} | <strong>Test：</strong> ${escapeHtml(data.test_size ?? "?")}</p>
    </div>
    <div class="table-container">
    <table>
        <thead>
            <tr>
                <th>轮次</th>
                <th>Train</th>
                <th>Test</th>
                <th class="query-col">Description</th>
${trainQueries.map((query) => `                <th class="${query.should_trigger ? "positive-col" : "negative-col"}">${escapeHtml(query.query)}</th>`).join("\n")}
${testQueries.map((query) => `                <th class="test-col ${query.should_trigger ? "positive-col" : "negative-col"}">${escapeHtml(query.query)}</th>`).join("\n")}
            </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
    </table>
    </div>
</body>
</html>
`;
}

function parseArgs(argv) {
  const args = { output: null, skillName: "" };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-o" || arg === "--output") args.output = argv[++index] ?? null;
    else if (arg === "--skill-name") args.skillName = argv[++index] ?? "";
    else positional.push(arg);
  }
  if (!positional.length) throw new Error("用法：node generate_report.mjs <results.json|- for stdin> [-o output.html] [--skill-name name]");
  return { ...args, input: positional[0] };
}

export function main(argv = process.argv.slice(2), stdin = process.stdin) {
  try {
    const args = parseArgs(argv);
    const data = args.input === "-"
      ? JSON.parse(readFileSync(stdin.fd, "utf8"))
      : JSON.parse(readFileSync(args.input, "utf8"));
    const html = generateHtml(data, false, args.skillName);
    if (args.output) {
      writeFileSync(args.output, html, "utf8");
      console.error(`报告已写入：${args.output}`);
    } else {
      console.log(html);
    }
    return 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
