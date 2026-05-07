#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const VIOLATIONS: Record<string, any> = {
    workflow_leak: {
        severity: "critical",
        label: "工作流泄露",
        why: "Claude 会按 description 走捷径，跳过 SKILL.md 完整流程",
    },
    output_leak: {
        severity: "critical",
        label: "输出产物泄露",
        why: "description 包含输出格式/产物，属于 SKILL.md 内容",
    },
    missing_trigger: {
        severity: "high",
        label: "缺少触发条件",
        why: "缺少 '当...时使用' 格式，Claude 难以判断何时触发",
    },
    tool_leak: {
        severity: "medium",
        label: "工具名泄露",
        why: "具体工具名过早缩小触发范围",
    },
    too_long: {
        severity: "medium",
        label: "过长 (>200字符)",
        why: "浪费 token 且可能含非触发信息",
    },
    too_short: {
        severity: "low",
        label: "过短 (<20字符)",
        why: "触发关键词覆盖不足",
    },
    missing_desc: {
        severity: "critical",
        label: "缺少 description",
        why: "无法触发 skill",
    },
};
const WORKFLOW_PATTERNS: any[] = [
    [/(?<!触发词)(?<!英文触发词)(?<!自)(?:覆盖(?!率)|包括|包含)(?!.*触发词)/u, "workflow_leak", "列举了覆盖范围"],
    [/按.*(?:步|阶段|流程|维度).*推进/u, "workflow_leak", "描述了执行步骤"],
    [/输出.*(?:评分|清单|文档|报告|蓝图|画像|摘要)/u, "output_leak", "包含输出产物"],
    [/(?<!若)重点(?:输出|覆盖)/u, "output_leak", "描述了重点输出"],
    [/强调.*(?:先|再|然后)/u, "workflow_leak", "描述了工作流顺序"],
    [/(?:106)\s*(?:条|个)/u, "workflow_leak", "泄露了具体数量"],
];
const TRIGGER_RE = /(当.*时(?:候)?使用|在.*时(?:候)?使用|Use when|适用于|用于)/u;
const SEVERITY_ORDER: Record<string, any> = { critical: 0, high: 1, medium: 2, low: 3 };
function parseArgs(argv: any): any {
    const args: Record<string, any> = { skillsDir: null, json: false, severity: null, help: false };
    for (let i = 0; i < argv.length; i += 1) {
        const current = argv[i];
        if (current === "--skills-dir") {
            args.skillsDir = argv[++i] ?? null;
        }
        else if (current === "--json") {
            args.json = true;
        }
        else if (current === "--severity") {
            args.severity = argv[++i] ?? null;
        }
        else if (current === "-h" || current === "--help") {
            args.help = true;
        }
        else {
            throw new Error(`unknown argument: ${current}`);
        }
    }
    return args;
}
function printUsage(): any {
    console.log(`Usage:
  node cso_audit.mjs [--skills-dir <path>] [--json] [--severity critical|high|medium|low]`);
}
function directoryExists(path: any): any {
    return existsSync(path);
}
function isSkillsRoot(path: any): any {
    if (!directoryExists(path))
        return false;
    try {
        return readdirSync(path, { withFileTypes: true }).some((entry: any) => {
            if (!entry.isDirectory())
                return false;
            return existsSync(join(path, entry.name, "SKILL.md"));
        });
    }
    catch {
        return false;
    }
}
function findSkillsDir(explicitDir: any): any {
    if (explicitDir) {
        const resolved = resolve(explicitDir);
        return isSkillsRoot(resolved) ? resolved : null;
    }
    let current = dirname(fileURLToPath(import.meta.url));
    while (true) {
        if (isSkillsRoot(current))
            return current;
        const candidate = join(current, "skills");
        if (isSkillsRoot(candidate))
            return candidate;
        const parent = dirname(current);
        if (parent === current)
            return null;
        current = parent;
    }
}
function collectSkillFiles(root: any): any {
    const files: any[] = [];
    for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory())
            continue;
        const skillFile = join(root, entry.name, "SKILL.md");
        if (existsSync(skillFile)) {
            files.push(skillFile);
        }
    }
    return files.sort();
}
function extractDescription(path: any): any {
    let text = "";
    try {
        text = readFileSync(path, "utf8");
    }
    catch {
        return ["", ""];
    }
    const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match)
        return ["", ""];
    const frontmatter = match[1];
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
    const clean = (value: any) => (value ?? "").trim().replace(/^['"]|['"]$/g, "");
    return [clean(nameMatch?.[1]), clean(descMatch?.[1])];
}
function auditDescription(desc: any): any {
    if (!desc)
        return [{ type: "missing_desc", detail: "no description field" }];
    const hits: any[] = [];
    const seenTypes = new Set();
    if (desc.length > 200) {
        hits.push({ type: "too_long", detail: `len=${desc.length}` });
        seenTypes.add("too_long");
    }
    if (desc.length < 20) {
        hits.push({ type: "too_short", detail: `len=${desc.length}` });
        seenTypes.add("too_short");
    }
    if (!TRIGGER_RE.test(desc)) {
        hits.push({ type: "missing_trigger", detail: "缺少触发条件句式" });
        seenTypes.add("missing_trigger");
    }
    for (const [pattern, vtype, reason] of WORKFLOW_PATTERNS) {
        if (!seenTypes.has(vtype) && pattern.test(desc)) {
            hits.push({ type: vtype, detail: reason });
            seenTypes.add(vtype);
        }
    }
    return hits;
}
function relativeSkillName(skillsDir: any, skillFile: any): any {
    const parts = relative(skillsDir, skillFile).split(/[\\/]/);
    return parts.slice(0, -1).join("/");
}
function buildReport(skillsDir: any, severity: any): any {
    const minSeverity = SEVERITY_ORDER[severity] ?? 3;
    const allSkills = collectSkillFiles(skillsDir);
    const results: any[] = [];
    let passCount = 0;
    const violationCounts = Object.fromEntries(Object.keys(VIOLATIONS).map((key: any) => [key, 0]));
    for (const path of allSkills) {
        const [, desc] = extractDescription(path);
        let hits = auditDescription(desc);
        if (severity) {
            hits = hits.filter((hit: any) => SEVERITY_ORDER[VIOLATIONS[hit.type].severity] <= minSeverity);
        }
        if (hits.length === 0) {
            passCount += 1;
            continue;
        }
        for (const hit of hits) {
            violationCounts[hit.type] += 1;
        }
        results.push({
            skill: relativeSkillName(skillsDir, path),
            description: desc.length > 150 ? `${desc.slice(0, 150)}...` : desc,
            violations: hits,
        });
    }
    const total = allSkills.length;
    return {
        total,
        pass_count: passCount,
        violation_count: results.length,
        pass_rate: total ? `${Math.floor((100 * passCount) / total)}%` : "N/A",
        breakdown: violationCounts,
        violations: results,
    };
}
function printHuman(report: any): any {
    console.log("=".repeat(60));
    console.log(`CSO AUDIT — ${report.total} skills scanned`);
    console.log("=".repeat(60));
    const passPct = report.total ? Math.floor((100 * report.pass_count) / report.total) : 0;
    console.log(`  PASS: ${report.pass_count}/${report.total} (${passPct}%)`);
    console.log(`  FAIL: ${report.violation_count}/${report.total}`);
    console.log();
    console.log("Violation breakdown:");
    for (const [vtype, count] of Object.entries(report.breakdown as Record<string, number>).sort((a: any, b: any) => b[1] - a[1])) {
        if (count <= 0)
            continue;
        const meta = VIOLATIONS[vtype];
        console.log(`  [${meta.severity.padStart(8)}] ${vtype.padEnd(20)} ${String(count).padStart(3)}  — ${meta.label}`);
    }
    console.log();
    for (const sev of ["critical", "high", "medium", "low"]) {
        const group = report.violations.filter((result: any) => result.violations.some((hit: any) => VIOLATIONS[hit.type].severity === sev));
        if (group.length === 0)
            continue;
        console.log(`── ${sev.toUpperCase()} (${"─".repeat(50)})`);
        for (const result of group) {
            const tags = result.violations.map((hit: any) => hit.type).join(", ");
            console.log(`  [${tags}] ${result.skill}`);
            console.log(`    ${result.description}`);
        }
        console.log();
    }
}
export function main(argv: any = process.argv.slice(2)): any {
    let args;
    try {
        args = parseArgs(argv);
    }
    catch (error: any) {
        console.error(error.message);
        printUsage();
        return 1;
    }
    if (args.help) {
        printUsage();
        return 0;
    }
    const skillsDir = findSkillsDir(args.skillsDir);
    if (!skillsDir) {
        console.error("Error: cannot find component skills directory");
        return 1;
    }
    const report = buildReport(skillsDir, args.severity);
    if (args.json) {
        console.log(JSON.stringify(report, null, 2));
        return 0;
    }
    printHuman(report);
    return 0;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main();
}
