import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  calculateStats,
  generateBenchmark,
  generateMarkdown,
} from "../skills/skill-creator/scripts/aggregate_benchmark.mjs";
import { generateHtml } from "../skills/skill-creator/scripts/generate_report.mjs";
import { splitEvalSet } from "../skills/skill-creator/scripts/run_loop.mjs";
import { parseSkillMd } from "../skills/skill-creator/scripts/utils.mjs";

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function createBenchmarkFixture() {
  const dir = mkdtempSync(join(tmpdir(), "skill-benchmark-"));
  const runDir = join(dir, "eval-1", "with_skill", "run-1");
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(dir, "eval-1", "eval_metadata.json"), JSON.stringify({ eval_id: 7 }));
  writeFileSync(
    join(runDir, "grading.json"),
    JSON.stringify({
      summary: { pass_rate: 0.75, passed: 3, failed: 1, total: 4 },
      timing: { total_duration_seconds: 12.5 },
      execution_metrics: { total_tool_calls: 4, output_chars: 2000, errors_encountered: 1 },
      expectations: [{ text: "has useful output", passed: true, evidence: "ok" }],
      user_notes_summary: { uncertainties: ["needs review"] },
    }),
  );
  return dir;
}

test("parseSkillMd reads scalar and multiline descriptions", () => {
  const dir = mkdtempSync(join(tmpdir(), "skill-md-"));
  try {
    mkdirSync(join(dir, "demo"), { recursive: true });
    writeFileSync(join(dir, "demo", "SKILL.md"), "---\nname: demo\ndescription: >\n  Use for demo\n  workflows.\n---\n# Demo\n");
    assert.deepEqual(parseSkillMd(join(dir, "demo")), {
      name: "demo",
      description: "Use for demo workflows.",
      content: "---\nname: demo\ndescription: >\n  Use for demo\n  workflows.\n---\n# Demo\n",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("aggregate_benchmark.mjs summarizes grading results", () => {
  const dir = createBenchmarkFixture();
  try {
    assert.deepEqual(calculateStats([1, 2, 3]), { mean: 2, stddev: 1, min: 1, max: 3 });
    const benchmark = generateBenchmark(dir, "demo-skill", "/tmp/demo");
    assert.equal(benchmark.metadata.skill_name, "demo-skill");
    assert.equal(benchmark.runs[0].eval_id, 7);
    assert.equal(benchmark.run_summary.with_skill.pass_rate.mean, 0.75);
    assert.match(generateMarkdown(benchmark), /Skill Benchmark：demo-skill/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("aggregate_benchmark.mjs CLI writes benchmark files", () => {
  const dir = createBenchmarkFixture();
  try {
    const script = resolve(pluginRoot, "skills/skill-creator/scripts/aggregate_benchmark.mjs");
    const output = execFileSync("node", [script, dir, "--skill-name", "demo-skill"], { encoding: "utf8" });
    assert.match(output, /已生成：/);
    assert.equal(JSON.parse(readFileSync(join(dir, "benchmark.json"), "utf8")).metadata.skill_name, "demo-skill");
    assert.match(readFileSync(join(dir, "benchmark.md"), "utf8"), /Pass Rate/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("generate_report.mjs renders train and test result tables", () => {
  const html = generateHtml({
    original_description: "old",
    best_description: "new",
    best_score: "1/1",
    iterations_run: 1,
    train_size: 1,
    test_size: 1,
    history: [{
      iteration: 1,
      description: "new",
      train_results: [{ query: "make a skill", should_trigger: true, pass: true, triggers: 3, runs: 3 }],
      test_results: [{ query: "write SQL", should_trigger: false, pass: true, triggers: 0, runs: 3 }],
    }],
  }, false, "demo");
  assert.match(html, /demo - Skill Description 优化/);
  assert.match(html, /make a skill/);
  assert.match(html, /write SQL/);
});

test("splitEvalSet keeps trigger and non-trigger examples in holdout", () => {
  const evalSet = [
    { query: "a", should_trigger: true },
    { query: "b", should_trigger: true },
    { query: "c", should_trigger: false },
    { query: "d", should_trigger: false },
  ];
  const { trainSet, testSet } = splitEvalSet(evalSet, 0.5);
  assert.equal(trainSet.length, 2);
  assert.equal(testSet.length, 2);
  assert.ok(testSet.some((item) => item.should_trigger));
  assert.ok(testSet.some((item) => !item.should_trigger));
});
