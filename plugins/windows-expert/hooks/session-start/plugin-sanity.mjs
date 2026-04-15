import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "..", "..");
const EXPECTED_NAME = "windows-expert";
const EXPECTED_HOOK_COMMAND = "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs session-start";
const REQUIRED_HEADINGS = [
  "## 适用场景",
  "## 核心约束",
  "## 代码模式",
  "## 检查清单",
  "## 反模式",
];
const LEGACY_HEADINGS = /^## (Overview|Process|Rules|Inputs|Instructions|Output Format|Purpose \/ Overview|When to Use|Operational Workflow|Discovery|Quick Templates|DO \/ DON'T)\b/m;

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

function getSkillDirs(skillsRoot) {
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function parseReadmeSkillList(readme) {
  return readme
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) => line.match(/\| `([^`]+)` \|/)?.[1])
    .filter(Boolean)
    .sort();
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

  if (manifest.author?.name !== "ai-experts") {
    issues.push(`plugin.json.author.name 应为 ai-experts，实际为 ${String(manifest.author?.name) || "<empty>"}`);
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

  if (!existsSync(readmePath)) {
    issues.push("缺少 README.md。");
  }

  if (!existsSync(dispatchPath)) {
    issues.push("缺少 hooks/dispatch.mjs。");
  }

  if (!existsSync(hooksPath)) {
    issues.push("缺少 hooks/hooks.json。");
  } else {
    const hooks = readJson(hooksPath);
    if (hooks.__error) {
      issues.push(`hooks/hooks.json 无法解析：${hooks.__error}`);
    } else {
      const sessionHooks = hooks.hooks?.SessionStart?.[0]?.hooks ?? [];
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

  const skillDirs = getSkillDirs(skillsRoot);

  if (existsSync(readmePath)) {
    const readme = readText(readmePath);
    if (readme.__error) {
      issues.push(`README.md 无法读取：${readme.__error}`);
    } else {
      const listedSkills = parseReadmeSkillList(readme);
      if (JSON.stringify(listedSkills) !== JSON.stringify(skillDirs)) {
        issues.push(`README.md 的技能列表与目录不一致：README=${listedSkills.join(", ")}；目录=${skillDirs.join(", ")}`);
      }
    }
  }

  for (const skillName of skillDirs) {
    const skillPath = join(skillsRoot, skillName, "SKILL.md");
    if (!existsSync(skillPath)) {
      issues.push(`skill 目录缺少 SKILL.md：skills/${skillName}/SKILL.md`);
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

    if (frontmatter.name !== skillName) {
      issues.push(`${skillPath} 的 frontmatter.name 应为 ${skillName}，实际为 ${String(frontmatter.name) || "<empty>"}`);
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

    if (/\b(TODO|FIXME|HACK|TBD|XXX)\b/i.test(source)) {
      issues.push(`${skillPath} 仍残留 TODO/FIXME/HACK/TBD/XXX 标记。`);
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
