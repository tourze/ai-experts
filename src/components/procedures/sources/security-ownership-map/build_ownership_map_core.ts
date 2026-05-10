import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  DEFAULT_AUTHOR_EXCLUDE_REGEXES,
  DEFAULT_COCHANGE_EXCLUDES,
  DEFAULT_SENSITIVE_RULES,
  assertOutputFilesWritable,
  plannedOwnershipMapOutputFiles,
} from "./build_ownership_map_args";
import {
  buildGraphJson,
  computeCommunityOwners,
  connectedComponents,
  writeGraphml,
} from "./build_ownership_map_graph";

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
