import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");
const skillsRoot = resolve(pluginRoot, "skills");
const readmePath = resolve(pluginRoot, "README.md");

const requiredHeadings = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];

function parseJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch (error) {
    return { __error: error.message };
  }
}

function getSkillFiles() {
  if (!existsSync(skillsRoot)) {
    return [];
  }

  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(skillsRoot, entry.name, "SKILL.md"));
}

function getRelativeLinks(content) {
  return Array.from(content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g))
    .map((match) => match[1])
    .filter(
      (target) =>
        !target.startsWith("http://") &&
        !target.startsWith("https://") &&
        !target.startsWith("#"),
    );
}

function collectManifestIssues() {
  const issues = [];

  if (!existsSync(manifestPath)) {
    issues.push("缺少 .claude-plugin/plugin.json。");
    return issues;
  }

  const manifest = parseJson(manifestPath);
  if (manifest.__error) {
    issues.push(`plugin.json 无法解析：${manifest.__error}`);
  } else {
    if (manifest.name !== "thinking-expert") {
      issues.push(`manifest.name 应为 thinking-expert，当前为 ${JSON.stringify(manifest.name)}`);
    }
    if (manifest.skills !== "./skills/") {
      issues.push(`manifest.skills 应为 ./skills/，当前为 ${JSON.stringify(manifest.skills)}`);
    }
    if (manifest.hooks !== "./hooks/hooks.json") {
      issues.push(`manifest.hooks 应为 ./hooks/hooks.json，当前为 ${JSON.stringify(manifest.hooks)}`);
    }
    if (manifest.author?.name !== "ai-experts") {
      issues.push(`manifest.author.name 应为 ai-experts，当前为 ${JSON.stringify(manifest.author?.name)}`);
    }
  }

  if (!existsSync(skillsRoot)) {
    issues.push("缺少 skills/ 目录。");
  }
  if (!existsSync(hooksPath)) {
    issues.push("缺少 hooks/hooks.json。");
  }
  if (!existsSync(resolve(pluginRoot, "hooks/dispatch.mjs"))) {
    issues.push("缺少 hooks/dispatch.mjs。");
  }
  if (!existsSync(readmePath)) {
    issues.push("缺少 README.md。");
  }

  return issues;
}

function collectHookIssues() {
  const issues = [];
  if (!existsSync(hooksPath)) {
    return issues;
  }

  const hooks = parseJson(hooksPath);
  if (hooks.__error) {
    issues.push(`hooks.json 无法解析：${hooks.__error}`);
    return issues;
  }

  const sessionHooks = hooks.hooks?.SessionStart?.[0]?.hooks ?? [];
  const expected = "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs session-start";
  if (sessionHooks.length !== 1) {
    issues.push(`SessionStart hook 数量异常：期望 1 个，实际 ${sessionHooks.length} 个。`);
  } else if (sessionHooks[0].command !== expected) {
    issues.push(`SessionStart command 异常：${JSON.stringify(sessionHooks[0].command)}`);
  }

  return issues;
}

function collectSkillIssues() {
  const issues = [];
  const skillFiles = getSkillFiles();

  if (skillFiles.length === 0) {
    issues.push("未发现任何 skills/*/SKILL.md。");
    return issues;
  }

  for (const file of skillFiles) {
    if (!existsSync(file)) {
      issues.push(`缺少技能文档：${file}`);
      continue;
    }

    const content = readFileSync(file, "utf-8");

    if (!/description:\s*.*[\u4e00-\u9fff]/u.test(content)) {
      issues.push(`${file} 的 frontmatter description 需要中文描述。`);
    }

    let lastIndex = -1;
    for (const heading of requiredHeadings) {
      const index = content.indexOf(heading);
      if (index === -1) {
        issues.push(`${file} 缺少 ${heading}。`);
        continue;
      }
      if (index < lastIndex) {
        issues.push(`${file} 中 ${heading} 顺序错误。`);
      }
      lastIndex = index;
    }

    if (/\b(TODO|FIXME|TBD|HACK|XXX)\b/.test(content) || /\$ARGUMENTS|\$[A-Z_]+/.test(content)) {
      issues.push(`${file} 仍含占位符或未实现标记。`);
    }

    for (const link of getRelativeLinks(content)) {
      const target = resolve(dirname(file), link);
      if (!existsSync(target)) {
        issues.push(`${file} 引用了不存在的文件：${link}`);
      }
    }
  }

  return issues;
}

export async function run() {
  const issues = [
    ...collectManifestIssues(),
    ...collectHookIssues(),
    ...collectSkillIssues(),
  ];

  if (issues.length === 0) {
    return null;
  }

  return {
    decision: "report",
    reason: [
      "[thinking-expert] 插件自检发现问题：",
      ...issues.map((issue) => `  • ${issue}`),
    ].join("\n"),
  };
}
