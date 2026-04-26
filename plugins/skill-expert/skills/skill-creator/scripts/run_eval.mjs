#!/usr/bin/env node

import { createInterface } from "node:readline";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseSkillMd, withoutClaudeCodeEnv } from "./utils.mjs";

export function findProjectRoot(startDir = process.cwd()) {
  let current = resolve(startDir);
  while (true) {
    if (existsSync(join(current, ".claude"))) return current;
    const parent = dirname(current);
    if (parent === current) return resolve(startDir);
    current = parent;
  }
}

function parseStreamEvent(event, state, cleanName) {
  if (event.type === "stream_event") {
    const streamEvent = event.event ?? {};
    const eventType = streamEvent.type ?? "";

    if (eventType === "content_block_start") {
      const contentBlock = streamEvent.content_block ?? {};
      if (contentBlock.type === "tool_use") {
        const toolName = contentBlock.name ?? "";
        if (toolName === "Skill" || toolName === "Read") {
          state.pendingToolName = toolName;
          state.accumulatedJson = "";
          return null;
        }
        return false;
      }
    } else if (eventType === "content_block_delta" && state.pendingToolName) {
      const delta = streamEvent.delta ?? {};
      if (delta.type === "input_json_delta") {
        state.accumulatedJson += delta.partial_json ?? "";
        if (state.accumulatedJson.includes(cleanName)) return true;
      }
    } else if (eventType === "content_block_stop" || eventType === "message_stop") {
      if (state.pendingToolName) return state.accumulatedJson.includes(cleanName);
      if (eventType === "message_stop") return false;
    }
    return null;
  }

  if (event.type === "assistant") {
    for (const contentItem of event.message?.content ?? []) {
      if (contentItem.type !== "tool_use") continue;
      const toolName = contentItem.name ?? "";
      const toolInput = contentItem.input ?? {};
      if (toolName === "Skill" && String(toolInput.skill ?? "").includes(cleanName)) return true;
      if (toolName === "Read" && String(toolInput.file_path ?? "").includes(cleanName)) return true;
      return false;
    }
  }

  if (event.type === "result") return state.triggered;
  return null;
}

export function runSingleQuery(query, skillName, skillDescription, timeout, projectRoot, model = null) {
  return new Promise((resolvePromise) => {
    const uniqueId = Math.random().toString(16).slice(2, 10);
    const cleanName = `${skillName}-skill-${uniqueId}`;
    const projectCommandsDir = join(projectRoot, ".claude", "commands");
    const commandFile = join(projectCommandsDir, `${cleanName}.md`);
    const indentedDescription = skillDescription.split("\n").join("\n  ");
    const commandContent = `---\ndescription: |\n  ${indentedDescription}\n---\n\n# ${skillName}\n\n此 skill 处理：${skillDescription}\n`;

    mkdirSync(projectCommandsDir, { recursive: true });
    writeFileSync(commandFile, commandContent, "utf8");

    const args = [
      "-p",
      query,
      "--output-format",
      "stream-json",
      "--verbose",
      "--include-partial-messages",
    ];
    if (model) args.push("--model", model);

    const child = spawn("claude", args, {
      cwd: projectRoot,
      env: withoutClaudeCodeEnv(),
      stdio: ["ignore", "pipe", "ignore"],
    });
    const state = { pendingToolName: null, accumulatedJson: "", triggered: false, done: false };

    const finish = (value) => {
      if (state.done) return;
      state.done = true;
      if (!child.killed) child.kill();
      try {
        if (existsSync(commandFile)) unlinkSync(commandFile);
      } catch {
        // Best-effort cleanup.
      }
      resolvePromise(Boolean(value));
    };

    const timer = setTimeout(() => finish(false), timeout * 1000);
    const rl = createInterface({ input: child.stdout });
    rl.on("line", (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const event = JSON.parse(trimmed);
        const result = parseStreamEvent(event, state, cleanName);
        if (result === true) {
          state.triggered = true;
          clearTimeout(timer);
          finish(true);
        } else if (result === false) {
          clearTimeout(timer);
          finish(false);
        }
      } catch {
        // Ignore non-JSON stream fragments.
      }
    });
    child.on("error", () => {
      clearTimeout(timer);
      finish(false);
    });
    child.on("close", () => {
      clearTimeout(timer);
      finish(state.triggered);
    });
  });
}

async function runWithLimit(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (next < tasks.length) {
      const current = next;
      next += 1;
      results[current] = await tasks[current]();
    }
  });
  await Promise.all(workers);
  return results;
}

export async function runEval({
  evalSet,
  skillName,
  description,
  numWorkers,
  timeout,
  projectRoot,
  runsPerQuery = 1,
  triggerThreshold = 0.5,
  model = null,
}) {
  const tasks = [];
  const taskInfo = [];
  for (const item of evalSet) {
    for (let runIndex = 0; runIndex < runsPerQuery; runIndex += 1) {
      tasks.push(() => runSingleQuery(item.query, skillName, description, timeout, projectRoot, model));
      taskInfo.push(item);
    }
  }

  const taskResults = await runWithLimit(tasks, numWorkers);
  const queryTriggers = new Map();
  const queryItems = new Map();
  taskResults.forEach((triggered, index) => {
    const item = taskInfo[index];
    queryItems.set(item.query, item);
    if (!queryTriggers.has(item.query)) queryTriggers.set(item.query, []);
    queryTriggers.get(item.query).push(Boolean(triggered));
  });

  const results = [];
  for (const item of evalSet) {
    const triggers = queryTriggers.get(item.query) ?? [];
    const triggerCount = triggers.filter(Boolean).length;
    const triggerRate = triggers.length ? triggerCount / triggers.length : 0;
    const shouldTrigger = item.should_trigger;
    const didPass = shouldTrigger ? triggerRate >= triggerThreshold : triggerRate < triggerThreshold;
    results.push({
      query: item.query,
      should_trigger: shouldTrigger,
      trigger_rate: triggerRate,
      triggers: triggerCount,
      runs: triggers.length,
      pass: didPass,
    });
  }

  const passed = results.filter((result) => result.pass).length;
  return {
    skill_name: skillName,
    description,
    results,
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
    },
  };
}

function parseArgs(argv) {
  const args = {
    description: null,
    numWorkers: 10,
    timeout: 30,
    runsPerQuery: 3,
    triggerThreshold: 0.5,
    model: null,
    verbose: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--eval-set") args.evalSet = argv[++index];
    else if (arg === "--skill-path") args.skillPath = argv[++index];
    else if (arg === "--description") args.description = argv[++index];
    else if (arg === "--num-workers") args.numWorkers = Number(argv[++index]);
    else if (arg === "--timeout") args.timeout = Number(argv[++index]);
    else if (arg === "--runs-per-query") args.runsPerQuery = Number(argv[++index]);
    else if (arg === "--trigger-threshold") args.triggerThreshold = Number(argv[++index]);
    else if (arg === "--model") args.model = argv[++index];
    else if (arg === "--verbose") args.verbose = true;
  }
  if (!args.evalSet || !args.skillPath) {
    throw new Error("用法：node run_eval.mjs --eval-set evals.json --skill-path skill-dir [--model model]");
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
    const { name, description } = parseSkillMd(args.skillPath);
    const testedDescription = args.description ?? description;
    const projectRoot = findProjectRoot();
    if (args.verbose) console.error(`正在评估：${testedDescription}`);
    const output = await runEval({
      evalSet,
      skillName: name,
      description: testedDescription,
      numWorkers: args.numWorkers,
      timeout: args.timeout,
      projectRoot,
      runsPerQuery: args.runsPerQuery,
      triggerThreshold: args.triggerThreshold,
      model: args.model,
    });
    if (args.verbose) {
      const summary = output.summary;
      console.error(`结果：${summary.passed}/${summary.total} 通过`);
      for (const result of output.results) {
        const status = result.pass ? "PASS" : "FAIL";
        console.error(`  [${status}] rate=${result.triggers}/${result.runs} expected=${result.should_trigger}: ${result.query.slice(0, 70)}`);
      }
    }
    console.log(JSON.stringify(output, null, 2));
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
