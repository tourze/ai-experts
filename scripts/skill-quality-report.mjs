#!/usr/bin/env node
/**
 * Repository-level Skill quality report.
 *
 * This script intentionally uses only local filesystem evidence. It aggregates
 * SKILL.md structure, description hygiene, trigger eval coverage, and trigger
 * domain overlap so skill governance has one stable entry point.
 *
 * Usage:
 *   node scripts/skill-quality-report.mjs
 *   node scripts/skill-quality-report.mjs --json
 *   node scripts/skill-quality-report.mjs --plugin skill-expert --top 20
 *   node scripts/skill-quality-report.mjs --repo-root /path/to/repo
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";

function parseArgs(argv) {
  const args = {
    json: false,
    plugin: null,
    repoRoot: resolve("."),
    top: 20,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      args.json = true;
      continue;
    }
    if (arg === "--plugin") {
      args.plugin = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--repo-root") {
      args.repoRoot = resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (arg === "--top") {
      args.top = Number.parseInt(argv[index + 1] ?? "", 10);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (args.plugin !== null && args.plugin.trim() === "") {
    throw new Error("--plugin must be a non-empty plugin name");
  }
  if (!Number.isFinite(args.top) || args.top <= 0) {
    throw new Error("--top must be a positive integer");
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

function formatPath(repoRoot, path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

function isInsidePath(path, root) {
  const rel = relative(root, path);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return null;
  }

  const end = markdown.indexOf("\n---\n", 4);
  if (end < 0) {
    return null;
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
    if (rawValue === "|" || rawValue === "|-" || rawValue === ">" || rawValue === ">-") {
      const buffer = [];
      index += 1;
      while (index < lines.length && (/^\s/.test(lines[index]) || lines[index] === "")) {
        buffer.push(lines[index].replace(/^\s{2}/, ""));
        index += 1;
      }
      index -= 1;
      data[key] = buffer.join("\n").trim();
      continue;
    }

    data[key] = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1").trim();
  }
  return data;
}

function parseEvalCases(filePath) {
  if (!existsSync(filePath)) {
    return { exists: false, total: 0, positive: 0, negative: 0 };
  }

  const text = readFileSync(filePath, "utf-8");
  const matches = [...text.matchAll(/trigger_expected:\s*(true|false)/g)];
  return {
    exists: true,
    total: matches.length,
    positive: matches.filter((match) => match[1] === "true").length,
    negative: matches.filter((match) => match[1] === "false").length,
  };
}

function extractRelativeLinks(markdown) {
  return [...markdown.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)]
    .map((match) => match[1])
    .filter((href) => !href.startsWith("#") && !/^[a-z][a-z0-9+.-]*:/i.test(href))
    .map((href) => href.split("#")[0])
    .filter((href) => !href.startsWith("type=") && href !== "...")
    .filter((href) => href.includes("/") || href.includes("."))
    .filter(Boolean);
}

const CSO_VIOLATIONS = {
  workflow_leak: { severity: "critical" },
  output_leak: { severity: "critical" },
  missing_trigger: { severity: "high" },
  tool_leak: { severity: "medium" },
  too_long: { severity: "medium" },
  too_short: { severity: "low" },
  missing_desc: { severity: "critical" },
};

const CSO_PATTERNS = [
  [/(?<!触发词)(?<!英文触发词)(?<!自)(?:覆盖(?!率)|包括|包含)(?!.*触发词)/u, "workflow_leak", "列举了覆盖范围"],
  [/按.*(?:步|阶段|流程|维度).*推进/u, "workflow_leak", "描述了执行步骤"],
  [/输出.*(?:评分|清单|文档|报告|蓝图|画像|摘要)/u, "output_leak", "包含输出产物"],
  [/(?<!若)重点(?:输出|覆盖)/u, "output_leak", "描述了重点输出"],
  [/强调.*(?:先|再|然后)/u, "workflow_leak", "描述了工作流顺序"],
  [/(?:106)\s*(?:条|个)/u, "workflow_leak", "泄露了具体数量"],
];

const TRIGGER_RE = /(当.*时(?:候)?使用|在.*时(?:候)?使用|Use when|适用于|用于)/iu;

function auditDescription(description) {
  if (!description) {
    return [{ type: "missing_desc", detail: "no description field" }];
  }

  const hits = [];
  const seenTypes = new Set();

  if (description.length > 200) {
    hits.push({ type: "too_long", detail: `len=${description.length}` });
    seenTypes.add("too_long");
  }
  if (description.length < 20) {
    hits.push({ type: "too_short", detail: `len=${description.length}` });
    seenTypes.add("too_short");
  }
  if (!TRIGGER_RE.test(description)) {
    hits.push({ type: "missing_trigger", detail: "缺少触发条件句式" });
    seenTypes.add("missing_trigger");
  }

  for (const [pattern, type, detail] of CSO_PATTERNS) {
    if (!seenTypes.has(type) && pattern.test(description)) {
      hits.push({ type, detail });
      seenTypes.add(type);
    }
  }

  return hits;
}

const STOP_TERMS = new Set([
  "使用",
  "用户",
  "需要",
  "适合",
  "触发",
  "提到",
  "时使用",
  "时触发",
  "要用",
  "要在",
  "要为",
  "当用户",
  "英文触发词",
  "description",
  "skill",
  "skills",
  "plugin",
  "expert",
  "when",
  "use",
  "uses",
  "using",
  "or",
  "to",
  "want",
  "wants",
  "need",
  "needs",
  "with",
  "and",
  "for",
  "the",
  "this",
  "that",
  "代码",
  "项目",
  "实现",
  "开发",
  "设计",
  "审查",
  "分析",
]);

function normalizeTerm(term) {
  return term
    .replace(/^[`"'“”‘’\s]+|[`"'“”‘’\s]+$/g, "")
    .replace(/^(当用户|用户|需要|适合|英文触发词|触发词|包括|涉及|在需要|当需要)/, "")
    .trim()
    .toLowerCase();
}

function extractTriggerTerms(description) {
  const terms = new Set();
  const normalized = description.replace(/[，。；;、/()（）[\]【】,:：|]/g, " ");

  for (const match of normalized.matchAll(/[A-Za-z][A-Za-z0-9_.+#-]{1,}/g)) {
    const term = normalizeTerm(match[0]);
    if (term.length >= 2 && !STOP_TERMS.has(term)) {
      terms.add(term);
    }
  }

  for (const chunk of normalized.split(/\s+/)) {
    const term = normalizeTerm(chunk);
    if (!/[\u4e00-\u9fff]/.test(term)) {
      continue;
    }
    if (term.length < 2 || term.length > 18 || STOP_TERMS.has(term)) {
      continue;
    }
    terms.add(term);
  }

  return [...terms].sort();
}

function collectSkills(repoRoot, pluginFilter) {
  const pluginsRoot = join(repoRoot, "plugins");
  const pluginNames = listDirectories(pluginsRoot).filter((pluginName) =>
    isDirectory(join(pluginsRoot, pluginName, "skills")),
  );

  if (pluginFilter && !pluginNames.includes(pluginFilter)) {
    throw new Error(`Unknown plugin with skills: ${pluginFilter}`);
  }

  const selectedPlugins = pluginFilter ? [pluginFilter] : pluginNames;
  const skills = [];

  for (const pluginName of selectedPlugins) {
    const skillsRoot = join(pluginsRoot, pluginName, "skills");
    for (const skillPath of listSkillFiles(skillsRoot)) {
      const skillDir = dirname(skillPath);
      const relativeSkillDir = relative(skillsRoot, skillDir).replaceAll("\\", "/");
      const text = readFileSync(skillPath, "utf-8");
      const frontmatter = parseFrontmatter(text);
      const name = String(frontmatter?.name ?? basename(skillDir));
      const description = String(frontmatter?.description ?? "");
      const evals = parseEvalCases(join(skillDir, "evals", "cases.yaml"));
      skills.push({
        plugin: pluginName,
        relativeSkillDir,
        id: `${pluginName}/${relativeSkillDir}`,
        path: formatPath(repoRoot, skillPath),
        dir: formatPath(repoRoot, skillDir),
        absolutePath: skillPath,
        absoluteDir: skillDir,
        frontmatter,
        name,
        description,
        lineCount: text.split("\n").length,
        evals,
        csoViolations: auditDescription(description),
        links: extractRelativeLinks(text),
        terms: extractTriggerTerms(description),
        resources: {
          references: isDirectory(join(skillDir, "references")),
          scripts: isDirectory(join(skillDir, "scripts")),
          assets: isDirectory(join(skillDir, "assets")),
        },
      });
    }
  }

  return { pluginNames: selectedPlugins, skills };
}

function collectStaticAudit(repoRoot, skills) {
  const brokenLinks = [];
  const absoluteRepoRoot = resolve(repoRoot);

  for (const skill of skills) {
    for (const href of skill.links) {
      const target = resolve(skill.absoluteDir, href);
      if (!isInsidePath(target, absoluteRepoRoot)) {
        brokenLinks.push({ skill: skill.id, path: skill.path, href, reason: "path escapes repository" });
        continue;
      }
      if (!existsSync(target)) {
        brokenLinks.push({ skill: skill.id, path: skill.path, href, reason: "target does not exist" });
      }
    }
  }

  return {
    missingFrontmatter: skills.filter((skill) => !skill.frontmatter).map((skill) => skill.id),
    missingName: skills.filter((skill) => !skill.frontmatter?.name).map((skill) => skill.id),
    missingDescription: skills.filter((skill) => !skill.description).map((skill) => skill.id),
    descriptionOver1024: skills
      .filter((skill) => skill.description.length > 1024)
      .map((skill) => ({ skill: skill.id, length: skill.description.length })),
    over500Lines: skills
      .filter((skill) => skill.lineCount > 500)
      .map((skill) => ({ skill: skill.id, lines: skill.lineCount })),
    brokenLinks,
    resources: {
      withReferences: skills.filter((skill) => skill.resources.references).length,
      withScripts: skills.filter((skill) => skill.resources.scripts).length,
      withAssets: skills.filter((skill) => skill.resources.assets).length,
    },
  };
}

function collectCsoAudit(skills) {
  const breakdown = Object.fromEntries(Object.keys(CSO_VIOLATIONS).map((key) => [key, 0]));
  const violations = [];

  for (const skill of skills) {
    const hits = skill.csoViolations;
    if (hits.length === 0) {
      continue;
    }
    for (const hit of hits) {
      breakdown[hit.type] += 1;
    }
    violations.push({
      skill: skill.id,
      path: skill.path,
      description: skill.description,
      violations: hits,
    });
  }

  return {
    passCount: skills.length - violations.length,
    violationCount: violations.length,
    breakdown,
    violations,
  };
}

function collectEvalAudit(skills) {
  const withEvals = skills.filter((skill) => skill.evals.exists);
  return {
    withEvals: withEvals.length,
    withoutEvals: skills.filter((skill) => !skill.evals.exists).map((skill) => skill.id),
    emptyEvals: withEvals.filter((skill) => skill.evals.total === 0).map((skill) => skill.id),
    withoutNegative: withEvals.filter((skill) => skill.evals.negative === 0).map((skill) => skill.id),
    withNegative: withEvals.filter((skill) => skill.evals.negative > 0).length,
    evalCaseTotals: {
      total: skills.reduce((sum, skill) => sum + skill.evals.total, 0),
      positive: skills.reduce((sum, skill) => sum + skill.evals.positive, 0),
      negative: skills.reduce((sum, skill) => sum + skill.evals.negative, 0),
    },
  };
}

function findSkillConflicts(skills, top) {
  const byPlugin = new Map();
  for (const skill of skills) {
    if (!byPlugin.has(skill.plugin)) {
      byPlugin.set(skill.plugin, []);
    }
    byPlugin.get(skill.plugin).push(skill);
  }

  const conflicts = [];
  for (const group of byPlugin.values()) {
    for (let leftIndex = 0; leftIndex < group.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < group.length; rightIndex += 1) {
        const left = group[leftIndex];
        const right = group[rightIndex];
        const rightTerms = new Set(right.terms);
        const shared = left.terms.filter((term) => rightTerms.has(term));
        if (shared.length < 3) {
          continue;
        }
        conflicts.push({
          left: left.id,
          right: right.id,
          shared,
          score: shared.length,
        });
      }
    }
  }

  return conflicts
    .sort((left, right) => right.score - left.score || left.left.localeCompare(right.left))
    .slice(0, top);
}

function collectTriggerAudit(skills, top) {
  return {
    thinDescriptions: skills.filter((skill) => skill.terms.length < 3).map((skill) => skill.id),
    conflicts: findSkillConflicts(skills, top),
  };
}

function scoreRatio(numerator, denominator, points) {
  if (denominator === 0) {
    return points;
  }
  return (numerator / denominator) * points;
}

function collectScores(skills, staticAudit, csoAudit, evalAudit, triggerAudit) {
  const total = skills.length;
  const staticPenalty = Math.min(
    25,
    staticAudit.missingFrontmatter.length * 5 +
      staticAudit.missingName.length * 3 +
      staticAudit.missingDescription.length * 5 +
      staticAudit.descriptionOver1024.length * 2 +
      staticAudit.brokenLinks.length * 2 +
      staticAudit.over500Lines.length,
  );
  const staticQuality = 25 - staticPenalty;
  const triggerQuality =
    scoreRatio(evalAudit.withEvals, total, 15) +
    scoreRatio(evalAudit.withNegative, evalAudit.withEvals, 5) +
    scoreRatio(csoAudit.passCount, total, 5) +
    Math.max(0, 5 - Math.min(5, triggerAudit.conflicts.length + triggerAudit.thinDescriptions.length * 0.25));
  const maintainability = Math.max(0, 5 - Math.min(5, staticAudit.over500Lines.length + staticAudit.brokenLinks.length * 0.5));
  const availablePoints = 60;
  const earnedPoints = staticQuality + triggerQuality + maintainability;

  return {
    availablePoints,
    earnedPoints: Number(earnedPoints.toFixed(1)),
    automatedScore: Number(((earnedPoints / availablePoints) * 100).toFixed(1)),
    dimensions: {
      staticQuality: Number(staticQuality.toFixed(1)),
      triggerQuality: Number(triggerQuality.toFixed(1)),
      maintainability: Number(maintainability.toFixed(1)),
    },
    unscoredDimensions: [
      "effectQuality: requires with-skill vs baseline task runs",
      "runtimeTelemetry: depends on installed hook telemetry for real sessions",
    ],
  };
}

function countCsoBySeverity(csoAudit, severity) {
  return csoAudit.violations.filter((item) =>
    item.violations.some((violation) => CSO_VIOLATIONS[violation.type]?.severity === severity),
  ).length;
}

function buildRecommendations(skills, staticAudit, csoAudit, evalAudit, triggerAudit) {
  const recommendations = [];

  if (
    staticAudit.missingFrontmatter.length > 0 ||
    staticAudit.missingName.length > 0 ||
    staticAudit.missingDescription.length > 0 ||
    staticAudit.brokenLinks.length > 0
  ) {
    recommendations.push("P0: 修复缺失 frontmatter/name/description 或失效相对链接；这些会直接破坏 skill 加载与引用。");
  }
  if (evalAudit.withoutEvals.length > 0) {
    recommendations.push(
      `P0: 为缺 evals/cases.yaml 的 ${evalAudit.withoutEvals.length}/${skills.length} 个 skill 补至少 2 个正例和 1 个反例。`,
    );
  }
  if (evalAudit.emptyEvals.length > 0) {
    recommendations.push(`P1: ${evalAudit.emptyEvals.length} 个 evals/cases.yaml 没有 trigger_expected 用例，需补成可统计格式。`);
  }
  if (evalAudit.withoutNegative.length > 0) {
    recommendations.push(`P1: ${evalAudit.withoutNegative.length} 个已有 eval 的 skill 缺少反例，无法防误触发回归。`);
  }
  const criticalCso = countCsoBySeverity(csoAudit, "critical");
  if (criticalCso > 0) {
    recommendations.push(`P1: 修复 ${criticalCso} 个 critical description 问题，优先处理 workflow/output 泄露。`);
  }
  if (triggerAudit.conflicts.length > 0) {
    recommendations.push(`P2: 复核 ${triggerAudit.conflicts.length} 组同插件触发词重叠，优先用 description 排他条件降低抢触发。`);
  }
  if (staticAudit.over500Lines.length > 0) {
    recommendations.push(`P2: ${staticAudit.over500Lines.length} 个 SKILL.md 超 500 行，拆分到 references/ 以保持渐进加载。`);
  }
  recommendations.push("P2: 对低分 skill 追加 with-skill vs baseline 效果评测；本报告暂不声称真实任务效果分。");

  return recommendations;
}

function buildReport(args) {
  const { pluginNames, skills } = collectSkills(args.repoRoot, args.plugin);
  const staticAudit = collectStaticAudit(args.repoRoot, skills);
  const csoAudit = collectCsoAudit(skills);
  const evalAudit = collectEvalAudit(skills);
  const triggerAudit = collectTriggerAudit(skills, args.top);
  const scores = collectScores(skills, staticAudit, csoAudit, evalAudit, triggerAudit);

  return {
    scope: {
      repoRoot: args.repoRoot,
      plugin: args.plugin,
      plugins: pluginNames.length,
    },
    summary: {
      skills: skills.length,
      automatedScore: scores.automatedScore,
      evalCoverage: skills.length ? Number(((evalAudit.withEvals / skills.length) * 100).toFixed(1)) : 100,
      csoPassRate: skills.length ? Number(((csoAudit.passCount / skills.length) * 100).toFixed(1)) : 100,
    },
    scores,
    static: staticAudit,
    cso: csoAudit,
    evals: evalAudit,
    trigger: triggerAudit,
    recommendations: buildRecommendations(skills, staticAudit, csoAudit, evalAudit, triggerAudit),
  };
}

function printHumanReport(report) {
  console.log("# Skill Quality Report");
  console.log("");
  console.log(`Scope: ${report.scope.plugin ?? "all plugins"} (${report.scope.plugins} plugin(s))`);
  console.log(`Skills: ${report.summary.skills}`);
  console.log(`Automated score: ${report.summary.automatedScore}/100 (${report.scores.earnedPoints}/${report.scores.availablePoints} measured points)`);
  console.log(`Eval coverage: ${report.evals.withEvals}/${report.summary.skills} (${report.summary.evalCoverage}%)`);
  console.log(`CSO pass rate: ${report.cso.passCount}/${report.summary.skills} (${report.summary.csoPassRate}%)`);
  console.log("");
  console.log("## Key Counts");
  console.log(`- Missing evals: ${report.evals.withoutEvals.length}`);
  console.log(`- Evals without negative cases: ${report.evals.withoutNegative.length}`);
  console.log(`- Empty eval files: ${report.evals.emptyEvals.length}`);
  console.log(`- CSO violations: ${report.cso.violationCount}`);
  console.log(`- Broken relative links: ${report.static.brokenLinks.length}`);
  console.log(`- Trigger conflicts shown: ${report.trigger.conflicts.length}`);
  console.log("");
  console.log("## Recommendations");
  for (const recommendation of report.recommendations) {
    console.log(`- ${recommendation}`);
  }
}

function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildReport(args);
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  printHumanReport(report);
}

run();
