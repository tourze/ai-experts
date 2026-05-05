#!/usr/bin/env node
/**
 * Brutal Honesty Code Assessment Script (Linus Mode)
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const RED = "\x1b[0;31m";
const YELLOW = "\x1b[1;33m";
const GREEN = "\x1b[0;32m";
const NC = "\x1b[0m";

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", "__pycache__", "venv"]);
const PROJECT_MARKERS = ["package.json", "pyproject.toml", "go.mod", "Cargo.toml", "composer.json", "Gemfile"];

function color(value, message) {
  return `${value}${message}${NC}`;
}

function usage() {
  console.log(`Usage: ${basename(process.argv[1])} <file-or-directory>`);
  return 1;
}

function resolvePath(target) {
  return resolve(target);
}

function findProjectRoot(targetPath) {
  let current = statSync(targetPath).isFile() ? dirname(targetPath) : targetPath;

  while (true) {
    for (const marker of PROJECT_MARKERS) {
      if (existsSync(resolve(current, marker))) {
        return current;
      }
    }

    if (
      existsSync(resolve(current, "tests"))
      || existsSync(resolve(current, "test"))
      || existsSync(resolve(current, "__tests__"))
    ) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return process.cwd();
    }
    current = parent;
  }
}

function collectFiles(targetPath) {
  if (statSync(targetPath).isFile()) {
    return [targetPath];
  }

  const files = [];
  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          walk(resolve(current, entry.name));
        }
      } else if (entry.isFile()) {
        files.push(resolve(current, entry.name));
      }
    }
  }

  walk(targetPath);
  return files;
}

function readFiles(files) {
  return files.map((file) => {
    try {
      return { file, content: readFileSync(file, "utf8") };
    } catch {
      return { file, content: "" };
    }
  });
}

function anyMatch(fileContents, pattern) {
  return fileContents.some(({ content }) => pattern.test(content));
}

function matchingLines(fileContents, pattern) {
  const lines = [];
  for (const { file, content } of fileContents) {
    for (const line of content.split(/\r?\n/)) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        lines.push(`${file}:${line}`);
      }
    }
  }
  return lines;
}

function assessCorrectness(fileContents) {
  console.log("📊 CORRECTNESS CHECK");
  console.log("-------------------");

  const markers = matchingLines(fileContents, /TODO|FIXME|BUG|HACK/g);
  if (markers.length > 0) {
    console.log(markers.join("\n"));
    console.log(color(RED, "🔴 FAILING: Found TODO/FIXME/BUG/HACK comments"));
    console.log("   → This code admits it's broken. Fix it before review.");
    return;
  }

  const suspiciousNulls = matchingLines(fileContents, /null|undefined/g)
    .filter((line) => !line.includes("!== null") && !line.includes("!== undefined"));
  if (suspiciousNulls.length > 0) {
    console.log(color(YELLOW, "🟡 WARNING: Potential null/undefined issues"));
    console.log("   → Are you handling null cases properly?");
  }

  console.log(color(GREEN, "✓ No obvious correctness issues"));
}

function assessPerformance(fileContents) {
  console.log("");
  console.log("⚡ PERFORMANCE CHECK");
  console.log("-------------------");

  const loops = matchingLines(fileContents, /for\s*\(.*\)\s*\{|for\s+.*\s+in\s+|for\s+.*\s+of\s+/g);
  if (loops.length > 5) {
    console.log(color(RED, `🔴 FAILING: Found ${loops.length} loops`));
    console.log("   → Are you creating O(n²) complexity where O(n) exists?");
    console.log("   → Use hash maps, sets, or better algorithms.");
  }

  if (anyMatch(fileContents, /readFileSync|writeFileSync/)) {
    console.log(color(RED, "🔴 FAILING: Synchronous file I/O detected"));
    console.log("   → You're blocking the event loop. Use async operations.");
  }

  console.log(color(GREEN, "✓ No obvious performance issues"));
}

function assessErrorHandling(fileContents) {
  console.log("");
  console.log("🛡️  ERROR HANDLING CHECK");
  console.log("----------------------");

  const tryCount = matchingLines(fileContents, /try|catch/g).length;
  if (tryCount === 0) {
    console.log(color(RED, "🔴 FAILING: No error handling found"));
    console.log("   → What happens when this code fails? It crashes.");
  } else {
    console.log(color(GREEN, "✓ Found error handling (verify it's sufficient)"));
  }

  if (anyMatch(fileContents, /catch\s*\([^)]*\)\s*\{\s*\}/)) {
    console.log(color(RED, "🔴 FAILING: Empty catch blocks detected"));
    console.log("   → Swallowing errors silently is worse than crashing.");
  }
}

function assessConcurrency(fileContents) {
  console.log("");
  console.log("🔀 CONCURRENCY CHECK");
  console.log("-------------------");

  if (anyMatch(fileContents, /global\.|window\./)) {
    console.log(color(YELLOW, "🟡 WARNING: Global state mutations detected"));
    console.log("   → Are you handling concurrent access safely?");
  }
  if (anyMatch(fileContents, /setTimeout|setInterval/)) {
    console.log(color(YELLOW, "🟡 WARNING: Timing-based code detected"));
    console.log("   → Are you creating race conditions?");
  }

  console.log(color(GREEN, "✓ Review concurrency manually"));
}

function assessTestability(targetPath, projectRoot, fileContents) {
  console.log("");
  console.log("🧪 TESTABILITY CHECK");
  console.log("-------------------");

  if (
    existsSync(resolve(projectRoot, "tests"))
    || existsSync(resolve(projectRoot, "test"))
    || existsSync(resolve(projectRoot, "__tests__"))
  ) {
    console.log(color(GREEN, "✓ Test directory exists"));
  } else {
    console.log(color(RED, "🔴 FAILING: No test directory found"));
    console.log("   → Where are the tests? Did you even test this?");
  }

  if (anyMatch(fileContents, /new\s+[A-Za-z_][A-Za-z0-9_]*\(/)) {
    const nonErrorConstructor = matchingLines(fileContents, /new\s+[A-Za-z_][A-Za-z0-9_]*\(/g)
      .some((line) => !line.includes("Error") && !line.includes("Date"));
    if (nonErrorConstructor) {
      console.log(color(YELLOW, "🟡 WARNING: Hard-coded dependencies detected"));
      console.log("   → Use dependency injection for testability.");
    }
  }
}

function countLongFunctions(content) {
  const lines = content.split(/\r?\n/);
  let start = null;
  let count = 0;

  lines.forEach((line, index) => {
    if (/^\s*(async\s+)?function\s+[A-Za-z0-9_]+/.test(line)) {
      start = index;
    }
    if (/^\s*const\s+[A-Za-z0-9_]+\s*=\s*(async\s*)?\([^)]*\)\s*=>/.test(line)) {
      start = index;
    }
    if (/^\s*}/.test(line) && start !== null) {
      if (index - start > 50) {
        count += 1;
      }
      start = null;
    }
  });

  return count;
}

function assessMaintainability(targetPath, fileContents) {
  console.log("");
  console.log("🔧 MAINTAINABILITY CHECK");
  console.log("-----------------------");

  if (statSync(targetPath).isFile()) {
    const longFunctions = countLongFunctions(readFileSync(targetPath, "utf8"));
    if (longFunctions > 0) {
      console.log(color(YELLOW, `🟡 WARNING: Found ${longFunctions} functions >50 lines`));
      console.log("   → Break down complex functions.");
    }
  }

  const hasMagicNumbers = matchingLines(fileContents, /\s[0-9]{3,}/g)
    .some((line) => !line.includes("1000") && !line.includes("2000"));
  if (hasMagicNumbers) {
    console.log(color(YELLOW, "🟡 WARNING: Magic numbers detected"));
    console.log("   → Use named constants.");
  }

  console.log(color(GREEN, "✓ Review code clarity manually"));
}

function main() {
  console.log("🔥 BRUTAL HONESTY CODE ASSESSMENT (Linus Mode)");
  console.log("================================================");
  console.log("");

  const target = process.argv[2];
  if (!target) {
    return usage();
  }

  if (!existsSync(target)) {
    console.log(color(RED, `🔴 FAILING: Target '${target}' does not exist`));
    return 1;
  }

  const targetPath = resolvePath(target);
  const projectRoot = findProjectRoot(targetPath);
  const fileContents = readFiles(collectFiles(targetPath));

  assessCorrectness(fileContents);
  assessPerformance(fileContents);
  assessErrorHandling(fileContents);
  assessConcurrency(fileContents);
  assessTestability(targetPath, projectRoot, fileContents);
  assessMaintainability(targetPath, fileContents);

  return 0;
}

process.exitCode = main();
