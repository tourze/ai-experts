import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("audit-skill-evals outputs a warn-only complete missing list", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-skill-evals-"));

  try {
    const covered = join(tmp, "plugins/demo-expert/skills/covered");
    const missing = join(tmp, "plugins/demo-expert/skills/missing");
    const nestedMissing = join(tmp, "plugins/demo-expert/skills/group/sub/nested");
    mkdirSync(join(covered, "evals"), { recursive: true });
    mkdirSync(missing, { recursive: true });
    mkdirSync(nestedMissing, { recursive: true });
    writeFileSync(join(covered, "SKILL.md"), "---\nname: covered\n---\n", "utf-8");
    writeFileSync(join(covered, "evals/cases.yaml"), "cases: []\n", "utf-8");
    writeFileSync(join(missing, "SKILL.md"), "---\nname: missing\n---\n", "utf-8");
    writeFileSync(join(nestedMissing, "SKILL.md"), "---\nname: nested\n---\n", "utf-8");

    const output = execFileSync(process.execPath, [
      "scripts/audit-skill-evals.mjs",
      "--repo-root",
      tmp,
    ], {
      encoding: "utf-8",
      stdio: "pipe",
    });

    assert.match(output, /\[warn\]\s+Skill eval coverage: 1\/3 skills with evals\/cases\.yaml; 2 missing\./);
    assert.match(output, /\[warn\]\s+demo-expert \(2\)/);
    assert.match(
      output,
      /plugins\/demo-expert\/skills\/missing\/SKILL\.md -> plugins\/demo-expert\/skills\/missing\/evals\/cases\.yaml/,
    );
    assert.match(
      output,
      /plugins\/demo-expert\/skills\/group\/sub\/nested\/SKILL\.md -> plugins\/demo-expert\/skills\/group\/sub\/nested\/evals\/cases\.yaml/,
    );
    assert.doesNotMatch(output, /plugins\/demo-expert\/skills\/covered\/SKILL\.md ->/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
