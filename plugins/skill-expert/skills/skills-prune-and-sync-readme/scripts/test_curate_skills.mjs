#!/usr/bin/env node
// Smoke tests for curate_skills.mjs.

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "curate_skills.mjs");

function writeSkill(skillDir, frontmatter, body) {
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), `---\n${frontmatter}\n---\n\n${body}\n`, "utf8");
}

function runCommand(...args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: "utf8",
    timeout: 30_000,
  });
}

function assertContainsPair(pairs, left, right) {
  const targets = new Set([left, right]);
  for (const pair of pairs) {
    const names = new Set(pair.skills || []);
    if (names.size === targets.size && [...targets].every((name) => names.has(name))) {
      return;
    }
  }
  throw new Error(`Expected pair not found: ${left}, ${right}`);
}

function main() {
  assert.ok(fs.existsSync(scriptPath), `Missing script under test: ${scriptPath}`);

  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "curate-skills-"));
  try {
    const skillsDir = path.join(repoRoot, "skills");
    fs.mkdirSync(skillsDir, { recursive: true });

    writeSkill(
      path.join(skillsDir, "alpha-skill"),
      "name: alpha-skill\ndescription: Alpha workflow for internal repo cleanup tasks.",
      "# Alpha Skill\n\n## Workflow\n- Audit before cleanup.\n- Keep evidence.\n",
    );
    writeSkill(
      path.join(skillsDir, "alpha-skill-audit"),
      "name: alpha-skill-audit\ndescription: Alpha workflow for internal repo cleanup tasks and reporting.",
      "# Alpha Skill Audit\n\n## Workflow\n- Audit before cleanup.\n- Keep evidence.\n",
    );
    writeSkill(
      path.join(skillsDir, "vue-best-practices"),
      "name: vue-best-practices\ndescription: MUST be used for any Vue task. Always prefer Composition API.",
      "# Vue Best Practices\n\n## Workflow\n- Use for any Vue task.\n",
    );
    writeSkill(
      path.join(skillsDir, "vue-options-api-only"),
      "name: vue-options-api-only\ndescription: Vue 3 Options API style only.",
      "# Vue Options API Only\n\n## Workflow\n- Use when the project explicitly requires Options API.\n",
    );
    writeSkill(
      path.join(skillsDir, "stub-skill"),
      "name: stub-skill\ndescription: TODO\nversion: 1.0.0",
      "# Stub Skill\n\nTODO\n",
    );

    const readmePath = path.join(repoRoot, "README.md");
    fs.writeFileSync(
      readmePath,
      "# Demo Repo\n\n" +
        "## Skill 清单\n\n" +
        "以下清单按仓库中实际存在的公共 `skills/*/SKILL.md` 整理，不包含 `.system` 内置 skill。名称可直接跳转到对应说明文件。\n\n" +
        "### 公共 Skills（1）\n\n" +
        "| 名称 | 作用简介 |\n" +
        "|------|----------|\n" +
        "| [alpha-skill](skills/alpha-skill/SKILL.md) | 旧摘要，应被保留。 |\n\n" +
        "## 数据来源\n\n" +
        "- example\n",
      "utf8",
    );

    const audit = runCommand("audit", "--repo-root", repoRoot, "--format", "json");
    assert.equal(audit.status, 0, `audit failed:\nSTDOUT:\n${audit.stdout}\nSTDERR:\n${audit.stderr}`);

    const report = JSON.parse(audit.stdout);
    const lowQualityNames = new Set(report.low_quality_candidates.map((item) => item.skill));
    assert.ok(lowQualityNames.has("stub-skill"), `stub-skill should be low quality: ${audit.stdout}`);
    assertContainsPair(report.duplicate_candidates, "alpha-skill", "alpha-skill-audit");
    assertContainsPair(report.conflict_candidates, "vue-best-practices", "vue-options-api-only");

    const prune = runCommand("prune", "--repo-root", repoRoot, "--skills", "stub-skill", "--yes");
    assert.equal(prune.status, 0, `prune failed:\nSTDOUT:\n${prune.stdout}\nSTDERR:\n${prune.stderr}`);
    assert.equal(fs.existsSync(path.join(skillsDir, "stub-skill")), false, "stub-skill should be deleted");

    const pluginsDir = path.join(repoRoot, "plugins", "demo-expert", "skills");
    writeSkill(
      path.join(pluginsDir, "beta-skill"),
      "name: beta-skill\ndescription: Beta workflow for plugin repository cleanup tasks.",
      "# Beta Skill\n\n## Workflow\n- Audit plugin skills.\n- Keep evidence.\n",
    );
    writeSkill(
      path.join(pluginsDir, "beta-skill-audit"),
      "name: beta-skill-audit\ndescription: Beta workflow for plugin repository cleanup tasks and reporting.",
      "# Beta Skill Audit\n\n## Workflow\n- Audit plugin skills.\n- Keep evidence.\n",
    );

    const pluginAudit = runCommand("audit", "--repo-root", repoRoot, "--format", "json");
    assert.equal(pluginAudit.status, 0, `plugin audit failed:\nSTDOUT:\n${pluginAudit.stdout}\nSTDERR:\n${pluginAudit.stderr}`);

    const pluginReport = JSON.parse(pluginAudit.stdout);
    assertContainsPair(pluginReport.duplicate_candidates, "demo-expert/beta-skill", "demo-expert/beta-skill-audit");

    const pluginPrune = runCommand("prune", "--repo-root", repoRoot, "--skills", "demo-expert/beta-skill-audit", "--yes");
    assert.equal(pluginPrune.status, 0, `plugin prune failed:\nSTDOUT:\n${pluginPrune.stdout}\nSTDERR:\n${pluginPrune.stderr}`);
    assert.equal(fs.existsSync(path.join(pluginsDir, "beta-skill-audit")), false, "plugin skill should be deleted");

    const sync = runCommand("sync-readme", "--repo-root", repoRoot, "--write");
    assert.equal(sync.status, 0, `sync-readme failed:\nSTDOUT:\n${sync.stdout}\nSTDERR:\n${sync.stderr}`);

    const readme = fs.readFileSync(readmePath, "utf8");
    assert.match(readme, /### 公共 Skills（5）/);
    assert.ok(readme.includes("| [alpha-skill](skills/alpha-skill/SKILL.md) | 旧摘要，应被保留。 |"));
    assert.ok(readme.includes("| [beta-skill](plugins/demo-expert/skills/beta-skill/SKILL.md) |"));
    assert.equal(readme.includes("skills/skills-prune-and-sync-readme/SKILL.md"), false);

    const check = runCommand("sync-readme", "--repo-root", repoRoot, "--check");
    assert.equal(check.status, 0, `sync-readme --check failed:\nSTDOUT:\n${check.stdout}\nSTDERR:\n${check.stderr}`);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }

  console.log("curate_skills smoke test passed");
}

main();
