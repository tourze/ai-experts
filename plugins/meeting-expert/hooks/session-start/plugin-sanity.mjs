import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "..", "..");
const EXPECTED_NAME = "meeting-expert";
const EXPECTED_HOOK_COMMAND = "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs session-start";
const REQUIRED_HEADINGS = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];
const LEGACY_HEADINGS = /^## (Overview|Process|Rules|Inputs|Instructions|Output Format|Purpose \/ Overview|When to Use|Operational Workflow|Discovery|Strict Minutes Schema|Style & Quality Rules|DO \/ DON'T|Example Prompts|Quick Templates|Verification & Acceptance Criteria for Generated Minutes)\b/m;

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (error) {
    return {
      __error: error instanceof Error ? error.message : String(error),
    };
  }
}

function readText(filePath) {
  try {
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    return {
      __error: error instanceof Error ? error.message : String(error),
    };
  }
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    return { __error: "缺少 frontmatter" };
  }

  const data = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (!kv) {
      continue;
    }
    data[kv[1]] = kv[2].replace(/^['"]|['"]$/g, "");
  }
  return data;
}

function extractRelativeLinks(source) {
  const links = [];
  const regex = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const target = match[1];
    if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#")) {
      continue;
    }
    links.push(target);
  }
  return links;
}

function collectIssues() {
  const issues = [];
  const manifestPath = join(PLUGIN_ROOT, ".claude-plugin", "plugin.json");
  const hooksPath = join(PLUGIN_ROOT, "hooks", "hooks.json");
  const dispatchPath = join(PLUGIN_ROOT, "hooks", "dispatch.mjs");
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

  if (manifest.author?.name !== "ai-experts") {
    issues.push(`plugin.json.author.name 应为 ai-experts，实际为 ${String(manifest.author?.name) || "<empty>"}`);
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

  if (manifest.dependencies?.optional !== undefined) {
    if (!Array.isArray(manifest.dependencies.optional)) {
      issues.push("plugin.json.dependencies.optional 必须是数组。");
    } else {
      for (const dep of manifest.dependencies.optional) {
        if (typeof dep !== "string" || dep.length === 0) {
          issues.push(`plugin.json.dependencies.optional 存在非法条目：${String(dep)}`);
          continue;
        }

        const depPath = resolve(PLUGIN_ROOT, "..", dep);
        if (!existsSync(depPath)) {
          issues.push(`可选依赖不存在：${dep}`);
        }
      }
    }
  }

  if (!existsSync(dispatchPath)) {
    issues.push("缺少 hooks/dispatch.mjs。");
  }

  if (!existsSync(hooksPath)) {
    issues.push("缺少 hooks/hooks.json。");
  } else {
    const hooksConfig = readJson(hooksPath);
    if (hooksConfig.__error) {
      issues.push(`hooks/hooks.json 无法解析：${hooksConfig.__error}`);
    } else {
      const sessionHooks = hooksConfig.hooks?.SessionStart?.[0]?.hooks ?? [];
      if (sessionHooks.length !== 1) {
        issues.push(`SessionStart hooks 数量应为 1，实际为 ${sessionHooks.length}`);
      } else if (sessionHooks[0].command !== EXPECTED_HOOK_COMMAND) {
        issues.push(`SessionStart command 应为 ${EXPECTED_HOOK_COMMAND}，实际为 ${String(sessionHooks[0].command)}`);
      }
    }
  }

  if (!existsSync(skillsRoot)) {
    issues.push("skills/ 目录不存在。");
    return issues;
  }

  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillPath = join(skillsRoot, entry.name, "SKILL.md");
    if (!existsSync(skillPath)) {
      issues.push(`skill 目录缺少 SKILL.md：skills/${entry.name}/SKILL.md`);
      continue;
    }

    const source = readText(skillPath);
    if (source.__error) {
      issues.push(`无法读取 ${skillPath}：${source.__error}`);
      continue;
    }

    const frontmatter = parseFrontmatter(source);
    if (frontmatter.__error) {
      issues.push(`${skillPath} ${frontmatter.__error}`);
      continue;
    }

    if (frontmatter.name !== entry.name) {
      issues.push(`${skillPath} 的 frontmatter.name 应为 ${entry.name}，实际为 ${String(frontmatter.name) || "<empty>"}`);
    }

    if (!frontmatter.description) {
      issues.push(`${skillPath} 缺少 frontmatter.description。`);
    }

    let previousIndex = -1;
    for (const heading of REQUIRED_HEADINGS) {
      const index = source.indexOf(heading);
      if (index < 0) {
        issues.push(`${skillPath} 缺少 ${heading}。`);
        continue;
      }
      if (index <= previousIndex) {
        issues.push(`${skillPath} 的标题顺序不正确：${heading}。`);
      }
      previousIndex = index;
    }

    if (LEGACY_HEADINGS.test(source)) {
      issues.push(`${skillPath} 仍残留旧结构标题。`);
    }

    for (const link of extractRelativeLinks(source)) {
      const resolved = resolve(dirname(skillPath), link);
      if (!resolved.startsWith(PLUGIN_ROOT)) {
        issues.push(`${skillPath} 的链接越界：${link}`);
        continue;
      }
      if (!existsSync(resolved)) {
        issues.push(`${skillPath} 的链接不存在：${link}`);
      }
    }
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
