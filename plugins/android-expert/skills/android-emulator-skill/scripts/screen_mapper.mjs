#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveSerial, runAdbCommand } from "./common.mjs";

export class ScreenMapper {
  constructor(serial = null, tempFile = join(tmpdir(), "window_dump.xml")) {
    this.serial = serial;
    this.tempFile = tempFile;
  }

  dumpUi() {
    runAdbCommand(["shell", "uiautomator", "dump", "/sdcard/window_dump.xml"], this.serial);
    runAdbCommand(["pull", "/sdcard/window_dump.xml", this.tempFile], this.serial);
  }

  analyze() {
    this.dumpUi();
    if (!existsSync(this.tempFile)) {
      return { error: "Failed to dump UI" };
    }
    return analyzeXml(readFileSync(this.tempFile, "utf8"));
  }

  formatSummary(analysis) {
    return formatSummary(analysis);
  }
}

export function parseBounds(bounds) {
  const match = String(bounds).match(/^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/);
  if (!match) return null;
  const [, x1Text, y1Text, x2Text, y2Text] = match;
  const x1 = Number.parseInt(x1Text, 10);
  const y1 = Number.parseInt(y1Text, 10);
  const x2 = Number.parseInt(x2Text, 10);
  const y2 = Number.parseInt(y2Text, 10);
  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
    center_x: Math.trunc((x1 + x2) / 2),
    center_y: Math.trunc((y1 + y2) / 2),
  };
}

function decodeXmlAttribute(value) {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

export function parseNodeAttributes(source) {
  const attributes = {};
  const attrPattern = /([\w:-]+)="([^"]*)"/g;
  let match = attrPattern.exec(source);
  while (match) {
    attributes[match[1]] = decodeXmlAttribute(match[2]);
    match = attrPattern.exec(source);
  }
  return attributes;
}

export function elementFromAttributes(attributes) {
  return {
    class: attributes.class ?? "",
    text: attributes.text ?? "",
    "resource-id": attributes["resource-id"] ?? "",
    "content-desc": attributes["content-desc"] ?? "",
    package: attributes.package ?? "",
    clickable: attributes.clickable === "true",
    enabled: attributes.enabled === "true",
    focused: attributes.focused === "true",
    scrollable: attributes.scrollable === "true",
    bounds: parseBounds(attributes.bounds ?? ""),
  };
}

export function analyzeXml(xml) {
  const analysis = {
    buttons: [],
    text_fields: [],
    interactive: [],
    all_elements: [],
  };
  const buttons = new Set();
  const nodePattern = /<node\b([^>]*)>/g;
  let match = nodePattern.exec(xml);
  while (match) {
    const element = elementFromAttributes(parseNodeAttributes(match[1]));
    if (element.class.endsWith("Button") || element.clickable) {
      const label = element.text || element["content-desc"] || element["resource-id"];
      if (label) buttons.add(label);
    }
    if (element.class.endsWith("EditText")) {
      analysis.text_fields.push(element);
    }
    if (element.clickable || element.scrollable || element.class.endsWith("EditText")) {
      analysis.interactive.push(element);
    }
    analysis.all_elements.push(element);
    match = nodePattern.exec(xml);
  }
  analysis.buttons = [...buttons];
  return analysis;
}

export function formatSummary(analysis) {
  const lines = [`Screen: ${analysis.all_elements.length} elements (${analysis.interactive.length} interactive)`];

  if (analysis.buttons.length) {
    const buttons = analysis.buttons.slice(0, 5);
    lines.push(`Buttons: ${buttons.join(", ")}`);
    if (analysis.buttons.length > 5) {
      lines.push(`  ... +${analysis.buttons.length - 5} more`);
    }
  }

  if (analysis.text_fields.length) {
    lines.push(`TextFields: ${analysis.text_fields.length}`);
    for (const textField of analysis.text_fields) {
      lines.push(`  - ${textField.text || textField["resource-id"] || "Unnamed"}`);
    }
  }

  return lines.join("\n");
}

function usage() {
  return `Map Android UI elements.

Usage: node scripts/screen_mapper.mjs [options]

Options:
  --json                 Output JSON
  --verbose              Reserved for detailed output
  --serial, -s <serial>  Device serial
  --help                 Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { json: false, verbose: false, serial: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--json") {
      args.json = true;
      continue;
    }
    if (arg === "--verbose") {
      args.verbose = true;
      continue;
    }
    if (arg === "--serial" || arg === "-s") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error(`${arg} requires a value`);
      args.serial = value;
      index += 1;
      continue;
    }
    throw new Error(`unrecognized argument: ${arg}`);
  }
  return args;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }

  const serial = resolveSerial(args.serial);
  const mapper = new ScreenMapper(serial);
  const analysis = mapper.analyze();
  if (args.json) {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    console.log(formatSummary(analysis));
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
