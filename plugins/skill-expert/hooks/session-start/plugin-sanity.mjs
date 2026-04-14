import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "..", "..");
const EXPECTED_NAME = "skill-expert";

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (error) {
    return {
      __error: error instanceof Error ? error.message : String(error),
    };
  }
}

function collectSkillFiles(dir) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSkillFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name === "SKILL.md") {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function extractRelativeLinks(markdown) {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter((href) => !href.startsWith("#") && !/^[a-z]+:/i.test(href));
}

function validateSkillDoc(skillPath, issues) {
  const content = readFileSync(skillPath, "utf-8");
  const relPath = relative(PLUGIN_ROOT, skillPath);
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatter) {
    issues.push(`${relPath} 缺少 frontmatter。`);
    return;
  }

  const expectedName = relative(resolve(PLUGIN_ROOT, "skills"), dirname(skillPath)).split("/").join("/");

  if (!frontmatter[1].includes(`name: ${expectedName}`)) {
    issues.push(`${relPath} frontmatter.name 应为 ${expectedName}。`);
  }

  if (!/^\s*description:\s+/m.test(frontmatter[1])) {
    issues.push(`${relPath} frontmatter.description 缺失。`);
  }

  for (const href of extractRelativeLinks(content)) {
    const target = resolve(dirname(skillPath), href);
    if (!target.startsWith(PLUGIN_ROOT)) {
      issues.push(`${relPath} 中相对链接越界：${href}`);
      continue;
    }
    if (!existsSync(target)) {
      issues.push(`${relPath} 中相对链接不存在：${href}`);
    }
  }
}

function collectIssues() {
  const issues = [];
  const manifestPath = join(PLUGIN_ROOT, ".claude-plugin", "plugin.json");
  const hooksPath = join(PLUGIN_ROOT, "hooks", "hooks.json");
  const dispatchPath = join(PLUGIN_ROOT, "hooks", "dispatch.mjs");
  const readmePath = join(PLUGIN_ROOT, "README.md");
  const skillsRoot = join(PLUGIN_ROOT, "skills");

  if (!existsSync(manifestPath)) {
    issues.push("缺少 .claude-plugin/plugin.json。");
    return issues;
  }

  const manifest = readJson(manifestPath);
  if (manifest.__error) {
    issues.push(`plugin.json 无法解析：${manifest.__error}`);
    return issues;
  }

  if (manifest.name !== EXPECTED_NAME) {
    issues.push(`plugin.json.name 应为 ${EXPECTED_NAME}，实际为 ${String(manifest.name) || "<empty>"}`);
  }

  for (const [key, expected] of [
    ["skills", "./skills/"],
    ["hooks", "./hooks/hooks.json"],
  ]) {
    if (manifest[key] !== expected) {
      issues.push(`plugin.json.${key} 应为 ${expected}，实际为 ${String(manifest[key]) || "<empty>"}`);
      continue;
    }

    const target = resolve(PLUGIN_ROOT, manifest[key]);
    if (!existsSync(target)) {
      issues.push(`plugin.json.${key} 指向的路径不存在：${manifest[key]}`);
    }
  }

  if (!existsSync(hooksPath)) {
    issues.push("缺少 hooks/hooks.json。");
  } else {
    const hooks = readJson(hooksPath);
    if (hooks.__error) {
      issues.push(`hooks.json 无法解析：${hooks.__error}`);
    } else {
      const sessionHook = hooks.hooks?.SessionStart?.[0]?.hooks?.[0]?.command;
      if (sessionHook !== "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs session-start") {
        issues.push(`SessionStart hook 命令不正确：${String(sessionHook) || "<empty>"}`);
      }
    }
  }

  for (const filePath of [dispatchPath, readmePath]) {
    if (!existsSync(filePath)) {
      issues.push(`缺少 ${relative(PLUGIN_ROOT, filePath)}。`);
    }
  }

  if (!existsSync(skillsRoot)) {
    issues.push("缺少 skills/ 目录。");
    return issues;
  }

  const topLevelSkills = readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  if (topLevelSkills.length === 0) {
    issues.push("skills/ 目录为空。");
    return issues;
  }

  for (const entry of topLevelSkills) {
    const skillDoc = join(skillsRoot, entry.name, "SKILL.md");
    if (!existsSync(skillDoc)) {
      issues.push(`skill 目录缺少 SKILL.md：skills/${entry.name}/SKILL.md`);
    }
  }

  for (const skillPath of collectSkillFiles(skillsRoot)) {
    validateSkillDoc(skillPath, issues);
  }

  return issues;
}

export async function run() {
  const issues = collectIssues();
  if (issues.length === 0) {
    return null;
  }

  return {
    decision: "report",
    reason: `[Plugin Sanity] ${EXPECTED_NAME} 自检失败：\n- ${issues.join("\n- ")}`,
  };
}
