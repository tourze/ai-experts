#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export function toInt(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function toFloat(value) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isNaN(parsed) ? 0.0 : parsed;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows;
  return dataRows
    .filter((values) => values.some((value) => value !== ""))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

export function readCsv(path) {
  return parseCsv(readFileSync(path, "utf8"));
}

export function loadPeople(dataDir) {
  return readCsv(join(dataDir, "people.csv")).map((row) => ({
    ...row,
    touches: toInt(row.touches),
    commit_count: toInt(row.commit_count),
    sensitive_touches: toFloat(row.sensitive_touches),
  }));
}

export function loadFiles(dataDir) {
  return readCsv(join(dataDir, "files.csv")).map((row) => ({
    ...row,
    touches: toInt(row.touches),
    commit_count: toInt(row.commit_count),
    bus_factor: toInt(row.bus_factor),
    sensitivity_score: toFloat(row.sensitivity_score),
    sensitivity_tags: String(row.sensitivity_tags || "").split(";").filter(Boolean),
  }));
}

export function loadSummary(dataDir) {
  return JSON.parse(readFileSync(join(dataDir, "summary.json"), "utf8"));
}

export function loadCommunities(dataDir) {
  const path = join(dataDir, "communities.json");
  if (!existsSync(path)) {
    throw new Error("communities.json not found; rerun build with --communities");
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

export function loadCochangeEdges(dataDir) {
  const path = join(dataDir, "cochange_edges.csv");
  if (!existsSync(path)) {
    throw new Error("cochange_edges.csv not found; rerun build without --no-cochange");
  }
  return readCsv(path).map((row) => ({
    file_a: row.file_a,
    file_b: row.file_b,
    cochange_count: toInt(row.cochange_count),
    jaccard: toFloat(row.jaccard),
  }));
}

export function selectSingle(records, key, query) {
  const exact = records.filter((record) => String(record[key] || "") === query);
  if (exact.length) return exact[0];

  const contains = records.filter((record) => String(record[key] || "").includes(query));
  if (contains.length === 1) return contains[0];
  if (!contains.length) throw new Error(`No match for ${query}`);
  throw new Error(`Multiple matches for ${query}: ${contains.slice(0, 10).map((record) => record[key]).join(", ")}`);
}

export function sortRecords(records, key) {
  return [...records].sort((left, right) => {
    const leftValue = left[key] ?? 0;
    const rightValue = right[key] ?? 0;
    const leftNumber = Number(leftValue);
    const rightNumber = Number(rightValue);
    if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) return rightNumber - leftNumber;
    return String(rightValue).localeCompare(String(leftValue));
  });
}

export function topEdgesForPerson(dataDir, personId) {
  return readCsv(join(dataDir, "edges.csv"))
    .filter((row) => row.person_id === personId)
    .map((row) => ({
      file_id: row.file_id,
      touches: toInt(row.touches),
      recency_weight: toFloat(row.recency_weight),
      sensitive_weight: toFloat(row.sensitive_weight),
      last_seen: row.last_seen,
    }));
}

export function topEdgesForFile(dataDir, fileId) {
  return readCsv(join(dataDir, "edges.csv"))
    .filter((row) => row.file_id === fileId)
    .map((row) => ({
      person_id: row.person_id,
      touches: toInt(row.touches),
      recency_weight: toFloat(row.recency_weight),
      sensitive_weight: toFloat(row.sensitive_weight),
      last_seen: row.last_seen,
    }));
}

export function handlePeople(args, dataDir) {
  let people = loadPeople(dataDir);
  if (args.emailContains) people = people.filter((person) => String(person.email || "").includes(args.emailContains));
  people = people.filter((person) => person.touches >= args.minTouches);
  people = people.filter((person) => person.sensitive_touches >= args.minSensitive);
  return sortRecords(people, args.sort).slice(0, args.limit).map((person) => ({
    person_id: person.person_id,
    name: person.name,
    email: person.email,
    touches: person.touches,
    commit_count: person.commit_count,
    sensitive_touches: person.sensitive_touches,
    primary_tz_offset: person.primary_tz_offset,
  }));
}

export function handleFiles(args, dataDir) {
  let files = loadFiles(dataDir);
  if (args.pathContains) files = files.filter((file) => String(file.path || "").includes(args.pathContains));
  if (args.tag) files = files.filter((file) => file.sensitivity_tags.includes(args.tag));
  if (args.busFactorMax != null) files = files.filter((file) => file.bus_factor <= args.busFactorMax);
  files = files.filter((file) => file.sensitivity_score >= args.sensitivityMin);
  return sortRecords(files, args.sort).slice(0, args.limit).map((file) => ({
    file_id: file.file_id,
    path: file.path,
    touches: file.touches,
    bus_factor: file.bus_factor,
    sensitivity_score: file.sensitivity_score,
    sensitivity_tags: file.sensitivity_tags,
    last_seen: file.last_seen,
  }));
}

export function handlePerson(args, dataDir) {
  const person = selectSingle(loadPeople(dataDir), "person_id", args.person);
  const files = loadFiles(dataDir);
  const fileMap = new Map(files.map((file) => [file.file_id, file]));
  const edges = sortRecords(topEdgesForPerson(dataDir, person.person_id), args.sort).slice(0, args.limit);
  return {
    person: {
      person_id: person.person_id,
      name: person.name,
      email: person.email,
      touches: person.touches,
      commit_count: person.commit_count,
      sensitive_touches: person.sensitive_touches,
      primary_tz_offset: person.primary_tz_offset,
      timezone_offsets: person.timezone_offsets,
    },
    top_files: edges.map((edge) => ({
      file_id: edge.file_id,
      path: fileMap.get(edge.file_id)?.path,
      touches: edge.touches,
      recency_weight: edge.recency_weight,
      sensitive_weight: edge.sensitive_weight,
      last_seen: edge.last_seen,
      sensitivity_tags: fileMap.get(edge.file_id)?.sensitivity_tags,
    })),
  };
}

export function handleFile(args, dataDir) {
  const file = selectSingle(loadFiles(dataDir), "file_id", args.file);
  const people = loadPeople(dataDir);
  const peopleMap = new Map(people.map((person) => [person.person_id, person]));
  const edges = sortRecords(topEdgesForFile(dataDir, file.file_id), args.sort).slice(0, args.limit);
  return {
    file: {
      file_id: file.file_id,
      path: file.path,
      touches: file.touches,
      bus_factor: file.bus_factor,
      sensitivity_score: file.sensitivity_score,
      sensitivity_tags: file.sensitivity_tags,
      last_seen: file.last_seen,
    },
    top_people: edges.map((edge) => ({
      person_id: edge.person_id,
      name: peopleMap.get(edge.person_id)?.name,
      email: peopleMap.get(edge.person_id)?.email,
      touches: edge.touches,
      recency_weight: edge.recency_weight,
      sensitive_weight: edge.sensitive_weight,
      primary_tz_offset: peopleMap.get(edge.person_id)?.primary_tz_offset,
    })),
  };
}

export function handleCochange(args, dataDir) {
  const file = selectSingle(loadFiles(dataDir), "file_id", args.file);
  const neighbors = [];
  for (const row of loadCochangeEdges(dataDir)) {
    let other = null;
    if (row.file_a === file.file_id) other = row.file_b;
    else if (row.file_b === file.file_id) other = row.file_a;
    else continue;

    if (row.cochange_count < args.minCount || row.jaccard < args.minJaccard) continue;
    neighbors.push({
      file_id: other,
      path: other,
      cochange_count: row.cochange_count,
      jaccard: row.jaccard,
    });
  }

  return {
    file: { file_id: file.file_id, path: file.path },
    neighbors: sortRecords(neighbors, args.sort).slice(0, args.limit),
  };
}

export function handleTag(args, dataDir) {
  const taggedFiles = loadFiles(dataDir).filter((file) => file.sensitivity_tags.includes(args.tag));
  const taggedIds = new Set(taggedFiles.map((file) => file.file_id));
  const personTouch = new Map();
  for (const row of readCsv(join(dataDir, "edges.csv"))) {
    if (!taggedIds.has(row.file_id)) continue;
    personTouch.set(row.person_id, (personTouch.get(row.person_id) || 0) + toInt(row.touches));
  }
  const peopleMap = new Map(loadPeople(dataDir).map((person) => [person.person_id, person]));
  const topPeople = [...personTouch.entries()]
    .map(([personId, touches]) => ({
      person_id: personId,
      name: peopleMap.get(personId)?.name,
      email: peopleMap.get(personId)?.email,
      touches,
    }))
    .sort((left, right) => right.touches - left.touches)
    .slice(0, args.limit);
  const topFiles = sortRecords(taggedFiles, "touches").slice(0, args.limit);
  return {
    tag: args.tag,
    top_people: topPeople,
    top_files: topFiles.map((file) => ({
      file_id: file.file_id,
      path: file.path,
      touches: file.touches,
      bus_factor: file.bus_factor,
    })),
  };
}

export function handleSummary(args, dataDir) {
  const summary = loadSummary(dataDir);
  if (!args.section) return summary;
  if (!(args.section in summary)) throw new Error(`Section not found: ${args.section}`);
  return summary[args.section];
}

export function handleCommunities(args, dataDir) {
  const communities = loadCommunities(dataDir);
  if (args.id != null) {
    const match = communities.find((community) => community.id === args.id);
    if (!match) throw new Error(`Community id not found: ${args.id}`);
    return match;
  }
  return [...communities].sort((left, right) => Number(right.size || 0) - Number(left.size || 0)).slice(0, args.limit);
}

export function handleCommunity(args, dataDir) {
  const match = loadCommunities(dataDir).find((community) => community.id === args.id);
  if (!match) throw new Error(`Community id not found: ${args.id}`);
  const { files = [], ...payload } = match;
  if (args.includeFiles) {
    payload.files = files.slice(0, args.fileLimit);
    payload.files_truncated = files.length > args.fileLimit;
  }
  return payload;
}

function requireValue(argv, index, option) {
  const value = argv[index + 1];
  if (value == null || value.startsWith("--")) throw new Error(`${option} requires a value`);
  return value;
}

function parseCommonOptions(args, argv, index) {
  const arg = argv[index];
  if (arg === "--limit") {
    args.limit = toInt(requireValue(argv, index, arg));
    return 1;
  }
  if (arg === "--sort") {
    args.sort = requireValue(argv, index, arg);
    return 1;
  }
  return null;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { dataDir: "ownership-map-out" };
  let index = 0;
  while (index < argv.length) {
    const arg = argv[index];
    if (arg === "--data-dir") {
      args.dataDir = requireValue(argv, index, arg);
      index += 2;
    } else {
      break;
    }
  }

  args.command = argv[index];
  if (!args.command) throw new Error("command is required");
  index += 1;

  if (args.command === "people") {
    Object.assign(args, { limit: 20, sort: "touches", emailContains: null, minTouches: 0, minSensitive: 0.0 });
    for (; index < argv.length; index += 1) {
      const common = parseCommonOptions(args, argv, index);
      if (common != null) index += common;
      else if (argv[index] === "--email-contains") {
        args.emailContains = requireValue(argv, index, argv[index]);
        index += 1;
      } else if (argv[index] === "--min-touches") {
        args.minTouches = toInt(requireValue(argv, index, argv[index]));
        index += 1;
      } else if (argv[index] === "--min-sensitive") {
        args.minSensitive = toFloat(requireValue(argv, index, argv[index]));
        index += 1;
      }
      else throw new Error(`unrecognized argument: ${argv[index]}`);
    }
  } else if (args.command === "files") {
    Object.assign(args, { limit: 20, sort: "sensitivity_score", pathContains: null, tag: null, busFactorMax: null, sensitivityMin: 0.0 });
    for (; index < argv.length; index += 1) {
      const common = parseCommonOptions(args, argv, index);
      if (common != null) index += common;
      else if (argv[index] === "--path-contains") {
        args.pathContains = requireValue(argv, index, argv[index]);
        index += 1;
      } else if (argv[index] === "--tag") {
        args.tag = requireValue(argv, index, argv[index]);
        index += 1;
      } else if (argv[index] === "--bus-factor-max") {
        args.busFactorMax = toInt(requireValue(argv, index, argv[index]));
        index += 1;
      } else if (argv[index] === "--sensitivity-min") {
        args.sensitivityMin = toFloat(requireValue(argv, index, argv[index]));
        index += 1;
      }
      else throw new Error(`unrecognized argument: ${argv[index]}`);
    }
  } else if (args.command === "person") {
    Object.assign(args, { person: null, limit: 20, sort: "touches" });
    for (; index < argv.length; index += 1) {
      const common = parseCommonOptions(args, argv, index);
      if (common != null) index += common;
      else if (argv[index] === "--person") {
        args.person = requireValue(argv, index, argv[index]);
        index += 1;
      }
      else throw new Error(`unrecognized argument: ${argv[index]}`);
    }
    if (!args.person) throw new Error("--person is required");
  } else if (args.command === "file" || args.command === "cochange") {
    Object.assign(args, { file: null, limit: 20, sort: args.command === "cochange" ? "jaccard" : "touches", minJaccard: 0.0, minCount: 1 });
    for (; index < argv.length; index += 1) {
      const common = parseCommonOptions(args, argv, index);
      if (common != null) index += common;
      else if (argv[index] === "--file") {
        args.file = requireValue(argv, index, argv[index]);
        index += 1;
      } else if (argv[index] === "--min-jaccard") {
        args.minJaccard = toFloat(requireValue(argv, index, argv[index]));
        index += 1;
      } else if (argv[index] === "--min-count") {
        args.minCount = toInt(requireValue(argv, index, argv[index]));
        index += 1;
      }
      else throw new Error(`unrecognized argument: ${argv[index]}`);
    }
    if (!args.file) throw new Error("--file is required");
  } else if (args.command === "tag") {
    Object.assign(args, { tag: null, limit: 20 });
    for (; index < argv.length; index += 1) {
      const common = parseCommonOptions(args, argv, index);
      if (common != null) index += common;
      else if (argv[index] === "--tag") {
        args.tag = requireValue(argv, index, argv[index]);
        index += 1;
      }
      else throw new Error(`unrecognized argument: ${argv[index]}`);
    }
    if (!args.tag) throw new Error("--tag is required");
  } else if (args.command === "summary") {
    args.section = null;
    for (; index < argv.length; index += 1) {
      if (argv[index] === "--section") {
        args.section = requireValue(argv, index, argv[index]);
        index += 1;
      }
      else throw new Error(`unrecognized argument: ${argv[index]}`);
    }
  } else if (args.command === "communities") {
    Object.assign(args, { limit: 10, id: null });
    for (; index < argv.length; index += 1) {
      const common = parseCommonOptions(args, argv, index);
      if (common != null) index += common;
      else if (argv[index] === "--id") {
        args.id = toInt(requireValue(argv, index, argv[index]));
        index += 1;
      }
      else throw new Error(`unrecognized argument: ${argv[index]}`);
    }
  } else if (args.command === "community") {
    Object.assign(args, { id: null, includeFiles: false, fileLimit: 50 });
    for (; index < argv.length; index += 1) {
      if (argv[index] === "--id") {
        args.id = toInt(requireValue(argv, index, argv[index]));
        index += 1;
      }
      else if (argv[index] === "--include-files") args.includeFiles = true;
      else if (argv[index] === "--file-limit") {
        args.fileLimit = toInt(requireValue(argv, index, argv[index]));
        index += 1;
      }
      else throw new Error(`unrecognized argument: ${argv[index]}`);
    }
    if (args.id == null) throw new Error("--id is required");
  } else {
    throw new Error(`Unknown command: ${args.command}`);
  }

  return args;
}

export function handleCommand(args) {
  if (!existsSync(args.dataDir)) throw new Error(`Data directory not found: ${args.dataDir}`);
  if (args.command === "people") return handlePeople(args, args.dataDir);
  if (args.command === "files") return handleFiles(args, args.dataDir);
  if (args.command === "person") return handlePerson(args, args.dataDir);
  if (args.command === "file") return handleFile(args, args.dataDir);
  if (args.command === "cochange") return handleCochange(args, args.dataDir);
  if (args.command === "tag") return handleTag(args, args.dataDir);
  if (args.command === "summary") return handleSummary(args, args.dataDir);
  if (args.command === "communities") return handleCommunities(args, args.dataDir);
  if (args.command === "community") return handleCommunity(args, args.dataDir);
  throw new Error(`Unknown command: ${args.command}`);
}

export function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    console.log(JSON.stringify(handleCommand(args), null, 2));
    return 0;
  } catch (error) {
    console.error(error.message);
    return /Data directory not found|not found|No match|Multiple matches|Section not found|Unknown command|required/.test(error.message) ? 2 : 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
