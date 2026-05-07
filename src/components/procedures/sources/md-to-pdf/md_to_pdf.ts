#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { accessSync, constants, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, } from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { renderKatexFile } from "./katex_render";
const requireFromScript = createRequire(import.meta.url);
const numberFormatter = new Intl.NumberFormat("en-US");
type PageFormat = "A4" | "Letter" | "Legal" | "A3";
type Margins = {
    top: string;
    right: string;
    bottom: string;
    left: string;
};
type CliOptions = {
    input: string;
    output: string;
    format: PageFormat;
    margin: string;
    noMermaid: boolean;
    noMath: boolean;
    css?: string;
    landscape: boolean;
    headerFooter: boolean;
};
type ProcessResult = {
    status: number | null;
    stdout: string;
    stderr: string;
    error?: Error;
};
type KatexStats = {
    inline: number;
    display: number;
    errors: number;
};
type PlaywrightModule = {
    chromium: {
        launch(options?: Record<string, unknown>): Promise<{
            newContext(): Promise<{
                newPage(): Promise<{
                    goto(url: string, options?: Record<string, unknown>): Promise<unknown>;
                    waitForTimeout(milliseconds: number): Promise<unknown>;
                    pdf(options: Record<string, unknown>): Promise<Buffer>;
                }>;
                close(): Promise<unknown>;
            }>;
            close(): Promise<unknown>;
        }>;
    };
};
const DEFAULT_CSS = `
/* === MD-TO-PDF: Professional Document Styles === */

@page {
    size: {page_format};
    margin: {margin_top} {margin_right} {margin_bottom} {margin_left};
}

body {
    font-family: 'Georgia', 'Times New Roman', 'DejaVu Serif', serif;
    font-size: 11pt;
    line-height: 1.65;
    color: #1a1a1a;
    max-width: none;
    padding: 0;
    margin: 0;
}

h1 {
    font-size: 22pt;
    font-weight: 700;
    color: #111;
    border-bottom: 2.5px solid #333;
    padding-bottom: 6px;
    margin-top: 0;
    margin-bottom: 0.6em;
}
h2 {
    font-size: 16pt;
    font-weight: 600;
    color: #1a1a1a;
    border-bottom: 1px solid #ccc;
    padding-bottom: 4px;
    margin-top: 1.6em;
    margin-bottom: 0.5em;
}
h3 {
    font-size: 13pt;
    font-weight: 600;
    color: #2a2a2a;
    margin-top: 1.3em;
    margin-bottom: 0.4em;
}
h4, h5, h6 {
    font-size: 11pt;
    font-weight: 600;
    color: #333;
    margin-top: 1em;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
    font-size: 10pt;
    page-break-inside: avoid;
}
thead th {
    background-color: #f0f0f0;
    font-weight: 700;
    text-align: left;
    padding: 8px 12px;
    border: 1px solid #bbb;
    border-bottom: 2px solid #999;
}
td {
    padding: 6px 12px;
    border: 1px solid #ddd;
    vertical-align: top;
}
tbody tr:nth-child(even) {
    background-color: #fafafa;
}

code {
    font-family: 'Courier New', 'DejaVu Sans Mono', monospace;
    font-size: 9.5pt;
    background: #f5f5f5;
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid #e8e8e8;
}
pre {
    background: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 14px 16px;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.45;
    page-break-inside: avoid;
    margin: 1em 0;
}
pre code {
    background: none;
    padding: 0;
    border: none;
    border-radius: 0;
}

.mermaid-diagram {
    text-align: center;
    margin: 1.5em auto;
    page-break-inside: avoid;
}
.mermaid-diagram svg {
    max-width: 100%;
    height: auto;
}

.katex-display {
    margin: 1em 0;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.25em 0;
}
.katex {
    font-size: 1.1em;
}

ul, ol {
    padding-left: 1.8em;
    margin: 0.5em 0;
}
li {
    margin-bottom: 0.25em;
}
li > p {
    margin: 0.25em 0;
}

blockquote {
    border-left: 3px solid #999;
    margin: 1em 0;
    padding: 0.5em 0 0.5em 1.2em;
    color: #444;
    background: #fcfcfc;
}
blockquote p {
    margin: 0.3em 0;
}

hr {
    border: none;
    border-top: 1px solid #ccc;
    margin: 2em 0;
}

a {
    color: #1a5276;
    text-decoration: none;
}

img {
    max-width: 100%;
    height: auto;
}

dt { font-weight: bold; margin-top: 0.5em; }
dd { margin-left: 1.5em; margin-bottom: 0.5em; }

.footnotes { font-size: 9pt; border-top: 1px solid #ccc; margin-top: 2em; padding-top: 0.5em; }
.footnote-ref { font-size: 8pt; vertical-align: super; }

.page-break { page-break-before: always; }
`;
const HEADER_FOOTER_CSS = `
@page {
    @bottom-center {
        content: counter(page);
        font-size: 9pt;
        color: #888;
        font-family: 'Helvetica Neue', Arial, sans-serif;
    }
}
`;
function usage(): string {
    return [
        "Usage: node md_to_pdf.mjs <input.md> <output.pdf> [OPTIONS]",
        "",
        "Options:",
        "  --format <A4|Letter|Legal|A3>       Page format (default: A4)",
        "  --margin <value|top,right,bottom,left>",
        "                                      Margins (default: 0.75in)",
        "  --no-mermaid                        Skip Mermaid diagram rendering",
        "  --no-math                           Skip KaTeX math rendering",
        "  --css <file>                         Additional custom CSS file",
        "  --landscape                          Use landscape orientation",
        "  --header-footer                      Show page numbers in footer",
        "  -h, --help                           Show this help",
    ].join("\n");
}
function fail(message: string, exitCode: any = 1): never {
    console.error(message);
    process.exit(exitCode);
}
function parsePageFormat(value: string): PageFormat {
    if (value === "A4" || value === "Letter" || value === "Legal" || value === "A3") {
        return value;
    }
    fail(`ERROR: Invalid --format '${value}'. Expected A4, Letter, Legal, or A3.`);
}
function takeValue(args: string[], index: number, flag: string): string {
    const value = args[index + 1];
    if (!value || value.startsWith("-")) {
        fail(`ERROR: ${flag} requires a value.`);
    }
    return value;
}
function parseArgs(argv: string[]): CliOptions {
    const options: Omit<CliOptions, "input" | "output"> = {
        format: "A4",
        margin: "0.75in",
        noMermaid: false,
        noMath: false,
        landscape: false,
        headerFooter: false,
    };
    const positional: string[] = [];
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        switch (arg) {
            case "-h":
            case "--help":
                console.log(usage());
                process.exit(0);
            case "--format":
                options.format = parsePageFormat(takeValue(argv, index, arg));
                index += 1;
                break;
            case "--margin":
                options.margin = takeValue(argv, index, arg);
                index += 1;
                break;
            case "--css":
                options.css = takeValue(argv, index, arg);
                index += 1;
                break;
            case "--no-mermaid":
                options.noMermaid = true;
                break;
            case "--no-math":
                options.noMath = true;
                break;
            case "--landscape":
                options.landscape = true;
                break;
            case "--header-footer":
                options.headerFooter = true;
                break;
            default:
                if (arg.startsWith("-")) {
                    fail(`ERROR: Unknown option '${arg}'.\n\n${usage()}`);
                }
                positional.push(arg);
        }
    }
    if (positional.length !== 2) {
        fail(`${usage()}\n\nERROR: Expected input and output paths.`);
    }
    return {
        input: positional[0],
        output: positional[1],
        ...options,
    };
}
function formatCount(value: number): string {
    return numberFormatter.format(value);
}
function isExecutable(filePath: string): boolean {
    try {
        const stat = statSync(filePath);
        if (!stat.isFile()) {
            return false;
        }
        if (process.platform === "win32") {
            return true;
        }
        accessSync(filePath, constants.X_OK);
        return true;
    }
    catch {
        return false;
    }
}
function findChromeUnder(root: string, names: Set<string>, maxEntries: any = 5000): string | null {
    const stack: any[] = [root];
    let visited = 0;
    while (stack.length > 0 && visited < maxEntries) {
        const current = stack.pop();
        if (!current) {
            continue;
        }
        visited += 1;
        let stat;
        try {
            stat = statSync(current);
        }
        catch {
            continue;
        }
        if (stat.isFile() && names.has(current.split(/[\\/]/).pop() || "") && isExecutable(current)) {
            return current;
        }
        if (!stat.isDirectory()) {
            continue;
        }
        let entries: string[];
        try {
            entries = readdirSync(current);
        }
        catch {
            continue;
        }
        for (const entry of entries) {
            stack.push(join(current, entry));
        }
    }
    return null;
}
function findChromeBinary(): string | null {
    const home = homedir();
    const chromeNames = new Set(["chrome", "chrome.exe", "chromium", "chromium.exe", "Google Chrome", "Chromium"]);
    const candidates: any[] = [
        join(home, ".cache", "puppeteer", "chrome"),
        "/opt/google/chrome/chrome",
        "/opt/pw-browsers",
        join(home, ".cache", "ms-playwright"),
        join(home, "Library", "Caches", "ms-playwright"),
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
        "/usr/bin/google-chrome",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];
    for (const candidate of candidates) {
        if (!existsSync(candidate)) {
            continue;
        }
        try {
            const stat = statSync(candidate);
            if (stat.isFile() && isExecutable(candidate)) {
                return candidate;
            }
            if (stat.isDirectory()) {
                const found = findChromeUnder(candidate, chromeNames);
                if (found) {
                    return found;
                }
            }
        }
        catch {
            // Try the next candidate.
        }
    }
    return null;
}
function createPuppeteerConfig(tempDir: string): string {
    let chromePath = findChromeBinary();
    if (!chromePath) {
        console.error("WARNING: No Chrome/Chromium binary found. Mermaid rendering may fail.");
        chromePath = "chromium";
    }
    const configPath = join(tempDir, "puppeteer-config.json");
    writeFileSync(configPath, JSON.stringify({
        executablePath: chromePath,
        args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    }), "utf8");
    return configPath;
}
function run(command: string, args: string[], timeoutMs: any = 30000): ProcessResult {
    const result = spawnSync(command, args, {
        encoding: "utf8",
        maxBuffer: 100 * 1024 * 1024,
        timeout: timeoutMs,
    });
    return {
        status: result.status,
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        error: result.error,
    };
}
function npmGlobalRoot(): string | null {
    const result = run("npm", ["root", "-g"], 10000);
    if (result.status !== 0) {
        return null;
    }
    const root = result.stdout.trim();
    return root && existsSync(root) ? root : null;
}
function resolveNodeModule(request: string): string | null {
    try {
        return requireFromScript.resolve(request);
    }
    catch {
        const root = npmGlobalRoot();
        if (!root) {
            return null;
        }
        try {
            return requireFromScript.resolve(join(root, request));
        }
        catch {
            return null;
        }
    }
}
function requireNodeModule<T>(request: string): T {
    try {
        return requireFromScript(request) as T;
    }
    catch (localError: any) {
        const root = npmGlobalRoot();
        if (root) {
            try {
                return requireFromScript(join(root, request)) as T;
            }
            catch {
                // Report the original local resolution error below.
            }
        }
        throw localError;
    }
}
function findKatexCss(): {
    cssPath: string;
    fontsDir: string;
} | null {
    const packageJsonPath = resolveNodeModule("katex/package.json");
    if (!packageJsonPath) {
        return null;
    }
    const distDir = join(dirname(packageJsonPath), "dist");
    const cssPath = join(distDir, "katex.min.css");
    const fontsDir = join(distDir, "fonts");
    if (existsSync(cssPath) && existsSync(fontsDir) && statSync(fontsDir).isDirectory()) {
        return { cssPath, fontsDir };
    }
    return null;
}
function renderMermaidBlocks(markdown: string, tempDir: string, puppeteerConfig: string, mermaidConfig?: string): string {
    const pattern = /```mermaid\n([\s\S]*?)```/g;
    const matches: any[] = [...markdown.matchAll(pattern)];
    if (matches.length === 0) {
        return markdown;
    }
    console.log(`  Mermaid: found ${matches.length} diagram(s)`);
    const mmdcBase: any[] = ["-p", puppeteerConfig, "-b", "transparent", "-w", "800"];
    if (mermaidConfig && existsSync(mermaidConfig) && statSync(mermaidConfig).isFile()) {
        mmdcBase.push("-c", mermaidConfig);
    }
    let result = markdown;
    for (let reversedIndex = 0; reversedIndex < matches.length; reversedIndex += 1) {
        const match = matches[matches.length - 1 - reversedIndex];
        const mermaidCode = (match[1] || "").trim();
        const start = match.index ?? 0;
        const end = start + match[0].length;
        const mmdFile = join(tempDir, `mermaid_${reversedIndex}.mmd`);
        const svgFile = join(tempDir, `mermaid_${reversedIndex}.svg`);
        writeFileSync(mmdFile, mermaidCode, "utf8");
        const proc = run("mmdc", [...mmdcBase, "-i", mmdFile, "-o", svgFile], 30000);
        const diagramNumber = matches.length - reversedIndex;
        if (existsSync(svgFile)) {
            const svgContent = readFileSync(svgFile, "utf8").replace(/<\?xml[^?]*\?>\s*/, "");
            const replacement = `\n<div class="mermaid-diagram">\n${svgContent}\n</div>\n`;
            result = result.slice(0, start) + replacement + result.slice(end);
            console.log(`    Diagram ${diagramNumber}/${matches.length}: OK (${formatCount(svgContent.length)} chars)`);
            continue;
        }
        if (proc.error && proc.error.name === "ETIMEDOUT") {
            console.error(`    Diagram ${diagramNumber}/${matches.length}: TIMEOUT`);
        }
        else {
            const error = (proc.stderr || proc.error?.message || "unknown error").slice(0, 300);
            console.error(`    Diagram ${diagramNumber}/${matches.length}: FAILED - ${error}`);
        }
    }
    return result;
}
function markdownToHtml(markdownPath: string, title: string): string {
    const args: any[] = [
        markdownPath,
        "-f",
        [
            "markdown+pipe_tables+fenced_code_blocks+backtick_code_blocks+fenced_divs",
            "+tex_math_dollars+yaml_metadata_block+strikeout+footnotes+definition_lists",
            "+smart+autolink_bare_uris",
        ].join(""),
        "-t",
        "html5",
        "--katex",
        "--standalone",
        "--highlight-style",
        "pygments",
        "--metadata",
        title ? `title=${title}` : "title= ",
    ];
    const result = run("pandoc", args, 30000);
    if (result.error && result.error.message) {
        throw new Error(`pandoc failed to start: ${result.error.message}`);
    }
    if (result.status !== 0) {
        console.error(`  pandoc warning: ${(result.stderr || "unknown error").slice(0, 500)}`);
    }
    return result.stdout;
}
function renderKatex(htmlPath: string, outputPath: string): KatexStats {
    try {
        return renderKatexFile(htmlPath, outputPath);
    }
    catch (error: any) {
        console.error(`  KaTeX warning: ${(error instanceof Error ? error.message : String(error)).slice(0, 500)}`);
        copyFileSync(htmlPath, outputPath);
        return { inline: 0, display: 0, errors: 0 };
    }
}
function injectCss(html: string, pageFormat: PageFormat, margins: Margins, headerFooter: boolean, customCssPath?: string): string {
    const katex = findKatexCss();
    let katexCss = "";
    if (katex) {
        katexCss = readFileSync(katex.cssPath, "utf8").replaceAll("fonts/", `file://${katex.fontsDir}/`);
    }
    let documentCss = DEFAULT_CSS.replace("{page_format}", pageFormat)
        .replace("{margin_top}", margins.top)
        .replace("{margin_right}", margins.right)
        .replace("{margin_bottom}", margins.bottom)
        .replace("{margin_left}", margins.left);
    if (headerFooter) {
        documentCss += HEADER_FOOTER_CSS;
    }
    let customCss = "";
    if (customCssPath && existsSync(customCssPath) && statSync(customCssPath).isFile()) {
        customCss = readFileSync(customCssPath, "utf8");
    }
    let injection = `
<style>/* KaTeX */
${katexCss}</style>
<style>/* Document */
${documentCss}</style>
`;
    if (customCss) {
        injection += `<style>/* Custom */\n${customCss}</style>\n`;
    }
    let result = html.includes("</head>") ? html.replace("</head>", `${injection}</head>`) : `${injection}${html}`;
    result = result.replace(/<link[^>]*katex[^>]*\/?>/g, "");
    result = result.replace(/<script[^>]*katex[^>]*>[\s\S]*?<\/script>/g, "");
    return result;
}
async function htmlToPdf(htmlPath: string, pdfPath: string, pageFormat: PageFormat, margins: Margins, landscape: boolean, headerFooter: boolean): Promise<void> {
    let playwright: PlaywrightModule;
    try {
        playwright = requireNodeModule<PlaywrightModule>("playwright");
    }
    catch {
        throw new Error("playwright is not installed. Run `node scripts/setup.mjs --install` or `npm install -g playwright`.");
    }
    const browser = await playwright.chromium.launch({
        args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--disable-software-rasterizer"],
    });
    try {
        const context = await browser.newContext();
        try {
            const page = await context.newPage();
            await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
            await page.waitForTimeout(800);
            await page.pdf({
                path: pdfPath,
                format: pageFormat,
                margin: margins,
                printBackground: true,
                landscape,
                displayHeaderFooter: headerFooter,
                footerTemplate: headerFooter
                    ? '<div style="font-size:9px; color:#888; text-align:center; width:100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
                    : undefined,
                headerTemplate: headerFooter ? "<div></div>" : undefined,
            });
        }
        finally {
            await context.close();
        }
    }
    finally {
        await browser.close();
    }
}
function parseMargins(margin: string): Margins {
    const parts = margin.split(",").map((part: any): any => part.trim()).filter(Boolean);
    if (parts.length === 1) {
        return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
    }
    if (parts.length === 4) {
        return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
    }
    console.error(`WARNING: Invalid margin format '${margin}', using default.`);
    return { top: "0.75in", right: "0.75in", bottom: "0.75in", left: "0.75in" };
}
function extractTitle(markdown: string): string {
    const match = markdown.match(/^---\s*\n[\s\S]*?title:\s*(.+?)\n[\s\S]*?---/);
    return match ? match[1].trim().replace(/^["']|["']$/g, "") : "";
}
async function main(): Promise<string> {
    const args = parseArgs(process.argv.slice(2));
    const inputPath = resolve(args.input);
    const outputPath = resolve(args.output);
    const margins = parseMargins(args.margin);
    if (!existsSync(inputPath)) {
        fail(`ERROR: Input file not found: ${inputPath}`);
    }
    mkdirSync(dirname(outputPath), { recursive: true });
    console.log(`Converting: ${inputPath.split(/[\\/]/).pop()} -> ${outputPath.split(/[\\/]/).pop()}`);
    console.log(`  Format: ${args.format} | Landscape: ${args.landscape} | Page numbers: ${args.headerFooter}`);
    const tempDir = mkdtempSync(join(tmpdir(), "md2pdf_"));
    try {
        let markdown = readFileSync(inputPath, "utf8");
        const title = extractTitle(markdown);
        if (!args.noMermaid) {
            const puppeteerConfig = createPuppeteerConfig(tempDir);
            markdown = renderMermaidBlocks(markdown, tempDir, puppeteerConfig, process.env.MERMAID_CONFIG);
        }
        else {
            console.log("  Mermaid: skipped (--no-mermaid)");
        }
        const modifiedMarkdown = join(tempDir, "modified.md");
        writeFileSync(modifiedMarkdown, markdown, "utf8");
        let html = markdownToHtml(modifiedMarkdown, title);
        console.log(`  Pandoc: ${formatCount(html.length)} chars HTML`);
        if (!args.noMath) {
            const preKatex = join(tempDir, "pre_katex.html");
            const postKatex = join(tempDir, "post_katex.html");
            writeFileSync(preKatex, html, "utf8");
            const stats = renderKatex(preKatex, postKatex);
            html = readFileSync(postKatex, "utf8");
            console.log(`  KaTeX: ${stats.inline} inline + ${stats.display} display (${stats.errors} errors)`);
        }
        else {
            console.log("  KaTeX: skipped (--no-math)");
        }
        html = injectCss(html, args.format, margins, args.headerFooter, args.css ? resolve(args.css) : undefined);
        const finalHtml = join(tempDir, "final.html");
        writeFileSync(finalHtml, html, "utf8");
        console.log(`  CSS injected: ${formatCount(html.length)} chars final HTML`);
        await htmlToPdf(finalHtml, outputPath, args.format, margins, args.landscape, args.headerFooter);
    }
    finally {
        rmSync(tempDir, { recursive: true, force: true });
    }
    const size = statSync(outputPath).size;
    console.log(`\nDone: ${outputPath}`);
    console.log(`  Size: ${formatCount(size)} bytes (${(size / 1024).toFixed(1)} KB)`);
    return outputPath;
}
main().catch((error: any): any => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`ERROR: ${message}`);
    process.exit(1);
});
