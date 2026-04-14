import { existsSync, readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = resolve(__dirname, "..", "..");
const skillsRoot = join(pluginRoot, "skills");

const REQUIRED_PATHS = [
  [".claude-plugin/plugin.json", "插件清单"],
  ["README.md", "README"],
  ["hooks/hooks.json", "hook 配置"],
  ["hooks/dispatch.mjs", "hook 分发器"],
  ["skills", "skills 目录"],
];

function hasCommand(command) {
  if (process.platform === "win32") {
    return spawnSync("where", [command], { stdio: "ignore" }).status === 0;
  }

  return spawnSync("bash", ["-lc", `command -v '${command}' >/dev/null 2>&1`], {
    stdio: "ignore",
  }).status === 0;
}

function listSkillDirs() {
  if (!existsSync(skillsRoot)) {
    return [];
  }

  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function collectMissingSkillDocs() {
  return listSkillDirs()
    .filter((name) => !existsSync(join(skillsRoot, name, "SKILL.md")))
    .map((name) => `skills/${name}/SKILL.md`);
}

function collectBrokenLinks() {
  const broken = [];
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  function collectMarkdownFiles(dir) {
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
    return files;
  }

  for (const filePath of collectMarkdownFiles(skillsRoot)) {
    const content = readFileSync(filePath, "utf8");
    for (const match of content.matchAll(linkPattern)) {
      const rawTarget = match[1].trim();
      const target = rawTarget.split("#")[0];

      if (!target || target.startsWith("http://") || target.startsWith("https://")) {
        continue;
      }
      if (target.startsWith("mailto:") || target.startsWith("#") || target.startsWith("/")) {
        continue;
      }

      const resolved = resolve(dirname(filePath), target);
      if (!resolved.startsWith(pluginRoot)) {
        continue;
      }

      if (!existsSync(resolved)) {
        broken.push(`${filePath.replace(`${pluginRoot}/`, "")}: ${rawTarget}`);
      }
    }
  }

  return broken;
}

function formatSection(title, items) {
  if (items.length === 0) {
    return [];
  }

  return [title, ...items.map((item) => `  • ${item}`)];
}

export async function run() {
  const missingPaths = REQUIRED_PATHS
    .filter(([relativePath]) => !existsSync(join(pluginRoot, relativePath)))
    .map(([relativePath, label]) => `${label} 缺失：${relativePath}`);

  const missingCommands = [
    ["node", "hook 分发器与前端示例资产检查"],
    ["python3", "营销分析脚本与可读性检查脚本"],
  ]
    .filter(([command]) => !hasCommand(command))
    .map(([command, usage]) => `${command}：${usage}`);

  const missingSkillDocs = collectMissingSkillDocs();
  const brokenLinks = collectBrokenLinks().slice(0, 10);

  const lines = [
    ...formatSection("[Plugin Deps] marketing-expert 缺少基础路径：", missingPaths),
    ...formatSection("[Plugin Deps] marketing-expert 缺少基础命令：", missingCommands),
    ...formatSection("[Plugin Deps] marketing-expert 缺少技能说明：", missingSkillDocs),
    ...formatSection("[Plugin Deps] marketing-expert 检测到失效文档链接：", brokenLinks),
  ];

  if (lines.length === 0) {
    return null;
  }

  lines.push("  建议运行 `claude plugin validate plugins/marketing-expert` 与静态语法检查后再继续使用。");
  return { decision: "report", reason: lines.join("\n") };
}
