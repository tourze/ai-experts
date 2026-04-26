#!/usr/bin/env node

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const nodeBin = process.execPath;

function requireValue(argv, index, option) {
  const value = argv[index + 1];
  if (value == null || value.startsWith("--")) throw new Error(`${option} requires a value`);
  return value;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    repo: ".",
    out: "ownership-map-out",
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
    if (arg === "--repo") args.repo = requireValue(argv, index, arg), index += 1;
    else if (arg === "--out") args.out = requireValue(argv, index, arg), index += 1;
    else if (arg === "--since") args.since = requireValue(argv, index, arg), index += 1;
    else if (arg === "--until") args.until = requireValue(argv, index, arg), index += 1;
    else if (arg === "--identity") args.identity = requireValue(argv, index, arg), index += 1;
    else if (arg === "--date-field") args.dateField = requireValue(argv, index, arg), index += 1;
    else if (arg === "--include-merges") args.includeMerges = true;
    else if (arg === "--emit-commits") args.emitCommits = true;
    else if (arg === "--author-exclude-regex") args.authorExcludeRegex.push(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--no-default-author-excludes") args.noDefaultAuthorExcludes = true;
    else if (arg === "--graphml") args.graphml = true;
    else if (arg === "--sensitive-config") args.sensitiveConfig = requireValue(argv, index, arg), index += 1;
    else if (arg === "--cochange-max-files") args.cochangeMaxFiles = Number(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--cochange-min-count") args.cochangeMinCount = Number(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--cochange-min-jaccard") args.cochangeMinJaccard = Number(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--cochange-exclude") args.cochangeExclude.push(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--no-default-cochange-excludes") args.noDefaultCochangeExcludes = true;
    else if (arg === "--community-top-owners") args.communityTopOwners = Number(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--bus-factor-threshold") args.busFactorThreshold = Number(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--stale-days") args.staleDays = Number(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--owner-threshold") args.ownerThreshold = Number(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--no-cochange") args.noCochange = true;
    else if (arg === "--no-communities") args.noCommunities = true;
    else throw new Error(`unrecognized argument: ${arg}`);
  }

  if (!["author", "committer"].includes(args.identity)) throw new Error(`invalid --identity: ${args.identity}`);
  if (!["author", "committer"].includes(args.dateField)) throw new Error(`invalid --date-field: ${args.dateField}`);
  return args;
}

export function buildCommand(args, node = nodeBin) {
  const command = [
    node,
    join(scriptDir, "build_ownership_map.mjs"),
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

  if (args.since) command.push("--since", args.since);
  if (args.until) command.push("--until", args.until);
  if (args.includeMerges) command.push("--include-merges");
  if (args.emitCommits) command.push("--emit-commits");
  if (args.graphml) command.push("--graphml");
  if (args.sensitiveConfig) command.push("--sensitive-config", args.sensitiveConfig);
  if (args.noCochange) command.push("--no-cochange");
  if (args.noCommunities) command.push("--no-communities");
  if (args.noDefaultCochangeExcludes) command.push("--no-default-cochange-excludes");
  for (const pattern of args.cochangeExclude) command.push("--cochange-exclude", pattern);
  if (args.noDefaultAuthorExcludes) command.push("--no-default-author-excludes");
  for (const pattern of args.authorExcludeRegex) command.push("--author-exclude-regex", pattern);
  return command;
}

export function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    const [command, ...commandArgs] = buildCommand(args);
    const result = spawnSync(command, commandArgs, { stdio: "inherit" });
    return result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
