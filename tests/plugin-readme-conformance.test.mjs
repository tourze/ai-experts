import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginsRoot = resolve("plugins");

function getPluginRoots() {
  return readdirSync(pluginsRoot)
    .map((name) => resolve(pluginsRoot, name))
    .filter((pluginRoot) => statSync(pluginRoot).isDirectory())
    .sort();
}

function getReadmeSections(markdown) {
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  const sections = new Map();

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const title = match[1].trim();
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : markdown.length;
    sections.set(title, markdown.slice(start, end).trim());
  }

  return sections;
}

function getRequiredSection(sections, titles, readmePath) {
  for (const title of titles) {
    if (sections.has(title)) {
      return sections.get(title);
    }
  }

  assert.fail(`${readmePath} 缺少章节：${titles.join(" / ")}`);
}

function getTopLevelSkillNames(pluginRoot) {
  const skillsRoot = resolve(pluginRoot, "skills");
  if (!existsSync(skillsRoot)) {
    return [];
  }

  return readdirSync(skillsRoot)
    .filter((name) => {
      const skillRoot = resolve(skillsRoot, name);
      return statSync(skillRoot).isDirectory() && existsSync(resolve(skillRoot, "SKILL.md"));
    })
    .sort();
}

function getListedSkillNames(sectionBody) {
  return [...sectionBody.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)]
    .map((match) => match[1])
    .filter((name) => name !== "Skill");
}

function collectNestedSkillPluginJson() {
  const nested = [];

  for (const pluginRoot of getPluginRoots()) {
    const skillsRoot = resolve(pluginRoot, "skills");
    if (!existsSync(skillsRoot)) {
      continue;
    }

    const stack = [skillsRoot];
    while (stack.length > 0) {
      const current = stack.pop();
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const entryPath = resolve(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(entryPath);
          continue;
        }

        if (entry.name === "plugin.json") {
          nested.push(entryPath);
        }
      }
    }
  }

  return nested.sort();
}

test("所有插件 README 都包含安装、卸载和验证入口", () => {
  for (const pluginRoot of getPluginRoots()) {
    const readmePath = resolve(pluginRoot, "README.md");
    const sections = getReadmeSections(readFileSync(readmePath, "utf-8"));

    const installSection = getRequiredSection(sections, ["安装"], readmePath);
    const uninstallSection = getRequiredSection(sections, ["卸载"], readmePath);
    const verifySection = getRequiredSection(sections, ["验证命令", "验证", "校验"], readmePath);

    assert.match(installSection, /```[\s\S]*?```/, `${readmePath} 的安装章节缺少命令块`);
    assert.match(uninstallSection, /```[\s\S]*?```/, `${readmePath} 的卸载章节缺少命令块`);
    assert.match(verifySection, /```[\s\S]*?```/, `${readmePath} 的验证章节缺少命令块`);
  }
});

test("所有插件 README 的技能列表与顶级 skill 目录保持一致", () => {
  for (const pluginRoot of getPluginRoots()) {
    const expectedSkills = getTopLevelSkillNames(pluginRoot);
    if (expectedSkills.length === 0) {
      continue;
    }

    const readmePath = resolve(pluginRoot, "README.md");
    const sections = getReadmeSections(readFileSync(readmePath, "utf-8"));
    const skillsSection = getRequiredSection(sections, ["Skills", "技能"], readmePath);
    const listedSkills = getListedSkillNames(skillsSection);
    const actualSkills = [...new Set(listedSkills)].sort();
    const duplicateSkills = [...new Set(listedSkills.filter((name, index) => listedSkills.indexOf(name) !== index))];

    assert.ok(actualSkills.length > 0, `${readmePath} 的技能章节缺少 Markdown 表格`);
    assert.deepEqual(duplicateSkills, [], `${readmePath} 的技能列表存在重复项`);
    assert.deepEqual(actualSkills, expectedSkills, `${readmePath} 的技能列表与目录不一致`);
  }
});

test("skills 目录下不再保留游离的 skill 级 plugin.json", () => {
  assert.deepEqual(collectNestedSkillPluginJson(), []);
});
