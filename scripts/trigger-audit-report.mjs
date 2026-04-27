#!/usr/bin/env node
/**
 * Hooks / Skills 触发审计报告。
 *
 * 覆盖两类信号：
 *   1. Hook 运行时遥测：默认读取当前工作区的 hook-telemetry/workspaces/<hash>-<name>/decisions.jsonl*
 *   2. Skill 触发可回归性：统计 SKILL.md description 与 evals/cases.yaml 覆盖
 *
 * 注意：Claude Code / Codex 的原生 skill 激活不是插件内 hook 事件，无法像 hook
 * 一样拿到权威 runtime decision。本报告把 skill 侧拆成可审计的替代指标：
 * description 覆盖、正/负触发样例、同插件触发域重叠。
 *
 * 用法：
 *   node scripts/trigger-audit-report.mjs
 *   node scripts/trigger-audit-report.mjs --plugin react-expert
 *   node scripts/trigger-audit-report.mjs --days 30 --top 20
 *   node scripts/trigger-audit-report.mjs --all-workspaces
 *   node scripts/trigger-audit-report.mjs --session latest
 *   node scripts/trigger-audit-report.mjs --json
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(".");
const pluginsRoot = resolve(repoRoot, "plugins");
const TELEMETRY_ROOT = process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR ||
  resolve(homedir(), ".claude", "hook-telemetry");
const EXPLICIT_TELEMETRY_FILE = process.env.AI_EXPERTS_HOOK_TELEMETRY_FILE || null;

function parseArgs(argv) {
  const args = {
    allWorkspaces: false,
    days: 7,
    json: false,
    plugin: null,
    session: null,
    top: 12,
    telemetryFile: EXPLICIT_TELEMETRY_FILE,
    workspace: process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE || process.cwd(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--all-workspaces") {
      args.allWorkspaces = true;
      continue;
    }
    if (arg === "--json") {
      args.json = true;
      continue;
    }
    if (arg === "--days") {
      args.days = Number.parseInt(argv[index + 1] ?? "", 10);
      index += 1;
      continue;
    }
    if (arg === "--plugin") {
      args.plugin = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--session") {
      args.session = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg === "--top") {
      args.top = Number.parseInt(argv[index + 1] ?? "", 10);
      index += 1;
      continue;
    }
    if (arg === "--telemetry-file") {
      args.telemetryFile = resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    if (arg === "--workspace") {
      args.workspace = resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(args.days) || args.days <= 0) {
    throw new Error("--days must be a positive integer");
  }
  if (!Number.isFinite(args.top) || args.top <= 0) {
    throw new Error("--top must be a positive integer");
  }
  if (args.session !== null && args.session.trim() === "") {
    throw new Error("--session must be a non-empty session id, transcript path, or latest");
  }
  return args;
}

function workspaceBucketDir(workspacePath) {
  const resolved = resolve(workspacePath);
  const hash = createHash("sha256").update(resolved).digest("hex").slice(0, 12);
  const rawName = basename(resolved) || "workspace";
  const slug = rawName.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 48) || "workspace";
  return join(TELEMETRY_ROOT, "workspaces", `${hash}-${slug}`);
}

function telemetryFilesInDir(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return [];
  }
  return readdirSync(dir)
    .filter((name) => /^decisions\.jsonl(?:\.\d+)?$/.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((name) => join(dir, name));
}

function allWorkspaceTelemetryFiles() {
  const workspacesRoot = join(TELEMETRY_ROOT, "workspaces");
  if (!existsSync(workspacesRoot) || !statSync(workspacesRoot).isDirectory()) {
    return [];
  }
  return readdirSync(workspacesRoot)
    .map((name) => join(workspacesRoot, name))
    .filter((dir) => existsSync(dir) && statSync(dir).isDirectory())
    .flatMap((dir) => telemetryFilesInDir(dir));
}

function telemetrySources(args) {
  if (args.telemetryFile) {
    return {
      description: args.telemetryFile,
      files: existsSync(args.telemetryFile) ? [args.telemetryFile] : [],
    };
  }

  if (args.allWorkspaces) {
    return {
      description: `${join(TELEMETRY_ROOT, "workspaces", "*/decisions.jsonl*")}`,
      files: allWorkspaceTelemetryFiles(),
    };
  }

  const dir = workspaceBucketDir(args.workspace);
  return {
    description: `${dir}/decisions.jsonl*`,
    files: telemetryFilesInDir(dir),
  };
}

function listTrackedFiles() {
  return execFileSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf-8",
  })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf-8"));
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

function listPlugins(trackedFiles, pluginFilter) {
  const plugins = [...new Set(
    trackedFiles
      .filter((file) => file.startsWith("plugins/") && file.split("/").length >= 3)
      .map((file) => file.split("/")[1]),
  )].sort();

  if (!pluginFilter) return plugins;
  if (!plugins.includes(pluginFilter)) {
    throw new Error(`Unknown plugin: ${pluginFilter}`);
  }
  return [pluginFilter];
}

function collectHookModules(trackedFiles, pluginName) {
  const prefix = `plugins/${pluginName}/hooks/`;
  return trackedFiles
    .filter((file) => file.startsWith(prefix) && file.endsWith(".mjs"))
    .filter((file) => basename(file) !== "dispatch.mjs" && !basename(file).startsWith("_"))
    .filter((file) => !file.slice(prefix.length).split("/").some((part) => part.startsWith("_")))
    .map((file) => ({
      path: file,
      subdir: dirname(file.slice(prefix.length)),
      hook: basename(file),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function collectHookAudit(trackedFiles, pluginNames) {
  // 根 dispatcher 自动扫描每个 plugin 的 hooks/<event>/*.mjs，无需逐插件
  // 维护 dispatch.mjs 或 hooks.json。本函数只做模块清点，留给后续指标使用。
  const plugins = [];
  let hookModules = 0;
  for (const pluginName of pluginNames) {
    const modules = collectHookModules(trackedFiles, pluginName);
    hookModules += modules.length;
    plugins.push({ plugin: pluginName, modules: modules.length });
  }
  return { hookModules, plugins };
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
  "原生模块或",
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

function collectSkillAudit(trackedFiles, pluginNames, top) {
  const skillFiles = trackedFiles
    .filter((file) => file.startsWith("plugins/") && file.includes("/skills/") && file.endsWith("/SKILL.md"))
    .filter((file) => pluginNames.includes(file.split("/")[1]))
    .sort();

  const skills = skillFiles.map((file) => {
    const text = readFileSync(resolve(repoRoot, file), "utf-8");
    const frontmatter = parseFrontmatter(text);
    const evals = parseEvalCases(resolve(repoRoot, dirname(file), "evals", "cases.yaml"));
    const description = String(frontmatter.description ?? "");
    return {
      plugin: file.split("/")[1],
      name: frontmatter.name || basename(dirname(file)),
      path: file,
      description,
      evals,
      terms: extractTriggerTerms(description),
    };
  });

  const withoutEvals = skills.filter((skill) => !skill.evals.exists);
  const withoutNegative = skills.filter((skill) => skill.evals.exists && skill.evals.negative === 0);
  const thinDescriptions = skills.filter((skill) => skill.terms.length < 3);
  const conflicts = findSkillConflicts(skills)
    .slice(0, top)
    .map((item) => ({
      ...item,
      left: `${item.left.plugin}/${item.left.name}`,
      right: `${item.right.plugin}/${item.right.name}`,
    }));

  return {
    total: skills.length,
    withEvals: skills.length - withoutEvals.length,
    withoutEvals: withoutEvals.map((skill) => `${skill.plugin}/${skill.name}`),
    withoutNegative: withoutNegative.map((skill) => `${skill.plugin}/${skill.name}`),
    thinDescriptions: thinDescriptions.map((skill) => `${skill.plugin}/${skill.name}`),
    evalCaseTotals: {
      total: skills.reduce((sum, skill) => sum + skill.evals.total, 0),
      positive: skills.reduce((sum, skill) => sum + skill.evals.positive, 0),
      negative: skills.reduce((sum, skill) => sum + skill.evals.negative, 0),
    },
    conflicts,
  };
}

function findSkillConflicts(skills) {
  const conflicts = [];
  const byPlugin = new Map();
  for (const skill of skills) {
    if (!byPlugin.has(skill.plugin)) {
      byPlugin.set(skill.plugin, []);
    }
    byPlugin.get(skill.plugin).push(skill);
  }

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
          left,
          right,
          shared,
          score: shared.length,
        });
      }
    }
  }

  return conflicts.sort((a, b) => b.score - a.score || a.left.name.localeCompare(b.left.name));
}

function sessionKey(entry) {
  return entry.session_id || entry.transcript_path || null;
}

function applySessionFilter(entries, session) {
  if (!session) {
    return { entries, label: null };
  }

  if (session === "latest") {
    const latest = [...entries]
      .filter((entry) => sessionKey(entry))
      .sort((left, right) => (right.ts ?? 0) - (left.ts ?? 0))[0];
    const key = latest ? sessionKey(latest) : null;
    return {
      entries: key ? entries.filter((entry) => sessionKey(entry) === key) : [],
      label: key || "latest (no session_id/transcript_path found)",
    };
  }

  return {
    entries: entries.filter((entry) => entry.session_id === session || entry.transcript_path === session),
    label: session,
  };
}

function countValues(entries, fieldName) {
  const counts = new Map();
  for (const entry of entries) {
    const values = Array.isArray(entry[fieldName]) ? entry[fieldName] : [];
    for (const value of values) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([name, count]) => ({ name, count }));
}

function summarizeSkillRuntime(entries, top) {
  const audits = entries.filter((entry) => entry.audit_type === "skill_usage");
  const skillAuditSkips = entries.filter((entry) =>
    entry.plugin === "skill-expert" &&
    entry.hook === "skill-usage-audit.mjs" &&
    entry.decision === "skip"
  );
  const missingRoute = audits.filter((entry) => entry.missing_route === true);
  const routedButNotUsed = audits.filter((entry) => entry.routed_but_not_used === true);
  const recommendationOnly = audits.filter((entry) =>
    Array.isArray(entry.skills_recommended) &&
    entry.skills_recommended.length > 0 &&
    (!Array.isArray(entry.skills_used) || entry.skills_used.length === 0),
  );

  return {
    entries: audits.length,
    skillAuditSkips: skillAuditSkips.length,
    turnsWithMissingRoute: missingRoute.length,
    routedButNotUsedTurns: routedButNotUsed.length,
    recommendationOnlyTurns: recommendationOnly.length,
    topRoutedSkills: countValues(audits, "skills_routed").slice(0, top),
    topUsedSkills: countValues(audits, "skills_used").slice(0, top),
    topRecommendedSkills: countValues(audits, "skills_recommended").slice(0, top),
  };
}

function skillAuditMentionsWantedPlugin(entry, wantedPlugins) {
  if (entry.audit_type !== "skill_usage") {
    return false;
  }
  const skills = [
    ...(Array.isArray(entry.skills_routed) ? entry.skills_routed : []),
    ...(Array.isArray(entry.skills_used) ? entry.skills_used : []),
    ...(Array.isArray(entry.skills_recommended) ? entry.skills_recommended : []),
  ];
  return skills.some((skill) => {
    const pluginName = String(skill).split(":")[0];
    return wantedPlugins.has(pluginName);
  });
}

function readRuntimeTelemetry(sources, days, pluginNames, top, session) {
  if (sources.files.length === 0) {
    return {
      exists: false,
      file: sources.description,
      session: null,
      entries: 0,
      byDecision: {},
      hotHooks: [],
      errors: [],
      skillRuntime: {
        entries: 0,
        skillAuditSkips: 0,
        turnsWithMissingRoute: 0,
        routedButNotUsedTurns: 0,
        recommendationOnlyTurns: 0,
        topRoutedSkills: [],
        topUsedSkills: [],
        topRecommendedSkills: [],
      },
    };
  }

  const cutoff = Date.now() - days * 86400000;
  const wantedPlugins = new Set(pluginNames);
  const entries = sources.files
    .flatMap((filePath) =>
      readFileSync(filePath, "utf-8")
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }),
    )
    .filter(Boolean)
    .filter((entry) => typeof entry.ts === "number" && entry.ts >= cutoff)
    .filter((entry) => {
      if (entry.plugin && wantedPlugins.has(entry.plugin)) {
        return true;
      }
      if (skillAuditMentionsWantedPlugin(entry, wantedPlugins)) {
        return true;
      }
      return false;
    });
  const sessionFiltered = applySessionFilter(entries, session);

  const byDecision = {};
  const hookCounts = new Map();
  const errors = [];
  for (const entry of sessionFiltered.entries) {
    byDecision[entry.decision] = (byDecision[entry.decision] ?? 0) + 1;
    const key = `${entry.plugin ?? "(unknown)"}/${entry.hook ?? "(unknown)"}`;
    hookCounts.set(key, (hookCounts.get(key) ?? 0) + 1);
    if (entry.decision === "error") {
      errors.push({
        hook: key,
        event: entry.event,
        detail: entry.detail,
      });
    }
  }

  return {
    exists: true,
    file: sources.description,
    session: sessionFiltered.label,
    entries: sessionFiltered.entries.length,
    byDecision,
    hotHooks: [...hookCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([hook, count]) => ({ hook, count })),
    errors: errors.slice(0, top),
    skillRuntime: summarizeSkillRuntime(sessionFiltered.entries, top),
  };
}

function buildReport(args) {
  const trackedFiles = listTrackedFiles();
  const pluginNames = listPlugins(trackedFiles, args.plugin);
  const hooks = collectHookAudit(trackedFiles, pluginNames);
  const skills = collectSkillAudit(trackedFiles, pluginNames, args.top);
  const runtime = readRuntimeTelemetry(telemetrySources(args), args.days, pluginNames, args.top, args.session);

  return {
    scope: {
      plugin: args.plugin || "all",
      plugins: pluginNames.length,
      days: args.days,
      session: args.session || null,
    },
    hooks,
    runtime,
    skills,
    recommendations: buildRecommendations(hooks, skills, runtime),
  };
}

function buildRecommendations(hooks, skills, runtime) {
  const recommendations = [];
  const sessionFilterMissingFields = runtime.session && runtime.session.includes("no session_id/transcript_path");
  if (hooks.telemetryReady < hooks.dispatchFiles) {
    recommendations.push("P0: 统一所有 hooks/dispatch.mjs 的遥测模板，否则只能审计部分插件的 hook 运行情况。");
  }
  if (sessionFilterMissingFields) {
    recommendations.push("P1: 当前日志缺少 session_id/transcript_path；旧日志只能按工作区和时间窗分析，新的 dispatch 模板会记录会话字段。");
  }
  if (runtime.exists && runtime.entries === 0 && !sessionFilterMissingFields) {
    recommendations.push("P1: 最近时间窗没有 hook runtime 记录；实际使用时确认 AI_EXPERTS_HOOK_TELEMETRY 未被设为 0。");
  }
  if (!runtime.exists) {
    recommendations.push("P1: 尚无 hook runtime 日志；运行一次带 hooks 的会话后再看 block/report/context/error 分布。");
  }
  if (skills.withEvals < skills.total) {
    recommendations.push("P0: 为缺 evals/cases.yaml 的 skill 补至少 2 个正例和 1 个反例，形成可回归的触发审计。");
  }
  if (skills.withoutNegative.length > 0) {
    recommendations.push("P1: 已有 eval 的 skill 仍缺反例，容易只测命中不测误触发。");
  }
  if (skills.conflicts.length > 0) {
    recommendations.push("P1: 优先处理同插件 description 触发域重叠，为相近 skill 增加排他指引。");
  }
  if (runtime.skillRuntime.entries === 0 && runtime.skillRuntime.skillAuditSkips > 0) {
    recommendations.push("P1: skill-usage-audit 已运行但只产生 skip 记录；优先检查 Stop payload 的 transcript_path 和 transcript 解析格式。");
  } else if (runtime.skillRuntime.entries === 0) {
    recommendations.push("P2: 最近时间窗没有 skill 使用审计记录；确认 skill-expert 的 Stop hook 已安装并运行。");
  }
  if (runtime.skillRuntime.turnsWithMissingRoute >= 2) {
    recommendations.push("P1: 最近多轮回复缺少 Skill 路由声明，优先检查 skill-routing-reminder 是否稳定注入并被模型遵守。");
  }
  if (runtime.skillRuntime.routedButNotUsedTurns >= 2) {
    recommendations.push("P1: 最近多次出现 skill 命中但未调用，优先检查 description 过宽或路由声明执行纪律。");
  }
  return recommendations;
}

function pct(numerator, denominator) {
  if (denominator === 0) {
    return "0%";
  }
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function printText(report, top) {
  console.log("\nTrigger Audit Report");
  console.log("====================");
  console.log(`Scope: ${report.scope.plugin} (${report.scope.plugins} plugin${report.scope.plugins === 1 ? "" : "s"}), last ${report.scope.days} days`);
  if (report.scope.session) {
    console.log(`Session: ${report.runtime.session || report.scope.session}`);
  }

  console.log("\nHook Static Coverage");
  console.log(`- hook modules: ${report.hooks.hookModules}`);

  console.log("\nHook Runtime Telemetry");
  if (!report.runtime.exists) {
    console.log(`- no telemetry file: ${report.runtime.file}`);
  } else {
    console.log(`- entries: ${report.runtime.entries}`);
    console.log(`- decisions: ${Object.entries(report.runtime.byDecision).map(([k, v]) => `${k}=${v}`).join(", ") || "-"}`);
    if (report.runtime.hotHooks.length > 0) {
      console.log("- hot hooks:");
      for (const item of report.runtime.hotHooks) {
        console.log(`  - ${item.hook}: ${item.count}`);
      }
    }
  }

  console.log("\nSkill Trigger Coverage");
  console.log(`- skills with evals: ${report.skills.withEvals}/${report.skills.total} (${pct(report.skills.withEvals, report.skills.total)})`);
  console.log(`- eval cases: ${report.skills.evalCaseTotals.total} (${report.skills.evalCaseTotals.positive} positive, ${report.skills.evalCaseTotals.negative} negative)`);
  console.log(`- skills without evals: ${report.skills.withoutEvals.length}`);
  console.log(`- eval files without negative cases: ${report.skills.withoutNegative.length}`);
  console.log(`- descriptions with <3 extracted trigger terms: ${report.skills.thinDescriptions.length}`);

  console.log("\nSkill Runtime Audit");
  console.log(`- audited turns: ${report.runtime.skillRuntime.entries}`);
  console.log(`- skill audit skips: ${report.runtime.skillRuntime.skillAuditSkips}`);
  console.log(`- missing route declarations: ${report.runtime.skillRuntime.turnsWithMissingRoute}`);
  console.log(`- routed but not used: ${report.runtime.skillRuntime.routedButNotUsedTurns}`);
  console.log(`- recommendation-only turns: ${report.runtime.skillRuntime.recommendationOnlyTurns}`);
  if (report.runtime.skillRuntime.topRoutedSkills.length > 0) {
    console.log("- top routed skills:");
    for (const item of report.runtime.skillRuntime.topRoutedSkills.slice(0, top)) {
      console.log(`  - ${item.name}: ${item.count}`);
    }
  }

  if (report.skills.withoutEvals.length > 0) {
    console.log("\nTop Skills Without Trigger Evals");
    for (const item of report.skills.withoutEvals.slice(0, top)) {
      console.log(`- ${item}`);
    }
  }

  if (report.skills.conflicts.length > 0) {
    console.log("\nLikely Same-Plugin Skill Trigger Overlaps");
    for (const item of report.skills.conflicts.slice(0, top)) {
      console.log(`- ${item.left} ↔ ${item.right}: ${item.shared.join(", ")}`);
    }
  }

  if (report.recommendations.length > 0) {
    console.log("\nRecommendations");
    for (const item of report.recommendations) {
      console.log(`- ${item}`);
    }
  }
  console.log("");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const report = buildReport(args);
    if (args.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printText(report, args.top);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
