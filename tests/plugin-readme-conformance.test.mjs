import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginsRoot = resolve("plugins");
const repoRoot = resolve(".");
const trackedFiles = new Set(
  [
    execFileSync("git", ["ls-files"], {
      cwd: repoRoot,
      encoding: "utf-8",
    }),
    execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: repoRoot,
      encoding: "utf-8",
    }),
  ]
    .join("\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean),
);

// plugin 目录的存在标记从 .claude-plugin/plugin.json（marketplace 时代）改为
// README.md。仓库已弃用 plugin.json，原过滤条件命中 0 文件，导致下方所有
// for-of 循环零次通过、断言形同虚设。每个插件强制有 README.md（plugin-readme
// -conformance 自身就是验证此前提的测试），用它兜底安全。
function listTrackedPluginNames() {
  return [...trackedFiles]
    .filter((line) => line.startsWith("plugins/") && /^plugins\/[^/]+\/README\.md$/.test(line))
    .map((line) => line.split("/")[1])
    .sort();
}

function getPluginRoots() {
  return listTrackedPluginNames()
    .map((name) => resolve(pluginsRoot, name))
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
      if (!statSync(skillRoot).isDirectory()) {
        return false;
      }
      const relativeSkillPath = `plugins/${pluginRoot.split("/").at(-1)}/skills/${name}/SKILL.md`;
      return trackedFiles.has(relativeSkillPath) && existsSync(resolve(skillRoot, "SKILL.md"));
    })
    .sort();
}

function getTopLevelAgentNames(pluginRoot) {
  const agentsRoot = resolve(pluginRoot, "agents");
  if (!existsSync(agentsRoot)) {
    return [];
  }

  return readdirSync(agentsRoot)
    .filter((name) => {
      if (!name.endsWith(".md")) {
        return false;
      }
      const relativeAgentPath = `plugins/${pluginRoot.split("/").at(-1)}/agents/${name}`;
      return trackedFiles.has(relativeAgentPath);
    })
    .map((name) => name.replace(/\.md$/, ""))
    .sort();
}

function getListedSkillNames(sectionBody) {
  return [...sectionBody.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)]
    .map((match) => match[1])
    .filter((name) => name !== "Skill");
}

function getListedAgentNames(sectionBody) {
  return [...sectionBody.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)]
    .map((match) => match[1])
    .filter((name) => name !== "Agent");
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

const SELF_DESCRIPTION_PLUGIN_TERMS = [
  "专家插件",
  "通用编码守卫插件",
  "基座插件",
  "审计插件",
  "本插件",
  "插件目录",
  "插件级",
  "插件清单",
  "协作插件",
  "依赖插件",
  "插件加载路径",
];

const SKILL_SCRIPT_DISCLOSURE_PATTERNS = [
  {
    label: "仓库内 skill scripts 路径",
    regex: /plugins\/[^/\s`]+\/skills\/[^/\s`]+\/scripts\/[^\s`)]+/,
  },
  {
    label: "插件内 skill scripts 路径",
    regex: /(?:^|[\s"`'(])skills\/[^/\s`]+\/scripts\/[^\s`)]+/,
  },
  {
    label: "已安装 skill scripts 路径",
    regex: /\$[A-Z_]+\/scripts\/[^\s`)]+/,
  },
];

test("非 skill-expert README 不使用本仓库插件自描述", () => {
  for (const pluginRoot of getPluginRoots()) {
    if (pluginRoot.endsWith("/skill-expert")) {
      continue;
    }

    const readmePath = resolve(pluginRoot, "README.md");
    const readme = readFileSync(readmePath, "utf-8");
    const violations = SELF_DESCRIPTION_PLUGIN_TERMS.filter((term) => readme.includes(term));

    assert.deepEqual(
      violations,
      [],
      `${readmePath} 含本仓库插件自描述：${violations.join(", ")}`,
    );
  }
});

test("所有插件 README 都包含安装、卸载和验证入口", () => {
  // 仓库统一安装入口已切换为根级 `node scripts/install.mjs`，每个插件 README
  // 不再重复 install/uninstall 命令块，改为合并段「安装 / 卸载」加一行指向
  // 根脚本的描述。这里检查两件事：(a) 该段存在；(b) 段内确实指向统一入口，
  // 而不是误删后留下空段或又写回 marketplace 时代的 `claude plugin install`。
  for (const pluginRoot of getPluginRoots()) {
    const readmePath = resolve(pluginRoot, "README.md");
    const sections = getReadmeSections(readFileSync(readmePath, "utf-8"));

    const installSection = getRequiredSection(sections, ["安装 / 卸载", "安装", "卸载"], readmePath);
    const verifySection = getRequiredSection(sections, ["验证命令", "验证", "校验"], readmePath);

    assert.match(
      installSection,
      /scripts\/install\.mjs/,
      `${readmePath} 的安装 / 卸载章节未指向 scripts/install.mjs 统一入口`,
    );
    assert.match(verifySection, /```[\s\S]*?```/, `${readmePath} 的验证章节缺少命令块`);
  }
});

test("插件 README 不直接披露 skill 内部 scripts 调用方式", () => {
  const violations = [];

  for (const pluginRoot of getPluginRoots()) {
    const readmePath = resolve(pluginRoot, "README.md");
    const lines = readFileSync(readmePath, "utf-8").split("\n");

    lines.forEach((line, index) => {
      for (const pattern of SKILL_SCRIPT_DISCLOSURE_PATTERNS) {
        if (pattern.regex.test(line)) {
          violations.push(`${readmePath}:${index + 1}: ${pattern.label}: ${line.trim()}`);
        }
      }
    });
  }

  assert.deepEqual(violations, []);
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

test("所有带 agents 的插件 README 都包含同步的 Agents 索引", () => {
  for (const pluginRoot of getPluginRoots()) {
    const expectedAgents = getTopLevelAgentNames(pluginRoot);
    if (expectedAgents.length === 0) {
      continue;
    }

    const readmePath = resolve(pluginRoot, "README.md");
    const sections = getReadmeSections(readFileSync(readmePath, "utf-8"));
    const agentsSection = getRequiredSection(sections, ["Agents"], readmePath);
    const listedAgents = getListedAgentNames(agentsSection);
    const actualAgents = [...new Set(listedAgents)].sort();
    const duplicateAgents = [...new Set(listedAgents.filter((name, index) => listedAgents.indexOf(name) !== index))];

    assert.ok(actualAgents.length > 0, `${readmePath} 的 Agents 章节缺少 Markdown 表格`);
    assert.deepEqual(duplicateAgents, [], `${readmePath} 的 Agents 列表存在重复项`);
    assert.deepEqual(actualAgents, expectedAgents, `${readmePath} 的 Agents 列表与目录不一致`);
  }
});

test("react-expert 的 Skills 附加说明不会被同步脚本覆盖", () => {
  const readmePath = resolve(pluginsRoot, "react-expert", "README.md");
  const readme = readFileSync(readmePath, "utf-8");

  assert.match(
    readme,
    /React Native 相关 skill 仍保留在本目录/,
    `${readmePath} 丢失了 Skills 章节后的附加说明`,
  );
  assert.doesNotMatch(readme, /react-native-expert/, `${readmePath} 引用了不存在的 react-native-expert`);
});

test("skills 目录下不再保留游离的 skill 级 plugin.json", () => {
  assert.deepEqual(collectNestedSkillPluginJson(), []);
});
