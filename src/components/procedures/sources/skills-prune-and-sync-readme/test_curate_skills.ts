#!/usr/bin/env node
// Smoke tests for curate_skills.mjs.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { main as curateSkillsMain } from "./curate_skills";
function writeSkill(skillDir: any, frontmatter: any, body: any): any {
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), `---\n${frontmatter}\n---\n\n${body}\n`, "utf8");
}
function writeComponentSkill(skillDir: any, id: any, description: any, body: any): any {
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "index.ts"), `import { defineSkill, defineSkillWorkflow } from "../../sdk";\n\nexport const ${id.replaceAll("-", "_")} = defineSkill({\n  id: "${id}",\n  fullName: "${id}",\n  description: "${description}",\n  useCases: [\n    "${description}",\n  ],\n  constraints: [\n    "遵循该 skill 的正文流程、边界和检查清单。",\n  ],\n  sourceDir: new URL("./", import.meta.url),\n  workflow: defineSkillWorkflow({ steps: [${JSON.stringify(body)}] }),\n});\n`, "utf8");
}
function runCommand(...args: any): any {
    const originalStdoutWrite = process.stdout.write;
    const originalStderrWrite = process.stderr.write;
    const originalExitCode = process.exitCode;
    let stdout = "";
    let stderr = "";
    (process.stdout.write as any) = (chunk: any): boolean => {
        stdout += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
        return true;
    };
    (process.stderr.write as any) = (chunk: any): boolean => {
        stderr += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
        return true;
    };
    try {
        process.exitCode = undefined;
        const status = Number(curateSkillsMain(args) ?? process.exitCode ?? 0);
        return { status, stdout, stderr };
    }
    catch (error: any) {
        return { status: 1, stdout, stderr: `${stderr}${error?.message ?? String(error)}\n` };
    }
    finally {
        process.stdout.write = originalStdoutWrite;
        process.stderr.write = originalStderrWrite;
        process.exitCode = originalExitCode;
    }
}
function assertContainsPair(pairs: any, left: any, right: any): any {
    const targets = new Set([left, right]);
    for (const pair of pairs) {
        const names = new Set(pair.skills || []);
        if (names.size === targets.size && [...targets].every((name: any) => names.has(name))) {
            return;
        }
    }
    throw new Error(`Expected pair not found: ${left}, ${right}`);
}
function assertContainsGroup(groups: any, ...skills: any): any {
    for (const group of groups) {
        const names = new Set(group.skills || []);
        if (skills.every((skill: any) => names.has(skill)))
            return;
    }
    throw new Error(`Expected group not found: ${skills.join(", ")}`);
}
function main(): any {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "curate-skills-"));
    try {
        const skillsDir = path.join(repoRoot, "skills");
        fs.mkdirSync(skillsDir, { recursive: true });
        writeSkill(path.join(skillsDir, "alpha-skill"), "name: alpha-skill\ndescription: Alpha workflow for internal repo cleanup tasks.", "# Alpha Skill\n\n## Workflow\n- Audit before cleanup.\n- Keep evidence.\n");
        writeSkill(path.join(skillsDir, "alpha-skill-audit"), "name: alpha-skill-audit\ndescription: Alpha workflow for internal repo cleanup tasks and reporting.", "# Alpha Skill Audit\n\n## Workflow\n- Audit before cleanup.\n- Keep evidence.\n");
        writeSkill(path.join(skillsDir, "vue-best-practices"), "name: vue-best-practices\ndescription: MUST be used for any Vue task. Always prefer Composition API.", "# Vue Best Practices\n\n## Workflow\n- Use for any Vue task.\n");
        writeSkill(path.join(skillsDir, "vue-options-api-only"), "name: vue-options-api-only\ndescription: Vue 3 Options API style only.", "# Vue Options API Only\n\n## Workflow\n- Use when the project explicitly requires Options API.\n");
        writeSkill(path.join(skillsDir, "stub-skill"), "name: stub-skill\ndescription: TODO\nversion: 1.0.0", "# Stub Skill\n\nTODO\n");
        const readmePath = path.join(repoRoot, "README.md");
        fs.writeFileSync(readmePath, "# Demo Repo\n\n" +
            "## Skill 清单\n\n" +
            "以下清单按仓库中实际存在的公共组件 skill 源码或生成 `skills/*/SKILL.md` 整理，不包含 `.system` 内置 skill。名称可直接跳转到对应说明文件。\n\n" +
            "### 公共 Skills（1）\n\n" +
            "| 名称 | 作用简介 |\n" +
            "|------|----------|\n" +
            "| [alpha-skill](skills/alpha-skill/SKILL.md) | 旧摘要，应被保留。 |\n\n" +
            "## 数据来源\n\n" +
            "- example\n", "utf8");
        const audit = runCommand("audit", "--repo-root", repoRoot, "--format", "json");
        assert.equal(audit.status, 0, `audit failed:\nSTDOUT:\n${audit.stdout}\nSTDERR:\n${audit.stderr}`);
        const report = JSON.parse(audit.stdout);
        const lowQualityNames = new Set(report.low_quality_candidates.map((item: any) => item.skill));
        assert.ok(lowQualityNames.has("stub-skill"), `stub-skill should be low quality: ${audit.stdout}`);
        assertContainsPair(report.duplicate_candidates, "alpha-skill", "alpha-skill-audit");
        assertContainsPair(report.conflict_candidates, "vue-best-practices", "vue-options-api-only");
        const prune = runCommand("prune", "--repo-root", repoRoot, "--skills", "stub-skill", "--yes");
        assert.equal(prune.status, 0, `prune failed:\nSTDOUT:\n${prune.stdout}\nSTDERR:\n${prune.stderr}`);
        assert.equal(fs.existsSync(path.join(skillsDir, "stub-skill")), false, "stub-skill should be deleted");
        const componentSkillsDir = path.join(repoRoot, "src", "components", "skills");
        writeComponentSkill(path.join(componentSkillsDir, "beta-skill"), "beta-skill", "Beta workflow for component repository cleanup tasks.", "# Beta Skill\n\n## Workflow\n- Audit component skills.\n- Keep evidence.\n");
        writeComponentSkill(path.join(componentSkillsDir, "beta-skill-audit"), "beta-skill-audit", "Beta workflow for component repository cleanup tasks and reporting.", "# Beta Skill Audit\n\n## Workflow\n- Audit component skills.\n- Keep evidence.\n");
        const componentAudit = runCommand("audit", "--repo-root", repoRoot, "--format", "json");
        assert.equal(componentAudit.status, 0, `component audit failed:\nSTDOUT:\n${componentAudit.stdout}\nSTDERR:\n${componentAudit.stderr}`);
        const componentReport = JSON.parse(componentAudit.stdout);
        assertContainsPair(componentReport.duplicate_candidates, "beta-skill", "beta-skill-audit");
        assertContainsGroup(componentReport.similarity_groups, "beta-skill", "beta-skill-audit");
        const componentPrune = runCommand("prune", "--repo-root", repoRoot, "--skills", "beta-skill-audit", "--yes");
        assert.equal(componentPrune.status, 0, `component prune failed:\nSTDOUT:\n${componentPrune.stdout}\nSTDERR:\n${componentPrune.stderr}`);
        assert.equal(fs.existsSync(path.join(componentSkillsDir, "beta-skill-audit")), false, "component skill should be deleted");
        const sync = runCommand("sync-readme", "--repo-root", repoRoot, "--write");
        assert.equal(sync.status, 0, `sync-readme failed:\nSTDOUT:\n${sync.stdout}\nSTDERR:\n${sync.stderr}`);
        const readme = fs.readFileSync(readmePath, "utf8");
        assert.match(readme, /### 公共 Skills（5）/);
        assert.ok(readme.includes("| [alpha-skill](skills/alpha-skill/SKILL.md) | 旧摘要，应被保留。 |"));
        assert.ok(readme.includes("| [beta-skill](src/components/skills/beta-skill/index.ts) |"));
        assert.equal(readme.includes("skills/skills-prune-and-sync-readme/SKILL.md"), false);
        const check = runCommand("sync-readme", "--repo-root", repoRoot, "--check");
        assert.equal(check.status, 0, `sync-readme --check failed:\nSTDOUT:\n${check.stdout}\nSTDERR:\n${check.stderr}`);
    }
    finally {
        fs.rmSync(repoRoot, { recursive: true, force: true });
    }
    console.log("curate_skills smoke test passed");
}
main();
