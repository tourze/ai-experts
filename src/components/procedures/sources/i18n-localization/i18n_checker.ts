#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
/**
 * i18n Checker - Detects hardcoded strings and missing translations.
 * Scans for untranslated text in React, Vue, and Python files.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

export const procedure = defineCliProcedure({
  id: "i18n-localization-i18n-checker",
  entry: procedureEntry(import.meta.url),
  description:
    "扫描项目源码中的硬编码文案、检查 locale 翻译文件完整性和跨语言键一致性，发现缺失翻译和冗余键。",
  owners: { skillIds: ["i18n-localization"] },
  target: "scripts/i18n_checker.mjs",
  runtime: "node",
  params: [
    {
      flag: "[target]",
      type: "路径",
      description: "要扫描的项目文件或目录（默认 .）",
      required: false,
    },
  ],

  exampleArgs: { args: ["."] },
});

const HARDCODED_PATTERNS: Record<string, any> = {
  jsx: [
    />\s*[A-Z][a-zA-Z\s]{3,30}\s*</g,
    /(title|placeholder|label|alt|aria-label)="[A-Z][a-zA-Z\s]{2,}"/g,
    /<(button|h[1-6]|p|span|label)[^>]*>\s*[A-Z][a-zA-Z\s!?.,]{3,}\s*</g,
  ],
  vue: [
    />\s*[A-Z][a-zA-Z\s]{3,30}\s*</g,
    /(placeholder|label|title)="[A-Z][a-zA-Z\s]{2,}"/g,
  ],
  python: [
    /(print|raise\s+\w+)\s*\(\s*["'][A-Z][^"']{5,}["']/g,
    /flash\s*\(\s*["'][A-Z][^"']{5,}["']/g,
  ],
};
const I18N_PATTERNS: any[] = [
  /t\(["']/,
  /useTranslation/,
  /\$t\(/,
  /_\(["']/,
  /gettext\(/,
  /useTranslations/,
  /FormattedMessage/,
  /i18n\./,
];
const CODE_EXTENSIONS: Record<string, any> = {
  ".tsx": "jsx",
  ".jsx": "jsx",
  ".ts": "jsx",
  ".js": "jsx",
  ".vue": "vue",
  ".py": "python",
};
const SKIP_PARTS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "__pycache__",
  "venv",
]);
function walkFiles(root: any, predicate: any, results: any = []): any {
  if (!existsSync(root)) {
    return results;
  }
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (SKIP_PARTS.has(entry.name)) {
      continue;
    }
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, results);
    } else if (entry.isFile() && predicate(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}
function findLocaleFiles(projectPath: any): any {
  return walkFiles(projectPath, (file: any) => {
    const normalized = file.replaceAll("\\", "/");
    return (
      normalized.endsWith(".po") ||
      (normalized.endsWith(".json") &&
        (normalized.includes("/locales/") ||
          normalized.includes("/translations/") ||
          normalized.includes("/lang/") ||
          normalized.includes("/i18n/") ||
          /\/messages\/[^/]+\.json$/.test(normalized)))
    );
  });
}
function flattenKeys(value: any, prefix: any = ""): any {
  const keys = new Set();
  for (const [key, child] of Object.entries(value)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      for (const nested of flattenKeys(child, newKey)) {
        keys.add(nested);
      }
    } else {
      keys.add(newKey);
    }
  }
  return keys;
}
function checkLocaleCompleteness(localeFiles: any): any {
  const issues: any[] = [];
  const passed: any[] = [];
  if (localeFiles.length === 0) {
    return { passed: [], issues: ["[!] No locale files found"] };
  }
  const locales: Record<string, any> = {};
  for (const file of localeFiles) {
    if (extname(file) !== ".json") {
      continue;
    }
    try {
      const parts = file.replaceAll("\\", "/").split("/");
      const lang = parts.at(-2);
      const namespace = basename(file, ".json");
      const content = JSON.parse(readFileSync(file, "utf8"));
      locales[lang] ??= {};
      locales[lang][namespace] = flattenKeys(content);
    } catch {
      // Ignore malformed locale files to match the previous best-effort scanner.
    }
  }
  const languageNames = Object.keys(locales);
  if (languageNames.length < 2) {
    passed.push(`[OK] Found ${localeFiles.length} locale file(s)`);
    return { passed, issues };
  }
  passed.push(
    `[OK] Found ${languageNames.length} language(s): ${languageNames.join(", ")}`,
  );
  const baseLang = languageNames[0];
  for (const namespace of Object.keys(locales[baseLang] ?? {})) {
    const baseKeys = locales[baseLang][namespace] ?? new Set();
    for (const lang of languageNames.slice(1)) {
      const otherKeys = locales[lang]?.[namespace] ?? new Set();
      const missing = [...baseKeys].filter((key: any) => !otherKeys.has(key));
      if (missing.length > 0) {
        issues.push(`[X] ${lang}/${namespace}: Missing ${missing.length} keys`);
      }
      const extra = [...otherKeys].filter((key: any) => !baseKeys.has(key));
      if (extra.length > 0) {
        issues.push(`[!] ${lang}/${namespace}: ${extra.length} extra keys`);
      }
    }
  }
  if (issues.length === 0) {
    passed.push("[OK] All locales have matching keys");
  }
  return { passed, issues };
}
function checkHardcodedStrings(projectPath: any): any {
  const issues: any[] = [];
  const passed: any[] = [];
  const codeFiles = walkFiles(
    projectPath,
    (file: any) => extname(file) in CODE_EXTENSIONS,
  ).filter((file: any) => !/(?:test|spec)/.test(file));
  if (codeFiles.length === 0) {
    return { passed: ["[!] No code files found"], issues: [] };
  }
  let filesWithI18n = 0;
  let filesWithHardcoded = 0;
  const hardcodedExamples: any[] = [];
  for (const filePath of codeFiles.slice(0, 50)) {
    let content;
    try {
      content = readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    const fileType = CODE_EXTENSIONS[extname(filePath)] ?? "jsx";
    const hasI18n = I18N_PATTERNS.some((pattern: any) => pattern.test(content));
    if (hasI18n) {
      filesWithI18n += 1;
    }
    let hardcodedFound = false;
    for (const pattern of HARDCODED_PATTERNS[fileType] ?? []) {
      pattern.lastIndex = 0;
      const match = pattern.exec(content);
      if (match && !hasI18n) {
        hardcodedFound = true;
        if (hardcodedExamples.length < 5) {
          hardcodedExamples.push(
            `${basename(filePath)}: ${String(match[0]).slice(0, 40)}...`,
          );
        }
      }
    }
    if (hardcodedFound) {
      filesWithHardcoded += 1;
    }
  }
  passed.push(`[OK] Analyzed ${codeFiles.length} code files`);
  if (filesWithI18n > 0) {
    passed.push(`[OK] ${filesWithI18n} files use i18n`);
  }
  if (filesWithHardcoded > 0) {
    issues.push(`[X] ${filesWithHardcoded} files may have hardcoded strings`);
    for (const example of hardcodedExamples) {
      issues.push(`   → ${example}`);
    }
  } else {
    passed.push("[OK] No obvious hardcoded strings detected");
  }
  return { passed, issues };
}
export function main(argv: readonly string[]): any {
  const target = argv[0] ?? ".";
  const projectPath = target;
  if (!existsSync(projectPath) || !statSync(projectPath).isDirectory()) {
    console.error(`Error: ${target} is not a valid directory`);
    return 1;
  }
  console.log(`\n${"=".repeat(60)}`);
  console.log("  i18n CHECKER - Internationalization Audit");
  console.log(`${"=".repeat(60)}\n`);
  const localeResult = checkLocaleCompleteness(findLocaleFiles(projectPath));
  const codeResult = checkHardcodedStrings(projectPath);
  console.log("[LOCALE FILES]");
  console.log("-".repeat(40));
  for (const item of localeResult.passed) {
    console.log(`  ${item}`);
  }
  for (const item of localeResult.issues) {
    console.log(`  ${item}`);
  }
  console.log("\n[CODE ANALYSIS]");
  console.log("-".repeat(40));
  for (const item of codeResult.passed) {
    console.log(`  ${item}`);
  }
  for (const item of codeResult.issues) {
    console.log(`  ${item}`);
  }
  const criticalIssues = [...localeResult.issues, ...codeResult.issues].filter(
    (issue: any) => issue.startsWith("[X]"),
  ).length;
  console.log(`\n${"=".repeat(60)}`);
  if (criticalIssues === 0) {
    console.log("[OK] i18n CHECK: PASSED");
    return 0;
  }
  console.log(`[X] i18n CHECK: ${criticalIssues} issues found`);
  return 1;
}
