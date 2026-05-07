#!/usr/bin/env node
/**
 * Web Quality Audit Script
 *
 * Analyzes HTML files for common quality issues and emits a JSON report.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
function usage(): any {
    console.error(`Usage: ${process.argv[1]} <file_or_directory>`);
    console.error("Analyzes HTML files for web quality issues.");
    process.exit(1);
}
function collectHtmlFiles(root: any): any {
    const files: any[] = [];
    function walk(current: any) {
        for (const entry of readdirSync(current, { withFileTypes: true })) {
            const fullPath = join(current, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
                continue;
            }
            if (entry.isFile() && /\.(html|htm)$/i.test(entry.name)) {
                files.push(fullPath);
            }
        }
    }
    walk(root);
    return files.sort();
}
function countImagesWithoutAlt(content: any): any {
    const matches = content.match(/<img\b(?![^>]*\balt=)[^>]*>/gi);
    return matches ? matches.length : 0;
}
function analyzeHtml(file: any, issues: any, warnings: any): any {
    console.error(`Analyzing: ${file}`);
    const content = readFileSync(file, "utf8");
    if (!/<!doctype html>/i.test(content)) {
        issues.push(`${file}: Missing HTML5 doctype`);
    }
    if (!/charset.*utf-8/i.test(content)) {
        warnings.push(`${file}: Missing or non-UTF-8 charset declaration`);
    }
    if (!/name="viewport"/i.test(content)) {
        issues.push(`${file}: Missing viewport meta tag`);
    }
    if (!/<html.*lang=/i.test(content)) {
        issues.push(`${file}: Missing lang attribute on <html>`);
    }
    const missingAltCount = countImagesWithoutAlt(content);
    if (missingAltCount > 0) {
        warnings.push(`${file}: Found ${missingAltCount} image(s) without alt text`);
    }
    if (!/<title>/i.test(content)) {
        issues.push(`${file}: Missing <title> tag`);
    }
    if (/http:\/\//.test(content)) {
        warnings.push(`${file}: Contains non-HTTPS URLs`);
    }
}
const target = process.argv[2];
if (!target) {
    usage();
}
const targetPath = resolve(target);
const issues: any[] = [];
const warnings: any[] = [];
if (existsSync(targetPath) && statSync(targetPath).isDirectory()) {
    for (const file of collectHtmlFiles(targetPath)) {
        analyzeHtml(file, issues, warnings);
    }
}
else if (existsSync(targetPath) && statSync(targetPath).isFile()) {
    analyzeHtml(targetPath, issues, warnings);
}
else {
    console.error(`Error: ${target} is not a valid file or directory`);
    process.exit(1);
}
console.log(JSON.stringify({
    issues,
    warnings,
    issueCount: issues.length,
    warningCount: warnings.length,
}, null, 2));
