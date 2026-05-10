import { existsSync } from "node:fs";
import { join } from "node:path";

export const DEFAULT_SENSITIVE_RULES: any[] = [
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
export const DEFAULT_AUTHOR_EXCLUDE_REGEXES: any[] = ["dependabot"];
export const DEFAULT_COCHANGE_EXCLUDES: any[] = [
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
