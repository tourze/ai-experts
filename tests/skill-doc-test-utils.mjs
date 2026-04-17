import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const repoRoot = resolve(".");

export function getSkillFiles(pluginRoot) {
  const skillsRoot = resolve(pluginRoot, "skills");
  return readdirSync(skillsRoot)
    .map((name) => resolve(skillsRoot, name, "SKILL.md"))
    .filter((file) => existsSync(file));
}

export function extractRelativeLinks(markdown) {
  const withoutCodeBlocks = markdown.replace(/```[\s\S]*?```/g, "");
  return Array.from(withoutCodeBlocks.matchAll(/\[[^\]]+\]\(([^)]+)\)/g))
    .map((match) => match[1].trim())
    .filter((target) => target && !target.startsWith("#") && !/^[a-z]+:/i.test(target))
    .map((target) => target.split("#")[0])
    .filter(Boolean);
}

export function assertBasicSkillDocQuality(assert, pluginRoot, file) {
  const content = readFileSync(file, "utf-8");
  const nameMatch = content.match(/^name:\s*([^\n]+)$/m);
  const descriptionMatch = content.match(/^description:\s*([^\n]+)$/m);

  assert.ok(nameMatch, `${file} 缺少 frontmatter.name`);
  assert.ok(descriptionMatch, `${file} 缺少 frontmatter.description`);
  assert.equal(nameMatch[1].trim(), basename(dirname(file)), `${file} 的 frontmatter.name 与目录名不一致`);
  assert.match(content, /^##\s+/m, `${file} 缺少二级标题正文结构`);
  assert.doesNotMatch(content, /\b(TODO|FIXME|TBD|HACK|XXX)\b/, `${file} 存在遗留占位符`);

  for (const link of extractRelativeLinks(content)) {
    const target = resolve(dirname(file), link);
    assert.ok(target.startsWith(repoRoot), `${file} 中 ${link} 越界`);
    assert.ok(existsSync(target), `${file} 中交叉引用不存在：${link}`);
  }

  if (pluginRoot) {
    assert.ok(file.startsWith(resolve(pluginRoot)), `${file} 不在插件目录内`);
  }
}
