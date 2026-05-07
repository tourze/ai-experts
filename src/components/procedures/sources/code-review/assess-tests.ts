#!/usr/bin/env node
/**
 * Brutal Honesty Test Assessment Script (Ramsay Mode)
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
const RED = "\x1b[0;31m";
const YELLOW = "\x1b[1;33m";
const GREEN = "\x1b[0;32m";
const NC = "\x1b[0m";
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build"]);
function color(value: any, message: any): any {
    return `${value}${message}${NC}`;
}
function usage(): any {
    console.log(`Usage: ${process.argv[1]} <test-directory>`);
    return 1;
}
function findProjectRoot(testPath: any): any {
    let current = testPath;
    while (true) {
        for (const marker of ["package.json", "pnpm-lock.yaml", "yarn.lock", "package-lock.json"]) {
            if (existsSync(resolve(current, marker))) {
                return current;
            }
        }
        const parent = dirname(current);
        // 找不到 marker 时返回 null，让调用方明确报告"无 package.json"，
        // 而不是回退到 process.cwd() 误用外层项目根（会让 testDir 借用宿主仓库的 package.json）
        if (parent === current) {
            return null;
        }
        current = parent;
    }
}
function walkFiles(root: any, results: any = []): any {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) {
                walkFiles(resolve(root, entry.name), results);
            }
        }
        else if (entry.isFile()) {
            results.push(resolve(root, entry.name));
        }
    }
    return results;
}
function readAll(testPath: any): any {
    return walkFiles(testPath).map((file: any) => {
        try {
            return readFileSync(file, "utf8");
        }
        catch {
            return "";
        }
    }).join("\n");
}
function runNpmTest(projectRoot: any): any {
    return spawnSync("npm", ["test"], {
        cwd: projectRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
    });
}
function extractFirstPercent(text: any): any {
    const match = text.match(/(\d+(?:\.\d+)?)%/);
    return match ? Number(match[1]) : null;
}
function assessCoverage(projectRoot: any, testDir: any): any {
    console.log("📊 COVERAGE CHECK");
    console.log("----------------");
    if (!projectRoot) {
        console.log(color(YELLOW, `⚠️  No package.json found near ${testDir}`));
        console.log("   → Skipping coverage check.");
        return;
    }
    const packagePath = resolve(projectRoot, "package.json");
    if (!existsSync(packagePath) || !readFileSync(packagePath, "utf8").includes('"test:coverage"')) {
        console.log(color(YELLOW, "⚠️  No coverage command found"));
        console.log("   → Add 'test:coverage' script to package.json");
        return;
    }
    console.log("Running coverage analysis...");
    const result = spawnSync("npm", ["run", "test:coverage"], {
        cwd: projectRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
    });
    const coverage = extractFirstPercent(`${result.stdout}\n${result.stderr}`) ?? 0;
    if (coverage < 50) {
        console.log(color(RED, `🔴 RAW: ${coverage}% coverage`));
        console.log("   → This is embarrassing. You're barely testing anything.");
    }
    else if (coverage < 80) {
        console.log(color(YELLOW, `🟡 ACCEPTABLE: ${coverage}% coverage`));
        console.log("   → Minimum is 80%. You're not there yet.");
    }
    else {
        console.log(color(GREEN, `🟢 MICHELIN STAR: ${coverage}% coverage`));
    }
}
function assessEdgeCases(testSource: any): any {
    console.log("");
    console.log("🎯 EDGE CASE CHECK");
    console.log("-----------------");
    const patterns: any[] = ["null", "undefined", "empty", "zero", "negative", "max", "min", "overflow", "boundary"];
    const lower = testSource.toLowerCase();
    const foundCount = patterns.filter((pattern: any) => lower.includes(pattern)).length;
    if (foundCount === 0) {
        console.log(color(RED, "🔴 RAW: No edge cases tested"));
        console.log("   → You're only testing the happy path. That's not testing.");
    }
    else if (foundCount < 3) {
        console.log(color(YELLOW, `🟡 ACCEPTABLE: Found ${foundCount} edge case patterns`));
        console.log("   → Test more: null, empty, boundaries, overflow");
    }
    else {
        console.log(color(GREEN, `🟢 MICHELIN STAR: Found ${foundCount} edge case patterns`));
    }
}
function assessClarity(testSource: any): any {
    console.log("");
    console.log("📖 CLARITY CHECK");
    console.log("---------------");
    const unclearTests = (testSource.match(/test\('test/g) ?? []).length;
    if (unclearTests > 0) {
        console.log(color(RED, `🔴 RAW: Found ${unclearTests} unclear test names`));
        console.log("   → 'test1', 'test2' - What are you testing? Use descriptive names.");
    }
    if (/describe|it|test/.test(testSource)) {
        console.log(color(GREEN, "✓ Tests have structure"));
    }
    else {
        console.log(color(YELLOW, "⚠️  No test framework patterns detected"));
    }
}
function assessSpeed(projectRoot: any, testDir: any): any {
    console.log("");
    console.log("⚡ SPEED CHECK");
    console.log("-------------");
    console.log("Running tests...");
    if (!projectRoot || !existsSync(resolve(projectRoot, "package.json"))) {
        console.log(color(YELLOW, `⚠️  No package.json found near ${testDir}`));
        console.log("   → Skipping speed check.");
        return;
    }
    const startedAt = Date.now();
    const result = runNpmTest(projectRoot);
    if (result.status === 0) {
        const duration = Math.floor((Date.now() - startedAt) / 1000);
        if (duration > 60) {
            console.log(color(RED, `🔴 RAW: Tests took ${duration}s`));
            console.log("   → Unit tests should run in seconds, not minutes.");
            console.log("   → Are you calling real databases/networks?");
        }
        else if (duration > 10) {
            console.log(color(YELLOW, `🟡 ACCEPTABLE: Tests took ${duration}s`));
            console.log("   → Aim for <10s. Use mocks and in-memory operations.");
        }
        else {
            console.log(color(GREEN, `🟢 MICHELIN STAR: Tests took ${duration}s`));
        }
    }
    else {
        console.log(color(RED, "🔴 FAILING: Tests don't even pass"));
        console.log("   → Fix your broken tests before worrying about speed.");
    }
}
function assessStability(projectRoot: any, testDir: any, testSource: any): any {
    console.log("");
    console.log("🎲 STABILITY CHECK");
    console.log("-----------------");
    if (/setTimeout|sleep|wait/i.test(testSource)) {
        console.log(color(RED, "🔴 RAW: Timing-based tests detected"));
        console.log("   → You're creating flaky tests. Use proper async/await.");
    }
    console.log("Running tests 3x to detect flakes...");
    if (!projectRoot || !existsSync(resolve(projectRoot, "package.json"))) {
        console.log(color(YELLOW, `⚠️  No package.json found near ${testDir}`));
        console.log("   → Skipping flake check.");
        return;
    }
    let failures = 0;
    for (let i = 0; i < 3; i += 1) {
        if (runNpmTest(projectRoot).status !== 0) {
            failures += 1;
        }
    }
    if (failures > 0) {
        console.log(color(RED, `🔴 RAW: Tests failed ${failures}/3 times`));
        console.log("   → FLAKY TESTS. These are worse than no tests.");
        console.log("   → Fix the non-determinism before merging.");
    }
    else {
        console.log(color(GREEN, "🟢 MICHELIN STAR: Tests are stable"));
    }
}
function assessIsolation(testSource: any): any {
    console.log("");
    console.log("🏝️  ISOLATION CHECK");
    console.log("------------------");
    if (/global|beforeAll|shared/i.test(testSource)) {
        console.log(color(YELLOW, "🟡 WARNING: Shared state patterns detected"));
        console.log("   → Are your tests independent? Can they run in any order?");
    }
    if (/\.only|\.skip/.test(testSource)) {
        console.log(color(YELLOW, "🟡 WARNING: .only or .skip found"));
        console.log("   → Don't commit tests with .only or .skip");
    }
    console.log(color(GREEN, "✓ Review test isolation manually"));
}
function main(): any {
    console.log("👨‍🍳 BRUTAL HONESTY TEST ASSESSMENT (Ramsay Mode)");
    console.log("==================================================");
    console.log("");
    const testDir = process.argv[2];
    if (!testDir) {
        return usage();
    }
    if (!existsSync(testDir) || !statSync(testDir).isDirectory()) {
        console.log(color(RED, `🔴 FAILING: Test directory '${testDir}' doesn't exist`));
        console.log("   → Where are the tests? Did you even write any?");
        return 1;
    }
    const testPath = resolve(testDir);
    const projectRoot = findProjectRoot(testPath);
    const testSource = readAll(testPath);
    assessCoverage(projectRoot, testDir);
    assessEdgeCases(testSource);
    assessClarity(testSource);
    assessSpeed(projectRoot, testDir);
    assessStability(projectRoot, testDir, testSource);
    assessIsolation(testSource);
    console.log("");
    console.log("==================================================");
    console.log("🎯 FINAL VERDICT");
    console.log("==================================================");
    console.log("");
    console.log("Look at the results above. If you see multiple 🔴 RAW marks,");
    console.log("these tests are NOT production-ready.");
    console.log("");
    console.log("Expected standards:");
    console.log("  - 80%+ branch coverage");
    console.log("  - Edge cases tested (null, empty, boundaries)");
    console.log("  - Clear test names");
    console.log("  - <10s to run");
    console.log("  - 0% flaky");
    console.log("  - Independent tests");
    console.log("");
    console.log("You know what good tests look like. Why aren't you writing them?");
    return 0;
}
process.exitCode = main();
