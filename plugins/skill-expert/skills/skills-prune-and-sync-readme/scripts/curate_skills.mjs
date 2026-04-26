#!/usr/bin/env node
// Audit, prune, and sync repository skills metadata.

import fs from "node:fs";
import path from "node:path";

const ALLOWED_FRONTMATTER_KEYS = new Set("acknowledgments agent allowed-tools alwaysApply compatibility context date_added dependency description license metadata name related-skills risk source tools user-invocable user_invocable version".split(" "));
const README_SECTION_START = "## Skill 清单";
const README_SECTION_END = "## 数据来源";
const STOP_WORDS = new Set([
  "a", "an", "and", "api", "app", "application", "best", "by", "code", "covers",
  "default", "for", "from", "guide", "help", "how", "in", "is", "it", "its",
  "must", "of", "on", "or", "skill", "skills", "style", "task", "tasks", "the",
  "this", "to", "tool", "tools", "use", "used", "using", "when", "with", "workflow",
]);
const LOW_QUALITY_PATTERNS = [/\bTODO\b/i, /\bTBD\b/i, /placeholder/i];
const EXCLUSIVE_MARKERS = [
  "must be used",
  "must use",
  "always use",
  "always prefer",
  "only",
  "do not use",
  "必须",
  "仅限",
  "只在",
  "禁止",
];
const BROAD_SCOPE_MARKERS = [
  "any ",
  "all ",
  "must be used for",
  "always use",
  "for any",
  "任何",
  "全部",
];
const SUMMARY_SPLIT_PATTERNS = [
  " Use when ",
  " This skill should be used when ",
  " Also use when ",
  " Triggers on ",
  " Trigger with ",
  " Use this whenever ",
  " 适合",
  " 用户提到",
  " 当用户",
];

function stripQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed[0] === trimmed.at(-1) && ["'", "\""].includes(trimmed[0])) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseFrontmatter(content) {
  if (!content.startsWith("---\n")) {
    return { data: {}, keys: [], body: content };
  }

  const closing = content.indexOf("\n---", 4);
  if (closing === -1) {
    return { data: {}, keys: [], body: content };
  }

  const rawFrontmatter = content.slice(4, closing).split(/\r?\n/);
  const body = content.slice(closing + 4).replace(/^\n/, "");
  const data = {};
  const keys = [];

  let index = 0;
  while (index < rawFrontmatter.length) {
    const rawLine = rawFrontmatter[index];
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes(":")) {
      index += 1;
      continue;
    }

    const splitIndex = line.indexOf(":");
    const key = line.slice(0, splitIndex).trim();
    let rawValue = line.slice(splitIndex + 1).trim();
    keys.push(key);

    if (["|", ">"].includes(rawValue)) {
      const blockLines = [];
      index += 1;
      while (index < rawFrontmatter.length) {
        const candidate = rawFrontmatter[index];
        if (candidate.startsWith(" ") || candidate.startsWith("\t")) {
          blockLines.push(candidate.trim());
          index += 1;
          continue;
        }
        break;
      }
      data[key] = blockLines.join("\n").trim();
      continue;
    }

    data[key] = stripQuotes(rawValue);
    index += 1;
  }

  return { data, keys, body };
}

function findBrokenLinks(skillDir, body) {
  const broken = new Set();
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of body.matchAll(linkPattern)) {
    const target = match[1].trim();
    if (!target || target.startsWith("#") || /^https?:\/\//.test(target) || target.startsWith("mailto:")) {
      continue;
    }

    const resolved = path.resolve(skillDir, target);
    if (!fs.existsSync(resolved)) {
      broken.add(target);
    }
  }

  return [...broken].sort();
}

function computeQuality(folder, frontmatter, frontmatterKeys, body, brokenLinks) {
  const issues = [];
  let score = 100;
  const name = (frontmatter.name || "").trim();
  const description = (frontmatter.description || "").trim();
  const bodyStripped = body.trim();

  if (!name) {
    score -= 40;
    issues.push("缺少 frontmatter.name");
  }
  if (!description) {
    score -= 40;
    issues.push("缺少 frontmatter.description");
  }
  if (name && name !== folder) {
    score -= 10;
    issues.push(`文件夹名与 frontmatter.name 不一致: ${folder} != ${name}`);
  }

  const extraKeys = frontmatterKeys.filter((key) => !ALLOWED_FRONTMATTER_KEYS.has(key));
  if (extraKeys.length > 0) {
    score -= 5;
    issues.push(`frontmatter 包含额外字段: ${extraKeys.slice(0, 6).join(", ")}`);
  }

  if (!bodyStripped) {
    score -= 30;
    issues.push("正文为空");
  } else {
    const bodyLength = bodyStripped.length;
    if (bodyLength < 120) {
      score -= 25;
      issues.push(`正文过短: ${bodyLength} 字符`);
    } else if (bodyLength < 300) {
      score -= 15;
      issues.push(`正文偏短: ${bodyLength} 字符`);
    } else if (bodyLength < 600) {
      score -= 5;
      issues.push(`正文略短: ${bodyLength} 字符`);
    }

    if (!/^#\s+\S/m.test(bodyStripped)) {
      score -= 10;
      issues.push("缺少一级标题");
    }

    for (const pattern of LOW_QUALITY_PATTERNS) {
      if (pattern.test(bodyStripped) || pattern.test(description)) {
        score -= 20;
        issues.push(`包含占位/未完成标记: ${pattern.source}`);
        break;
      }
    }
  }

  if (description && description.length < 12) {
    score -= 15;
    issues.push(`description 过短: ${description.length} 字符`);
  }

  if (brokenLinks.length > 0) {
    score -= 15;
    issues.push(`存在失效相对链接: ${brokenLinks.slice(0, 4).join(", ")}`);
  }

  return { qualityScore: Math.max(score, 0), issues };
}

function readSkill(skillDir, options = {}) {
  const skillFile = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    return null;
  }

  const content = fs.readFileSync(skillFile, "utf8");
  const plugin = options.plugin || null;
  const { data: frontmatter, keys: frontmatterKeys, body } = parseFrontmatter(content);
  const brokenLinks = findBrokenLinks(skillDir, body);
  const { qualityScore, issues } = computeQuality(path.basename(skillDir), frontmatter, frontmatterKeys, body, brokenLinks);
  const link = plugin
    ? `plugins/${plugin}/skills/${path.basename(skillDir)}/SKILL.md`
    : `skills/${path.basename(skillDir)}/SKILL.md`;
  const id = plugin ? `${plugin}/${path.basename(skillDir)}` : path.basename(skillDir);

  return {
    id,
    plugin,
    folder: path.basename(skillDir),
    skillDir,
    skillFile,
    name: (frontmatter.name || "").trim(),
    description: (frontmatter.description || "").trim(),
    frontmatterKeys,
    body,
    brokenLinks,
    issues,
    qualityScore,
    link,
  };
}

function toSummary(record) {
  return {
    skill: record.id,
    name: record.name,
    path: record.link,
    quality_score: record.qualityScore,
    issues: record.issues,
  };
}

function listPublicDirs(root) {
  if (!fs.existsSync(root)) {
    return [];
  }
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith(".") && name !== ".system")
    .sort();
}

function iterPublicSkills(repoRoot) {
  const records = [];
  const skillsRoot = path.join(repoRoot, "skills");
  for (const name of listPublicDirs(skillsRoot)) {
    const record = readSkill(path.join(skillsRoot, name));
    if (record) {
      records.push(record);
    }
  }

  const pluginsRoot = path.join(repoRoot, "plugins");
  for (const plugin of listPublicDirs(pluginsRoot)) {
    const pluginSkillsRoot = path.join(pluginsRoot, plugin, "skills");
    for (const name of listPublicDirs(pluginSkillsRoot)) {
      const record = readSkill(path.join(pluginSkillsRoot, name), { plugin });
      if (record) {
        records.push(record);
      }
    }
  }
  return records.sort((left, right) => left.id.localeCompare(right.id));
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[`*_"]/g, " ")
    .replace(/[^0-9a-z\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  const tokens = new Set(normalizeText(text).match(/[0-9a-z\u4e00-\u9fff]+/g) || []);
  return new Set([...tokens].filter((token) => !STOP_WORDS.has(token) && token.length > 1));
}

function jaccardSimilarity(left, right) {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }
  const overlap = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return overlap / union;
}

function levenshteinRatio(left, right) {
  if (left === right) {
    return 1;
  }
  if (!left || !right) {
    return 0;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array(right.length + 1).fill(0);
  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous.splice(0, previous.length, ...current);
  }
  const distance = previous[right.length];
  return 1 - distance / Math.max(left.length, right.length);
}

function chooseKeep(left, right) {
  if (left.qualityScore !== right.qualityScore) {
    return left.qualityScore > right.qualityScore ? left : right;
  }
  if (left.description.length !== right.description.length) {
    return left.description.length > right.description.length ? left : right;
  }
  if (left.body.length !== right.body.length) {
    return left.body.length > right.body.length ? left : right;
  }
  return left.folder < right.folder ? left : right;
}

function detectDuplicates(records) {
  const duplicates = [];

  for (let index = 0; index < records.length; index += 1) {
    const left = records[index];
    for (const right of records.slice(index + 1)) {
      const leftPrefix = left.folder.split("-", 1)[0];
      const rightPrefix = right.folder.split("-", 1)[0];
      const leftNameTokens = tokenize(left.folder);
      const rightNameTokens = tokenize(right.folder);
      const leftDescTokens = tokenize(left.description);
      const rightDescTokens = tokenize(right.description);

      const nameRatio = levenshteinRatio(left.folder, right.folder);
      const descRatio = levenshteinRatio(normalizeText(left.description), normalizeText(right.description));
      const nameOverlap = jaccardSimilarity(leftNameTokens, rightNameTokens);
      const descOverlap = jaccardSimilarity(leftDescTokens, rightDescTokens);
      const sharedPrefix = left.folder.startsWith(right.folder) || right.folder.startsWith(left.folder);
      const sameFamily = leftPrefix === rightPrefix;

      if (!(
        ((sameFamily || sharedPrefix || nameOverlap >= 0.6) && descRatio >= 0.45 && descOverlap >= 0.35) ||
        (descRatio >= 0.90 && descOverlap >= 0.50)
      )) {
        continue;
      }

      const keep = chooseKeep(left, right);
      const drop = keep === left ? right : left;
      const confidence = descRatio >= 0.90 || sharedPrefix ? "high" : "medium";
      duplicates.push({
        skills: [left.id, right.id],
        confidence,
        reason: `name_ratio=${nameRatio.toFixed(2)}, desc_ratio=${descRatio.toFixed(2)}, name_overlap=${nameOverlap.toFixed(2)}, desc_overlap=${descOverlap.toFixed(2)}`,
        keep: keep.id,
        drop: drop.id,
      });
    }
  }

  return duplicates;
}

function hasMarker(text, markers) {
  const lowered = text.toLowerCase();
  return markers.some((marker) => lowered.includes(marker));
}

function detectConflicts(records) {
  const conflicts = [];

  for (let index = 0; index < records.length; index += 1) {
    const left = records[index];
    const leftPrefix = left.folder.split("-", 1)[0];
    for (const right of records.slice(index + 1)) {
      if (left.plugin !== right.plugin) {
        continue;
      }

      const rightPrefix = right.folder.split("-", 1)[0];
      if (leftPrefix !== rightPrefix) {
        continue;
      }

      const leftDesc = normalizeText(left.description);
      const rightDesc = normalizeText(right.description);
      if (!(hasMarker(leftDesc, EXCLUSIVE_MARKERS) || hasMarker(rightDesc, EXCLUSIVE_MARKERS))) {
        continue;
      }
      if (!(
        hasMarker(leftDesc, BROAD_SCOPE_MARKERS) ||
        hasMarker(rightDesc, BROAD_SCOPE_MARKERS) ||
        (hasMarker(leftDesc, EXCLUSIVE_MARKERS) && hasMarker(rightDesc, EXCLUSIVE_MARKERS))
      )) {
        continue;
      }

      const keep = chooseKeep(left, right);
      conflicts.push({
        skills: [left.id, right.id],
        family: leftPrefix,
        reason: "同一技能家族存在强约束/排他触发语，容易让调度结果互相覆盖",
        keep: keep.id,
        drop: keep === left ? right.id : left.id,
      });
    }
  }

  return conflicts;
}

function buildReport(repoRoot) {
  const records = iterPublicSkills(repoRoot);
  const criticalIssuePrefixes = ["缺少 frontmatter.", "正文为空"];
  const lowQuality = records
    .filter((record) => (
      record.qualityScore <= 70 ||
      record.issues.some((issue) => criticalIssuePrefixes.some((prefix) => issue.startsWith(prefix)))
    ))
    .map(toSummary);
  const duplicates = detectDuplicates(records);
  const conflicts = detectConflicts(records);
  const recommendedDeletions = [];
  const seenRecommendations = new Set();

  for (const item of lowQuality) {
    if (item.quality_score <= 55) {
      recommendedDeletions.push({
        skill: item.skill,
        reason: "质量分过低，且存在明显结构性问题",
        confidence: "medium",
      });
      seenRecommendations.add(item.skill);
    }
  }

  for (const duplicate of duplicates) {
    if (duplicate.confidence === "high" && !seenRecommendations.has(duplicate.drop)) {
      recommendedDeletions.push({
        skill: duplicate.drop,
        reason: `高相似度重复，建议保留 ${duplicate.keep}`,
        confidence: "high",
      });
      seenRecommendations.add(duplicate.drop);
    }
  }

  return {
    repo_root: repoRoot,
    skill_count: records.length,
    low_quality_candidates: lowQuality,
    duplicate_candidates: duplicates,
    conflict_candidates: conflicts,
    recommended_deletions: recommendedDeletions,
  };
}

function renderTextReport(report) {
  const lines = [
    `skills 总数: ${report.skill_count}`,
    `低质量候选: ${report.low_quality_candidates.length}`,
    `重复候选: ${report.duplicate_candidates.length}`,
    `冲突候选: ${report.conflict_candidates.length}`,
    "",
  ];
  const sections = [
    ["建议删除:", report.recommended_deletions, (item) => `- ${item.skill}: ${item.reason} (${item.confidence})`],
    ["低质量候选:", report.low_quality_candidates.slice(0, 20), (item) => `- ${item.skill} [${item.quality_score}]: ${item.issues.join("; ")}`],
    ["重复候选:", report.duplicate_candidates.slice(0, 20), (item) => `- ${item.skills.join(" / ")}: keep=${item.keep} drop=${item.drop} (${item.reason})`],
    ["冲突候选:", report.conflict_candidates.slice(0, 20), (item) => `- ${item.skills.join(" / ")}: keep=${item.keep} drop=${item.drop} (${item.reason})`],
  ];
  for (const [title, items, render] of sections) {
    if (items.length > 0) {
      lines.push(title, ...items.map(render), "");
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function parseExistingSummaries(readmeText) {
  const summaries = {};
  let inside = false;

  for (const line of readmeText.split(/\r?\n/)) {
    if (line.startsWith(README_SECTION_START)) {
      inside = true;
      continue;
    }
    if (inside && line.startsWith(README_SECTION_END)) {
      break;
    }
    if (!inside || !line.startsWith("| [")) {
      continue;
    }

    const match = line.trim().match(/^\| \[([^\]]+)\]\([^)]+\) \| (.+) \|$/);
    if (match) {
      summaries[match[1]] = match[2].trim();
    }
  }

  return summaries;
}

function condenseDescription(description) {
  let summary = description.split(/\s+/).join(" ");
  for (const marker of SUMMARY_SPLIT_PATTERNS) {
    if (summary.includes(marker)) {
      summary = summary.split(marker, 1)[0].trim();
    }
  }
  summary = summary.replace(/[，,;；。.]+$/g, "");
  if (summary.length > 80) {
    summary = `${summary.slice(0, 77).trimEnd()}...`;
  }
  return summary || "待补充说明。";
}

function buildSkillTable(records, existingSummaries) {
  const lines = [
    README_SECTION_START,
    "",
    "以下清单按仓库中实际存在的公共 `skills/*/SKILL.md` 整理，不包含 `.system` 内置 skill。名称可直接跳转到对应说明文件。",
    "",
    `### 公共 Skills（${records.length}）`,
    "",
    "| 名称 | 作用简介 |",
    "|------|----------|",
  ];

  for (const record of records) {
    let summary = existingSummaries[record.folder];
    let generated = false;
    if ([undefined, "", "|。", "\\|。", "\\\\|。"].includes(summary)) {
      summary = condenseDescription(record.description);
      generated = true;
    }
    if (generated) {
      summary = summary.replaceAll("|", "\\|");
    }
    lines.push(summary.endsWith("。")
      ? `| [${record.folder}](${record.link}) | ${summary} |`
      : `| [${record.folder}](${record.link}) | ${summary}。 |`);
  }

  return `${lines.join("\n")}\n`;
}

function syncReadme(repoRoot, write, check) {
  const readmePath = path.join(repoRoot, "README.md");
  const existingText = fs.readFileSync(readmePath, "utf8");
  const records = iterPublicSkills(repoRoot);
  const summaries = parseExistingSummaries(existingText);
  const skillSection = buildSkillTable(records, summaries);
  const start = existingText.indexOf(README_SECTION_START);
  const end = existingText.indexOf(README_SECTION_END);

  if (start === -1 || end === -1 || end <= start) {
    if (records.some((record) => record.plugin)) {
      console.log("README Skill 清单不存在；插件仓库请使用 scripts/sync-plugin-metadata.mjs");
      return 0;
    }
    throw new Error("README.md 中未找到可替换的 Skill 清单区块");
  }

  const newText = `${existingText.slice(0, start)}${skillSection}\n${existingText.slice(end)}`;
  const isCurrent = newText === existingText;

  if (check) {
    if (isCurrent) { console.log("README Skill 清单已是最新状态"); return 0; }
    console.log("README Skill 清单不是最新状态");
    return 1;
  }

  if (write) {
    fs.writeFileSync(readmePath, newText, "utf8");
    console.log(`已更新 README.md，公共 Skills 数量: ${records.length}`);
    return 0;
  }

  process.stdout.write(skillSection);
  return 0;
}

function removeDirRecursive(target) {
  fs.rmSync(target, { recursive: true, force: false });
}

function resolveSkillTarget(repoRoot, skill) {
  const records = iterPublicSkills(repoRoot);
  const clean = skill.replaceAll("\\", "/");
  const normalized = clean
    .replace(/^plugins\//, "")
    .replace(/\/SKILL\.md$/, "")
    .replace(/\/skills\//, "/");
  const matches = records.filter((record) => (
    record.id === normalized ||
    record.folder === normalized ||
    record.link.replace(/\/SKILL\.md$/, "") === clean
  ));

  if (matches.length === 0) {
    throw new Error(`未找到 skill: ${skill}`);
  }
  if (matches.length > 1) {
    throw new Error(`skill 名称不唯一，请使用 plugin/skill: ${skill}`);
  }
  return matches[0];
}

function pruneSkills(repoRoot, skills, yes) {
  if (!yes) {
    console.log("删除前必须显式传入 --yes");
    return 2;
  }

  const deleted = [];
  for (const skill of skills) {
    const record = resolveSkillTarget(repoRoot, skill);
    if (path.basename(record.skillDir).startsWith(".") || path.basename(record.skillDir) === ".system") {
      throw new Error(`拒绝删除内置或隐藏技能: ${path.basename(record.skillDir)}`);
    }
    removeDirRecursive(record.skillDir);
    deleted.push(record.id);
  }

  console.log(`已删除 skills: ${deleted.sort().join(", ")}`);
  return 0;
}

function printHelp() {
  console.log(`Usage:
  node scripts/curate_skills.mjs audit [--repo-root <path>] [--format text|json]
  node scripts/curate_skills.mjs prune --skills <skill...> [--repo-root <path>] --yes
  node scripts/curate_skills.mjs sync-readme [--repo-root <path>] [--write|--check]`);
}

function parseArgs(argv) {
  const command = argv.shift();
  if (!command || ["--help", "-h"].includes(command)) {
    return { help: true };
  }

  const args = { command, repoRoot: process.cwd(), format: "text", skills: [], yes: false, write: false, check: false };
  while (argv.length > 0) {
    const arg = argv.shift();
    if (arg === "--repo-root") args.repoRoot = path.resolve(argv.shift() || "");
    else if (arg === "--format") args.format = argv.shift() || "text";
    else if (arg === "--skills") {
      while (argv.length > 0 && !argv[0].startsWith("--")) {
        args.skills.push(argv.shift());
      }
    } else if (arg === "--yes") args.yes = true;
    else if (arg === "--write") args.write = true;
    else if (arg === "--check") args.check = true;
    else throw new Error(`未知参数: ${arg}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); return 0; }

  const repoRoot = path.resolve(args.repoRoot);
  if (args.write && args.check) {
    throw new Error("--write 与 --check 不能同时使用");
  }

  if (args.command === "audit") {
    if (!["text", "json"].includes(args.format)) {
      throw new Error("--format 必须是 text 或 json");
    }
    const report = buildReport(repoRoot);
    if (args.format === "json") console.log(JSON.stringify(report, null, 2));
    else process.stdout.write(renderTextReport(report));
    return 0;
  }

  if (args.command === "prune") {
    if (args.skills.length === 0) throw new Error("prune 需要 --skills");
    return pruneSkills(repoRoot, args.skills, args.yes);
  }

  if (args.command === "sync-readme") {
    return syncReadme(repoRoot, args.write, args.check);
  }

  throw new Error(`未知命令: ${args.command}`);
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
