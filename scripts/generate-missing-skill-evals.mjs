#!/usr/bin/env node
/**
 * Generate starter trigger evals for skills that do not yet have
 * evals/cases.yaml. Existing eval files are never overwritten.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {
    repoRoot: resolve(scriptDir, ".."),
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root") {
      args.repoRoot = resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function isDirectory(path) {
  return existsSync(path) && statSync(path).isDirectory();
}

function listDirectories(path) {
  if (!isDirectory(path)) {
    return [];
  }
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listSkillFiles(path) {
  if (!isDirectory(path)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const entryPath = join(path, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSkillFiles(entryPath));
      continue;
    }
    if (entry.isFile() && entry.name === "SKILL.md") {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return {};
  }
  const end = markdown.indexOf("\n---\n", 4);
  if (end < 0) {
    return {};
  }

  const data = {};
  const lines = markdown.slice(4, end).split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      continue;
    }
    const [, key, rawValue] = match;
    data[key] = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)"$/, "$1").replace(/^'(.*)'$/, "$1").trim();
  }
  return data;
}

function stripFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return markdown;
  }
  const end = markdown.indexOf("\n---\n", 4);
  return end < 0 ? markdown : markdown.slice(end + 5);
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\[[^\]]+\]\([^)]+\)/g, (match) => match.replace(/\]\([^)]+\)/, "]"))
    .replace(/[`*_#>]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[-*]\s+/, "")
    .trim();
}

function sentenceFromDescription(description, skillName) {
  const text = cleanText(description)
    .replace(/^当用户要?/, "")
    .replace(/^当需要/, "")
    .replace(/时使用。?$/, "")
    .replace(/时触发。?$/, "")
    .replace(/适合.*$/, "")
    .trim();
  return text || `使用 ${skillName}`;
}

function extractBullets(markdown) {
  return stripFrontmatter(markdown)
    .split("\n")
    .map((line) => line.match(/^\s*[-*]\s+(.+)$/)?.[1])
    .filter(Boolean)
    .map(cleanText)
    .filter((line) => line.length >= 8 && !line.includes("改用 [") && !line.includes("不要"))
    .slice(0, 6);
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function idPart(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "case";
}

function buildCases(skill, peers) {
  const task = sentenceFromDescription(skill.description, skill.name);
  const bullets = extractBullets(skill.markdown);
  const positiveDetail = bullets.find((bullet) => bullet !== task) ?? task;
  const peer = peers.find((candidate) => candidate.id !== skill.id);
  const peerTask = peer ? sentenceFromDescription(peer.description, peer.name) : "写一个通用排序函数或解释基础编程语法";

  return [
    {
      id: `positive_${idPart(skill.name)}_primary`,
      prompt: `我需要${task}`,
      rubric: [
        `recognizes the request as ${skill.name} territory`,
        "uses the skill-specific workflow or domain criteria instead of giving a generic answer",
      ],
      trigger: true,
    },
    {
      id: `positive_${idPart(skill.name)}_realistic`,
      prompt: positiveDetail.startsWith("我") ? positiveDetail : `帮我处理这个场景：${positiveDetail}`,
      rubric: [
        "matches a concrete use case described by the skill",
        "keeps the response focused on the skill's domain boundary",
      ],
      trigger: true,
    },
    {
      id: `negative_adjacent_${idPart(peer?.name ?? "unrelated")}`,
      prompt: peer ? `这个需求应该交给 ${peer.name}：${peerTask}` : "请写一个通用 Python 排序函数并解释时间复杂度",
      rubric: [
        peer
          ? `adjacent ${peer.name} requests should not trigger ${skill.name}`
          : `unrelated programming requests should not trigger ${skill.name}`,
      ],
      trigger: false,
    },
    {
      id: "negative_general_unrelated_task",
      prompt: "请帮我写一封简短的会议改期通知邮件",
      rubric: [
        "general writing or administrative requests are outside this skill",
      ],
      trigger: false,
    },
  ];
}

function renderCases(cases) {
  const lines = ["cases:"];
  for (const item of cases) {
    lines.push(`  - id: ${item.id}`);
    lines.push(`    prompt: ${yamlString(item.prompt)}`);
    lines.push("    fixtures: []");
    lines.push("    rubric:");
    for (const rubric of item.rubric) {
      lines.push(`      - ${yamlString(rubric)}`);
    }
    lines.push(`    trigger_expected: ${item.trigger ? "true" : "false"}`);
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function collectSkills(repoRoot) {
  const pluginsRoot = join(repoRoot, "plugins");
  const skills = [];

  for (const pluginName of listDirectories(pluginsRoot)) {
    const skillsRoot = join(pluginsRoot, pluginName, "skills");
    for (const skillPath of listSkillFiles(skillsRoot)) {
      const skillDir = dirname(skillPath);
      const markdown = readFileSync(skillPath, "utf-8");
      const frontmatter = parseFrontmatter(markdown);
      const relativeSkillDir = relative(skillsRoot, skillDir).replaceAll("\\", "/");
      skills.push({
        pluginName,
        skillPath,
        skillDir,
        id: `${pluginName}/${relativeSkillDir}`,
        name: String(frontmatter.name ?? basename(skillDir)),
        description: String(frontmatter.description ?? ""),
        markdown,
        evalPath: join(skillDir, "evals", "cases.yaml"),
      });
    }
  }

  return skills;
}

function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const skills = collectSkills(args.repoRoot);
  const byPlugin = new Map();
  for (const skill of skills) {
    if (!byPlugin.has(skill.pluginName)) {
      byPlugin.set(skill.pluginName, []);
    }
    byPlugin.get(skill.pluginName).push(skill);
  }

  const missing = skills.filter((skill) => !existsSync(skill.evalPath));
  for (const skill of missing) {
    const cases = buildCases(skill, byPlugin.get(skill.pluginName) ?? []);
    if (!args.dryRun) {
      mkdirSync(dirname(skill.evalPath), { recursive: true });
      writeFileSync(skill.evalPath, renderCases(cases), "utf-8");
    }
    console.log(`${args.dryRun ? "would create" : "created"} ${relative(args.repoRoot, skill.evalPath).replaceAll("\\", "/")}`);
  }

  console.log(`${args.dryRun ? "Would create" : "Created"} ${missing.length} eval file(s).`);
}

run();
