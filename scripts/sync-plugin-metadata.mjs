#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(".");
const pluginsRoot = resolve(repoRoot, "plugins");
const marketplacePath = resolve(repoRoot, ".claude-plugin", "marketplace.json");

function parseArgs(argv) {
  const args = {
    check: false,
    write: false,
    plugins: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") {
      args.check = true;
      continue;
    }
    if (arg === "--write") {
      args.write = true;
      continue;
    }
    if (arg === "--plugins") {
      const raw = argv[index + 1] ?? "";
      args.plugins = new Set(
        raw
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      );
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (args.check === args.write) {
    throw new Error("Use exactly one of --check or --write");
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function writeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function listTrackedFiles() {
  return new Set(
    execFileSync("git", ["ls-files"], {
      cwd: repoRoot,
      encoding: "utf-8",
    })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  );
}

const trackedFiles = listTrackedFiles();

function getPluginRoots(filterSet = null) {
  return [...trackedFiles]
    .filter((file) => file.startsWith("plugins/") && file.endsWith("/.claude-plugin/plugin.json"))
    .map((file) => resolve(repoRoot, file.replace(/\/\.claude-plugin\/plugin\.json$/, "")))
    .filter((pluginRoot) => {
      if (filterSet === null) {
        return true;
      }
      return filterSet.has(basename(pluginRoot));
    })
    .sort();
}

function getTopLevelSkillNames(pluginRoot) {
  const skillsRoot = resolve(pluginRoot, "skills");
  if (!existsSync(skillsRoot)) {
    return [];
  }

  return readdirSync(skillsRoot)
    .filter((name) => {
      const skillRoot = resolve(skillsRoot, name);
      if (!statSync(skillRoot).isDirectory()) {
        return false;
      }
      const relativeSkillPath = `plugins/${basename(pluginRoot)}/skills/${name}/SKILL.md`;
      return trackedFiles.has(relativeSkillPath) && existsSync(resolve(skillRoot, "SKILL.md"));
    })
    .sort();
}

function getTopLevelAgentNames(pluginRoot) {
  const agentsRoot = resolve(pluginRoot, "agents");
  if (!existsSync(agentsRoot)) {
    return [];
  }

  return readdirSync(agentsRoot)
    .filter((name) => {
      if (!name.endsWith(".md")) {
        return false;
      }
      return trackedFiles.has(`plugins/${basename(pluginRoot)}/agents/${name}`);
    })
    .map((name) => name.replace(/\.md$/, ""))
    .sort();
}

function parseFrontmatter(filePath) {
  const content = readFileSync(filePath, "utf-8");
  if (!content.startsWith("---\n")) {
    return {};
  }

  const endMarker = "\n---\n";
  const endIndex = content.indexOf(endMarker, 4);
  if (endIndex < 0) {
    return {};
  }

  const block = content.slice(4, endIndex);
  const lines = block.split("\n");
  const result = {};

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
      result[key] = buffer.join("\n").trim();
      continue;
    }

    result[key] = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1").trim();
  }

  return result;
}

function getSkillDescription(pluginRoot, skillName) {
  const skillPath = resolve(pluginRoot, "skills", skillName, "SKILL.md");
  const frontmatter = parseFrontmatter(skillPath);
  return normalizeInlineText(frontmatter.description ?? "");
}

function getAgentDescription(pluginRoot, agentName) {
  const agentPath = resolve(pluginRoot, "agents", `${agentName}.md`);
  const frontmatter = parseFrontmatter(agentPath);
  const description = String(frontmatter.description ?? "").trim();
  if (description.length === 0) {
    return "";
  }

  const firstParagraph = description.split(/\n\s*\n/, 1)[0].replace(/\s+/g, " ").trim();
  const firstSentenceMatch = firstParagraph.match(/^(.+?[.!?。！？])(?:\s|$)/);
  const firstSentence = (firstSentenceMatch?.[1] ?? firstParagraph).trim();

  return normalizeInlineText(
    firstSentence
      .replace(/^Use this agent to\s+/i, "")
      .replace(/^Use this agent for\s+/i, "")
      .replace(/\.$/, ""),
  );
}

function normalizeInlineText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function getReadmeSections(markdown) {
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  const sections = [];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const title = match[1].trim();
    const headingStart = match.index;
    const bodyStart = headingStart + match[0].length;
    const nextHeadingStart = index + 1 < matches.length ? matches[index + 1].index : markdown.length;
    sections.push({
      title,
      headingStart,
      bodyStart,
      end: nextHeadingStart,
      body: markdown.slice(bodyStart, nextHeadingStart).trim(),
    });
  }

  return sections;
}

function findSection(sections, titles) {
  return sections.find((section) => titles.includes(section.title));
}

function parseIndexTable(sectionBody, label) {
  const rows = [];

  for (const line of sectionBody.split("\n")) {
    const match = line.match(/^\|\s*`([^`]+)`\s*\|\s*(.+?)\s*\|$/);
    if (!match) {
      continue;
    }

    const [, name, description] = match;
    if (name === label) {
      continue;
    }

    rows.push({ name, description: description.trim() });
  }

  return rows;
}

function splitIndexSectionBody(sectionBody, label) {
  const lines = sectionBody.split("\n");
  const headerPattern = new RegExp(`^\\|\\s*${label}\\s*\\|`);
  const startIndex = lines.findIndex((line) => headerPattern.test(line.trim()));

  if (startIndex < 0) {
    return {
      prefix: "",
      rows: [],
      suffix: "",
      hasTable: false,
    };
  }

  let endIndex = startIndex + 1;
  while (endIndex < lines.length && lines[endIndex].trim().startsWith("|")) {
    endIndex += 1;
  }

  return {
    prefix: lines.slice(0, startIndex).join("\n").trim(),
    rows: parseIndexTable(lines.slice(startIndex, endIndex).join("\n"), label),
    suffix: lines.slice(endIndex).join("\n").trim(),
    hasTable: true,
  };
}

function buildIndexRows({ expectedNames, existingRows, fallbackDescription }) {
  const expectedSet = new Set(expectedNames);
  const existingByName = new Map(existingRows.map((row) => [row.name, row.description]));
  const orderedExistingNames = existingRows.map((row) => row.name).filter((name) => expectedSet.has(name));
  const missingNames = expectedNames.filter((name) => !existingByName.has(name));
  const orderedNames = [...orderedExistingNames, ...missingNames];

  return orderedNames.map((name) => ({
    name,
    description: existingByName.get(name) ?? fallbackDescription(name),
  }));
}

function buildIndexTable(label, rows) {
  const lines = [`| ${label} | 用途 |`, "|-------|------|"];
  for (const row of rows) {
    lines.push(`| \`${row.name}\` | ${row.description} |`);
  }
  return lines.join("\n");
}

function replaceSectionBody(markdown, section, newBody) {
  const replacement = `${markdown.slice(section.headingStart, section.bodyStart)}\n\n${newBody}\n\n`;
  return `${markdown.slice(0, section.headingStart)}${replacement}${markdown.slice(section.end)}`;
}

function insertSection(markdown, title, newBody, beforeTitles) {
  const sections = getReadmeSections(markdown);
  const anchor = findSection(sections, beforeTitles);
  const snippet = `## ${title}\n\n${newBody}\n\n`;

  if (anchor) {
    return `${markdown.slice(0, anchor.headingStart)}${snippet}${markdown.slice(anchor.headingStart)}`;
  }

  return `${markdown.replace(/\s*$/, "")}\n\n${snippet}`;
}

function syncIndexSection(markdown, options) {
  const {
    expectedNames,
    label,
    preferredTitle,
    alternativeTitles,
    fallbackDescription,
    insertBeforeTitles,
  } = options;

  if (expectedNames.length === 0) {
    return markdown;
  }

  const sections = getReadmeSections(markdown);
  const titles = [preferredTitle, ...alternativeTitles];
  const existingSection = findSection(sections, titles);
  const sectionParts = existingSection
    ? splitIndexSectionBody(existingSection.body, label)
    : { prefix: "", rows: [], suffix: "", hasTable: false };
  const tableBody = buildIndexTable(
    label,
    buildIndexRows({
      expectedNames,
      existingRows: sectionParts.rows,
      fallbackDescription,
    }),
  );
  const nextBody = [sectionParts.prefix, tableBody, sectionParts.suffix]
    .filter((part) => part && part.trim().length > 0)
    .join("\n\n");

  if (existingSection) {
    return replaceSectionBody(markdown, existingSection, nextBody);
  }

  return insertSection(markdown, preferredTitle, nextBody, insertBeforeTitles);
}

function syncPluginReadme(pluginRoot) {
  const readmePath = resolve(pluginRoot, "README.md");
  const original = readFileSync(readmePath, "utf-8");

  let next = syncIndexSection(original, {
    expectedNames: getTopLevelSkillNames(pluginRoot),
    label: "Skill",
    preferredTitle: "Skills",
    alternativeTitles: ["技能"],
    fallbackDescription: (name) => getSkillDescription(pluginRoot, name),
    insertBeforeTitles: ["安装", "卸载", "验证命令", "验证", "校验"],
  });

  next = syncIndexSection(next, {
    expectedNames: getTopLevelAgentNames(pluginRoot),
    label: "Agent",
    preferredTitle: "Agents",
    alternativeTitles: [],
    fallbackDescription: (name) => getAgentDescription(pluginRoot, name),
    insertBeforeTitles: ["Hooks", "安装", "卸载", "验证命令", "验证", "校验"],
  });

  return { path: readmePath, content: next };
}

function buildMarketplaceManifest() {
  const current = readJson(marketplacePath);
  const plugins = getPluginRoots()
    .map((pluginRoot) => {
      const manifest = readJson(resolve(pluginRoot, ".claude-plugin", "plugin.json"));
      const name = basename(pluginRoot);
      return {
        name,
        source: `./plugins/${name}`,
        description: manifest.description,
        version: manifest.version,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    ...current,
    plugins,
  };
}

function collectExpectedFiles(filterSet = null) {
  const files = new Map();
  files.set(marketplacePath, writeJson(buildMarketplaceManifest()));

  for (const pluginRoot of getPluginRoots(filterSet)) {
    const synced = syncPluginReadme(pluginRoot);
    files.set(synced.path, synced.content);
  }

  return files;
}

function run(args) {
  const expectedFiles = collectExpectedFiles(args.plugins);
  const changedFiles = [];

  for (const [filePath, expectedContent] of expectedFiles.entries()) {
    const actualContent = readFileSync(filePath, "utf-8");
    if (actualContent !== expectedContent) {
      changedFiles.push(filePath);
      if (args.write) {
        writeFileSync(filePath, expectedContent);
      }
    }
  }

  if (args.write) {
    if (changedFiles.length === 0) {
      console.log("sync-plugin-metadata: already up to date");
      return;
    }

    for (const filePath of changedFiles) {
      console.log(`updated ${filePath.replace(`${repoRoot}/`, "")}`);
    }
    return;
  }

  if (changedFiles.length > 0) {
    for (const filePath of changedFiles) {
      console.error(`out of sync: ${filePath.replace(`${repoRoot}/`, "")}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("sync-plugin-metadata: OK");
}

export { buildMarketplaceManifest };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
