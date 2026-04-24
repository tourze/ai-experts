#!/usr/bin/env node
// Warn about skills that do not have trigger eval cases.
//
// This is intentionally advisory: missing evals must not fail installation.

import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { repoRoot: resolve(scriptDir, "..") };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root") {
      args.repoRoot = resolve(argv[index + 1] ?? "");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function isDirectory(path) {
  return existsSync(path) && statSync(path).isDirectory();
}

function listDirectories(path) {
  if (!isDirectory(path)) {
    return [];
  }
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listSkillFiles(path) {
  if (!isDirectory(path)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const entryPath = join(path, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSkillFiles(entryPath));
      continue;
    }
    if (entry.isFile() && entry.name === "SKILL.md") {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function collectSkillEvals(repoRoot) {
  const pluginsRoot = join(repoRoot, "plugins");
  const skills = [];

  for (const pluginName of listDirectories(pluginsRoot)) {
    const skillsRoot = join(pluginsRoot, pluginName, "skills");
    for (const skillPath of listSkillFiles(skillsRoot)) {
      const skillDir = dirname(skillPath);
      const evalPath = join(skillDir, "evals", "cases.yaml");
      skills.push({
        pluginName,
        skillPath,
        evalPath,
        hasEvals: existsSync(evalPath),
      });
    }
  }

  return skills;
}

function groupByPlugin(skills) {
  const groups = new Map();
  for (const skill of skills) {
    if (!groups.has(skill.pluginName)) {
      groups.set(skill.pluginName, []);
    }
    groups.get(skill.pluginName).push(skill);
  }
  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function warn(message) {
  console.log(`[warn]  ${message}`);
}

function formatPath(repoRoot, path) {
  return relative(repoRoot, path).replaceAll("\\", "/");
}

function run(argv = process.argv.slice(2)) {
  const { repoRoot } = parseArgs(argv);
  const skills = collectSkillEvals(repoRoot);
  const missing = skills.filter((skill) => !skill.hasEvals);
  const covered = skills.length - missing.length;

  if (skills.length === 0) {
    warn("Skill eval coverage: no SKILL.md files found under plugins/*/skills/**/SKILL.md");
    return;
  }

  if (missing.length === 0) {
    console.log(`[ok]    Skill eval coverage: ${covered}/${skills.length}; all skills have evals/cases.yaml`);
    return;
  }

  warn(`Skill eval coverage: ${covered}/${skills.length} skills with evals/cases.yaml; ${missing.length} missing.`);
  warn("Missing skill evals/cases.yaml:");

  for (const [pluginName, pluginSkills] of groupByPlugin(missing)) {
    warn(`  ${pluginName} (${pluginSkills.length})`);
    for (const skill of pluginSkills) {
      warn(`    - ${formatPath(repoRoot, skill.skillPath)} -> ${formatPath(repoRoot, skill.evalPath)}`);
    }
  }
}

run();
