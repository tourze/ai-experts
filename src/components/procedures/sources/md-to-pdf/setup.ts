#!/usr/bin/env node
// Verify and optionally install dependencies for the md-to-pdf skill.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
const install = process.argv.includes("--install");
const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const NC = "\x1b[0m";
let failed = false;
function ok(message: any): any {
    console.log(`${GREEN}✓${NC} ${message}`);
}
function warn(message: any): any {
    console.log(`${YELLOW}⚠${NC} ${message}`);
}
function fail(message: any): any {
    console.log(`${RED}✗${NC} ${message}`);
    failed = true;
}
function executableNames(command: any): any {
    if (process.platform !== "win32" || path.extname(command)) {
        return [command];
    }
    return (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM").split(";").map((ext: any) => `${command}${ext}`);
}
function isExecutable(filePath: any): any {
    try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) {
            return false;
        }
        if (process.platform === "win32") {
            return true;
        }
        fs.accessSync(filePath, fs.constants.X_OK);
        return true;
    }
    catch {
        return false;
    }
}
function findCommand(command: any): any {
    for (const dir of (process.env.PATH || "").split(path.delimiter).filter(Boolean)) {
        for (const name of executableNames(command)) {
            const candidate = path.join(dir, name);
            if (isExecutable(candidate)) {
                return candidate;
            }
        }
    }
    return "";
}
function run(command: any, args: any, options: any = {}): any {
    return spawnSync(command, args, {
        encoding: "utf8",
        stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
    });
}
function firstLine(text: any): any {
    return text.split(/\r?\n/).find((line: any) => line.trim()) || "";
}
function installPandoc(): any {
    if (findCommand("apt-get")) {
        if (run("sudo", ["apt-get", "update", "-qq"], { stdio: "inherit" }).status !== 0)
            return false;
        return run("sudo", ["apt-get", "install", "-y", "-qq", "pandoc"], { stdio: "inherit" }).status === 0;
    }
    if (findCommand("brew")) {
        return run("brew", ["install", "pandoc"], { stdio: "inherit" }).status === 0;
    }
    if (findCommand("choco")) {
        return run("choco", ["install", "pandoc", "-y"], { stdio: "inherit" }).status === 0;
    }
    return false;
}
function nodeRequire(moduleName: any): any {
    return run(process.execPath, [
        "-e",
        [
            "const {createRequire}=require('node:module');",
            "const {spawnSync}=require('node:child_process');",
            "const path=require('node:path');",
            "const req=createRequire(process.cwd() + '/noop.js');",
            `const name=${JSON.stringify(moduleName)};`,
            "function load(){try{return req(name)}catch(e){const root=spawnSync('npm',['root','-g'],{encoding:'utf8'}).stdout.trim(); if(root){return req(path.join(root,name));} throw e;}}",
            "try{const m=load(); console.log(m.version || 'loaded')}catch(e){process.exit(1)}",
        ].join(""),
    ]);
}
function nodeResolve(request: any): any {
    return run(process.execPath, [
        "-e",
        [
            "const {createRequire}=require('node:module');",
            "const {spawnSync}=require('node:child_process');",
            "const path=require('node:path');",
            "const req=createRequire(process.cwd() + '/noop.js');",
            `const request=${JSON.stringify(request)};`,
            "try{console.log(req.resolve(request))}catch(e){const root=spawnSync('npm',['root','-g'],{encoding:'utf8'}).stdout.trim(); if(root){try{console.log(req.resolve(path.join(root,request))); process.exit(0)}catch(_){}} process.exit(1)}",
        ].join(""),
    ]);
}
function findChromeUnder(root: any): any {
    const stack: any[] = [root];
    const maxEntries = 5000;
    let visited = 0;
    while (stack.length > 0 && visited < maxEntries) {
        const current = stack.pop();
        visited += 1;
        let stat;
        try {
            stat = fs.statSync(current);
        }
        catch {
            continue;
        }
        if (stat.isFile() && ["chrome", "chrome.exe", "chromium", "chromium.exe"].includes(path.basename(current))) {
            if (isExecutable(current)) {
                return current;
            }
        }
        if (!stat.isDirectory()) {
            continue;
        }
        let entries;
        try {
            entries = fs.readdirSync(current);
        }
        catch {
            continue;
        }
        for (const entry of entries) {
            stack.push(path.join(current, entry));
        }
    }
    return "";
}
function findChrome(): any {
    const home = os.homedir();
    const candidates: any[] = [
        path.join(home, ".cache", "puppeteer", "chrome"),
        "/opt/google/chrome/chrome",
        "/opt/pw-browsers",
        path.join(home, ".cache", "ms-playwright"),
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
        "/usr/bin/google-chrome",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];
    for (const candidate of candidates) {
        try {
            const stat = fs.statSync(candidate);
            if (stat.isFile() && isExecutable(candidate)) {
                return candidate;
            }
            if (stat.isDirectory()) {
                const found = findChromeUnder(candidate);
                if (found) {
                    return found;
                }
            }
        }
        catch {
            // Try next candidate.
        }
    }
    return "";
}
console.log("=== md-to-pdf dependency check ===");
console.log("");
const pandoc = findCommand("pandoc");
if (pandoc) {
    const versionLine = firstLine(run(pandoc, ["--version"]).stdout);
    ok(`pandoc ${versionLine.split(/\s+/)[1] || versionLine || "unknown"}`);
}
else if (install) {
    warn("pandoc not found — installing...");
    if (installPandoc())
        ok("pandoc installed");
    else
        fail("pandoc install failed (install pandoc manually)");
}
else {
    fail("pandoc not found (apt/brew/choco install pandoc)");
}
const node = findCommand("node");
if (node) {
    ok(`node ${process.version}`);
}
else {
    fail("node not found — required for KaTeX and Mermaid");
}
const mmdc = findCommand("mmdc");
if (mmdc) {
    const version = firstLine(run(mmdc, ["--version"]).stdout || "unknown");
    ok(`mmdc (mermaid-cli) ${version || "unknown"}`);
}
else if (install) {
    warn("mmdc not found — installing @mermaid-js/mermaid-cli...");
    if (findCommand("npm") && run("npm", ["install", "-g", "@mermaid-js/mermaid-cli"], { stdio: "inherit" }).status === 0) {
        ok("mmdc installed");
    }
    else {
        fail("mmdc install failed (npm install -g @mermaid-js/mermaid-cli)");
    }
}
else {
    fail("mmdc not found (npm install -g @mermaid-js/mermaid-cli)");
}
const katex = nodeRequire("katex");
if (katex.status === 0) {
    ok(`katex ${firstLine(katex.stdout) || "loaded"}`);
}
else if (install) {
    warn("katex not found — installing...");
    if (findCommand("npm") && run("npm", ["install", "-g", "katex"], { stdio: "inherit" }).status === 0) {
        ok("katex installed");
    }
    else {
        fail("katex install failed (npm install -g katex)");
    }
}
else {
    fail("katex not found (npm install -g katex)");
}
const playwright = nodeRequire("playwright");
if (playwright.status === 0) {
    ok(`playwright (Node.js) ${firstLine(playwright.stdout) || "loaded"}`);
}
else if (install) {
    warn("playwright not found — installing...");
    if (findCommand("npm") &&
        run("npm", ["install", "-g", "playwright"], { stdio: "inherit" }).status === 0 &&
        findCommand("playwright") &&
        run("playwright", ["install", "chromium"], { stdio: "inherit" }).status === 0) {
        ok("playwright installed");
    }
    else {
        fail("playwright install failed (npm install -g playwright && playwright install chromium)");
    }
}
else {
    fail("playwright not found (npm install -g playwright && playwright install chromium)");
}
const chrome = findChrome();
if (chrome) {
    ok(`Chrome binary: ${chrome}`);
}
else {
    fail("No Chrome/Chromium binary found (playwright install chromium)");
}
const katexPackage = nodeResolve("katex/package.json").stdout.trim();
const katexDir = katexPackage ? path.join(path.dirname(katexPackage), "dist") : "";
if (katexDir && fs.existsSync(path.join(katexDir, "katex.min.css")) && fs.statSync(path.join(katexDir, "fonts")).isDirectory()) {
    const fontCount = fs.readdirSync(path.join(katexDir, "fonts")).length;
    ok(`KaTeX CSS + fonts (${fontCount} font files)`);
}
else {
    warn("KaTeX CSS/fonts not found — math will render but may look degraded");
}
console.log("");
if (!failed) {
    console.log(`${GREEN}All dependencies satisfied.${NC} Ready to convert.`);
    process.exit(0);
}
console.log(`${RED}Missing dependencies detected.${NC} Run: node scripts/setup.mjs --install`);
process.exit(1);
