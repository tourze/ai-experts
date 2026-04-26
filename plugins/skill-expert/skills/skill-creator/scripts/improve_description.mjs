#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseSkillMd, withoutClaudeCodeEnv } from "./utils.mjs";

function callClaude(prompt, model, timeout = 300) {
  const args = ["-p", "--output-format", "text"];
  if (model) args.push("--model", model);
  const result = spawnSync("claude", args, {
    input: prompt,
    encoding: "utf8",
    env: withoutClaudeCodeEnv(),
    timeout: timeout * 1000,
    maxBuffer: 1024 * 1024 * 50,
  });
  if (result.status !== 0) {
    throw new Error(`claude -p exited ${result.status}\nstderr: ${result.stderr}`);
  }
  return result.stdout;
}

function extractDescription(text) {
  const match = text.match(/<new_description>([\s\S]*?)<\/new_description>/);
  return (match ? match[1] : text).trim().replace(/^["']|["']$/g, "");
}

function buildPrompt({
  skillName,
  skillContent,
  currentDescription,
  evalResults,
  history,
  testResults = null,
}) {
  const failedTriggers = evalResults.results.filter((result) => result.should_trigger && !result.pass);
  const falseTriggers = evalResults.results.filter((result) => !result.should_trigger && !result.pass);
  const trainScore = `${evalResults.summary.passed}/${evalResults.summary.total}`;
  const scoresSummary = testResults
    ? `Train: ${trainScore}, Test: ${testResults.summary.passed}/${testResults.summary.total}`
    : `Train: ${trainScore}`;

  let prompt = `你正在优化一个 Claude Code skill 的 description。skill 名称是 "${skillName}"。skill 类似 prompt，但带有渐进披露机制：Claude 先看到 title 和 description，并据此决定是否使用该 skill；如果决定使用，再读取 .md 文件，其中包含更多细节，也可能链接到 skill 目录中的 helper files、scripts、补充文档或示例。

description 会出现在 Claude 的 "available_skills" 列表中。用户发送 query 时，Claude 只根据 title 和 description 判断是否调用 skill。你的目标是写出一个 description：相关 query 会触发，无关 query 不会触发。

当前 description：
<current_description>
"${currentDescription}"
</current_description>

当前分数（${scoresSummary}）：
<scores_summary>
`;

  if (failedTriggers.length) {
    prompt += "未触发但应该触发：\n";
    for (const result of failedTriggers) {
      prompt += `  - "${result.query}"（触发 ${result.triggers}/${result.runs} 次）\n`;
    }
    prompt += "\n";
  }

  if (falseTriggers.length) {
    prompt += "误触发：\n";
    for (const result of falseTriggers) {
      prompt += `  - "${result.query}"（触发 ${result.triggers}/${result.runs} 次）\n`;
    }
    prompt += "\n";
  }

  if (history.length) {
    prompt += "之前尝试过的 description（不要重复这些写法，请尝试结构上不同的表达）：\n\n";
    for (const item of history) {
      const trainScoreText = `${item.train_passed ?? item.passed ?? 0}/${item.train_total ?? item.total ?? 0}`;
      const testScoreText = item.test_passed != null ? `, test=${item.test_passed}/${item.test_total}` : "";
      prompt += `<attempt train=${trainScoreText}${testScoreText}>\n`;
      prompt += `Description: "${item.description}"\n`;
      for (const result of item.results ?? []) {
        const status = result.pass ? "PASS" : "FAIL";
        prompt += `  [${status}] "${String(result.query).slice(0, 80)}"（触发 ${result.triggers}/${result.runs}）\n`;
      }
      if (item.note) prompt += `Note: ${item.note}\n`;
      prompt += "</attempt>\n\n";
    }
  }

  prompt += `</scores_summary>

Skill 内容（用于理解该 skill 做什么）：
<skill_content>
${skillContent}
</skill_content>

根据失败情况，写一个更可能正确触发的新 description。不要过拟合这些精确例子，要泛化到更广的用户意图。description 建议控制在约 100-200 词以内，并且必须少于 1024 个字符。

建议：
- 使用祈使句表达，例如 "Use this skill for..."
- 聚焦用户意图，而不是实现细节
- 与相邻 skill 区分清楚
- 如果多次尝试失败，改变结构或措辞

只返回包在 <new_description> 标签内的新 description 文本，不要输出其他内容。`;

  return prompt;
}

export function improveDescription({
  skillName,
  skillContent,
  currentDescription,
  evalResults,
  history,
  model,
  testResults = null,
  logDir = null,
  iteration = null,
}) {
  const prompt = buildPrompt({ skillName, skillContent, currentDescription, evalResults, history, testResults });
  const text = callClaude(prompt, model);
  let description = extractDescription(text);
  const transcript = {
    iteration,
    prompt,
    response: text,
    parsed_description: description,
    char_count: description.length,
    over_limit: description.length > 1024,
  };

  if (description.length > 1024) {
    const shortenPrompt = `${prompt}\n\n---\n\n上一次尝试生成的 description 有 ${description.length} 个字符，超过 1024 字符硬限制：\n\n"${description}"\n\n请在保留最重要触发词和意图覆盖的前提下，将它改写到 1024 字符以内。只返回包在 <new_description> 标签内的新 description。`;
    const shortenText = callClaude(shortenPrompt, model);
    const shortened = extractDescription(shortenText);
    transcript.rewrite_prompt = shortenPrompt;
    transcript.rewrite_response = shortenText;
    transcript.rewrite_description = shortened;
    transcript.rewrite_char_count = shortened.length;
    description = shortened;
  }

  transcript.final_description = description;
  if (logDir) {
    mkdirSync(logDir, { recursive: true });
    writeFileSync(join(logDir, `improve_iter_${iteration ?? "unknown"}.json`), JSON.stringify(transcript, null, 2), "utf8");
  }
  return description;
}

function parseArgs(argv) {
  const args = { history: null, verbose: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--eval-results") args.evalResults = argv[++index];
    else if (arg === "--skill-path") args.skillPath = argv[++index];
    else if (arg === "--history") args.history = argv[++index];
    else if (arg === "--model") args.model = argv[++index];
    else if (arg === "--verbose") args.verbose = true;
  }
  if (!args.evalResults || !args.skillPath || !args.model) {
    throw new Error("用法：node improve_description.mjs --eval-results results.json --skill-path skill-dir --model model");
  }
  return args;
}

export function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    if (!existsSync(join(args.skillPath, "SKILL.md"))) {
      console.error(`错误：${args.skillPath} 中未找到 SKILL.md`);
      return 1;
    }
    const evalResults = JSON.parse(readFileSync(args.evalResults, "utf8"));
    const history = args.history ? JSON.parse(readFileSync(args.history, "utf8")) : [];
    const { name, content } = parseSkillMd(args.skillPath);
    const currentDescription = evalResults.description;
    if (args.verbose) {
      console.error(`当前：${currentDescription}`);
      console.error(`分数：${evalResults.summary.passed}/${evalResults.summary.total}`);
    }
    const newDescription = improveDescription({
      skillName: name,
      skillContent: content,
      currentDescription,
      evalResults,
      history,
      model: args.model,
    });
    if (args.verbose) console.error(`改进后：${newDescription}`);
    console.log(JSON.stringify({
      description: newDescription,
      history: history.concat([{
        description: currentDescription,
        passed: evalResults.summary.passed,
        failed: evalResults.summary.failed,
        total: evalResults.summary.total,
        results: evalResults.results,
      }]),
    }, null, 2));
    return 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
