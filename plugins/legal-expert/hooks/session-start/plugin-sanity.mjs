import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "..", "..");
const EXPECTED_NAME = "legal-expert";
const REQUIRED_SECTIONS = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];
function joinedRegex(parts, flags = "") {
  return new RegExp(parts.join(""), flags);
}

const FORBIDDEN_PATTERNS = [
  joinedRegex(["\\b", "TO", "DO", "\\b"], "i"),
  joinedRegex(["\\b", "FIX", "ME", "\\b"], "i"),
  joinedRegex(["\\b", "TB", "D", "\\b"], "i"),
];

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (error) {
    return {
      __error: error instanceof Error ? error.message : String(error),
    };
  }
}

function validateSkillDoc(skillPath, relativePath, issues) {
  const content = readFileSync(skillPath, "utf-8");
  let previousIndex = -1;

  for (const heading of REQUIRED_SECTIONS) {
    const index = content.indexOf(heading);
    if (index === -1) {
      issues.push(`${relativePath} 缺少 ${heading}。`);
      return;
    }

    if (index <= previousIndex) {
      issues.push(`${relativePath} 中 ${heading} 顺序不正确。`);
      return;
    }

    previousIndex = index;
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      issues.push(`${relativePath} 仍包含占位或未完成标记：${pattern}`);
    }
  }
}

function collectIssues() {
  const issues = [];
  const manifestPath = join(PLUGIN_ROOT, ".claude-plugin", "plugin.json");
  const hooksPath = join(PLUGIN_ROOT, "hooks", "hooks.json");
  const readmePath = join(PLUGIN_ROOT, "README.md");

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

  if (manifest.skills !== "./skills/") {
    issues.push(`plugin.json.skills 应为 ./skills/，实际为 ${String(manifest.skills) || "<empty>"}`);
  } else {
    const skillsPath = resolve(PLUGIN_ROOT, manifest.skills);
    if (!existsSync(skillsPath)) {
      issues.push(`plugin.json.skills 指向的路径不存在：${manifest.skills}`);
    }
  }

  if ("hooks" in manifest) {
    issues.push(`plugin.json.hooks 不应重复声明标准 hooks/hooks.json；Claude 会自动加载该文件，实际为 ${String(manifest.hooks) || "<empty>"}`);
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

  if (!existsSync(readmePath)) {
    issues.push("缺少 README.md。");
  }

  const skillsRoot = resolve(PLUGIN_ROOT, "skills");
  if (!existsSync(skillsRoot)) {
    issues.push("skills/ 目录不存在。");
    return issues;
  }

  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const relativePath = `skills/${entry.name}/SKILL.md`;
    const skillPath = join(skillsRoot, entry.name, "SKILL.md");
    if (!existsSync(skillPath)) {
      issues.push(`skill 目录缺少 SKILL.md：${relativePath}`);
      continue;
    }

    validateSkillDoc(skillPath, relativePath, issues);
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
