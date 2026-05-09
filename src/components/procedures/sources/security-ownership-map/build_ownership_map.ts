#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  realpathSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const procedure = defineCliProcedure({
  id: "security-ownership-map-build-ownership-map",
  entry: procedureEntry(import.meta.url),
  description:
    "基于 git 历史构建安全所有权图谱：分析敏感代码归属、bus factor、共改关系和社区结构，输出 CSV/JSON/GraphML。",
  owners: { skillIds: ["security-ownership-map"] },
  target: "scripts/build_ownership_map.mjs",
  runtime: "node",
  params: [
    {
      flag: "--repo",
      type: "路径",
      description: "Git 仓库路径（默认 .）",
      required: false,
    },
    {
      flag: "--out",
      type: "路径",
      description: "输出目录（默认 ownership-map-out）",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "允许覆盖输出目录内已存在的所有权分析产物；仅在确认目标可替换后使用",
      required: false,
    },
    {
      flag: "--since",
      type: "字符串",
      description: "起始日期（如 2024-01-01）",
      required: false,
    },
    {
      flag: "--until",
      type: "字符串",
      description: "结束日期",
      required: false,
    },
    {
      flag: "--identity",
      type: "author|committer",
      description: "身份归因字段（默认 author）",
      required: false,
    },
    {
      flag: "--date-field",
      type: "author|committer",
      description: "日期字段（默认 author）",
      required: false,
    },
    {
      flag: "--include-merges",
      type: "",
      description: "包含合并提交，传此标志即启用",
      required: false,
    },
    {
      flag: "--emit-commits",
      type: "",
      description: "输出 commits.jsonl，传此标志即启用",
      required: false,
    },
    {
      flag: "--sensitive-config",
      type: "路径",
      description: "敏感规则配置文件路径",
      required: false,
    },
    {
      flag: "--owner-threshold",
      type: "数字",
      description: "隐藏 owner 判定阈值（默认 0.5）",
      required: false,
    },
    {
      flag: "--bus-factor-threshold",
      type: "数字",
      description: "bus factor 告警阈值（默认 1）",
      required: false,
    },
    {
      flag: "--stale-days",
      type: "数字",
      description: "孤儿代码判定天数（默认 365）",
      required: false,
    },
    {
      flag: "--no-cochange",
      type: "",
      description: "跳过共改关系分析，传此标志即启用",
      required: false,
    },
    {
      flag: "--no-communities",
      type: "",
      description: "跳过社区检测，传此标志即启用",
      required: false,
    },
    {
      flag: "--graphml",
      type: "",
      description: "输出 GraphML 格式，传此标志即启用",
      required: false,
    },
    {
      flag: "--half-life-days",
      type: "数字",
      description: "减半周期天数（默认 180.0）",
      required: false,
    },
    {
      flag: "--min-touches",
      type: "数字",
      description: "最少触及次数（默认 1）",
      required: false,
    },
    {
      flag: "--author-exclude-regex",
      type: "字符串",
      description: "排除匹配正则的作者（可重复）",
      required: false,
    },
    {
      flag: "--no-default-author-excludes",
      type: "",
      description: "不使用默认的作者排除规则，传此标志即启用",
      required: false,
    },
    {
      flag: "--cochange-max-files",
      type: "数字",
      description: "共改最大文件数（默认 50）",
      required: false,
    },
    {
      flag: "--cochange-min-count",
      type: "数字",
      description: "共改最少出现次数（默认 2）",
      required: false,
    },
    {
      flag: "--cochange-min-jaccard",
      type: "数字",
      description: "共改最小 Jaccard 系数（默认 0.05）",
      required: false,
    },
    {
      flag: "--cochange-exclude",
      type: "字符串",
      description: "排除匹配正则的共改文件（可重复）",
      required: false,
    },
    {
      flag: "--no-default-cochange-excludes",
      type: "",
      description: "不使用默认的共改排除规则，传此标志即启用",
      required: false,
    },
    {
      flag: "--max-community-files",
      type: "数字",
      description: "社区分析最大文件数（默认 50）",
      required: false,
    },
    {
      flag: "--community-top-owners",
      type: "数字",
      description: "每个社区显示的最多 owner 数（默认 5）",
      required: false,
    },
  ],

  exampleArgs: {
    args: ["--repo", ".", "--out", "ownership-out", "--since", "2024-01-01"],
  },
});

const DEFAULT_SENSITIVE_RULES: any[] = [
  ["**/auth/**", "auth", 1.0],
  ["**/oauth/**", "auth", 1.0],
  ["**/rbac/**", "auth", 1.0],
  ["**/session/**", "auth", 1.0],
  ["**/token/**", "auth", 1.0],
  ["**/crypto/**", "crypto", 1.0],
  ["**/tls/**", "crypto", 1.0],
  ["**/ssl/**", "crypto", 1.0],
  ["**/secrets/**", "secrets", 1.0],
  ["**/keys/**", "secrets", 1.0],
  ["**/*.pem", "secrets", 1.0],
  ["**/*.key", "secrets", 1.0],
  ["**/*.p12", "secrets", 1.0],
  ["**/*.pfx", "secrets", 1.0],
  ["**/iam/**", "auth", 1.0],
  ["**/sso/**", "auth", 1.0],
];
const DEFAULT_AUTHOR_EXCLUDE_REGEXES: any[] = ["dependabot"];
const DEFAULT_COCHANGE_EXCLUDES: any[] = [
  "**/Cargo.lock",
  "**/Cargo.toml",
  "**/package-lock.json",
  "**/yarn.lock",
  "**/pnpm-lock.yaml",
  "**/go.sum",
  "**/go.mod",
  "**/Gemfile.lock",
  "**/Pipfile.lock",
  "**/poetry.lock",
  "**/composer.lock",
  "**/.github/**",
  "**/.gitignore",
  "**/.gitattributes",
  "**/.gitmodules",
  "**/.editorconfig",
  "**/.vscode/**",
  "**/.idea/**",
];
function requireValue(argv: readonly string[], index: any, option: any): any {
  const value = argv[index + 1];
  if (value == null || value.startsWith("--"))
    throw new Error(`${option} requires a value`);
  return value;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    repo: ".",
    out: "ownership-map-out",
    overwrite: false,
    since: null,
    until: null,
    identity: "author",
    dateField: "author",
    includeMerges: false,
    halfLifeDays: 180.0,
    sensitiveConfig: null,
    ownerThreshold: 0.5,
    busFactorThreshold: 1,
    staleDays: 365,
    minTouches: 1,
    emitCommits: false,
    authorExcludeRegex: [],
    noDefaultAuthorExcludes: false,
    noCochange: false,
    cochangeMaxFiles: 50,
    cochangeMinCount: 2,
    cochangeMinJaccard: 0.05,
    cochangeExclude: [],
    noDefaultCochangeExcludes: false,
    communities: true,
    graphml: false,
    maxCommunityFiles: 50,
    communityTopOwners: 5,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo")
      ((args.repo = requireValue(argv, index, arg)), (index += 1));
    else if (arg === "--out")
      ((args.out = requireValue(argv, index, arg)), (index += 1));
    else if (arg === "--overwrite") args.overwrite = true;
    else if (arg === "--since")
      ((args.since = requireValue(argv, index, arg)), (index += 1));
    else if (arg === "--until")
      ((args.until = requireValue(argv, index, arg)), (index += 1));
    else if (arg === "--identity")
      ((args.identity = requireValue(argv, index, arg)), (index += 1));
    else if (arg === "--date-field")
      ((args.dateField = requireValue(argv, index, arg)), (index += 1));
    else if (arg === "--include-merges") args.includeMerges = true;
    else if (arg === "--half-life-days")
      ((args.halfLifeDays = Number(requireValue(argv, index, arg))),
        (index += 1));
    else if (arg === "--sensitive-config")
      ((args.sensitiveConfig = requireValue(argv, index, arg)), (index += 1));
    else if (arg === "--owner-threshold")
      ((args.ownerThreshold = Number(requireValue(argv, index, arg))),
        (index += 1));
    else if (arg === "--bus-factor-threshold")
      ((args.busFactorThreshold = Number(requireValue(argv, index, arg))),
        (index += 1));
    else if (arg === "--stale-days")
      ((args.staleDays = Number(requireValue(argv, index, arg))), (index += 1));
    else if (arg === "--min-touches")
      ((args.minTouches = Number(requireValue(argv, index, arg))),
        (index += 1));
    else if (arg === "--emit-commits") args.emitCommits = true;
    else if (arg === "--author-exclude-regex")
      (args.authorExcludeRegex.push(requireValue(argv, index, arg)),
        (index += 1));
    else if (arg === "--no-default-author-excludes")
      args.noDefaultAuthorExcludes = true;
    else if (arg === "--no-cochange") args.noCochange = true;
    else if (arg === "--cochange-max-files")
      ((args.cochangeMaxFiles = Number(requireValue(argv, index, arg))),
        (index += 1));
    else if (arg === "--cochange-min-count")
      ((args.cochangeMinCount = Number(requireValue(argv, index, arg))),
        (index += 1));
    else if (arg === "--cochange-min-jaccard")
      ((args.cochangeMinJaccard = Number(requireValue(argv, index, arg))),
        (index += 1));
    else if (arg === "--cochange-exclude")
      (args.cochangeExclude.push(requireValue(argv, index, arg)), (index += 1));
    else if (arg === "--no-default-cochange-excludes")
      args.noDefaultCochangeExcludes = true;
    else if (arg === "--no-communities") args.communities = false;
    else if (arg === "--graphml") args.graphml = true;
    else if (arg === "--max-community-files")
      ((args.maxCommunityFiles = Number(requireValue(argv, index, arg))),
        (index += 1));
    else if (arg === "--community-top-owners")
      ((args.communityTopOwners = Number(requireValue(argv, index, arg))),
        (index += 1));
    else throw new Error(`unrecognized argument: ${arg}`);
  }
  if (!["author", "committer"].includes(args.identity))
    throw new Error(`invalid --identity: ${args.identity}`);
  if (!["author", "committer"].includes(args.dateField))
    throw new Error(`invalid --date-field: ${args.dateField}`);
  return args;
}
export function plannedOwnershipMapOutputFiles(args: any, outDir: any): any {
  const names: any[] = ["people.csv", "files.csv", "edges.csv", "summary.json"];
  if (args.emitCommits) names.push("commits.jsonl");
  if (!args.noCochange) names.push("cochange_edges.csv");
  if (args.communities) {
    names.push(
      "communities.json",
      "cochange.graph.json",
      "ownership.graph.json",
    );
  }
  if (args.graphml) {
    names.push("ownership.graphml", "cochange.graphml");
  }
  return names.map((name) => join(outDir, name));
}
export function assertOutputFilesWritable(
  paths: any,
  overwrite: any = false,
): any {
  for (const path of paths) {
    if (existsSync(path) && !overwrite) {
      throw new Error(
        `output file already exists: ${path}; pass --overwrite only after confirming it can be replaced`,
      );
    }
  }
}
function parseDate(value: any): any {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return date;
}
function iso(date: any): any {
  return date.toISOString();
}
function formatOffset(minutes: any): any {
  const sign = minutes >= 0 ? "+" : "-";
  const absolute = Math.abs(minutes);
  return `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}
function offsetMinutes(date: any): any {
  return -date.getTimezoneOffset();
}
function recencyWeighted(now: any, when: any, halfLifeDays: any): any {
  if (halfLifeDays <= 0) return 1.0;
  const ageDays = Math.max(0, (now - when) / 86400000);
  return Math.exp((-Math.log(2) * ageDays) / halfLifeDays);
}
function globToRegExp(pattern: any): any {
  let source = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    const next = pattern[index + 1];
    if (char === "*" && next === "*") {
      source += ".*";
      index += 1;
    } else if (char === "*") {
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += char.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}
function matchesGlob(path: any, pattern: any): any {
  const posix = path.replaceAll("\\", "/");
  const patterns = pattern.startsWith("**/")
    ? [pattern, pattern.slice(3)]
    : [pattern];
  return patterns.some((candidate: any) => globToRegExp(candidate).test(posix));
}
function isExcluded(path: any, patterns: any): any {
  return patterns.some((pattern: any) => matchesGlob(path, pattern));
}
function csvEscape(value: any): any {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function writeCsv(path: any, header: any, rows: any): any {
  writeFileSync(
    path,
    [header, ...rows]
      .map((row: any) => row.map(csvEscape).join(","))
      .join("\n") + "\n",
    "utf8",
  );
}
function loadSensitiveRules(path: any): any {
  if (!path) return [...DEFAULT_SENSITIVE_RULES];
  const rules: any[] = [];
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(",").map((part: any) => part.trim());
    rules.push([
      parts[0],
      parts[1] || "sensitive",
      parts[2] ? Number(parts[2]) : 1.0,
    ]);
  }
  return rules;
}
function matchSensitive(path: any, rules: any): any {
  const tags = new Map();
  for (const [pattern, tag, weight] of rules) {
    if (matchesGlob(path, pattern))
      tags.set(tag, (tags.get(tag) || 0) + weight);
  }
  return tags;
}
function authorExcluded(name: any, email: any, patterns: any): any {
  const haystack = `${name} ${email}`.trim();
  return patterns.some((pattern: any) => pattern.test(haystack));
}
function runGitLog(repo: any, since: any, until: any, includeMerges: any): any {
  const args: any[] = [
    "-C",
    repo,
    "log",
    "--name-only",
    "--no-renames",
    "--date=iso-strict",
    "--format=---%n%H%n%P%n%an%n%ae%n%ad%n%cn%n%ce%n%cd",
  ];
  if (!includeMerges) args.push("--no-merges");
  if (since) args.push("--since", since);
  if (until) args.push("--until", until);
  const result = spawnSync("git", args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 200,
  });
  if (result.status !== 0)
    throw new Error(result.stderr.trim() || "git log failed");
  return result.stdout;
}
function iterCommits(logOutput: any): any {
  const commits: any[] = [];
  let block: any[] = [];
  for (const line of logOutput.split(/\r?\n/)) {
    if (line === "---") {
      if (block.length) {
        commits.push(parseGitBlock(block));
        block = [];
      }
    } else {
      block.push(line);
    }
  }
  if (block.length) commits.push(parseGitBlock(block));
  return commits.filter(Boolean);
}
function parseGitBlock(block: any): any {
  if (block.length < 8) return null;
  const parents = block[1].split(" ").filter(Boolean);
  return {
    commit: {
      hash: block[0],
      parents,
      is_merge: parents.length > 1,
      author_name: block[2],
      author_email: block[3],
      author_date: block[4],
      committer_name: block[5],
      committer_email: block[6],
      committer_date: block[7],
    },
    files: block.slice(8).filter((line: any) => line.trim()),
  };
}
function mapAdd(map: any, key: any, value: any): any {
  map.set(key, (map.get(key) || 0) + value);
}
function getNestedMap(root: any, key: any): any {
  if (!root.has(key)) root.set(key, new Map());
  return root.get(key);
}
function edgeKey(left: any, right: any): any {
  return `${left}\u0000${right}`;
}
function splitEdgeKey(key: any): any {
  return key.split("\u0000");
}
function setMin(current: any, value: any): any {
  return current == null || value < current ? value : current;
}
function setMax(current: any, value: any): any {
  return current == null || value > current ? value : current;
}
function computeCommunityOwners(
  communityFiles: any,
  people: any,
  filePeopleTouches: any,
  filePeopleRecency: any,
  filePeopleSensitive: any,
  topN: any,
): any {
  const touchesByPerson = new Map();
  const recencyByPerson = new Map();
  const sensitiveByPerson = new Map();
  for (const path of communityFiles) {
    for (const [person, touches] of getNestedMap(filePeopleTouches, path))
      mapAdd(touchesByPerson, person, touches);
    for (const [person, recency] of getNestedMap(filePeopleRecency, path))
      mapAdd(recencyByPerson, person, recency);
    for (const [person, weight] of getNestedMap(filePeopleSensitive, path))
      mapAdd(sensitiveByPerson, person, weight);
  }
  const totalTouches = [...touchesByPerson.values()].reduce(
    (sum: any, value: any) => sum + value,
    0,
  );
  const totalRecency = [...recencyByPerson.values()].reduce(
    (sum: any, value: any) => sum + value,
    0,
  );
  const totalSensitive = [...sensitiveByPerson.values()].reduce(
    (sum: any, value: any) => sum + value,
    0,
  );
  const topMaintainers = [...touchesByPerson.entries()]
    .sort((left: any, right: any) => right[1] - left[1])
    .slice(0, topN)
    .map(([personId, touches]: any) => {
      const person = people.get(personId) || {};
      const recency = recencyByPerson.get(personId) || 0;
      const sensitive = sensitiveByPerson.get(personId) || 0;
      return {
        person_id: personId,
        name: person.name || personId,
        touches,
        touch_share: totalTouches
          ? Number((touches / totalTouches).toFixed(4))
          : 0,
        recency_share: totalRecency
          ? Number((recency / totalRecency).toFixed(4))
          : 0,
        sensitive_share: totalSensitive
          ? Number((sensitive / totalSensitive).toFixed(4))
          : 0,
        primary_tz_offset: person.primary_tz_offset || "",
      };
    });
  return {
    bus_factor: touchesByPerson.size,
    owner_count: touchesByPerson.size,
    totals: {
      touches: totalTouches,
      recency_weight: Number(totalRecency.toFixed(6)),
      sensitive_weight: Number(totalSensitive.toFixed(2)),
    },
    top_maintainers: topMaintainers,
  };
}
function connectedComponents(nodes: any, edgeRows: any): any {
  const adjacency = new Map<any, Set<any>>(
    nodes.map((node: any) => [node, new Set<any>()]),
  );
  for (const [fileA, fileB] of edgeRows.map((row: any) => [row[0], row[1]])) {
    if (!adjacency.has(fileA)) adjacency.set(fileA, new Set());
    if (!adjacency.has(fileB)) adjacency.set(fileB, new Set());
    const neighborsA = adjacency.get(fileA);
    const neighborsB = adjacency.get(fileB);
    if (neighborsA) neighborsA.add(fileB);
    if (neighborsB) neighborsB.add(fileA);
  }
  const seen = new Set();
  const components: any[] = [];
  for (const node of [...adjacency.keys()].sort()) {
    if (seen.has(node)) continue;
    const stack: any[] = [node];
    const component: any[] = [];
    seen.add(node);
    while (stack.length) {
      const current = stack.pop();
      if (current == null) continue;
      component.push(current);
      for (const next of adjacency.get(current) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        stack.push(next);
      }
    }
    components.push(component.sort());
  }
  return components.sort(
    (left: any, right: any) =>
      right.length - left.length || left[0].localeCompare(right[0]),
  );
}
function buildGraphJson(
  nodes: any,
  edges: any,
  communityIndex: any,
  communityMetadata: any,
): any {
  return {
    directed: false,
    multigraph: false,
    graph: { community_maintainers: communityMetadata },
    nodes: nodes.map((id: any) => ({
      id,
      community_id: communityIndex.get(id),
    })),
    edges,
  };
}
function xmlEscape(value: any): any {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function writeGraphml(path: any, nodes: any, edges: any): any {
  const lines: any[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">',
    '  <graph edgedefault="undirected">',
  ];
  for (const node of nodes) lines.push(`    <node id="${xmlEscape(node)}"/>`);
  edges.forEach((edge: any, index: any) => {
    lines.push(
      `    <edge id="e${index}" source="${xmlEscape(edge.source)}" target="${xmlEscape(edge.target)}"/>`,
    );
  });
  lines.push("  </graph>", "</graphml>");
  writeFileSync(path, lines.join("\n"), "utf8");
}
export function buildOwnershipMap(args: any): any {
  const now = new Date();
  const rules = loadSensitiveRules(args.sensitiveConfig);
  const outDir = args.out;
  assertOutputFilesWritable(
    plannedOwnershipMapOutputFiles(args, outDir),
    args.overwrite,
  );
  mkdirSync(outDir, { recursive: true });
  const people = new Map();
  const files = new Map();
  const edges = new Map();
  const filePeopleTouches = new Map();
  const filePeopleRecency = new Map();
  const filePeopleSensitive = new Map();
  const tagTotals = new Map();
  const tagPersonTotals = new Map();
  const personTimezoneCounts = new Map();
  const cochangeCounts = new Map();
  const cochangeFileCommits = new Map();
  let cochangeCommitsUsed = 0;
  let cochangeCommitsSkipped = 0;
  let cochangeCommitsFiltered = 0;
  let cochangeFilesExcluded = 0;
  let totalCommitsSeen = 0;
  let totalCommitsIncluded = 0;
  let commitsExcludedIdentities = 0;
  let commitsExcludedMerges = 0;
  let totalEdges = 0;
  const emittedCommits: any[] = [];
  const authorExcludeRegexes = args.noDefaultAuthorExcludes
    ? []
    : [...DEFAULT_AUTHOR_EXCLUDE_REGEXES];
  authorExcludeRegexes.push(...args.authorExcludeRegex);
  const authorExcludePatterns = authorExcludeRegexes.map(
    (pattern: any) => new RegExp(pattern, "i"),
  );
  const cochangeExcludes = args.noDefaultCochangeExcludes
    ? []
    : [...DEFAULT_COCHANGE_EXCLUDES];
  cochangeExcludes.push(...args.cochangeExclude);
  for (const { commit, files: touchedFiles } of iterCommits(
    runGitLog(args.repo, args.since, args.until, args.includeMerges),
  )) {
    totalCommitsSeen += 1;
    if (commit.is_merge && !args.includeMerges) {
      commitsExcludedMerges += 1;
      continue;
    }
    const identityName = commit[`${args.identity}_name`] || "";
    const identityEmailRaw = commit[`${args.identity}_email`] || "";
    if (authorExcluded(identityName, identityEmailRaw, authorExcludePatterns)) {
      commitsExcludedIdentities += 1;
      continue;
    }
    if (!touchedFiles.length) continue;
    totalCommitsIncluded += 1;
    if (args.emitCommits)
      emittedCommits.push(JSON.stringify({ ...commit, files: touchedFiles }));
    const identityEmail = identityEmailRaw || identityName;
    const commitDate = parseDate(commit[`${args.dateField}_date`] || "");
    const recency = recencyWeighted(now, commitDate, args.halfLifeDays);
    const tzMinutes = offsetMinutes(commitDate);
    if (tzMinutes != null) {
      const counts = getNestedMap(personTimezoneCounts, identityEmail);
      mapAdd(counts, tzMinutes, 1);
    }
    const uniqueFiles = [...new Set(touchedFiles)].sort();
    if (!args.noCochange && uniqueFiles.length > 1) {
      if (uniqueFiles.length > args.cochangeMaxFiles) {
        cochangeCommitsSkipped += 1;
      } else {
        const filteredFiles = uniqueFiles.filter(
          (path: any) => !isExcluded(path, cochangeExcludes),
        );
        const excluded = uniqueFiles.length - filteredFiles.length;
        cochangeFilesExcluded += excluded;
        if (filteredFiles.length < 2) cochangeCommitsFiltered += 1;
        for (const path of filteredFiles) mapAdd(cochangeFileCommits, path, 1);
        if (filteredFiles.length >= 2) {
          cochangeCommitsUsed += 1;
          filteredFiles.forEach((path: any, index: any) => {
            for (const other of filteredFiles.slice(index + 1))
              mapAdd(cochangeCounts, edgeKey(path, other), 1);
          });
        }
      }
    }
    if (!people.has(identityEmail)) {
      people.set(identityEmail, {
        name: identityName,
        email: identityEmail,
        first_seen: commitDate,
        last_seen: commitDate,
        commit_count: 0,
        touches: 0,
        sensitive_touches: 0,
      });
    }
    const person = people.get(identityEmail);
    person.commit_count += 1;
    person.first_seen = setMin(person.first_seen, commitDate);
    person.last_seen = setMax(person.last_seen, commitDate);
    for (const path of touchedFiles) {
      if (!files.has(path)) {
        files.set(path, {
          path,
          first_seen: commitDate,
          last_seen: commitDate,
          commit_count: 0,
          touches: 0,
          authors: new Set(),
          sensitive_tags: new Map(),
        });
      }
      const fileEntry = files.get(path);
      fileEntry.commit_count += 1;
      fileEntry.first_seen = setMin(fileEntry.first_seen, commitDate);
      fileEntry.last_seen = setMax(fileEntry.last_seen, commitDate);
      fileEntry.touches += 1;
      fileEntry.authors.add(identityEmail);
      const key = edgeKey(identityEmail, path);
      if (!edges.has(key)) {
        edges.set(key, {
          touches: 0,
          first_seen: commitDate,
          last_seen: commitDate,
          recency_weight: 0,
          sensitive_weight: 0,
        });
      }
      const edge = edges.get(key);
      edge.touches += 1;
      edge.first_seen = setMin(edge.first_seen, commitDate);
      edge.last_seen = setMax(edge.last_seen, commitDate);
      edge.recency_weight += recency;
      const tags = matchSensitive(path, rules);
      if (tags.size) {
        fileEntry.sensitive_tags = tags;
        const sensitiveWeight = [...tags.values()].reduce(
          (sum: any, value: any) => sum + value,
          0,
        );
        edge.sensitive_weight += sensitiveWeight;
        person.sensitive_touches += sensitiveWeight;
        mapAdd(
          getNestedMap(filePeopleSensitive, path),
          identityEmail,
          sensitiveWeight,
        );
        for (const [tag, weight] of tags.entries()) {
          mapAdd(tagTotals, tag, weight);
          mapAdd(getNestedMap(tagPersonTotals, tag), identityEmail, weight);
        }
      }
      person.touches += 1;
      mapAdd(getNestedMap(filePeopleTouches, path), identityEmail, 1);
      mapAdd(getNestedMap(filePeopleRecency, path), identityEmail, recency);
      totalEdges += 1;
    }
  }
  if (args.emitCommits)
    writeFileSync(
      join(outDir, "commits.jsonl"),
      emittedCommits.join("\n") + (emittedCommits.length ? "\n" : ""),
      "utf8",
    );
  for (const [email, person] of people.entries()) {
    const tzCounts = personTimezoneCounts.get(email) || new Map();
    if (tzCounts.size) {
      const primaryTzMinutes = [...tzCounts.entries()].sort(
        (left: any, right: any) => right[1] - left[1] || right[0] - left[0],
      )[0][0];
      person.primary_tz_offset = formatOffset(primaryTzMinutes);
      person.primary_tz_minutes = String(primaryTzMinutes);
      person.timezone_offsets = [...tzCounts.entries()]
        .sort((left: any, right: any) => left[0] - right[0])
        .map(([minutes, count]: any) => `${formatOffset(minutes)}:${count}`)
        .join(";");
    } else {
      person.primary_tz_offset = "";
      person.primary_tz_minutes = "";
      person.timezone_offsets = "";
    }
  }
  const peopleRows = [...people.entries()]
    .sort()
    .map(([email, person]: any) => [
      email,
      person.name,
      email,
      iso(person.first_seen),
      iso(person.last_seen),
      String(person.commit_count),
      String(person.touches),
      person.sensitive_touches.toFixed(2),
      person.primary_tz_offset,
      person.primary_tz_minutes,
      person.timezone_offsets,
    ]);
  const fileRows = [...files.entries()]
    .sort()
    .map(([path, fileEntry]: any) => [
      path,
      path,
      iso(fileEntry.first_seen),
      iso(fileEntry.last_seen),
      String(fileEntry.commit_count),
      String(fileEntry.touches),
      String(fileEntry.authors.size),
      [...fileEntry.sensitive_tags.values()]
        .reduce((sum: any, value: any) => sum + value, 0)
        .toFixed(2),
      [...fileEntry.sensitive_tags.keys()].sort().join(";"),
    ]);
  const edgeRows = [...edges.entries()].flatMap(([key, edge]: any) => {
    if (edge.touches < args.minTouches) return [];
    const [email, path] = splitEdgeKey(key);
    return [
      [
        email,
        path,
        String(edge.touches),
        edge.recency_weight.toFixed(6),
        iso(edge.first_seen),
        iso(edge.last_seen),
        edge.sensitive_weight.toFixed(2),
      ],
    ];
  });
  const cochangeRows: any[] = [];
  if (!args.noCochange) {
    for (const [key, count] of cochangeCounts.entries()) {
      if (count < args.cochangeMinCount) continue;
      const [fileA, fileB] = splitEdgeKey(key);
      const denom =
        (cochangeFileCommits.get(fileA) || 0) +
        (cochangeFileCommits.get(fileB) || 0) -
        count;
      if (denom <= 0) continue;
      const jaccard = count / denom;
      if (jaccard < args.cochangeMinJaccard) continue;
      cochangeRows.push([fileA, fileB, String(count), jaccard.toFixed(6)]);
    }
  }
  writeCsv(
    join(outDir, "people.csv"),
    [
      "person_id",
      "name",
      "email",
      "first_seen",
      "last_seen",
      "commit_count",
      "touches",
      "sensitive_touches",
      "primary_tz_offset",
      "primary_tz_minutes",
      "timezone_offsets",
    ],
    peopleRows,
  );
  writeCsv(
    join(outDir, "files.csv"),
    [
      "file_id",
      "path",
      "first_seen",
      "last_seen",
      "commit_count",
      "touches",
      "bus_factor",
      "sensitivity_score",
      "sensitivity_tags",
    ],
    fileRows,
  );
  writeCsv(
    join(outDir, "edges.csv"),
    [
      "person_id",
      "file_id",
      "touches",
      "recency_weight",
      "first_seen",
      "last_seen",
      "sensitive_weight",
    ],
    edgeRows,
  );
  if (!args.noCochange)
    writeCsv(
      join(outDir, "cochange_edges.csv"),
      ["file_a", "file_b", "cochange_count", "jaccard"],
      cochangeRows,
    );
  const orphanedSensitiveCode: any[] = [];
  const busFactorHotspots: any[] = [];
  for (const [path, fileEntry] of files.entries()) {
    if (!fileEntry.sensitive_tags.size) continue;
    const busFactor = fileEntry.authors.size;
    const lastSeenTime =
      fileEntry.last_seen instanceof Date
        ? fileEntry.last_seen.getTime()
        : new Date(fileEntry.last_seen).getTime();
    const ageDays = Math.floor((now.getTime() - lastSeenTime) / 86400000);
    const touches = filePeopleTouches.get(path);
    const topOwner = touches
      ? [...touches.entries()].sort(
          (left: any, right: any) => right[1] - left[1],
        )[0]?.[0]
      : null;
    const hotspot: Record<string, any> = {
      path,
      bus_factor: busFactor,
      last_touch: iso(fileEntry.last_seen),
      sensitivity_tags: [...fileEntry.sensitive_tags.keys()].sort(),
      top_owner: topOwner,
    };
    if (busFactor <= args.busFactorThreshold) {
      busFactorHotspots.push(hotspot);
      if (ageDays >= args.staleDays)
        orphanedSensitiveCode.push({
          ...hotspot,
          last_security_touch: iso(fileEntry.last_seen),
        });
    }
  }
  const hiddenOwners: any[] = [];
  for (const [tag, total] of tagTotals.entries()) {
    if (total <= 0) continue;
    const personTotals = tagPersonTotals.get(tag);
    if (!personTotals?.size) continue;
    const [topEmail, topValue] = [...personTotals.entries()].sort(
      (left: any, right: any) => right[1] - left[1],
    )[0];
    const share = topValue / total;
    if (share >= args.ownerThreshold) {
      hiddenOwners.push({
        person: topEmail,
        name: people.get(topEmail)?.name || topEmail,
        controls: `${(share * 100).toFixed(0)}% of ${tag} code`,
        category: tag,
        share: Number(share.toFixed(4)),
      });
    }
  }
  const summary: Record<string, any> = {
    generated_at: iso(now),
    repo: resolve(args.repo),
    parameters: {
      since: args.since,
      until: args.until,
      half_life_days: args.halfLifeDays,
      bus_factor_threshold: args.busFactorThreshold,
      stale_days: args.staleDays,
      owner_threshold: args.ownerThreshold,
      sensitive_config: args.sensitiveConfig,
      identity: args.identity,
      date_field: args.dateField,
      include_merges: args.includeMerges,
      cochange_enabled: !args.noCochange,
      cochange_max_files: args.cochangeMaxFiles,
      cochange_min_count: args.cochangeMinCount,
      cochange_min_jaccard: args.cochangeMinJaccard,
      cochange_default_excludes: !args.noDefaultCochangeExcludes,
      cochange_excludes: cochangeExcludes,
      author_default_excludes: !args.noDefaultAuthorExcludes,
      author_exclude_regexes: authorExcludeRegexes,
      community_top_owners: args.communityTopOwners,
    },
    orphaned_sensitive_code: orphanedSensitiveCode,
    hidden_owners: hiddenOwners,
    bus_factor_hotspots: busFactorHotspots,
    stats: {
      commits: totalCommitsIncluded,
      commits_seen: totalCommitsSeen,
      commits_excluded_identities: commitsExcludedIdentities,
      commits_excluded_merges: commitsExcludedMerges,
      edges: totalEdges,
      people: people.size,
      files: files.size,
      cochange_pairs_total: args.noCochange ? 0 : cochangeCounts.size,
      cochange_edges: args.noCochange ? 0 : cochangeRows.length,
      cochange_commits_used: args.noCochange ? 0 : cochangeCommitsUsed,
      cochange_commits_skipped: args.noCochange ? 0 : cochangeCommitsSkipped,
      cochange_commits_filtered: args.noCochange ? 0 : cochangeCommitsFiltered,
      cochange_files_excluded: args.noCochange ? 0 : cochangeFilesExcluded,
    },
  };
  writeFileSync(
    join(outDir, "summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );
  if (args.communities || args.graphml) {
    const communityIndex = new Map();
    const communityMetadata: any[] = [];
    const fileNodes = [...files.keys()].sort();
    const components =
      args.noCochange || !cochangeRows.length
        ? connectedComponents(
            fileNodes,
            edgeRows.map((row: any) => [row[1], row[1], "1", "1"]),
          )
        : connectedComponents(fileNodes, cochangeRows);
    if (args.communities) {
      const serialized = components.map((component: any, index: any) => {
        const id = index + 1;
        for (const path of component) communityIndex.set(path, id);
        const owners = computeCommunityOwners(
          component,
          people,
          filePeopleTouches,
          filePeopleRecency,
          filePeopleSensitive,
          args.communityTopOwners,
        );
        const entry: Record<string, any> = {
          id,
          size: component.length,
          files: component.slice(0, args.maxCommunityFiles),
          maintainers: owners.top_maintainers,
          bus_factor: owners.bus_factor,
          owner_count: owners.owner_count,
          totals: owners.totals,
        };
        const { files: _files, ...metadata } = entry;
        communityMetadata.push(metadata);
        return entry;
      });
      writeFileSync(
        join(outDir, "communities.json"),
        JSON.stringify(serialized, null, 2),
        "utf8",
      );
      if (!args.noCochange && cochangeRows.length) {
        const graphEdges = cochangeRows.map(
          ([source, target, count, jaccard]: any) => ({
            source,
            target,
            weight: Number(jaccard),
            count: Number(count),
          }),
        );
        writeFileSync(
          join(outDir, "cochange.graph.json"),
          JSON.stringify(
            buildGraphJson(
              fileNodes,
              graphEdges,
              communityIndex,
              communityMetadata,
            ),
            null,
            2,
          ),
          "utf8",
        );
      } else {
        const graphEdges = edgeRows.map(([person, file, touches]: any) => ({
          source: person,
          target: file,
          weight: Number(touches),
        }));
        const nodes = [...new Set([...people.keys(), ...fileNodes])].sort();
        writeFileSync(
          join(outDir, "ownership.graph.json"),
          JSON.stringify(
            buildGraphJson(
              nodes,
              graphEdges,
              communityIndex,
              communityMetadata,
            ),
            null,
            2,
          ),
          "utf8",
        );
      }
    }
    if (args.graphml) {
      const ownershipEdges = edgeRows.map(([person, file]: any) => ({
        source: person,
        target: file,
      }));
      writeGraphml(
        join(outDir, "ownership.graphml"),
        [...new Set([...people.keys(), ...fileNodes])].sort(),
        ownershipEdges,
      );
      if (!args.noCochange && cochangeRows.length) {
        writeGraphml(
          join(outDir, "cochange.graphml"),
          fileNodes,
          cochangeRows.map(([source, target]: any) => ({ source, target })),
        );
      }
    }
  }
  return outDir;
}
export function main(argv: readonly string[]): any {
  try {
    const outDir = buildOwnershipMap(parseArgs(argv));
    console.log(`Ownership map written to ${outDir}`);
    return 0;
  } catch (error: any) {
    console.error(error.message);
    return 1;
  }
}
