import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(".");

function writeSkill(dir, description, body = "") {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "SKILL.md"),
    [
      "---",
      `name: ${basename(dir)}`,
      `description: "${description}"`,
      "---",
      "",
      body,
      "",
    ].join("\n"),
    "utf-8",
  );
}

test("skill-quality-report recursively scans nested skills and trigger eval coverage", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-skill-quality-"));

  try {
    const good = join(tmp, "plugins/demo-expert/skills/good");
    const nested = join(tmp, "plugins/demo-expert/skills/group/sub/nested");
    writeSkill(good, "Use when the user asks for demo skill quality review.", "[Guide](references/guide.md)");
    mkdirSync(join(good, "references"), { recursive: true });
    writeFileSync(join(good, "references/guide.md"), "# Guide\n", "utf-8");
    mkdirSync(join(good, "evals"), { recursive: true });
    writeFileSync(
      join(good, "evals/cases.yaml"),
      [
        "cases:",
        "  - id: positive",
        "    prompt: review this demo skill",
        "    trigger_expected: true",
        "  - id: negative",
        "    prompt: write a sorting function",
        "    trigger_expected: false",
        "",
      ].join("\n"),
      "utf-8",
    );

    writeSkill(nested, "too short");

    const output = execFileSync(process.execPath, [
      "scripts/skill-quality-report.mjs",
      "--repo-root",
      tmp,
      "--plugin",
      "demo-expert",
      "--json",
    ], {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: "pipe",
    });
    const report = JSON.parse(output);

    assert.equal(report.summary.skills, 2);
    assert.equal(report.evals.withEvals, 1);
    assert.deepEqual(report.evals.withoutEvals, ["demo-expert/group/sub/nested"]);
    assert.equal(report.evals.evalCaseTotals.positive, 1);
    assert.equal(report.evals.evalCaseTotals.negative, 1);
    assert.equal(report.static.brokenLinks.length, 0);
    assert.ok(
      report.cso.violations.some((violation) => violation.skill === "demo-expert/group/sub/nested"),
      "nested skill should retain its full relative path in CSO output",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
