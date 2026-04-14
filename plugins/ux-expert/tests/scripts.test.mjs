import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const pluginRoot = resolve("plugins/ux-expert");

function listFiles(predicate) {
  const results = [];
  const queue = [pluginRoot];

  while (queue.length > 0) {
    const current = queue.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const next = resolve(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(next);
        continue;
      }
      if (predicate(next)) {
        results.push(next);
      }
    }
  }

  return results.sort();
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: resolve("."),
    encoding: "utf-8",
  });
}

test("Python 脚本通过 py_compile", () => {
  const files = listFiles((file) => file.endsWith(".py"));
  const result = run("python3", ["-m", "py_compile", ...files]);
  assert.equal(result.status, 0, result.stderr);
});

test("Node 脚本通过 node --check", () => {
  for (const file of listFiles((next) => next.endsWith(".js") || next.endsWith(".mjs"))) {
    const result = run("node", ["--check", file]);
    assert.equal(result.status, 0, `${file}\n${result.stderr}`);
  }
});

test("persona_generator 提供真实输入参数并拒绝无效参数", () => {
  const script = resolve(pluginRoot, "skills/ux-researcher-designer/scripts/persona_generator.py");
  const help = run("python3", [script, "--help"]);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /--input/);
  assert.match(help.stdout, /--output-format/);
  assert.match(help.stdout, /--sample/);

  const failure = run("python3", [script, "--output-format", "xml"]);
  assert.notEqual(failure.status, 0);
});

test("persona_generator 能消费真实 JSON 并输出结构化结果", () => {
  const root = mkdtempSync(join(tmpdir(), "ux-expert-persona-"));
  const script = resolve(pluginRoot, "skills/ux-researcher-designer/scripts/persona_generator.py");
  const usersPath = join(root, "users.json");
  const interviewsPath = join(root, "interviews.json");

  writeFileSync(usersPath, JSON.stringify([
    {
      user_id: "u-1",
      age: 30,
      usage_frequency: "daily",
      features_used: ["dashboard", "reports", "export", "share"],
      primary_device: "desktop",
      usage_context: "work",
      tech_proficiency: 8,
      pain_points: ["slow loading", "confusing UI", "slow loading"],
    },
    {
      user_id: "u-2",
      age: 33,
      usage_frequency: "daily",
      features_used: ["dashboard", "reports", "export", "shortcuts"],
      primary_device: "desktop",
      usage_context: "work",
      tech_proficiency: 7,
      pain_points: ["slow loading"],
    },
  ], null, 2));
  writeFileSync(interviewsPath, JSON.stringify([
    {
      quotes: ["我最讨厌提交后没反应。"],
      motivations: ["效率"],
      goals: ["减少等待"],
      needs: ["明确状态反馈"],
      pain_points: ["slow loading"],
    },
  ], null, 2));

  try {
    const result = run("python3", [
      script,
      "--input",
      usersPath,
      "--interviews",
      interviewsPath,
      "--output-format",
      "json",
    ]);
    assert.equal(result.status, 0, result.stderr);

    const output = JSON.parse(result.stdout);
    assert.equal(output.data_points.sample_size, 2);
    assert.equal(output.data_points.interview_count, 1);
    assert.equal(output.frustrations[0].issue, "slow loading");
    assert.equal(output.frustrations[0].count, 4);
    assert.match(output.quote, /没反应/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
