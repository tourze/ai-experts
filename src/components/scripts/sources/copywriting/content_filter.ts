#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultBlocklist = resolve(scriptDir, "../assets/blocklist.txt");
const patternGroups: Record<string, any> = {
    advertising: [
        "\\b(best|top|ultimate|amazing|incredible)\\s+\\w+\\s+(product|tool|service)\\b",
        "\\b(revolutionary|game-changing|breakthrough)\\b",
        "\\b(click here|learn more|sign up now|limited time)\\b",
        "\\b(100%|guaranteed|risk-free|no obligation)\\b",
        "(全网最强|唯一正确|闭眼入|马上下单)",
    ],
    dangerous_instructions: [
        "\\b(hack|exploit|bypass security|circumvent)\\b",
        "\\b(illegal|unauthorized|steal|pirate)\\b",
        "\\b(weapon|explosive|chemical|toxic)\\b.*\\b(make|create|build)\\b",
        "(忽略之前的规则|绕过限制|教你搞到后台权限)",
    ],
    manipulative_language: [
        "\\b(you must|everyone should|no one else|only we)\\b",
        "\\b(fear|scare|panic|emergency)\\b.*\\b(act now|immediately)\\b",
        "\\b(secret|hidden|exclusive|insider)\\b.*\\b(knowledge|information|access)\\b",
        "(不转不是中国人|现在不做就晚了|必须加我微信)",
    ],
};
function parseArgs(argv: any): any {
    const args: Record<string, any> = {
        platform: "social-platform",
        text: null,
        inputFile: null,
        blocklist: defaultBlocklist,
        json: false,
    };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === "--platform") {
            args.platform = requireValue(argv, ++i, arg);
        }
        else if (arg === "--text") {
            args.text = requireValue(argv, ++i, arg);
        }
        else if (arg === "--input-file") {
            args.inputFile = requireValue(argv, ++i, arg);
        }
        else if (arg === "--blocklist") {
            args.blocklist = requireValue(argv, ++i, arg);
        }
        else if (arg === "--json") {
            args.json = true;
        }
        else if (arg === "-h" || arg === "--help") {
            printHelp();
            process.exit(0);
        }
        else {
            throw new Error(`unknown argument: ${arg}`);
        }
    }
    return args;
}
function requireValue(argv: any, index: any, flag: any): any {
    const value = argv[index];
    if (!value || value.startsWith("--")) {
        throw new Error(`${flag} requires a value`);
    }
    return value;
}
function printHelp(): any {
    console.log(`Usage: content_filter.mjs [--platform NAME] [--text TEXT | --input-file PATH] [--blocklist PATH] [--json]`);
}
function loadBlocklist(path: any): any {
    if (!path || !existsSync(path))
        return [];
    return readFileSync(path, "utf-8")
        .split(/\r?\n/)
        .map((line: any) => line.trim())
        .filter((line: any) => line && !line.startsWith("#"));
}
function findBlocklistHits(text: any, blocklist: any): any {
    const lowered = text.toLowerCase();
    const hits: any[] = [];
    for (const item of blocklist) {
        if (item.startsWith("re:")) {
            const pattern = item.slice(3);
            if (new RegExp(pattern, "i").test(text)) {
                hits.push(item);
            }
        }
        else if (lowered.includes(item.toLowerCase())) {
            hits.push(item);
        }
    }
    return hits;
}
function detectHarmfulContent(text: any, blocklist: any = []): any {
    const content = text.trim();
    if (!content) {
        throw new Error("text must not be empty");
    }
    const results: Record<string, any> = {
        advertising: false,
        dangerous_instructions: false,
        manipulative_language: false,
        blocklist_hit: false,
        confidence_scores: {},
        matched_patterns: {},
    };
    for (const [category, patterns] of Object.entries(patternGroups)) {
        const matched = patterns.filter((pattern: any) => new RegExp(pattern, "i").test(content));
        results[category] = category === "dangerous_instructions" ? matched.length > 0 : matched.length >= 2;
        results.matched_patterns[category] = matched;
        if (category === "advertising") {
            results.confidence_scores[category] = Math.min(matched.length * 0.3, 1.0);
        }
        else if (category === "dangerous_instructions") {
            results.confidence_scores[category] = Math.min(matched.length * 0.45, 1.0);
        }
        else {
            results.confidence_scores[category] = Math.min(matched.length * 0.35, 1.0);
        }
    }
    const hits = findBlocklistHits(content, blocklist);
    results.blocklist_hit = hits.length > 0;
    results.matched_patterns.blocklist = hits;
    results.confidence_scores.blocklist = hits.length > 0 ? 1.0 : 0.0;
    results.overall_risk = Math.max(...(Object.values(results.confidence_scores) as number[]));
    results.should_block = (results.dangerous_instructions ||
        results.blocklist_hit ||
        results.overall_risk >= 0.7);
    return results;
}
function filterSocialContent(content: any, platform: any = "social-platform", blocklistPath: any = defaultBlocklist): any {
    const analysis = detectHarmfulContent(content, loadBlocklist(blocklistPath));
    let recommendation = "allow";
    let warningMessage: any = null;
    if (analysis.should_block) {
        recommendation = "block";
        warningMessage = `${platform} 内容命中高风险规则，建议直接屏蔽。`;
    }
    else if (analysis.overall_risk >= 0.35) {
        recommendation = "warn";
        warningMessage = `${platform} 内容含营销或诱导信号，建议人工复核。`;
    }
    return {
        platform,
        content_length: Array.from(content).length,
        analysis,
        recommendation,
        warning_message: warningMessage,
    };
}
function readContent(args: any): any {
    if (args.text)
        return args.text;
    if (args.inputFile)
        return readFileSync(args.inputFile, "utf-8");
    if (!process.stdin.isTTY)
        return readFileSync(0, "utf-8");
    throw new Error("请通过 --text、--input-file 或 stdin 提供待检测内容");
}
function main(): any {
    try {
        const args = parseArgs(process.argv.slice(2));
        const result = filterSocialContent(readContent(args), args.platform, args.blocklist);
        if (args.json) {
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            console.log(`platform: ${result.platform}`);
            console.log(`recommendation: ${result.recommendation}`);
            if (result.warning_message) {
                console.log(`warning: ${result.warning_message}`);
            }
            console.log(`overall_risk: ${result.analysis.overall_risk.toFixed(2)}`);
        }
        return 0;
    }
    catch (error: any) {
        console.error(JSON.stringify({ error: error.message }));
        return 1;
    }
}
process.exitCode = main();
