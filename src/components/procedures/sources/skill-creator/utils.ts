import { readFileSync } from "node:fs";
import { join } from "node:path";
export function parseSkillMd(skillPath: any): any {
    const content = readFileSync(join(skillPath, "SKILL.md"), "utf8");
    const lines = content.split("\n");
    if ((lines[0] || "").trim() !== "---") {
        throw new Error("SKILL.md 缺少 frontmatter（没有开头 ---）");
    }
    const endIdx = lines.findIndex((line: any, index: any) => index > 0 && line.trim() === "---");
    if (endIdx === -1) {
        throw new Error("SKILL.md 缺少 frontmatter（没有结尾 ---）");
    }
    let name = "";
    let description = "";
    const frontmatterLines = lines.slice(1, endIdx);
    for (let index = 0; index < frontmatterLines.length; index += 1) {
        const line = frontmatterLines[index];
        if (line.startsWith("name:")) {
            name = line.slice("name:".length).trim().replace(/^["']|["']$/g, "");
        }
        else if (line.startsWith("description:")) {
            const value = line.slice("description:".length).trim();
            if ([">", "|", ">-", "|-"].includes(value)) {
                const continuationLines: any[] = [];
                index += 1;
                while (index < frontmatterLines.length
                    && (frontmatterLines[index].startsWith("  ") || frontmatterLines[index].startsWith("\t"))) {
                    continuationLines.push(frontmatterLines[index].trim());
                    index += 1;
                }
                index -= 1;
                description = continuationLines.join(" ");
            }
            else {
                description = value.replace(/^["']|["']$/g, "");
            }
        }
    }
    return { name, description, content };
}
export function withoutClaudeCodeEnv(env: any = process.env): any {
    return Object.fromEntries(Object.entries(env).filter(([key]: any) => key !== "CLAUDECODE"));
}
