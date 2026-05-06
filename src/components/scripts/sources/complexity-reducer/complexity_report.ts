#!/usr/bin/env node
/**
 * Lightweight code complexity analyzer.
 *
 * Produces a JSON report of per-function complexity metrics for Python, Go, TS/JS, and Rust files.
 * No external dependencies. Python analysis uses indentation heuristics; other languages use regex heuristics.
 *
 * Usage:
 *   node complexity_report.mjs <file_or_directory> [--format json|markdown]
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
const LANG_MAP = new Map([
    [".py", "python"],
    [".go", "go"],
    [".ts", "typescript"],
    [".tsx", "typescript"],
    [".js", "javascript"],
    [".jsx", "javascript"],
    [".rs", "rust"],
]);
const FUNC_PATTERNS: Record<string, any> = {
    go: /^func\s+(?:\([^)]*\)\s+)?(\w+)\s*\(([^)]*)\)/,
    typescript: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/,
    javascript: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/,
    rust: /^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)/,
};
const BRANCH_KEYWORDS = /\b(if|else if|elif|else|for|while|match|switch|case|try|catch|except)\b/g;
const PYTHON_FUNCTION_PATTERN = /^([ \t]*)(?:async\s+def|def)\s+([A-Za-z_]\w*)\s*\(/;
const PYTHON_IMPORT_PATTERN = /^[ \t]*import\s+(.+)$/;
const PYTHON_FROM_IMPORT_PATTERN = /^[ \t]*from\s+[\w.]+\s+import\s+(.+)$/;
const PYTHON_BRANCH_PATTERN = /^(?:if\b|elif\b|for\b|async\s+for\b|while\b|try\b|except\b|match\b)/;
const PYTHON_NESTING_PATTERN = /^(?:if\b|elif\b|for\b|async\s+for\b|while\b|with\b|async\s+with\b|try\b|except\b|match\b)/;
const SKIP_DIRS = new Set(["node_modules", "vendor", "__pycache__", "target", ".git"]);
function splitLines(source: any): any {
    const lines = source.split(/\r\n|\n|\r/);
    if (lines.length > 0 && lines.at(-1) === "") {
        lines.pop();
    }
    return lines;
}
function stripPythonTripleQuotedStrings(lines: any): any {
    let activeQuote: any = null;
    return lines.map((line: any) => {
        let index = 0;
        let output = "";
        while (index < line.length) {
            if (activeQuote) {
                const end = line.indexOf(activeQuote, index);
                if (end === -1) {
                    break;
                }
                index = end + activeQuote.length;
                activeQuote = null;
                continue;
            }
            const single = line.indexOf("'''", index);
            const double = line.indexOf('"""', index);
            const candidates = [single, double].filter((position: any) => position !== -1);
            if (candidates.length === 0) {
                output += line.slice(index);
                break;
            }
            const next = Math.min(...candidates);
            output += line.slice(index, next);
            activeQuote = line.startsWith("'''", next) ? "'''" : '"""';
            index = next + activeQuote.length;
        }
        return output;
    });
}
function leadingIndent(line: any): any {
    let count = 0;
    for (const char of line) {
        if (char === " ")
            count += 1;
        else if (char === "\t")
            count += 4;
        else
            break;
    }
    return count;
}
function countOccurrences(text: any, needle: any): any {
    if (needle === "")
        return 0;
    let count = 0;
    let index = 0;
    while (true) {
        const found = text.indexOf(needle, index);
        if (found === -1)
            break;
        count += 1;
        index = found + needle.length;
    }
    return count;
}
function createFunctionMetrics({ file, name, lineStart, lineEnd, maxNestingDepth, branchCount, parameterCount, returnCount, cognitiveComplexity, }: any): any {
    return {
        file,
        name,
        line_start: lineStart,
        line_end: lineEnd,
        lines_of_code: lineEnd - lineStart + 1,
        max_nesting_depth: maxNestingDepth,
        branch_count: branchCount,
        parameter_count: parameterCount,
        return_count: returnCount,
        cognitive_complexity: cognitiveComplexity,
    };
}
function stripInlineComment(line: any): any {
    let quote: any = null;
    let escaped = false;
    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (char === "\\") {
            escaped = true;
            continue;
        }
        if (quote) {
            if (char === quote)
                quote = null;
            continue;
        }
        if (char === "'" || char === '"') {
            quote = char;
            continue;
        }
        if (char === "#") {
            return line.slice(0, index);
        }
    }
    return line;
}
function splitTopLevelCommas(text: any): any {
    const parts: any[] = [];
    let current = "";
    let depth = 0;
    let quote: any = null;
    let escaped = false;
    for (const char of text) {
        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }
        if (char === "\\") {
            current += char;
            escaped = true;
            continue;
        }
        if (quote) {
            current += char;
            if (char === quote)
                quote = null;
            continue;
        }
        if (char === "'" || char === '"') {
            quote = char;
            current += char;
            continue;
        }
        if ("([{".includes(char))
            depth += 1;
        if (")]}".includes(char))
            depth = Math.max(0, depth - 1);
        if (char === "," && depth === 0) {
            parts.push(current.trim());
            current = "";
            continue;
        }
        current += char;
    }
    if (current.trim()) {
        parts.push(current.trim());
    }
    return parts;
}
function extractParenthesized(lines: any, startIndex: any, openOffset: any): any {
    let depth = 0;
    let text = "";
    let started = false;
    for (let lineIndex = startIndex; lineIndex < lines.length; lineIndex += 1) {
        const line = stripInlineComment(lines[lineIndex]);
        const begin = lineIndex === startIndex ? openOffset : 0;
        for (let charIndex = begin; charIndex < line.length; charIndex += 1) {
            const char = line[charIndex];
            if (char === "(") {
                depth += 1;
                if (started)
                    text += char;
                started = true;
                continue;
            }
            if (char === ")") {
                depth -= 1;
                if (depth === 0)
                    return text;
                text += char;
                continue;
            }
            if (started)
                text += char;
        }
        if (started)
            text += "\n";
    }
    return text.trim();
}
function countPythonParameters(lines: any, startIndex: any): any {
    const openOffset = lines[startIndex].indexOf("(");
    if (openOffset === -1)
        return 0;
    const params = extractParenthesized(lines, startIndex, openOffset).trim();
    if (!params)
        return 0;
    return splitTopLevelCommas(params).filter((param: any) => {
        const normalized = param.trim();
        return normalized && normalized !== "/" && normalized !== "*";
    }).length;
}
function parsePythonImports(lines: any): any {
    const imports = new Set();
    const usedNames = new Set();
    for (const rawLine of lines) {
        const line = stripInlineComment(rawLine);
        const importMatch = line.match(PYTHON_IMPORT_PATTERN);
        const fromImportMatch = line.match(PYTHON_FROM_IMPORT_PATTERN);
        if (importMatch) {
            for (const part of splitTopLevelCommas(importMatch[1])) {
                const aliasMatch = part.match(/\bas\s+([A-Za-z_]\w*)$/);
                const name = aliasMatch ? aliasMatch[1] : part.trim().split(".")[0];
                if (name)
                    imports.add(name);
            }
            continue;
        }
        if (fromImportMatch) {
            for (const part of splitTopLevelCommas(fromImportMatch[1])) {
                const trimmed = part.trim();
                if (!trimmed || trimmed === "*")
                    continue;
                const aliasMatch = trimmed.match(/\bas\s+([A-Za-z_]\w*)$/);
                const name = aliasMatch ? aliasMatch[1] : trimmed.split(/\s+/)[0];
                if (name)
                    imports.add(name);
            }
            continue;
        }
        for (const match of line.matchAll(/\b[A-Za-z_]\w*\b/g)) {
            usedNames.add(match[0]);
        }
    }
    return [...imports].filter((name: any) => !usedNames.has(name)).sort();
}
function findPythonBlockEnd(lines: any, startIndex: any, functionIndent: any): any {
    let lastContentIndex = startIndex;
    for (let index = startIndex + 1; index < lines.length; index += 1) {
        const line = lines[index];
        if (!line.trim())
            continue;
        if (leadingIndent(line) <= functionIndent) {
            return lastContentIndex + 1;
        }
        lastContentIndex = index;
    }
    return lastContentIndex + 1;
}
function discoverPythonFunctions(lines: any): any {
    const functions: any[] = [];
    for (let index = 0; index < lines.length; index += 1) {
        const match = lines[index].match(PYTHON_FUNCTION_PATTERN);
        if (!match)
            continue;
        const indent = leadingIndent(match[1]);
        const end = findPythonBlockEnd(lines, index, indent);
        functions.push({
            name: match[2],
            startIndex: index,
            endIndex: end,
            indent,
            parameterCount: countPythonParameters(lines, index),
        });
    }
    return functions;
}
function isNestedDefinition(line: any): any {
    const trimmed = line.trim();
    return /^(?:async\s+def|def|class)\s+/.test(trimmed);
}
function findIndentedBlockEnd(lines: any, startIndex: any, indent: any, limitIndex: any): any {
    let lastContentIndex = startIndex;
    for (let index = startIndex + 1; index < limitIndex; index += 1) {
        const line = lines[index];
        if (!line.trim())
            continue;
        if (leadingIndent(line) <= indent) {
            return lastContentIndex + 1;
        }
        lastContentIndex = index;
    }
    return lastContentIndex + 1;
}
function analyzePythonFunction(lines: any, func: any): any {
    let maxNestingDepth = 0;
    let branchCount = 0;
    let returnCount = 0;
    let cognitiveComplexity = 0;
    const nestingStack: any[] = [];
    let index = func.startIndex + 1;
    while (index < func.endIndex) {
        const rawLine = lines[index];
        const line = stripInlineComment(rawLine);
        const trimmed = line.trim();
        if (!trimmed) {
            index += 1;
            continue;
        }
        const indent = leadingIndent(line);
        if (indent <= func.indent) {
            index += 1;
            continue;
        }
        if (isNestedDefinition(line)) {
            index = findIndentedBlockEnd(lines, index, indent, func.endIndex);
            continue;
        }
        while (nestingStack.length > 0 && indent <= nestingStack.at(-1)) {
            nestingStack.pop();
        }
        if (PYTHON_BRANCH_PATTERN.test(trimmed)) {
            branchCount += 1;
        }
        if (PYTHON_NESTING_PATTERN.test(trimmed)) {
            const depth = nestingStack.length + 1;
            maxNestingDepth = Math.max(maxNestingDepth, depth);
            cognitiveComplexity += 1 + nestingStack.length;
            nestingStack.push(indent);
        }
        if (/\b(?:and|or)\b/.test(trimmed)) {
            cognitiveComplexity += 1;
        }
        if (/^return\b/.test(trimmed)) {
            returnCount += 1;
        }
        index += 1;
    }
    return {
        maxNestingDepth,
        branchCount,
        returnCount,
        cognitiveComplexity,
    };
}
function analyzePython(source: any, filepath: any): any {
    const lines = splitLines(source);
    const codeLines = stripPythonTripleQuotedStrings(lines);
    const functions = discoverPythonFunctions(codeLines).map((func: any) => {
        const metrics = analyzePythonFunction(codeLines, func);
        return createFunctionMetrics({
            file: filepath,
            name: func.name,
            lineStart: func.startIndex + 1,
            lineEnd: func.endIndex,
            linesOfCode: func.endIndex - func.startIndex,
            maxNestingDepth: metrics.maxNestingDepth,
            branchCount: metrics.branchCount,
            parameterCount: func.parameterCount,
            returnCount: metrics.returnCount,
            cognitiveComplexity: metrics.cognitiveComplexity,
        });
    });
    return {
        file: filepath,
        language: "python",
        total_lines: lines.length,
        functions,
        dead_imports: parsePythonImports(codeLines),
    };
}
function analyzeGeneric(source: any, filepath: any, language: any): any {
    const lines = splitLines(source);
    const functions: any[] = [];
    const pattern = FUNC_PATTERNS[language];
    if (pattern) {
        let index = 0;
        while (index < lines.length) {
            const match = lines[index].trim().match(pattern);
            if (match) {
                const name = match[1];
                const params = match[2].trim();
                const parameterCount = params ? params.split(",").filter((param: any) => param.trim()).length : 0;
                const start = index + 1;
                const end = findBlockEnd(lines, index);
                const block = lines.slice(index, end);
                const blockText = block.join("\n");
                const branches = [...blockText.matchAll(BRANCH_KEYWORDS)].length;
                const maxNest = estimateMaxNesting(block);
                const returns = countOccurrences(blockText, "return ");
                functions.push(createFunctionMetrics({
                    file: filepath,
                    name,
                    lineStart: start,
                    lineEnd: end,
                    maxNestingDepth: maxNest,
                    branchCount: branches,
                    parameterCount,
                    returnCount: returns,
                    cognitiveComplexity: branches + maxNest,
                }));
                index = end;
            }
            else {
                index += 1;
            }
        }
    }
    return {
        file: filepath,
        language,
        total_lines: lines.length,
        functions,
        dead_imports: [],
    };
}
function findBlockEnd(lines: any, start: any): any {
    let depth = 0;
    for (let index = start; index < lines.length; index += 1) {
        depth += countOccurrences(lines[index], "{") - countOccurrences(lines[index], "}");
        if (depth <= 0 && index > start) {
            return index + 1;
        }
    }
    return lines.length;
}
function estimateMaxNesting(block: any): any {
    if (block.length === 0)
        return 0;
    const baseIndent = leadingIndent(block[0]);
    let maxDepth = 0;
    for (const line of block) {
        if (!line.trim())
            continue;
        const indent = leadingIndent(line);
        const depth = Math.max(0, Math.floor((indent - baseIndent) / 4));
        maxDepth = Math.max(maxDepth, depth);
    }
    return maxDepth;
}
function analyzeFile(filepath: any): any {
    const language = LANG_MAP.get(extname(filepath));
    if (!language)
        return null;
    let source;
    try {
        source = readFileSync(filepath, "utf-8");
    }
    catch {
        return null;
    }
    if (language === "python") {
        return analyzePython(source, filepath);
    }
    return analyzeGeneric(source, filepath, language);
}
function walkSourceFiles(targetPath: any, reports: any): any {
    let entries;
    try {
        entries = readdirSync(targetPath, { withFileTypes: true });
    }
    catch {
        return;
    }
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name))
                continue;
            walkSourceFiles(join(targetPath, entry.name), reports);
            continue;
        }
        if (!entry.isFile())
            continue;
        const report = analyzeFile(join(targetPath, entry.name));
        if (report)
            reports.push(report);
    }
}
function analyzePath(target: any): any {
    const reports: any[] = [];
    if (!existsSync(target))
        return reports;
    const stats = statSync(target);
    if (stats.isFile()) {
        const report = analyzeFile(target);
        if (report)
            reports.push(report);
    }
    else if (stats.isDirectory()) {
        walkSourceFiles(target, reports);
    }
    return reports;
}
function formatMarkdown(reports: any): any {
    const lines: any[] = ["# Complexity Report\n"];
    for (const report of reports) {
        lines.push(`## ${report.file} (${report.language}, ${report.total_lines} lines)\n`);
        if (report.dead_imports.length > 0) {
            lines.push(`⚠️  Potentially unused imports: ${report.dead_imports.join(", ")}\n`);
        }
        if (report.functions.length > 0) {
            lines.push("| Function | Lines | Nesting | Branches | Params | Cognitive |");
            lines.push("|----------|-------|---------|----------|--------|-----------|");
            for (const func of report.functions) {
                const flag = func.cognitive_complexity > 10 || func.max_nesting_depth > 3 ? " ⚠️" : "";
                lines.push(`| \`${func.name}\` | ${func.lines_of_code} | ${func.max_nesting_depth} | ` +
                    `${func.branch_count} | ${func.parameter_count} | ${func.cognitive_complexity}${flag} |`);
            }
            lines.push("");
        }
        else {
            lines.push("No functions detected.\n");
        }
    }
    return lines.join("\n");
}
function usage(scriptName: any): any {
    return `Usage: ${scriptName} <file_or_directory> [--format json|markdown]`;
}
function main(): any {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error(usage(process.argv[1]));
        process.exitCode = 1;
        return;
    }
    const target = args[0];
    let format = "json";
    const formatIndex = args.indexOf("--format");
    if (formatIndex !== -1 && formatIndex + 1 < args.length) {
        format = args[formatIndex + 1];
    }
    const reports = analyzePath(target);
    if (format === "markdown") {
        console.log(formatMarkdown(reports));
    }
    else {
        console.log(JSON.stringify(reports, null, 2));
    }
}
main();
