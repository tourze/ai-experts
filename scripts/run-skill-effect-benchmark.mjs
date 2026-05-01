#!/usr/bin/env node
// 自动跑 with-skill vs baseline benchmark：读 evals/cases.yaml → 跑两次 executor →
// 输出 schema 与 tests/fixtures/skill-effect-benchmarks/ 一致的 JSON。
//
// expectations 来自 cases.yaml 的 rubric，预填 passed:null 让人工 grade。
// 这是经过深思的设计：避免 LLM-as-judge 的自回归噪声，跑 prompt 自动化、
// grade 仍可信。grade 完后 skill-quality-report.mjs 自动识别并计 effect 分。
import { readFileSync, writeFileSync, mkdirSync, existsSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultModelForProvider, runAgent } from "./agent-runner.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const OUTPUT_EXCERPT_LIMIT = 12_000;

// 极简 yaml 解析：cases.yaml 形态固定（cases 列表，每条字段简单），不引第三方依赖。
export function parseCasesYaml(text) {
  const lines = text.split(/\r?\n/);
  const cases = [];
  let current = null;
  let listKey = null;
  for (const raw of lines) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    if (/^cases:\s*$/.test(raw)) continue;
    const itemMatch = raw.match(/^\s*-\s+(\w+):\s*(.*)$/);
    if (itemMatch && /^\s{2}-/.test(raw)) {
      if (current) cases.push(current);
      current = {};
      listKey = null;
      const [, key, value] = itemMatch;
      current[key] = parseScalar(value);
      continue;
    }
    if (!current) continue;
    const fieldMatch = raw.match(/^\s{4}(\w+):\s*(.*)$/);
    if (fieldMatch) {
      const [, key, value] = fieldMatch;
      if (value === "" || value === null) {
        current[key] = [];
        listKey = key;
      } else if (value === "[]") {
        current[key] = [];
        listKey = null;
      } else {
        current[key] = parseScalar(value);
        listKey = null;
      }
      continue;
    }
    const listItem = raw.match(/^\s{6}-\s+(.*)$/);
    if (listItem && listKey) {
      current[listKey].push(parseScalar(listItem[1]));
    }
  }
  if (current) cases.push(current);
  return { cases };
}

function parseScalar(raw) {
  const v = raw.trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null" || v === "") return null;
  if (/^-?\d+$/.test(v)) return Number(v);
  if (/^".*"$/.test(v)) return v.slice(1, -1);
  if (/^'.*'$/.test(v)) return v.slice(1, -1);
  return v;
}

export function rubricToExpectations(rubric = []) {
  return rubric.map((text) => ({ text, passed: null, evidence: "" }));
}

export function buildRunRecord({ skillId, caseEntry, configuration, model, output }) {
  return {
    skill: skillId,
    prompt_id: caseEntry.id,
    configuration,
    model,
    output_excerpt: outputExcerpt(output),
    expectations: rubricToExpectations(caseEntry.rubric),
  };
}

function outputExcerpt(output) {
  const text = output ?? "";
  if (text.length <= OUTPUT_EXCERPT_LIMIT) return text;
  return `${text.slice(0, OUTPUT_EXCERPT_LIMIT)}\n[truncated ${text.length - OUTPUT_EXCERPT_LIMIT} chars]`;
}

export function buildContentEffectPrompt({ skillId, skillMarkdown, userPrompt }) {
  if (!skillMarkdown?.trim()) throw new Error("skillMarkdown is required for content comparison");
  return [
    "你正在执行一个 skill content effect benchmark。",
    "请把下面的 SKILL.md 当作本轮唯一额外方法论，优先遵守其中的触发条件、步骤、检查清单和红线。",
    "",
    `<skill id="${skillId}">`,
    skillMarkdown.trimEnd(),
    "</skill>",
    "",
    "用户任务：",
    userPrompt,
  ].join("\n");
}

function providerList(provider) {
  if (provider === "codex" || provider === "claude") return [provider];
  throw new Error(`unsupported provider: ${provider}`);
}

function defaultExecutor({
  prompt,
  provider,
  model,
  loadUserConfig,
  comparison,
  cwd = "/tmp",
}) {
  return runAgent({
    provider,
    prompt,
    model,
    cwd,
    loadUserConfig,
    sandbox: "read-only",
    isolateCodexHome: comparison === "content",
    timeoutMs: 180_000,
  }).output;
}

function modelForProvider(provider, model) {
  return model ?? defaultModelForProvider(provider);
}

export async function runBenchmark({
  skillId,
  cases,
  model = null,
  provider = "codex",
  comparison = "runtime",
  skillMarkdown = null,
  executor = defaultExecutor,
  dryRun = false,
} = {}) {
  if (!skillId) throw new Error("skillId required (e.g. 'testing-expert/pre-landing-review')");
  if (!Array.isArray(cases) || !cases.length) throw new Error("no cases provided");
  if (!["runtime", "content"].includes(comparison)) throw new Error(`unsupported comparison: ${comparison}`);
  if (comparison === "content" && !skillMarkdown?.trim()) {
    throw new Error("skillMarkdown is required when comparison=content");
  }
  const triggerable = cases.filter((c) => c.trigger_expected !== false);
  const runs = [];
  for (const c of triggerable) {
    for (const currentProvider of providerList(provider)) {
      const currentModel = modelForProvider(currentProvider, model);
      for (const configuration of ["with_skill", "baseline"]) {
        const loadUserConfig = comparison === "runtime" && configuration === "with_skill";
        const prompt = comparison === "content" && configuration === "with_skill"
          ? buildContentEffectPrompt({ skillId, skillMarkdown, userPrompt: c.prompt })
          : c.prompt;
        let output = "";
        if (!dryRun) {
          try {
            output = executor({
              prompt,
              originalPrompt: c.prompt,
              configuration,
              model: currentModel,
              provider: currentProvider,
              comparison,
              loadUserConfig,
            });
          } catch (err) {
            output = `[executor error] ${err.message}`;
          }
        } else {
          output = `[dry-run] provider=${currentProvider} comparison=${comparison} configuration=${configuration} prompt=${prompt}`;
        }
        runs.push({
          ...buildRunRecord({ skillId, caseEntry: c, configuration, model: currentModel, output }),
          provider: currentProvider,
          comparison,
        });
      }
    }
  }
  return runs;
}

function parseArgs(argv) {
  const args = { dryRun: false, model: null, provider: "codex", comparison: "runtime" };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--skill") args.skill = argv[++i];
    else if (a === "--cases") args.cases = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--model") args.model = argv[++i];
    else if (a === "--provider") args.provider = argv[++i];
    else if (a === "--comparison") args.comparison = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function defaultPaths(repoRoot, skillId) {
  const cases = resolve(repoRoot, "plugins", skillId.split("/")[0], "skills", skillId.split("/")[1], "evals/cases.yaml");
  const date = new Date().toISOString().slice(0, 10);
  const out = resolve(repoRoot, "tests/fixtures/skill-effect-benchmarks", `${skillId.split("/")[1]}-${date}.json`);
  return { cases, out };
}

function skillPath(repoRoot, skillId) {
  const [plugin, skill] = skillId.split("/");
  return resolve(repoRoot, "plugins", plugin, "skills", skill, "SKILL.md");
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.skill) {
    process.stdout.write(
      "usage: run-skill-effect-benchmark.mjs --skill <plugin/skill> [--provider codex|claude] [--comparison runtime|content] [--cases path] [--out path] [--model name] [--dry-run]\n",
    );
    process.exit(args.help ? 0 : 1);
  }
  const defaults = defaultPaths(REPO_ROOT, args.skill);
  const casesPath = args.cases ?? defaults.cases;
  const outPath = args.out ?? defaults.out;
  const yamlText = readFileSync(casesPath, "utf-8");
  const { cases } = parseCasesYaml(yamlText);
  const skillMarkdown = args.comparison === "content"
    ? readFileSync(skillPath(REPO_ROOT, args.skill), "utf-8")
    : null;
  const runs = await runBenchmark({
    skillId: args.skill,
    cases,
    model: args.model,
    provider: args.provider,
    comparison: args.comparison,
    skillMarkdown,
    dryRun: args.dryRun,
  });
  const fixture = {
    version: 1,
    metadata: {
      run_date: new Date().toISOString().slice(0, 10),
      skill: args.skill,
      provider: args.provider,
      comparison: args.comparison,
      cases_source: casesPath.replace(`${REPO_ROOT}/`, ""),
      executor: args.dryRun ? "dry-run" : `${args.provider} ${args.comparison} benchmark`,
      grading_method: "Manual assertion grading; expectations.passed left null until human review.",
    },
    runs,
  };
  if (args.dryRun) {
    process.stdout.write(`${JSON.stringify(fixture, null, 2)}\n`);
    process.stderr.write(`[dry-run] would write ${outPath} (${runs.length} runs)\n`);
  } else {
    if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(fixture, null, 2)}\n`);
    process.stdout.write(`wrote ${outPath} (${runs.length} runs)\n`);
  }
}
