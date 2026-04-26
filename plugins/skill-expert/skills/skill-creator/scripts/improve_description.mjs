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

  let prompt = `You are optimizing a skill description for a Claude Code skill called "${skillName}". A "skill" is sort of like a prompt, but with progressive disclosure -- there's a title and description that Claude sees when deciding whether to use the skill, and then if it does use the skill, it reads the .md file which has lots more details and potentially links to other resources in the skill folder like helper files and scripts and additional documentation or examples.

The description appears in Claude's "available_skills" list. When a user sends a query, Claude decides whether to invoke the skill based solely on the title and on this description. Your goal is to write a description that triggers for relevant queries, and doesn't trigger for irrelevant ones.

Here's the current description:
<current_description>
"${currentDescription}"
</current_description>

Current scores (${scoresSummary}):
<scores_summary>
`;

  if (failedTriggers.length) {
    prompt += "FAILED TO TRIGGER (should have triggered but didn't):\n";
    for (const result of failedTriggers) {
      prompt += `  - "${result.query}" (triggered ${result.triggers}/${result.runs} times)\n`;
    }
    prompt += "\n";
  }

  if (falseTriggers.length) {
    prompt += "FALSE TRIGGERS (triggered but shouldn't have):\n";
    for (const result of falseTriggers) {
      prompt += `  - "${result.query}" (triggered ${result.triggers}/${result.runs} times)\n`;
    }
    prompt += "\n";
  }

  if (history.length) {
    prompt += "PREVIOUS ATTEMPTS (do NOT repeat these -- try something structurally different):\n\n";
    for (const item of history) {
      const trainScoreText = `${item.train_passed ?? item.passed ?? 0}/${item.train_total ?? item.total ?? 0}`;
      const testScoreText = item.test_passed != null ? `, test=${item.test_passed}/${item.test_total}` : "";
      prompt += `<attempt train=${trainScoreText}${testScoreText}>\n`;
      prompt += `Description: "${item.description}"\n`;
      for (const result of item.results ?? []) {
        const status = result.pass ? "PASS" : "FAIL";
        prompt += `  [${status}] "${String(result.query).slice(0, 80)}" (triggered ${result.triggers}/${result.runs})\n`;
      }
      if (item.note) prompt += `Note: ${item.note}\n`;
      prompt += "</attempt>\n\n";
    }
  }

  prompt += `</scores_summary>

Skill content (for context on what the skill does):
<skill_content>
${skillContent}
</skill_content>

Based on the failures, write a new and improved description that is more likely to trigger correctly. Avoid overfitting to the exact examples; generalize to broader user intents. The description should not be more than about 100-200 words and must stay under 1024 characters.

Tips:
- Phrase it in the imperative: "Use this skill for..."
- Focus on the user's intent, not implementation details.
- Make it distinctive against nearby skills.
- If repeated attempts fail, change structure or wording.

Please respond with only the new description text in <new_description> tags, nothing else.`;

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
    const shortenPrompt = `${prompt}\n\n---\n\nA previous attempt produced this description, which at ${description.length} characters is over the 1024-character hard limit:\n\n"${description}"\n\nRewrite it to be under 1024 characters while keeping the most important trigger words and intent coverage. Respond with only the new description in <new_description> tags.`;
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
    throw new Error("Usage: node improve_description.mjs --eval-results results.json --skill-path skill-dir --model model");
  }
  return args;
}

export function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    if (!existsSync(join(args.skillPath, "SKILL.md"))) {
      console.error(`Error: No SKILL.md found at ${args.skillPath}`);
      return 1;
    }
    const evalResults = JSON.parse(readFileSync(args.evalResults, "utf8"));
    const history = args.history ? JSON.parse(readFileSync(args.history, "utf8")) : [];
    const { name, content } = parseSkillMd(args.skillPath);
    const currentDescription = evalResults.description;
    if (args.verbose) {
      console.error(`Current: ${currentDescription}`);
      console.error(`Score: ${evalResults.summary.passed}/${evalResults.summary.total}`);
    }
    const newDescription = improveDescription({
      skillName: name,
      skillContent: content,
      currentDescription,
      evalResults,
      history,
      model: args.model,
    });
    if (args.verbose) console.error(`Improved: ${newDescription}`);
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
