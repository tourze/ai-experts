import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(".");

function writeSkill(dir, name, description, body = "") {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "SKILL.md"),
    [
      "---",
      `name: ${name}`,
      `description: ${JSON.stringify(description)}`,
      "---",
      "",
      "# Skill",
      "",
      body,
      "",
    ].join("\n"),
    "utf-8",
  );
}

test("generate-missing-skill-evals creates starter evals without overwriting existing cases", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-generate-evals-"));

  try {
    const missing = join(tmp, "plugins/demo-expert/skills/missing-skill");
    const covered = join(tmp, "plugins/demo-expert/skills/covered-skill");
    writeSkill(
      missing,
      "missing-skill",
      "当用户要审查 demo 流程、触发规则或质量边界时使用。",
      "- 审查 demo skill 的触发边界。\n- 生成质量回归样例。",
    );
    writeSkill(
      covered,
      "covered-skill",
      "当用户要处理已有覆盖样例、回归测试或质量审计时使用。",
    );
    mkdirSync(join(covered, "evals"), { recursive: true });
    writeFileSync(join(covered, "evals/cases.yaml"), "cases:\n  - id: keep_me\n    trigger_expected: true\n", "utf-8");

    const output = execFileSync(process.execPath, [
      "scripts/generate-missing-skill-evals.mjs",
      "--repo-root",
      tmp,
    ], {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: "pipe",
    });

    const generated = join(missing, "evals/cases.yaml");
    assert.match(output, /Created 1 eval file\(s\)\./);
    assert.equal(existsSync(generated), true);
    const generatedText = readFileSync(generated, "utf-8");
    assert.match(generatedText, /trigger_expected: true/);
    assert.match(generatedText, /trigger_expected: false/);
    assert.match(readFileSync(join(covered, "evals/cases.yaml"), "utf-8"), /keep_me/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
