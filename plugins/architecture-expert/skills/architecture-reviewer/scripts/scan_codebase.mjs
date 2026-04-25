#!/usr/bin/env node
// Produce a structural fingerprint of a codebase for architecture review.
// Usage: node scan_codebase.mjs <path_to_codebase>

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const codebaseArg = process.argv[2] ?? ".";
const codebase = path.resolve(codebaseArg);

if (!isDirectory(codebase)) {
  console.log(`ERROR: Directory '${codebaseArg}' does not exist.`);
  process.exit(1);
}

process.chdir(codebase);

const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  "vendor",
  "__pycache__",
  ".venv",
  ".env",
  "dist",
  "build",
  ".next",
]);

const SOURCE_EXTENSIONS = new Set([
  ".py",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".rb",
  ".php",
  ".cs",
  ".cpp",
  ".c",
  ".swift",
  ".scala",
  ".ex",
  ".exs",
  ".zig",
  ".vue",
  ".svelte",
  ".dart",
]);

const TEST_RATIO_SOURCE_EXTENSIONS = new Set([
  ".py",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".go",
  ".rs",
  ".java",
  ".rb",
  ".php",
]);

const LARGEST_FILE_EXTENSIONS = TEST_RATIO_SOURCE_EXTENSIONS;
const SECRET_SCAN_EXTENSIONS = new Set([
  ".py",
  ".js",
  ".ts",
  ".java",
  ".go",
  ".rb",
  ".php",
  ".yaml",
  ".yml",
  ".json",
  ".toml",
  ".cfg",
  ".ini",
]);

function isDirectory(targetPath) {
  try {
    return fs.statSync(targetPath).isDirectory();
  } catch {
    return false;
  }
}

function isFile(targetPath) {
  try {
    return fs.statSync(targetPath).isFile();
  } catch {
    return false;
  }
}

function toPosix(relPath) {
  return relPath.split(path.sep).join("/");
}

function displayPath(relPath) {
  return `./${toPosix(relPath)}`;
}

function relDepth(relPath) {
  if (!relPath) {
    return 0;
  }
  return toPosix(relPath).split("/").filter(Boolean).length;
}

function shouldSkipDir(dirName) {
  return EXCLUDED_DIRS.has(dirName);
}

function walkEntries({
  root = process.cwd(),
  maxDepth = Infinity,
  includeFiles = true,
  includeDirs = false,
} = {}) {
  const entries = [];

  function visit(absDir, relDir) {
    let dirents;
    try {
      dirents = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const dirent of dirents) {
      const rel = relDir ? path.join(relDir, dirent.name) : dirent.name;
      const depth = relDepth(rel);
      if (depth > maxDepth) {
        continue;
      }

      const abs = path.join(root, rel);
      if (dirent.isDirectory()) {
        if (shouldSkipDir(dirent.name)) {
          continue;
        }
        if (includeDirs) {
          entries.push({ abs, rel, type: "dir" });
        }
        visit(abs, rel);
      } else if (includeFiles && dirent.isFile()) {
        entries.push({ abs, rel, type: "file" });
      }
    }
  }

  visit(root, "");
  return entries.sort((a, b) => toPosix(a.rel).localeCompare(toPosix(b.rel)));
}

function allFiles(options = {}) {
  return walkEntries({ ...options, includeFiles: true, includeDirs: false });
}

function allDirs(options = {}) {
  return walkEntries({ ...options, includeFiles: false, includeDirs: true });
}

function printOrNone(content) {
  const output = Array.isArray(content) ? content.join("\n") : String(content ?? "");
  if (output.trim().length > 0) {
    console.log(output);
  } else {
    console.log("  (none found)");
  }
}

function countLines(absPath) {
  try {
    const content = fs.readFileSync(absPath, "utf8");
    return (content.match(/\n/g) ?? []).length;
  } catch {
    return 0;
  }
}

function readText(absPath) {
  try {
    return fs.readFileSync(absPath, "utf8");
  } catch {
    return "";
  }
}

function extensionOf(relPath) {
  return path.extname(relPath);
}

function basename(relPath) {
  return path.basename(relPath);
}

function wildcardToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function nameMatches(fileName, patterns) {
  return patterns.some((pattern) => wildcardToRegExp(pattern).test(fileName));
}

function findFiles({ maxDepth = Infinity, patterns = [], predicate = () => true, limit = Infinity }) {
  const matches = [];
  for (const file of allFiles({ maxDepth })) {
    if (patterns.length > 0 && !nameMatches(basename(file.rel), patterns)) {
      continue;
    }
    if (!predicate(file)) {
      continue;
    }
    matches.push(displayPath(file.rel));
    if (matches.length >= limit) {
      break;
    }
  }
  return matches;
}

function git(args) {
  return spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function gitOutput(args) {
  const result = git(args);
  if (result.status !== 0) {
    return "";
  }
  return result.stdout.trimEnd();
}

function firstLine(text, fallback = "unknown") {
  const line = text.split(/\r?\n/).find((item) => item.trim().length > 0);
  return line ?? fallback;
}

function utcNow() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function isYaml(relPath) {
  return [".yaml", ".yml"].includes(extensionOf(relPath));
}

function hasSourceExtension(file) {
  return SOURCE_EXTENSIONS.has(extensionOf(file.rel));
}

function hasTestRatioSourceExtension(file) {
  return TEST_RATIO_SOURCE_EXTENSIONS.has(extensionOf(file.rel));
}

function topByName(patterns, maxDepth, limit) {
  return findFiles({ maxDepth, patterns, limit });
}

console.log("==============================================");
console.log("ARCHITECTURE REVIEW — CODEBASE SCAN");
console.log("==============================================");
console.log(`Scanned path: ${process.cwd()}`);
console.log(`Scan date:    ${utcNow()}`);
console.log("");

console.log("══════════════════════════════════════════════");
console.log("1. PROJECT OVERVIEW");
console.log("══════════════════════════════════════════════");

const files = allFiles();
console.log(`Total files (excluding generated): ${files.length}`);

const sourceFiles = files.filter(hasSourceExtension);
const locEstimate = sourceFiles.reduce((total, file) => total + countLines(file.abs), 0);
console.log(`Estimated source LOC: ${locEstimate}`);

console.log("");
console.log("Language distribution (by file count):");
const languageCounts = new Map();
for (const file of sourceFiles) {
  const ext = extensionOf(file.rel).slice(1);
  languageCounts.set(ext, (languageCounts.get(ext) ?? 0) + 1);
}
const languageDistribution = [...languageCounts.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 10)
  .map(([ext, count]) => `${String(count).padStart(7)} ${ext}`);
printOrNone(languageDistribution);

console.log("");
if (git(["rev-parse", "--is-inside-work-tree"]).status === 0) {
  console.log("Git repository: YES");
  if (git(["rev-parse", "--verify", "HEAD"]).status === 0) {
    const firstCommit = firstLine(gitOutput(["log", "--reverse", "--format=%ai"]));
    const lastCommit = firstLine(gitOutput(["log", "-1", "--format=%ai"]));
    const commitCount = gitOutput(["rev-list", "--count", "HEAD"]) || "unknown";
    const contributors = new Set(
      gitOutput(["log", "--format=%ae"])
        .split(/\r?\n/)
        .map((email) => email.trim())
        .filter(Boolean),
    );
    console.log(`  First commit:   ${firstCommit}`);
    console.log(`  Last commit:    ${lastCommit}`);
    console.log(`  Total commits:  ${commitCount}`);
    console.log(`  Contributors:   ${contributors.size}`);
  } else {
    console.log("  First commit:   unknown");
    console.log("  Last commit:    unknown");
    console.log("  Total commits:  0");
    console.log("  Contributors:   0");
  }
} else {
  console.log("Git repository: NO");
}

console.log("");
console.log("══════════════════════════════════════════════");
console.log("2. ARCHITECTURE INDICATORS");
console.log("══════════════════════════════════════════════");

console.log("");
console.log("Directory tree (top 2 levels):");
const directoryTree = allDirs({ maxDepth: 2 })
  .slice(0, 50)
  .map((dir) => {
    const depth = relDepth(dir.rel);
    const indent = "  ".repeat(Math.max(0, depth - 1));
    return `${indent}- ${basename(dir.rel)}`;
  });
printOrNone(directoryTree);

console.log("");
const workspaceFiles = findFiles({
  maxDepth: 2,
  patterns: ["pnpm-workspace.yaml", "lerna.json", "nx.json", "turbo.json", "rush.json"],
});
if (workspaceFiles.length > 0) {
  console.log("Monorepo indicator: YES");
  console.log(`  ${workspaceFiles.join("\n  ")}`);
} else {
  console.log("Monorepo indicator: NO (or not detected)");
}

console.log("");
console.log("══════════════════════════════════════════════");
console.log("3. INFRASTRUCTURE FILES");
console.log("══════════════════════════════════════════════");

console.log("");
console.log("Docker:");
printOrNone(
  topByName(["Dockerfile*", "docker-compose*.yml", "docker-compose*.yaml", ".dockerignore"], 4, 20),
);

console.log("");
console.log("Kubernetes:");
printOrNone(
  findFiles({
    maxDepth: 4,
    patterns: ["*.yaml", "*.yml"],
    limit: 20,
    predicate: (file) => isYaml(file.rel) && readText(file.abs).includes("apiVersion:"),
  }),
);

console.log("");
console.log("Terraform / IaC:");
printOrNone(
  topByName(
    ["*.tf", "*.tfvars", "template.yaml", "serverless.yml", "serverless.yaml", "cdk.json", "Pulumi.yaml"],
    4,
    20,
  ),
);

console.log("");
console.log("Reverse Proxy / Load Balancer:");
printOrNone(
  topByName(["nginx*.conf", "Caddyfile", "traefik*.yml", "traefik*.yaml", "haproxy*.cfg"], 4, 10),
);

console.log("");
console.log("CI/CD:");
const ciFiles = allFiles({ maxDepth: 3 })
  .filter((file) => {
    const rel = toPosix(file.rel);
    const name = basename(file.rel);
    return (
      (rel.startsWith(".github/workflows/") && isYaml(file.rel)) ||
      nameMatches(name, [
        "Jenkinsfile",
        ".gitlab-ci.yml",
        "buildspec.yml",
        "bitbucket-pipelines.yml",
        ".circleci",
      ])
    );
  })
  .map((file) => displayPath(file.rel));
printOrNone(ciFiles);

console.log("");
console.log("══════════════════════════════════════════════");
console.log("4. DEPENDENCY HEALTH");
console.log("══════════════════════════════════════════════");

console.log("");
console.log("Dependency manifests found:");
printOrNone(
  topByName(
    [
      "package.json",
      "requirements.txt",
      "pyproject.toml",
      "Pipfile",
      "go.mod",
      "Cargo.toml",
      "pom.xml",
      "build.gradle",
      "build.gradle.kts",
      "Gemfile",
      "composer.json",
      "mix.exs",
      "pubspec.yaml",
      "Package.swift",
    ],
    3,
    Infinity,
  ),
);

console.log("");
console.log("Lock files found:");
printOrNone(
  topByName(
    [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "poetry.lock",
      "Pipfile.lock",
      "go.sum",
      "Cargo.lock",
      "Gemfile.lock",
      "composer.lock",
      "mix.lock",
      "pubspec.lock",
      "Package.resolved",
    ],
    3,
    Infinity,
  ),
);

console.log("");
console.log("Environment files:");
printOrNone(topByName([".env", ".env.*", "env.*"], 3, Infinity));

if (isFile(path.join(process.cwd(), ".gitignore"))) {
  if (readText(path.join(process.cwd(), ".gitignore")).includes(".env")) {
    console.log("  .env in .gitignore: YES ✓");
  } else {
    console.log("  .env in .gitignore: NO ✗ (SECURITY CONCERN)");
  }
}

console.log("");
console.log("══════════════════════════════════════════════");
console.log("5. API SURFACE");
console.log("══════════════════════════════════════════════");

console.log("");
console.log("API definition files:");
printOrNone(
  topByName(
    [
      "openapi.*",
      "swagger.*",
      "*.openapi.yml",
      "*.openapi.yaml",
      "schema.graphql",
      "*.graphql",
      "*.gql",
      "*.proto",
    ],
    4,
    20,
  ),
);

console.log("");
console.log("══════════════════════════════════════════════");
console.log("6. TESTING INDICATORS");
console.log("══════════════════════════════════════════════");

console.log("");
console.log("Test directories:");
const testDirNames = new Set(["tests", "test", "__tests__", "spec", "e2e", "integration", "unit"]);
const testDirs = allDirs({ maxDepth: 3 })
  .filter((dir) => testDirNames.has(basename(dir.rel)))
  .slice(0, 20)
  .map((dir) => displayPath(dir.rel));
printOrNone(testDirs);

function isTestFile(file) {
  const rel = toPosix(file.rel);
  const name = basename(file.rel);
  const parts = rel.split("/");
  return (
    parts.includes("tests") ||
    parts.includes("test") ||
    parts.includes("__tests__") ||
    /^test_.*\.py$/.test(name) ||
    /^.*_test\.py$/.test(name) ||
    /^.*\.test\..+$/.test(name) ||
    /^.*\.spec\..+$/.test(name)
  );
}

const testFiles = files.filter(isTestFile);
console.log(`Test files found: ${testFiles.length}`);

const ratioSourceFiles = files.filter(hasTestRatioSourceExtension);
if (ratioSourceFiles.length > 0) {
  const ratio = ((testFiles.length / ratioSourceFiles.length) * 100).toFixed(2);
  console.log(
    `Test-to-source ratio: ${ratio}% (${testFiles.length} test files / ${ratioSourceFiles.length} source files)`,
  );
}

console.log("");
console.log("Test config files:");
printOrNone(
  topByName(
    [
      "jest.config.*",
      "vitest.config.*",
      "pytest.ini",
      "pyproject.toml",
      ".coveragerc",
      "phpunit.xml",
      "karma.conf.*",
      "cypress.config.*",
      "playwright.config.*",
      ".codecov.yml",
      "codecov.yml",
    ],
    3,
    10,
  ),
);

console.log("");
console.log("══════════════════════════════════════════════");
console.log("7. SECURITY INDICATORS");
console.log("══════════════════════════════════════════════");

console.log("");
console.log("Security config files:");
printOrNone(
  topByName(
    [".pre-commit-config.yaml", ".snyk", ".trivyignore", "SECURITY.md", ".gitleaks.toml", ".secretlintrc*"],
    3,
    10,
  ),
);

console.log("");
console.log("Potential hardcoded secret patterns (file count, not values):");
const secretPattern = /(password|api_key|secret_key|access_key|private_key)\s*[=:]\s*["'][^\s]+/i;
const potentialSecretFiles = files.filter((file) => {
  const name = basename(file.rel);
  if (name.endsWith(".lock") || name.endsWith(".min.js")) {
    return false;
  }
  if (!SECRET_SCAN_EXTENSIONS.has(extensionOf(file.rel))) {
    return false;
  }
  return secretPattern.test(readText(file.abs));
});
if (potentialSecretFiles.length > 0) {
  console.log(`  ⚠ Found ${potentialSecretFiles.length} files with potential hardcoded secret patterns`);
  console.log("    (Manual review recommended — may include false positives from examples/docs)");
} else {
  console.log("  No obvious hardcoded secret patterns detected ✓");
}

console.log("");
console.log("══════════════════════════════════════════════");
console.log("8. DOCUMENTATION");
console.log("══════════════════════════════════════════════");

console.log("");
const readmePath = path.join(process.cwd(), "README.md");
if (isFile(readmePath)) {
  console.log(`README.md: YES (${countLines(readmePath)} lines)`);
} else {
  console.log("README.md: NO");
}

console.log("");
console.log("Documentation files:");
printOrNone(
  topByName(
    ["ARCHITECTURE.md", "CONTRIBUTING.md", "CHANGELOG.md", "DESIGN.md", "DEPLOYMENT.md", "RUNBOOK.md"],
    3,
    Infinity,
  ),
);

console.log("");
console.log("ADR directory:");
printOrNone(
  allDirs({ maxDepth: 3 })
    .filter((dir) => ["adr", "ADR", "decisions"].includes(basename(dir.rel)))
    .map((dir) => displayPath(dir.rel)),
);

console.log("");
console.log("Docs directory:");
printOrNone(
  allDirs({ maxDepth: 2 })
    .filter((dir) => ["docs", "doc", "documentation"].includes(basename(dir.rel)))
    .map((dir) => displayPath(dir.rel)),
);

console.log("");
console.log("══════════════════════════════════════════════");
console.log("9. LARGEST SOURCE FILES (potential god objects)");
console.log("══════════════════════════════════════════════");

console.log("");
const largestFiles = files
  .filter((file) => LARGEST_FILE_EXTENSIONS.has(extensionOf(file.rel)))
  .filter((file) => {
    const name = basename(file.rel);
    return !name.endsWith(".lock") && !name.endsWith(".min.js") && !name.endsWith(".min.css") && !name.endsWith(".map") && !name.endsWith(".svg");
  })
  .map((file) => ({ file, lines: countLines(file.abs) }))
  .sort((a, b) => b.lines - a.lines || toPosix(a.file.rel).localeCompare(toPosix(b.file.rel)))
  .slice(0, 15)
  .map(({ file, lines }) => `${String(lines).padStart(8)} ${displayPath(file.rel)}`);
printOrNone(largestFiles);

console.log("");
console.log("==============================================");
console.log("SCAN COMPLETE");
console.log("==============================================");
