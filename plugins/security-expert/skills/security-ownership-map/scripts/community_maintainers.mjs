#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { readCsv } from "./query_ownership.mjs";

export function parseDate(value) {
  let text = String(value || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) text = `${text}T00:00:00Z`;
  else if (!/(Z|[+-]\d{2}:\d{2})$/.test(text)) text = `${text}Z`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return date;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

export function monthKey(date) {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

export function quarterKey(date) {
  return `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
}

export function monthEnd(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) - 1000);
}

export function quarterStart(date) {
  const startMonth = Math.floor(date.getUTCMonth() / 3) * 3;
  return new Date(Date.UTC(date.getUTCFullYear(), startMonth, 1));
}

export function quarterEnd(date) {
  const start = quarterStart(date);
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 3, 1) - 1000);
}

export function addMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

export function recencyWeight(ageDays, halfLifeDays) {
  if (halfLifeDays <= 0) return 1.0;
  return Math.exp(-ageDays / halfLifeDays);
}

export function loadPeople(dataDir) {
  const people = new Map();
  for (const row of readCsv(join(dataDir, "people.csv"))) {
    const personId = row.person_id || "";
    people.set(personId, {
      name: row.name || "",
      email: row.email || "",
      primary_tz_offset: row.primary_tz_offset || "",
    });
  }
  return people;
}

export function loadGraphJson(dataDir) {
  const cochangePath = join(dataDir, "cochange.graph.json");
  const ownershipPath = join(dataDir, "ownership.graph.json");
  if (existsSync(cochangePath)) return JSON.parse(readFileSync(cochangePath, "utf8"));
  if (existsSync(ownershipPath)) return JSON.parse(readFileSync(ownershipPath, "utf8"));
  return null;
}

export function findFileNode(nodes, query) {
  const exact = nodes.filter((node) => node.id === query);
  if (exact.length) return exact[0];
  const contains = nodes.filter((node) => String(node.id || "").includes(query));
  if (contains.length === 1) return contains[0];
  if (!contains.length) throw new Error(`File not found in graph: ${query}`);
  throw new Error(`Multiple matches for file ${query}: ${contains.slice(0, 10).map((node) => node.id).join(", ")}`);
}

export function loadCommunityFiles(dataDir, fileQuery, communityId) {
  const graph = loadGraphJson(dataDir);
  if (graph) {
    const nodes = graph.nodes || [];
    let resolvedCommunityId = communityId;
    if (fileQuery) {
      const node = findFileNode(nodes, fileQuery);
      resolvedCommunityId = Number(node.community_id ?? -1);
    }
    if (resolvedCommunityId == null) throw new Error("Provide --file or --community-id");
    const files = nodes.filter((node) => Number(node.community_id) === resolvedCommunityId).map((node) => node.id).filter(Boolean);
    if (!files.length) throw new Error(`No files found for community ${resolvedCommunityId}`);
    return { communityId: resolvedCommunityId, files };
  }

  const communitiesPath = join(dataDir, "communities.json");
  if (!existsSync(communitiesPath)) throw new Error("Missing graph json and communities.json");
  const communities = JSON.parse(readFileSync(communitiesPath, "utf8"));
  if (fileQuery) {
    for (const entry of communities) {
      const files = entry.files || [];
      if (files.some((file) => fileQuery === file || file.includes(fileQuery))) {
        return { communityId: Number(entry.id ?? -1), files: [...files] };
      }
    }
    throw new Error("File not found in communities.json (list may be truncated)");
  }
  if (communityId == null) throw new Error("Provide --file or --community-id");
  const match = communities.find((entry) => Number(entry.id ?? -1) === communityId);
  if (!match) throw new Error(`Community id not found: ${communityId}`);
  return { communityId, files: [...(match.files || [])] };
}

export function iterCommitsFromJson(commitsPath, since, until, dateField) {
  const commits = [];
  for (const line of readFileSync(commitsPath, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    const authorDate = entry.author_date || entry.date;
    const committerDate = entry.committer_date;
    const authorDt = authorDate ? parseDate(authorDate) : null;
    const committerDt = committerDate ? parseDate(committerDate) : null;
    const commitDate = dateField === "committer" ? committerDt || authorDt : authorDt || committerDt;
    if (!commitDate) continue;
    if (since && commitDate < since) continue;
    if (until && commitDate > until) continue;
    commits.push({
      hash: entry.hash || "",
      parents: entry.parents || [],
      is_merge: entry.is_merge || false,
      author_name: entry.author_name || "",
      author_email: entry.author_email || "",
      author_date: authorDate,
      committer_name: entry.committer_name || "",
      committer_email: entry.committer_email || "",
      committer_date: committerDate,
      files: entry.files || [],
    });
  }
  return commits;
}

function parseGitBlock(block) {
  if (block.length < 8) return [];
  return [{
    hash: block[0],
    parents: block[1].split(" ").filter(Boolean),
    is_merge: block[1].split(" ").filter(Boolean).length > 1,
    author_name: block[2],
    author_email: block[3],
    author_date: block[4],
    committer_name: block[5],
    committer_email: block[6],
    committer_date: block[7],
    files: block.slice(8).filter(Boolean),
  }];
}

export function iterCommitsFromGit(repo, since, until, includeMerges) {
  const args = [
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

  const result = spawnSync("git", args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 100 });
  if (result.status !== 0) throw new Error(result.stderr.trim() || "git log failed");
  const commits = [];
  let block = [];
  for (const line of result.stdout.split(/\r?\n/)) {
    if (line === "---") {
      if (block.length) {
        commits.push(...parseGitBlock(block));
        block = [];
      }
    } else {
      block.push(line);
    }
  }
  if (block.length) commits.push(...parseGitBlock(block));
  return commits;
}

function addCounter(map, key, value) {
  map.set(key, (map.get(key) || 0) + value);
}

export function generateRows(args) {
  if (!existsSync(args.dataDir)) throw new Error(`Data directory not found: ${args.dataDir}`);
  const since = args.since ? parseDate(args.since) : null;
  const until = args.until ? parseDate(args.until) : null;
  const { files: communityFiles } = loadCommunityFiles(args.dataDir, args.file, args.communityId);
  const communityFileSet = new Set(communityFiles);
  const people = loadPeople(args.dataDir);
  const ignoreRe = args.ignoreAuthorRegex ? new RegExp(args.ignoreAuthorRegex) : null;
  const commitsPath = join(args.dataDir, "commits.jsonl");
  const commits = existsSync(commitsPath)
    ? iterCommitsFromJson(commitsPath, since, until, args.dateField)
    : (() => {
      if (!args.repo) throw new Error("--repo is required when commits.jsonl is missing");
      return iterCommitsFromGit(args.repo, args.since, args.until, args.includeMerges);
    })();

  const commitRows = [];
  for (const commit of commits) {
    if (commit.is_merge && !args.includeMerges) continue;
    const inCommunity = (commit.files || []).filter((path) => communityFileSet.has(path)).length;
    if (!inCommunity) continue;
    const identityName = commit[`${args.identity}_name`] || "";
    const identityEmail = commit[`${args.identity}_email`] || "";
    const dateValue = commit[`${args.dateField}_date`];
    if (!dateValue) throw new Error("Missing committer fields in commits.jsonl. Re-run build or pass --repo.");
    if (ignoreRe && (ignoreRe.test(identityName) || ignoreRe.test(identityEmail))) continue;
    const personId = identityEmail || identityName;
    const touches = args.touchMode === "commit" ? 1 : inCommunity;
    commitRows.push({ date: parseDate(dateValue), personId, touches, name: identityName, email: identityEmail });
    if (!people.has(personId)) {
      people.set(personId, { name: identityName, email: identityEmail, primary_tz_offset: "" });
    }
  }

  if (!commitRows.length) return [];
  commitRows.sort((left, right) => left.date - right.date);
  const periodCounts = new Map();
  const periodTotals = new Map();
  const minDate = commitRows[0].date;
  const maxDate = commitRows[commitRows.length - 1].date;
  let periodCursor;
  let periodEndAnchor;
  let stepMonths;
  let keyFunc;
  let endFunc;
  if (args.bucket === "quarter") {
    periodCursor = quarterStart(minDate);
    periodEndAnchor = quarterStart(maxDate);
    stepMonths = 3;
    keyFunc = quarterKey;
    endFunc = quarterEnd;
  } else {
    periodCursor = new Date(Date.UTC(minDate.getUTCFullYear(), minDate.getUTCMonth(), 1));
    periodEndAnchor = new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), 1));
    stepMonths = 1;
    keyFunc = monthKey;
    endFunc = monthEnd;
  }

  while (periodCursor <= periodEndAnchor) {
    const bucketEnd = endFunc(periodCursor);
    const bucketKey = keyFunc(bucketEnd);
    const counts = new Map();
    let total = 0;
    let inBucket;
    if (args.windowDays > 0) {
      const windowStart = new Date(bucketEnd.getTime() - args.windowDays * 86400 * 1000);
      inBucket = (date) => windowStart <= date && date <= bucketEnd;
    } else if (args.bucket === "quarter") {
      const bucketStart = quarterStart(periodCursor);
      inBucket = (date) => bucketStart <= date && date <= bucketEnd;
    } else {
      inBucket = (date) => date.getUTCFullYear() === bucketEnd.getUTCFullYear() && date.getUTCMonth() === bucketEnd.getUTCMonth();
    }

    for (const row of commitRows) {
      if (!inBucket(row.date)) continue;
      const weight = args.weight === "recency"
        ? recencyWeight((bucketEnd - row.date) / 86400000, args.halfLifeDays)
        : 1.0;
      const contribution = row.touches * weight;
      addCounter(counts, row.personId, contribution);
      total += contribution;
    }
    if (counts.size) {
      periodCounts.set(bucketKey, counts);
      periodTotals.set(bucketKey, total);
    }
    periodCursor = addMonths(periodCursor, stepMonths);
  }

  const rows = [];
  for (const period of [...periodCounts.keys()].sort()) {
    const total = periodTotals.get(period) || 0;
    const ranked = [...periodCounts.get(period).entries()].sort((left, right) => right[1] - left[1]);
    let rank = 0;
    for (const [personId, touches] of ranked) {
      if (touches < args.minTouches) continue;
      const share = total ? touches / total : 0;
      if (share < args.minShare) continue;
      rank += 1;
      if (rank > args.top) break;
      const person = people.get(personId) || {};
      rows.push({
        period,
        rank,
        name: person.name || "",
        email: person.email || personId,
        primary_tz_offset: person.primary_tz_offset || "",
        community_touches: args.weight === "recency" ? touches.toFixed(4) : touches.toFixed(0),
        touch_share: share.toFixed(4),
      });
    }
  }
  return rows;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows) {
  const columns = ["period", "rank", "name", "email", "primary_tz_offset", "community_touches", "touch_share"];
  return [columns.join(","), ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","))].join("\n");
}

function requireValue(argv, index, option) {
  const value = argv[index + 1];
  if (value == null || value.startsWith("--")) throw new Error(`${option} requires a value`);
  return value;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    dataDir: "ownership-map-out",
    repo: null,
    file: null,
    communityId: null,
    since: null,
    until: null,
    identity: "author",
    dateField: "author",
    includeMerges: false,
    top: 5,
    bucket: "month",
    touchMode: "commit",
    windowDays: 0,
    weight: "touches",
    halfLifeDays: 180.0,
    minShare: 0.0,
    ignoreAuthorRegex: null,
    minTouches: 1,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--data-dir") args.dataDir = requireValue(argv, index, arg), index += 1;
    else if (arg === "--repo") args.repo = requireValue(argv, index, arg), index += 1;
    else if (arg === "--file") args.file = requireValue(argv, index, arg), index += 1;
    else if (arg === "--community-id") args.communityId = Number(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--since") args.since = requireValue(argv, index, arg), index += 1;
    else if (arg === "--until") args.until = requireValue(argv, index, arg), index += 1;
    else if (arg === "--identity") args.identity = requireValue(argv, index, arg), index += 1;
    else if (arg === "--date-field") args.dateField = requireValue(argv, index, arg), index += 1;
    else if (arg === "--include-merges") args.includeMerges = true;
    else if (arg === "--top") args.top = Number(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--bucket") args.bucket = requireValue(argv, index, arg), index += 1;
    else if (arg === "--touch-mode") args.touchMode = requireValue(argv, index, arg), index += 1;
    else if (arg === "--window-days") args.windowDays = Number(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--weight") args.weight = requireValue(argv, index, arg), index += 1;
    else if (arg === "--half-life-days") args.halfLifeDays = Number(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--min-share") args.minShare = Number(requireValue(argv, index, arg)), index += 1;
    else if (arg === "--ignore-author-regex") args.ignoreAuthorRegex = requireValue(argv, index, arg), index += 1;
    else if (arg === "--min-touches") args.minTouches = Number(requireValue(argv, index, arg)), index += 1;
    else throw new Error(`unrecognized argument: ${arg}`);
  }

  for (const [key, allowed] of Object.entries({
    identity: ["author", "committer"],
    dateField: ["author", "committer"],
    bucket: ["month", "quarter"],
    touchMode: ["commit", "file"],
    weight: ["touches", "recency"],
  })) {
    if (!allowed.includes(args[key])) throw new Error(`invalid ${key}: ${args[key]}`);
  }
  return args;
}

export function main(argv = process.argv.slice(2)) {
  try {
    const rows = generateRows(parseArgs(argv));
    if (!rows.length) {
      console.error("No commits touching community files for the selected window.");
      return 0;
    }
    console.log(toCsv(rows));
    return 0;
  } catch (error) {
    console.error(error.message);
    return /Data directory not found|Provide --file|not found|not required|Missing|Multiple matches|unrecognized|invalid|--repo/.test(error.message) ? 2 : 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
