import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/marketing-expert");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: resolve("."),
    encoding: "utf-8",
    ...options,
  });
}

test("Node 脚本通过语法检查", () => {
  const scripts = [
    `${pluginRoot}/skills/copy-editing/scripts/readability_scorer.mjs`,
    `${pluginRoot}/skills/competitor-alternatives/scripts/comparison_matrix_builder.mjs`,
  ];

  for (const script of scripts) {
    const result = run("node", ["--check", script]);

    assert.equal(result.status, 0, result.stderr);
  }
});

test("readability_scorer.mjs 输出稳定 JSON 指标", () => {
  const result = run("node", [
    `${pluginRoot}/skills/copy-editing/scripts/readability_scorer.mjs`,
    "--json",
  ], {
    input: "Clear copy sells. Customers act fast.\n",
  });

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.stats.word_count, 6);
  assert.equal(output.stats.sentence_count, 2);
  assert.equal(output.flesch_reading_ease.score, 91);
  assert.equal(output.flesch_kincaid_grade.grade_level, 1.3);
  assert.equal(output.overall_score, 91);
});

test("comparison_matrix_builder.mjs 输出稳定 JSON 矩阵", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "marketing-comparison-"));
  const inputPath = join(tempDir, "matrix.json");

  try {
    writeFileSync(
      inputPath,
      `${JSON.stringify({
        your_product: "NovaCRM",
        features: [
          {
            name: "Workflow automation",
            category: "Automation",
            your_status: "full",
            competitors: { AcmeSuite: "partial", LegacyFlow: "no" },
            notes: "All paid plans",
          },
          {
            name: "Audit logs",
            category: "Security",
            your_status: "no",
            competitors: { AcmeSuite: "full", LegacyFlow: "no" },
          },
          {
            name: "Mobile app",
            category: "Access",
            your_status: "planned",
            competitors: { AcmeSuite: "no", LegacyFlow: "partial" },
          },
          {
            name: "Unknown status fallback",
            category: "Reliability",
            your_status: "beta",
            competitors: { AcmeSuite: "full", LegacyFlow: "unknown" },
          },
        ],
      })}\n`,
      "utf-8",
    );

    const result = run("node", [
      `${pluginRoot}/skills/competitor-alternatives/scripts/comparison_matrix_builder.mjs`,
      "--input",
      inputPath,
      "--json",
    ]);

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.deepEqual(output.meta, {
      your_product: "NovaCRM",
      competitors: ["AcmeSuite", "LegacyFlow"],
      categories: ["Access", "Automation", "Reliability", "Security"],
      total_features: 4,
      overall_win_pct: 25,
      verdict: "Trailing",
    });
    assert.deepEqual(output.competitor_scores.AcmeSuite, {
      wins: 1,
      ties: 1,
      losses: 2,
      win_pct: 25,
      verdict: "Trailing",
    });
    assert.deepEqual(output.competitor_scores.LegacyFlow, {
      wins: 1,
      ties: 2,
      losses: 1,
      win_pct: 25,
      verdict: "Trailing",
    });
    assert.deepEqual(output.advantages, ["Workflow automation"]);
    assert.deepEqual(output.gaps, ["Audit logs", "Mobile app", "Unknown status fallback"]);
    assert.deepEqual(output.parity, []);
    assert.equal(output.features[2].your_status, "planned");
    assert.equal(output.features[3].your_status, "no");
    assert.equal(output.features[3].competitors.LegacyFlow, "no");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
