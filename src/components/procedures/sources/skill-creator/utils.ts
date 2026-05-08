import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

function parseFrontmatterBlock(content: string): { frontmatter: Record<string, any>; body: string } {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/);
    if (!match) {
        throw new Error("SKILL.md 缺少 frontmatter（没有结尾 ---）");
    }
    const parsed = parseYaml(match[1]) ?? {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("SKILL.md frontmatter 必须是 YAML dictionary");
    }
    return {
        frontmatter: parsed as Record<string, any>,
        body: content.slice(match[0].length),
    };
}

export function parseSkillMd(skillPath: any): any {
    const content = readFileSync(join(skillPath, "SKILL.md"), "utf8");
    if (!content.startsWith("---")) {
        throw new Error("SKILL.md 缺少 frontmatter（没有开头 ---）");
    }
    const { frontmatter } = parseFrontmatterBlock(content);
    const name = typeof frontmatter.name === "string" ? frontmatter.name : "";
    const description = typeof frontmatter.description === "string" ? frontmatter.description : "";
    return { name, description, content };
}
export function withoutNestedAgentCliEnv(env: any = process.env): any {
    return Object.fromEntries(Object.entries(env).filter(([key]: any) => key !== "CLAUDECODE"));
}
