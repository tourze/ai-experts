#!/usr/bin/env node
import { mkdirSync, existsSync, statSync, writeFileSync, realpathSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
const BROWSER_ARGS: any[] = [
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-software-rasterizer",
    "--single-process",
];
export async function loadPlaywright(): Promise<any> {
    try {
        return await import("playwright");
    }
    catch (error: any) {
        throw new Error("ERROR: 缺少 playwright。请先执行 `npm install playwright`，再运行 `npx playwright install chromium`。", { cause: error });
    }
}
export function launchBrowser(playwright: any): any {
    return playwright.chromium.launch({ args: BROWSER_ARGS });
}
export async function extractSvgContent(page: any, selector: any): Promise<any> {
    return page.evaluate(`(selector) => {
      const container = document.querySelector(selector);
      if (!container) return null;
      if (container.tagName.toLowerCase() === "svg") {
        return container.outerHTML;
      }
      const children = Array.from(container.children);
      const svgChildren = children.filter((child) => child.tagName.toLowerCase() === "svg");
      if (svgChildren.length === 1 && children.length === 1) {
        return svgChildren[0].outerHTML;
      }
      return null;
    }`, selector);
}
export function normalizeSvgContent(svgContent: any): any {
    let content = svgContent;
    if (!content.startsWith("<?xml")) {
        content = `<?xml version="1.0" encoding="UTF-8"?>\n${content}`;
    }
    if (!content.includes("xmlns=")) {
        content = content.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1);
    }
    return content;
}
export async function renderPng(page: any, outputPath: any, selector: any): Promise<any> {
    const element = await page.$(selector);
    if (!element) {
        console.error(`WARNING: Selector '${selector}' not found. Capturing full page.`);
        await page.screenshot({ path: outputPath, fullPage: true });
    }
    else {
        await element.screenshot({ path: outputPath });
    }
    const size = statSync(outputPath).size;
    console.log(`PNG saved: ${outputPath}`);
    console.log(`  Size: ${size.toLocaleString("en-US")} bytes (${(size / 1024).toFixed(1)} KB)`);
    return outputPath;
}
export async function renderSvg(page: any, outputPath: any, selector: any): Promise<any> {
    const svgContent = await extractSvgContent(page, selector);
    if (svgContent) {
        writeFileSync(outputPath, normalizeSvgContent(svgContent), "utf-8");
        const size = statSync(outputPath).size;
        console.log(`SVG saved: ${outputPath}`);
        console.log(`  Size: ${size.toLocaleString("en-US")} bytes (${(size / 1024).toFixed(1)} KB)`);
        return outputPath;
    }
    const fallbackPath = outputPath.replace(/\.svg$/i, ".png");
    console.error(`WARNING: No extractable SVG found in '${selector}'.\n` +
        "  The content uses HTML/CSS which cannot produce true vector SVG.\n" +
        `  Falling back to PNG: ${fallbackPath}\n` +
        `  TIP: For vector SVG output, redesign using a root <svg> element inside '${selector}'.`);
    return renderPng(page, fallbackPath, selector);
}
function usage(): any {
    return `Render HTML to PNG or SVG.

Usage: node scripts/concept-to-image-render_to_image.mjs <input.html> <output.png|output.svg> [options]

Options:
  --width <px>          Viewport width (default: 1920)
  --height <px>         Viewport height (default: 1080)
  --scale <number>      Device scale factor for PNG (default: 2)
  --selector <selector> CSS selector for target element (default: .canvas)
  --full-page           Capture full page instead of element (PNG only)
  --help                Show this help
`;
}
export function parseArgs(argv: any = process.argv.slice(2)): any {
    const args: Record<string, any> = {
        input: null,
        output: null,
        width: 1920,
        height: 1080,
        scale: 2,
        selector: ".canvas",
        fullPage: false,
        help: false,
    };
    const positional: any[] = [];
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--help" || arg === "-h") {
            args.help = true;
            continue;
        }
        if (arg === "--full-page") {
            args.fullPage = true;
            continue;
        }
        if (["--width", "--height", "--scale", "--selector"].includes(arg)) {
            const value = argv[index + 1];
            if (value == null || value.startsWith("--")) {
                throw new Error(`${arg} requires a value`);
            }
            index += 1;
            if (arg === "--width")
                args.width = Number.parseInt(value, 10);
            if (arg === "--height")
                args.height = Number.parseInt(value, 10);
            if (arg === "--scale")
                args.scale = Number.parseFloat(value);
            if (arg === "--selector")
                args.selector = value;
            continue;
        }
        if (arg.startsWith("-")) {
            throw new Error(`unrecognized argument: ${arg}`);
        }
        positional.push(arg);
    }
    [args.input, args.output] = positional;
    if (!args.help && positional.length !== 2) {
        throw new Error("input and output arguments are required");
    }
    if (!Number.isInteger(args.width))
        throw new Error("--width must be an integer");
    if (!Number.isInteger(args.height))
        throw new Error("--height must be an integer");
    if (!Number.isFinite(args.scale))
        throw new Error("--scale must be a number");
    return args;
}
export async function main(argv: any = process.argv.slice(2)): Promise<any> {
    const args = parseArgs(argv);
    if (args.help) {
        console.log(usage());
        return 0;
    }
    const inputPath = resolve(args.input);
    const outputPath = resolve(args.output);
    if (!existsSync(inputPath)) {
        throw new Error(`ERROR: Input file not found: ${inputPath}`);
    }
    const outputExt = extname(outputPath).toLowerCase();
    if (![".png", ".svg"].includes(outputExt)) {
        throw new Error(`ERROR: Output must be .png or .svg, got: ${outputExt}`);
    }
    mkdirSync(dirname(outputPath), { recursive: true });
    const playwright = await loadPlaywright();
    const browser = await launchBrowser(playwright);
    let actual;
    try {
        const context = await browser.newContext({
            viewport: { width: args.width, height: args.height },
            deviceScaleFactor: outputExt === ".png" ? args.scale : 1,
        });
        const page = await context.newPage();
        await page.goto(pathToFileURL(inputPath).href, { waitUntil: "load" });
        await page.waitForTimeout(500);
        if (args.fullPage) {
            if (outputExt !== ".png") {
                throw new Error("ERROR: --full-page with SVG not supported.");
            }
            await page.screenshot({ path: outputPath, fullPage: true });
            const size = statSync(outputPath).size;
            console.log(`PNG (full page) saved: ${outputPath}`);
            console.log(`  Size: ${size.toLocaleString("en-US")} bytes (${(size / 1024).toFixed(1)} KB)`);
            actual = outputPath;
        }
        else if (outputExt === ".png") {
            actual = await renderPng(page, outputPath, args.selector);
        }
        else {
            actual = await renderSvg(page, outputPath, args.selector);
        }
    }
    finally {
        await browser.close();
    }
    console.log(`\nDone. Output: ${actual}`);
    return 0;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().then((code: any): any => {
        process.exitCode = code;
    }).catch((error: any): any => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
