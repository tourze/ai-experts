#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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
      throw new Error(`不支持的 YAML 行：${line}`);
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
    return [false, "未找到 SKILL.md"];
  }

  const content = readFileSync(skillMd, "utf-8");
  if (!content.startsWith("---")) {
    return [false, "未找到 YAML frontmatter"];
  }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return [false, "frontmatter 格式无效"];
  }

  let frontmatter;
  try {
    frontmatter = parseFrontmatter(match[1]);
  } catch (error) {
    return [false, `frontmatter 中的 YAML 无效：${error.message}`];
  }

  if (!frontmatter || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    return [false, "Frontmatter 必须是 YAML dictionary"];
  }

  const unexpectedKeys = Object.keys(frontmatter).filter((key) => !ALLOWED_PROPERTIES.has(key)).sort();
  if (unexpectedKeys.length) {
    return [
      false,
      `SKILL.md frontmatter 中存在不支持的 key：${unexpectedKeys.join(", ")}。允许的 properties：${[...ALLOWED_PROPERTIES].sort().join(", ")}`,
    ];
  }

  if (!Object.hasOwn(frontmatter, "name")) {
    return [false, "frontmatter 缺少 'name'"];
  }
  if (!Object.hasOwn(frontmatter, "description")) {
    return [false, "frontmatter 缺少 'description'"];
  }

  const name = frontmatter.name;
  if (typeof name !== "string") {
    return [false, `Name 必须是 string，实际为 ${typeof name}`];
  }
  const trimmedName = name.trim();
  if (trimmedName) {
    if (!/^[a-z0-9-]+$/.test(trimmedName)) {
      return [false, `Name '${trimmedName}' 应为 kebab-case（只能包含小写字母、数字和连字符）`];
    }
    if (trimmedName.startsWith("-") || trimmedName.endsWith("-") || trimmedName.includes("--")) {
      return [false, `Name '${trimmedName}' 不能以连字符开头/结尾，也不能包含连续连字符`];
    }
    if (trimmedName.length > 64) {
      return [false, `Name 过长（${trimmedName.length} 个字符）。最大 64 个字符。`];
    }
  }

  const description = frontmatter.description;
  if (typeof description !== "string") {
    return [false, `Description 必须是 string，实际为 ${typeof description}`];
  }
  const trimmedDescription = description.trim();
  if (trimmedDescription) {
    if (trimmedDescription.includes("<") || trimmedDescription.includes(">")) {
      return [false, "Description 不能包含尖括号（< 或 >）"];
    }
    if (trimmedDescription.length > 1024) {
      return [false, `Description 过长（${trimmedDescription.length} 个字符）。最大 1024 个字符。`];
    }
  }

  const compatibility = frontmatter.compatibility ?? "";
  if (compatibility) {
    if (typeof compatibility !== "string") {
      return [false, `Compatibility 必须是 string，实际为 ${typeof compatibility}`];
    }
    if (compatibility.length > 500) {
      return [false, `Compatibility 过长（${compatibility.length} 个字符）。最大 500 个字符。`];
    }
  }

  return [true, "Skill 校验通过！"];
}

export function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) {
    console.log("用法：node quick_validate.mjs <skill_path>");
    return 1;
  }

  const [valid, message] = validateSkill(argv[0]);
  console.log(message);
  return valid ? 0 : 1;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
