#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  realpathSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSkillMd, withoutNestedAgentCliEnv } from "./utils";

export const procedure = defineCliProcedure({
  id: "skill-creator-improve-description",
  entry: procedureEntry(import.meta.url),
  description:
    "调用 LLM 分析 eval 失败记录，生成改进后的 skill frontmatter description：支持历史上下文和 1024 字符超限自动重写。",
  owners: { skillIds: ["skill-creator"] },
  target: "scripts/improve_description.mjs",
  runtime: "node",
  params: [
    {
      flag: "--eval-results",
      type: "路径",
      description: "Eval results JSON 文件路径（必填）",
      required: true,
    },
    {
      flag: "--skill-path",
      type: "路径",
      description: "Skill 目录路径（必填）",
      required: true,
    },
    {
      flag: "--model",
      type: "字符串",
      description: "LLM 模型名称（必填）",
      required: true,
    },
    {
      flag: "--history",
      type: "路径",
      description: "历史 description 改进记录 JSON 文件路径",
      required: false,
    },
    {
      flag: "--verbose",
      type: "",
      description: "输出详细日志，传此标志即启用",
      required: false,
    },
  ],

  exampleArgs: {
    args: [
      "--eval-results",
      "results.json",
      "--skill-path",
      "skills/my-skill",
      "--model",
      "claude-sonnet-4-20250514",
    ],
  },
});

function commandName(parts: string[]): string {
  return parts.join("");
}
function defaultInvocation(model: any): any {
  const platform =
    process.env.AI_EXPERTS_PROCEDURE_PLATFORM === "codex-cli"
      ? "codex"
      : "claude";
  if (platform === "codex") {
    const args: any[] = [
      "exec",
      "--skip-git-repo-check",
      "--sandbox",
      "read-only",
      "--ask-for-approval",
      "never",
      "--ephemeral",
    ];
    if (model) args.push("--model", model);
    args.push("-");
    return { command: commandName(["co", "dex"]), args };
  }
  const args: any[] = ["-p", "--output-format", "text"];
  if (model) args.push("--model", model);
  return { command: commandName(["clau", "de"]), args };
}
function configuredInvocation(model: any): any {
  const raw = process.env.AI_EXPERTS_DESCRIPTION_OPTIMIZER_COMMAND_JSON;
  if (!raw) return defaultInvocation(model);
  const parsed = JSON.parse(raw);
  if (
    !Array.isArray(parsed) ||
    parsed.length === 0 ||
    parsed.some((item) => typeof item !== "string")
  ) {
    throw new Error(
      "AI_EXPERTS_DESCRIPTION_OPTIMIZER_COMMAND_JSON must be a JSON string array",
    );
  }
  return { command: parsed[0], args: parsed.slice(1) };
}
function callModel(prompt: any, model: any, timeout: any = 300): any {
  const { command, args } = configuredInvocation(model);
  const result = spawnSync(command, args, {
    input: prompt,
    encoding: "utf8",
    env: withoutNestedAgentCliEnv(),
    timeout: timeout * 1000,
    maxBuffer: 1024 * 1024 * 50,
  });
  if (result.status !== 0) {
    throw new Error(
      `description optimizer exited ${result.status}\nstderr: ${result.stderr}`,
    );
  }
  return result.stdout;
}
function extractDescription(text: any): any {
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
}: any): any {
  const failedTriggers = evalResults.results.filter(
    (result: any) => result.should_trigger && !result.pass,
  );
  const falseTriggers = evalResults.results.filter(
    (result: any) => !result.should_trigger && !result.pass,
  );
  const trainScore = `${evalResults.summary.passed}/${evalResults.summary.total}`;
  const scoresSummary = testResults
    ? `Train: ${trainScore}, Test: ${testResults.summary.passed}/${testResults.summary.total}`
    : `Train: ${trainScore}`;
  let prompt = `你正在优化一个 AI agent skill 的 description。skill 名称是 "${skillName}"。skill 类似 prompt，但带有渐进披露机制：模型先看到 title 和 description，并据此决定是否使用该 skill；如果决定使用，再读取 .md 文件，其中包含更多细节，也可能链接到 skill 目录中的 helper files、scripts、补充文档或示例。

description 会出现在运行时的 "available_skills" 列表中。用户发送 query 时，模型只根据 title 和 description 判断是否调用 skill。你的目标是写出一个 description：相关 query 会触发，无关 query 不会触发。

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
    prompt +=
      "之前尝试过的 description（不要重复这些写法，请尝试结构上不同的表达）：\n\n";
    for (const item of history) {
      const trainScoreText = `${item.train_passed ?? item.passed ?? 0}/${item.train_total ?? item.total ?? 0}`;
      const testScoreText =
        item.test_passed != null
          ? `, test=${item.test_passed}/${item.test_total}`
          : "";
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
}: any): any {
  const prompt = buildPrompt({
    skillName,
    skillContent,
    currentDescription,
    evalResults,
    history,
    testResults,
  });
  const text = callModel(prompt, model);
  let description = extractDescription(text);
  const transcript: Record<string, any> = {
    iteration,
    prompt,
    response: text,
    parsed_description: description,
    char_count: description.length,
    over_limit: description.length > 1024,
  };
  if (description.length > 1024) {
    const shortenPrompt = `${prompt}\n\n---\n\n上一次尝试生成的 description 有 ${description.length} 个字符，超过 1024 字符硬限制：\n\n"${description}"\n\n请在保留最重要触发词和意图覆盖的前提下，将它改写到 1024 字符以内。只返回包在 <new_description> 标签内的新 description。`;
    const shortenText = callModel(shortenPrompt, model);
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
    writeFileSync(
      join(logDir, `improve_iter_${iteration ?? "unknown"}.json`),
      JSON.stringify(transcript, null, 2),
      "utf8",
    );
  }
  return description;
}
function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = { history: null, verbose: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--eval-results") args.evalResults = argv[++index];
    else if (arg === "--skill-path") args.skillPath = argv[++index];
    else if (arg === "--history") args.history = argv[++index];
    else if (arg === "--model") args.model = argv[++index];
    else if (arg === "--verbose") args.verbose = true;
  }
  if (!args.evalResults || !args.skillPath || !args.model) {
    throw new Error(
      "用法：node improve_description.mjs --eval-results results.json --skill-path skill-dir --model model",
    );
  }
  return args;
}
export function main(argv: readonly string[]): any {
  try {
    const args = parseArgs(argv);
    if (!existsSync(join(args.skillPath, "SKILL.md"))) {
      console.error(`错误：${args.skillPath} 中未找到 SKILL.md`);
      return 1;
    }
    const evalResults = JSON.parse(readFileSync(args.evalResults, "utf8"));
    const history = args.history
      ? JSON.parse(readFileSync(args.history, "utf8"))
      : [];
    const { name, content } = parseSkillMd(args.skillPath);
    const currentDescription = evalResults.description;
    if (args.verbose) {
      console.error(`当前：${currentDescription}`);
      console.error(
        `分数：${evalResults.summary.passed}/${evalResults.summary.total}`,
      );
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
    console.log(
      JSON.stringify(
        {
          description: newDescription,
          history: history.concat([
            {
              description: currentDescription,
              passed: evalResults.summary.passed,
              failed: evalResults.summary.failed,
              total: evalResults.summary.total,
              results: evalResults.results,
            },
          ]),
        },
        null,
        2,
      ),
    );
    return 0;
  } catch (error: any) {
    console.error(error.message);
    return 1;
  }
}
