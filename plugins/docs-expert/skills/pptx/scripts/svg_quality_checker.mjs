#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync, realpathSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SVG_NS = "http://www.w3.org/2000/svg";
export const XLINK_NS = "http://www.w3.org/1999/xlink";

export const ALLOWED_ELEMENTS = new Set([
  "svg",
  "g",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "path",
  "text",
  "tspan",
  "image",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "title",
  "desc",
  "metadata",
]);

export const BANNED_ELEMENTS = new Map([
  ["mask", "No DrawingML equivalent"],
  ["style", "Use inline presentation attributes instead"],
  ["foreignObject", "Cannot convert HTML to DrawingML"],
  ["textPath", "No curved-text support in DrawingML"],
  ["animate", "Static slides only"],
  ["animateTransform", "Static slides only"],
  ["animateMotion", "Static slides only"],
  ["set", "Static slides only"],
  ["script", "Security risk, no runtime in PPTX"],
  ["symbol", "Inline the content directly"],
  ["use", "Inline the referenced element"],
  ["filter", "Drop shadows/blurs have no reliable DrawingML mapping"],
  ["pattern", "Use solid or gradient fills"],
  ["marker", "Draw arrowheads as explicit paths"],
]);

const BANNED_ATTRIBUTES = new Set(["class", "style"]);
const CJK_FONT_KEYWORDS = new Set([
  "noto sans",
  "microsoft yahei",
  "simhei",
  "simsun",
  "pingfang",
  "hiragino",
  "source han",
  "wenquanyi",
]);

export class Issue {
  constructor(line, level, message) {
    this.line = line;
    this.level = level;
    this.message = message;
  }

  toString() {
    const marker = this.level === "error" ? "\u2717" : "\u26a0";
    return `  ${marker} Line ${this.line}: ${this.message}`;
  }
}

function localName(name) {
  return String(name || "").split(":").pop();
}

function lineNumberAt(text, offset) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text[index] === "\n") line += 1;
  }
  return line;
}

function decodeXmlEntities(text) {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function parseAttributes(source) {
  const attrs = {};
  const attrRe = /([A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const match of source.matchAll(attrRe)) {
    const rawName = match[1];
    const value = decodeXmlEntities(match[2] ?? match[3] ?? "");
    attrs[rawName] = value;
    const shortName = localName(rawName);
    if (attrs[shortName] == null) attrs[shortName] = value;
  }
  return attrs;
}

export function parseXmlElements(text) {
  const elements = [];
  const roots = [];
  const stack = [];
  const tagRe = /<[^>]+>/gs;
  let lastIndex = 0;

  for (const match of text.matchAll(tagRe)) {
    const tagText = match[0];
    const between = text.slice(lastIndex, match.index);
    if (between && stack.length) {
      stack[stack.length - 1].text += decodeXmlEntities(between);
    }

    if (tagText.startsWith("<!--") || tagText.startsWith("<?") || tagText.startsWith("<!DOCTYPE")) {
      lastIndex = match.index + tagText.length;
      continue;
    }

    if (tagText.startsWith("<![CDATA[")) {
      if (stack.length) {
        stack[stack.length - 1].text += tagText.slice("<![CDATA[".length, -"]]>".length);
      }
      lastIndex = match.index + tagText.length;
      continue;
    }

    const line = lineNumberAt(text, match.index);
    if (/^<\//.test(tagText)) {
      const closeName = localName(tagText.slice(2, -1).trim());
      const current = stack.pop();
      if (!current || current.tag !== closeName) {
        throw new Error(`mismatched closing tag </${closeName}> at line ${line}`);
      }
      lastIndex = match.index + tagText.length;
      continue;
    }

    const selfClosing = /\/\s*>$/.test(tagText);
    const body = tagText.slice(1, selfClosing ? -2 : -1).trim();
    const nameMatch = body.match(/^([^\s/>]+)/);
    if (!nameMatch) {
      lastIndex = match.index + tagText.length;
      continue;
    }
    const rawName = nameMatch[1];
    const element = {
      tag: localName(rawName),
      rawName,
      attrs: parseAttributes(body.slice(rawName.length)),
      line,
      text: "",
      children: [],
    };

    if (stack.length) stack[stack.length - 1].children.push(element);
    else roots.push(element);
    elements.push(element);
    if (!selfClosing) stack.push(element);
    lastIndex = match.index + tagText.length;
  }

  const tail = text.slice(lastIndex);
  if (tail && stack.length) stack[stack.length - 1].text += decodeXmlEntities(tail);
  if (stack.length) throw new Error(`unclosed tag <${stack[stack.length - 1].rawName}>`);

  return { root: roots[0] ?? null, elements };
}

function textContent(element) {
  return element.text + element.children.map(textContent).join("");
}

function hasCjkFallback(fontFamily) {
  const value = fontFamily.toLowerCase();
  return [...CJK_FONT_KEYWORDS].some((keyword) => value.includes(keyword));
}

export function checkSvgContent(svgText) {
  const issues = [];
  const { root, elements } = parseXmlElements(svgText);

  if (!root || root.tag !== "svg") {
    return [new Issue(1, "error", "Root element must be <svg>")];
  }

  const viewBox = root.attrs.viewBox;
  if (!viewBox) {
    issues.push(new Issue(1, "error", "Missing viewBox attribute on <svg>"));
  } else {
    const parts = viewBox.trim().split(/[,\s]+/).filter(Boolean);
    if (parts.length === 4) {
      const width = Number(parts[2]);
      const height = Number(parts[3]);
      if (Number.isFinite(width) && Number.isFinite(height)) {
        const ratio = height ? width / height : 0;
        if (!(ratio > 1.7 && ratio < 1.8)) {
          issues.push(new Issue(1, "warning", `viewBox aspect ratio ${ratio.toFixed(3)} is not 16:9 (expected ~1.778)`));
        }
      } else {
        issues.push(new Issue(1, "error", `Invalid viewBox values: ${viewBox}`));
      }
    } else {
      issues.push(new Issue(1, "error", `viewBox must have 4 values, got ${parts.length}`));
    }
  }

  for (const element of elements) {
    const { tag, line, attrs } = element;

    if (BANNED_ELEMENTS.has(tag)) {
      issues.push(new Issue(line, "error", `banned element <${tag}> -- ${BANNED_ELEMENTS.get(tag)}`));
      continue;
    }

    if (!ALLOWED_ELEMENTS.has(tag)) {
      issues.push(new Issue(line, "warning", `unknown element <${tag}>, will be skipped`));
    }

    for (const attr of BANNED_ATTRIBUTES) {
      if (attrs[attr] != null) {
        issues.push(new Issue(line, "error", `banned attribute "${attr}" on <${tag}> -- use inline presentation attributes`));
      }
    }

    for (const attr of ["fill", "stroke", "stop-color", "flood-color", "lighting-color"]) {
      const value = attrs[attr] ?? "";
      if (value.includes("rgba(")) {
        issues.push(new Issue(line, "error", `rgba() color in ${attr} -- use fill-opacity/stroke-opacity instead`));
      }
      if (value.includes("rgb(")) {
        issues.push(new Issue(line, "warning", `rgb() color in ${attr} -- use hex #RRGGBB for reliable conversion`));
      }
    }

    if (tag === "g" && attrs.opacity != null) {
      issues.push(new Issue(line, "error", "opacity on <g> -- set fill-opacity/stroke-opacity on each child instead"));
    }

    if (tag === "text" || tag === "tspan") {
      const fontFamily = attrs["font-family"] ?? "";
      if (fontFamily && !hasCjkFallback(fontFamily)) {
        issues.push(new Issue(line, "warning", 'font-family missing CJK fallback (add "Noto Sans SC" or "Microsoft YaHei")'));
      }
    }

    if (tag === "image") {
      const href = attrs["xlink:href"] ?? attrs.href ?? "";
      if (href && !href.startsWith("data:")) {
        issues.push(new Issue(line, "error", "external image URL -- images must be base64 data URIs"));
      }
    }

    const transform = attrs.transform ?? "";
    if (transform.includes("matrix(")) {
      issues.push(new Issue(line, "warning", "matrix() transform -- decompose into translate/scale/rotate"));
    }

    if (tag === "text") {
      const content = textContent(element);
      if (content.length > 200) {
        issues.push(new Issue(line, "warning", `text content is ${content.length} chars -- may overflow container`));
      }
    }
  }

  return issues;
}

export function checkSvg(path) {
  try {
    return checkSvgContent(readFileSync(path, "utf8"));
  } catch (error) {
    return [new Issue(0, "error", `XML parse error: ${error.message}`)];
  }
}

export function collectSvgFiles(args, stderr = process.stderr) {
  const svgFiles = [];
  for (const arg of args) {
    if (!existsSync(arg)) {
      stderr.write(`Warning: skipping ${arg} (not an SVG file or directory)\n`);
      continue;
    }
    const stats = statSync(arg);
    if (stats.isDirectory()) {
      for (const entry of readdirSync(arg).sort()) {
        const path = join(arg, entry);
        if (statSync(path).isFile() && extname(entry) === ".svg") svgFiles.push(path);
      }
    } else if (stats.isFile() && extname(arg) === ".svg") {
      svgFiles.push(arg);
    } else {
      stderr.write(`Warning: skipping ${arg} (not an SVG file or directory)\n`);
    }
  }
  return svgFiles;
}

export function runCli(args = process.argv.slice(2), stdout = process.stdout, stderr = process.stderr) {
  if (args.length < 1) {
    stderr.write("Usage: node svg_quality_checker.mjs <file.svg|dir> [...]\n");
    return 1;
  }

  const svgFiles = collectSvgFiles(args, stderr);
  if (!svgFiles.length) {
    stderr.write("No SVG files found.\n");
    return 1;
  }

  let passed = 0;
  let failed = 0;
  for (const svgFile of svgFiles) {
    const issues = checkSvg(svgFile);
    const errors = issues.filter((issue) => issue.level === "error");
    const warnings = issues.filter((issue) => issue.level === "warning");
    const status = errors.length ? "FAIL" : "PASS";
    if (errors.length) failed += 1;
    else passed += 1;

    stdout.write(`${basename(svgFile)}: ${status} (${errors.length} error(s), ${warnings.length} warning(s))\n`);
    for (const issue of [...errors, ...warnings]) stdout.write(`${issue.toString()}\n`);
    if (issues.length) stdout.write("\n");
  }

  const total = svgFiles.length;
  stdout.write(`Summary: ${passed}/${total} passed, ${failed}/${total} failed\n`);
  return failed > 0 ? 1 : 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runCli();
}
