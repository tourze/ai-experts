#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { getAccessibilityTree, resolveUdid } from "./interaction_common";
import { realpathSync } from "node:fs";
export const INTERACTIVE_TYPES = new Set([
    "Button",
    "Link",
    "TextField",
    "SecureTextField",
    "Cell",
    "Switch",
    "Slider",
    "Stepper",
    "SegmentedControl",
    "TabBar",
    "NavigationBar",
    "Toolbar",
]);
export class ScreenMapper {
    udid: any;
    constructor(udid: any = null) {
        this.udid = udid;
    }
    getAccessibilityTree(): any {
        return getAccessibilityTree(this.udid, { nested: true });
    }
    analyzeTree(node: any): any {
        const analysis: Record<string, any> = {
            elements_by_type: {},
            total_elements: 0,
            interactive_elements: 0,
            text_fields: [],
            buttons: [],
            navigation: {},
            screen_name: null,
            focusable: 0,
        };
        analyzeNode(node, analysis);
        return analysis;
    }
    formatSummary(analysis: any, { verbose = false }: any = {}): any {
        return formatSummary(analysis, { verbose });
    }
    getNavigationHints(analysis: any): any {
        return getNavigationHints(analysis);
    }
}
export function analyzeNode(node: any, analysis: any): any {
    const elementType = node?.type;
    const label = node?.AXLabel ?? "";
    const value = node?.AXValue ?? "";
    const identifier = node?.AXUniqueId ?? "";
    if (elementType) {
        analysis.total_elements += 1;
        if (INTERACTIVE_TYPES.has(elementType)) {
            analysis.interactive_elements += 1;
            const elementInfo = label || value || identifier || "Unnamed";
            if (!analysis.elements_by_type[elementType])
                analysis.elements_by_type[elementType] = [];
            analysis.elements_by_type[elementType].push(elementInfo);
            if (elementType === "Button")
                analysis.buttons.push(elementInfo);
            else if (elementType === "TextField" || elementType === "SecureTextField") {
                analysis.text_fields.push({ type: elementType, label: elementInfo, has_value: Boolean(value) });
            }
            else if (elementType === "NavigationBar") {
                analysis.navigation.nav_title = label || "Navigation";
            }
            else if (elementType === "TabBar") {
                analysis.navigation.tab_count = (node.children ?? []).length;
            }
        }
        if (node.enabled === true && INTERACTIVE_TYPES.has(elementType)) {
            analysis.focusable += 1;
        }
    }
    if (!analysis.screen_name && identifier && (identifier.includes("ViewController") || identifier.includes("Screen"))) {
        analysis.screen_name = identifier;
    }
    for (const child of node?.children ?? [])
        analyzeNode(child, analysis);
}
export function formatSummary(analysis: any, { verbose = false }: any = {}): any {
    const lines: any[] = [];
    const screen = analysis.screen_name || "Unknown Screen";
    lines.push(`Screen: ${screen} (${analysis.total_elements} elements, ${analysis.interactive_elements} interactive)`);
    if (analysis.buttons.length) {
        let buttonList = analysis.buttons.slice(0, 5).map((button: any) => `"${button}"`).join(", ");
        if (analysis.buttons.length > 5)
            buttonList += ` +${analysis.buttons.length - 5} more`;
        lines.push(`Buttons: ${buttonList}`);
    }
    if (analysis.text_fields.length) {
        const filled = analysis.text_fields.filter((field: any) => field.has_value).length;
        lines.push(`TextFields: ${analysis.text_fields.length} (${filled} filled)`);
    }
    const navigation: any[] = [];
    if (analysis.navigation.nav_title)
        navigation.push(`NavBar: "${analysis.navigation.nav_title}"`);
    if (analysis.navigation.tab_count != null)
        navigation.push(`TabBar: ${analysis.navigation.tab_count} tabs`);
    if (navigation.length)
        lines.push(`Navigation: ${navigation.join(", ")}`);
    lines.push(`Focusable: ${analysis.focusable} elements`);
    if (verbose) {
        lines.push("\nElements by type:");
        for (const [elementType, items] of Object.entries(analysis.elements_by_type as Record<string, any[]>)) {
            if (!items.length)
                continue;
            lines.push(`  ${elementType}: ${items.length}`);
            for (const item of items.slice(0, 3))
                lines.push(`    - ${item}`);
            if (items.length > 3)
                lines.push(`    ... +${items.length - 3} more`);
        }
    }
    return lines.join("\n");
}
export function getNavigationHints(analysis: any): any {
    const hints: any[] = [];
    if (String(analysis.buttons).includes("Login"))
        hints.push("Login screen detected - find TextFields for credentials");
    if (analysis.text_fields.length) {
        const unfilled = analysis.text_fields.filter((field: any) => !field.has_value);
        if (unfilled.length)
            hints.push(`${unfilled.length} empty text field(s) - may need input`);
    }
    if (!analysis.buttons.length && !analysis.text_fields.length)
        hints.push("No interactive elements - try swiping or going back");
    if (analysis.navigation.tab_count != null)
        hints.push(`Tab bar available with ${analysis.navigation.tab_count} tabs`);
    return hints;
}
function usage(): any {
    return `Map current screen UI elements.

Usage: node scripts/screen_mapper.mjs [options]

Options:
  --verbose       Show detailed element breakdown
  --json          Output raw JSON analysis
  --hints         Include navigation hints
  --udid <udid>   Device UDID
  --help          Show this help
`;
}
export function parseArgs(argv: any = process.argv.slice(2)): any {
    const args: Record<string, any> = { verbose: false, json: false, hints: false, udid: null, help: false };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--help" || arg === "-h")
            args.help = true;
        else if (arg === "--verbose")
            args.verbose = true;
        else if (arg === "--json")
            args.json = true;
        else if (arg === "--hints")
            args.hints = true;
        else if (arg === "--udid") {
            const value = argv[index + 1];
            if (value == null || value.startsWith("--"))
                throw new Error("--udid requires a value");
            args.udid = value;
            index += 1;
        }
        else {
            throw new Error(`unrecognized argument: ${arg}`);
        }
    }
    return args;
}
export function main(argv: any = process.argv.slice(2)): any {
    const args = parseArgs(argv);
    if (args.help) {
        console.log(usage());
        return 0;
    }
    const mapper = new ScreenMapper(resolveUdid(args.udid));
    const analysis = mapper.analyzeTree(mapper.getAccessibilityTree());
    if (args.json) {
        console.log(JSON.stringify(analysis, null, 2));
        return 0;
    }
    console.log(mapper.formatSummary(analysis, { verbose: args.verbose }));
    if (args.hints) {
        const hints = mapper.getNavigationHints(analysis);
        if (hints.length) {
            console.log("\nHints:");
            for (const hint of hints)
                console.log(`  - ${hint}`);
        }
    }
    return 0;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        process.exitCode = main();
    }
    catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
    }
}
