#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ALLOWED_PROPERTIES = new Set([
  "name",
  "description",
  "license",
  "allowed-tools",
  "metadata",
  "compatibility",
]);

function stripQuotes(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseFrontmatter(text) {
  const result = {};
  const lines = text.split(/\r?\n/);
  let currentBlockKey = null;
  let currentBlockLines = [];

  function flushBlock() {
    if (currentBlockKey) {
      result[currentBlockKey] = currentBlockLines.join("\n").trimEnd();
      currentBlockKey = null;
      currentBlockLines = [];
    }
  }

  for (const line of lines) {
    if (/^\s/.test(line) && currentBlockKey) {
      currentBlockLines.push(line.replace(/^\s{2}/, ""));
      continue;
    }
    if (/^\s/.test(line)) {
      continue;
    }
    flushBlock();

    if (!line.trim() || line.trim().startsWith("#")) {
      continue;
    }
    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) {
      throw new Error(`Unsupported YAML line: ${line}`);
    }

    const [, key, rawValue = ""] = match;
    if (rawValue === "|" || rawValue === ">") {
      currentBlockKey = key;
      currentBlockLines = [];
      continue;
    }
    if (!rawValue.trim()) {
      result[key] = {};
      continue;
    }
    result[key] = stripQuotes(rawValue);
  }
  flushBlock();
  return result;
}

export function validateSkill(skillPath) {
  const skillMd = join(skillPath, "SKILL.md");
  if (!existsSync(skillMd)) {
    return [false, "SKILL.md not found"];
  }

  const content = readFileSync(skillMd, "utf-8");
  if (!content.startsWith("---")) {
    return [false, "No YAML frontmatter found"];
  }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return [false, "Invalid frontmatter format"];
  }

  let frontmatter;
  try {
    frontmatter = parseFrontmatter(match[1]);
  } catch (error) {
    return [false, `Invalid YAML in frontmatter: ${error.message}`];
  }

  if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    return [false, "Frontmatter must be a YAML dictionary"];
  }

  const unexpectedKeys = Object.keys(frontmatter).filter((key) => !ALLOWED_PROPERTIES.has(key)).sort();
  if (unexpectedKeys.length) {
    return [
      false,
      `Unexpected key(s) in SKILL.md frontmatter: ${unexpectedKeys.join(", ")}. Allowed properties are: ${[...ALLOWED_PROPERTIES].sort().join(", ")}`,
    ];
  }

  if (!Object.hasOwn(frontmatter, "name")) {
    return [false, "Missing 'name' in frontmatter"];
  }
  if (!Object.hasOwn(frontmatter, "description")) {
    return [false, "Missing 'description' in frontmatter"];
  }

  const name = frontmatter.name;
  if (typeof name !== "string") {
    return [false, `Name must be a string, got ${typeof name}`];
  }
  const trimmedName = name.trim();
  if (trimmedName) {
    if (!/^[a-z0-9-]+$/.test(trimmedName)) {
      return [false, `Name '${trimmedName}' should be kebab-case (lowercase letters, digits, and hyphens only)`];
    }
    if (trimmedName.startsWith("-") || trimmedName.endsWith("-") || trimmedName.includes("--")) {
      return [false, `Name '${trimmedName}' cannot start/end with hyphen or contain consecutive hyphens`];
    }
    if (trimmedName.length > 64) {
      return [false, `Name is too long (${trimmedName.length} characters). Maximum is 64 characters.`];
    }
  }

  const description = frontmatter.description;
  if (typeof description !== "string") {
    return [false, `Description must be a string, got ${typeof description}`];
  }
  const trimmedDescription = description.trim();
  if (trimmedDescription) {
    if (trimmedDescription.includes("<") || trimmedDescription.includes(">")) {
      return [false, "Description cannot contain angle brackets (< or >)"];
    }
    if (trimmedDescription.length > 1024) {
      return [false, `Description is too long (${trimmedDescription.length} characters). Maximum is 1024 characters.`];
    }
  }

  const compatibility = frontmatter.compatibility ?? "";
  if (compatibility) {
    if (typeof compatibility !== "string") {
      return [false, `Compatibility must be a string, got ${typeof compatibility}`];
    }
    if (compatibility.length > 500) {
      return [false, `Compatibility is too long (${compatibility.length} characters). Maximum is 500 characters.`];
    }
  }

  return [true, "Skill is valid!"];
}

export function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) {
    console.log("Usage: node quick_validate.mjs <skill_directory>");
    return 1;
  }

  const [valid, message] = validateSkill(argv[0]);
  console.log(message);
  return valid ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
