#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import { main as buildOwnershipMapMain } from "./build_ownership_map";

export const procedure = defineCliProcedure({
  id: "security-ownership-map-run-ownership-map",
  entry: procedureEntry(import.meta.url),
  description:
    "快速运行所有权分析（简化参数）：构建所有权图谱并输出 summary/people/files/edges CSV。",
  owners: { skillIds: ["security-ownership-map"] },
  target: "scripts/run_ownership_map.mjs",
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
      description: "起始日期",
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
      flag: "--no-default-author-excludes",
      type: "",
      description: "不使用默认的作者排除规则，传此标志即启用",
      required: false,
    },
    {
      flag: "--graphml",
      type: "",
      description: "输出 GraphML 格式，传此标志即启用",
      required: false,
    },
    {
      flag: "--sensitive-config",
      type: "路径",
      description: "敏感规则配置文件路径",
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
  ],

  exampleArgs: { args: ["--repo", ".", "--since", "2024-01-01"] },
});

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
    emitCommits: false,
    authorExcludeRegex: [],
    noDefaultAuthorExcludes: false,
    graphml: false,
    sensitiveConfig: null,
    cochangeMaxFiles: 50,
    cochangeMinCount: 2,
    cochangeMinJaccard: 0.05,
    cochangeExclude: [],
    noDefaultCochangeExcludes: false,
    communityTopOwners: 5,
    busFactorThreshold: 1,
    staleDays: 365,
    ownerThreshold: 0.5,
    noCochange: false,
    noCommunities: false,
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
    else if (arg === "--emit-commits") args.emitCommits = true;
    else if (arg === "--author-exclude-regex")
      (args.authorExcludeRegex.push(requireValue(argv, index, arg)),
        (index += 1));
    else if (arg === "--no-default-author-excludes")
      args.noDefaultAuthorExcludes = true;
    else if (arg === "--graphml") args.graphml = true;
    else if (arg === "--sensitive-config")
      ((args.sensitiveConfig = requireValue(argv, index, arg)), (index += 1));
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
    else if (arg === "--community-top-owners")
      ((args.communityTopOwners = Number(requireValue(argv, index, arg))),
        (index += 1));
    else if (arg === "--bus-factor-threshold")
      ((args.busFactorThreshold = Number(requireValue(argv, index, arg))),
        (index += 1));
    else if (arg === "--stale-days")
      ((args.staleDays = Number(requireValue(argv, index, arg))), (index += 1));
    else if (arg === "--owner-threshold")
      ((args.ownerThreshold = Number(requireValue(argv, index, arg))),
        (index += 1));
    else if (arg === "--no-cochange") args.noCochange = true;
    else if (arg === "--no-communities") args.noCommunities = true;
    else throw new Error(`unrecognized argument: ${arg}`);
  }
  if (!["author", "committer"].includes(args.identity))
    throw new Error(`invalid --identity: ${args.identity}`);
  if (!["author", "committer"].includes(args.dateField))
    throw new Error(`invalid --date-field: ${args.dateField}`);
  return args;
}
export function buildOwnershipMapArgs(args: any): any {
  const commandArgs: any[] = [
    "--repo",
    args.repo,
    "--out",
    args.out,
    "--identity",
    args.identity,
    "--date-field",
    args.dateField,
    "--cochange-max-files",
    String(args.cochangeMaxFiles),
    "--cochange-min-count",
    String(args.cochangeMinCount),
    "--cochange-min-jaccard",
    String(args.cochangeMinJaccard),
    "--community-top-owners",
    String(args.communityTopOwners),
    "--bus-factor-threshold",
    String(args.busFactorThreshold),
    "--stale-days",
    String(args.staleDays),
    "--owner-threshold",
    String(args.ownerThreshold),
  ];
  if (args.since) commandArgs.push("--since", args.since);
  if (args.until) commandArgs.push("--until", args.until);
  if (args.includeMerges) commandArgs.push("--include-merges");
  if (args.emitCommits) commandArgs.push("--emit-commits");
  if (args.overwrite) commandArgs.push("--overwrite");
  if (args.graphml) commandArgs.push("--graphml");
  if (args.sensitiveConfig)
    commandArgs.push("--sensitive-config", args.sensitiveConfig);
  if (args.noCochange) commandArgs.push("--no-cochange");
  if (args.noCommunities) commandArgs.push("--no-communities");
  if (args.noDefaultCochangeExcludes)
    commandArgs.push("--no-default-cochange-excludes");
  for (const pattern of args.cochangeExclude)
    commandArgs.push("--cochange-exclude", pattern);
  if (args.noDefaultAuthorExcludes)
    commandArgs.push("--no-default-author-excludes");
  for (const pattern of args.authorExcludeRegex)
    commandArgs.push("--author-exclude-regex", pattern);
  return commandArgs;
}
export function main(argv: readonly string[]): any {
  try {
    const args = parseArgs(argv);
    return buildOwnershipMapMain(buildOwnershipMapArgs(args));
  } catch (error: any) {
    console.error(error.message);
    return 1;
  }
}
