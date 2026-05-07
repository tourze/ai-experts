#!/usr/bin/env node
// 把结构化 findings 渲染成标准 pre-landing-review markdown 报告。
// 保守式脚本化：固定输出格式（确定性强、跨次一致），留判断（severity、是否阻断、用户三选一）给模型。
//
// 输入 JSON schema：
// {
//   "verdict": "CLEAR TO LAND" | "BLOCKED",
//   "blocking": [{ "id": "B1", "severity": "P0"|"P1"|"高风险"|..., "file": "...", "line": 88,
//                  "issue": "...", "risk": "...", "options": ["立即修复","确认风险","误报"] }],
//   "informational": [{ "id": "I1", "file": "...", "line": null, "issue": "...", "note": "..." }],
//   "release_conditions": ["..."]
// }
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
const DEFAULT_OPTIONS: any[] = ["立即修复", "确认风险", "误报"];
function renderLocation({ file, line }: any): any {
    if (!file)
        return "(未提供文件)";
    return line ? `${file}:${line}` : file;
}
function renderBlocking(items: any = []): any {
    if (!items.length)
        return "## 阻断项\n\n无。\n";
    const lines: any[] = ["## 阻断项", ""];
    items.forEach((item: any, idx: any) => {
        const id = item.id ?? `B${idx + 1}`;
        const severity = item.severity ? `[${item.severity}] ` : "";
        const options = item.options?.length ? item.options : DEFAULT_OPTIONS;
        lines.push(`${idx + 1}. ${severity}\`${renderLocation(item)}\``);
        lines.push(`   - 问题：${item.issue ?? "(未填)"}`);
        lines.push(`   - 风险：${item.risk ?? "(未填)"}`);
        lines.push(`   - 用户选项（${id}）：${options.join(" / ")}`);
        lines.push("");
    });
    return lines.join("\n");
}
function renderInformational(items: any = []): any {
    if (!items.length)
        return "## 建议项\n\n无。\n";
    const lines: any[] = ["## 建议项", ""];
    items.forEach((item: any, idx: any) => {
        const id = item.id ?? `I${idx + 1}`;
        lines.push(`${idx + 1}. \`${renderLocation(item)}\` (${id})`);
        if (item.issue)
            lines.push(`   - 问题：${item.issue}`);
        if (item.note)
            lines.push(`   - 备注：${item.note}`);
        lines.push("");
    });
    return lines.join("\n");
}
function renderVerdict({ verdict, blocking = [], informational = [], release_conditions = [] }: any): any {
    const lines: any[] = ["## 门禁结论", ""];
    lines.push(`- 结论：${verdict ?? "(未给出)"}`);
    lines.push(`- 阻断项：${blocking.length}`);
    lines.push(`- 建议项：${informational.length}`);
    if (release_conditions.length) {
        lines.push("- 放行条件：");
        release_conditions.forEach((cond: any) => lines.push(`  - ${cond}`));
    }
    lines.push("");
    return lines.join("\n");
}
export function renderReport(input: any): any {
    if (!input || typeof input !== "object")
        throw new Error("findings must be an object");
    return [
        renderBlocking(input.blocking),
        renderInformational(input.informational),
        renderVerdict(input),
    ].join("\n");
}
function parseArgs(argv: any): any {
    const args: Record<string, any> = { input: "-" };
    for (let i = 0; i < argv.length; i += 1) {
        const a = argv[i];
        if (a === "--input")
            args.input = argv[++i];
        else if (a === "--help" || a === "-h")
            args.help = true;
    }
    return args;
}
async function readInput(source: any): Promise<any> {
    if (source && source !== "-")
        return readFileSync(source, "utf-8");
    let data = "";
    for await (const chunk of process.stdin)
        data += chunk;
    return data;
}
function isMain(): any {
    return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
}
export async function main(argv: any = process.argv.slice(2)): Promise<any> {
    const args = parseArgs(argv);
    if (args.help) {
        process.stdout.write("usage: render_report.mjs [--input findings.json|-]\n");
        return 0;
    }
    try {
        const raw = await readInput(args.input);
        const findings = JSON.parse(raw);
        process.stdout.write(renderReport(findings));
        return 0;
    }
    catch (err: any) {
        process.stderr.write(`render_report failed: ${err.message}\n`);
        return 1;
    }
}
if (isMain()) {
    process.exitCode = await main();
}
