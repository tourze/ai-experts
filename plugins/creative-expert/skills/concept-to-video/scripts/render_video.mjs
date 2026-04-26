#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const QUALITY_MAP = {
  low: ["-ql", "480p15"],
  medium: ["-qm", "720p30"],
  high: ["-qh", "1080p60"],
  "4k": ["-qk", "2160p60"],
};

export const FORMAT_MAP = {
  mp4: "--format=mp4",
  gif: "--format=gif",
  webm: "--format=webm",
};

function walk(root) {
  const results = [];
  if (!existsSync(root)) {
    return results;
  }
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = join(root, entry.name);
    results.push(fullPath);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    }
  }
  return results;
}

export function findRenderedFile(mediaDir, sceneName, qualityDir, format) {
  const extension = format;
  for (const item of walk(mediaDir)) {
    if (basename(item) !== qualityDir) continue;
    try {
      if (!statSync(item).isDirectory()) continue;
    } catch {
      continue;
    }
    const candidate = join(item, `${sceneName}.${extension}`);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  for (const item of walk(mediaDir)) {
    if (basename(item) === `${sceneName}.${extension}`) {
      return item;
    }
  }

  if (format === "gif") {
    for (const item of walk(mediaDir)) {
      if (basename(item) === `${sceneName}.gif`) {
        return item;
      }
    }
  }

  return null;
}

function defaultPython() {
  return process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");
}

export function ensureManimInstalled(python = defaultPython()) {
  const result = spawnSync(python, ["-c", "import manim; print(manim.__version__)"], {
    encoding: "utf-8",
    timeout: 10000,
  });
  if (result.status === 0) {
    console.log(`Manim version: ${result.stdout.trim()}`);
    return true;
  }
  return false;
}

function usage() {
  return `Render Manim scene to video.

Usage: node scripts/render_video.mjs <scene.py> <SceneName> [options]

Options:
  --quality <low|medium|high|4k>  Render quality preset (default: high)
  --format <mp4|gif|webm>         Output format (default: mp4)
  --output, -o <path>             Output file path
  --media-dir <path>              Custom media directory for Manim output
  --help                          Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    sceneFile: null,
    sceneName: null,
    quality: "high",
    format: "mp4",
    output: null,
    mediaDir: null,
    help: false,
  };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (["--quality", "--format", "--output", "-o", "--media-dir"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      index += 1;
      if (arg === "--quality") args.quality = value;
      if (arg === "--format") args.format = value;
      if (arg === "--output" || arg === "-o") args.output = value;
      if (arg === "--media-dir") args.mediaDir = value;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`unrecognized argument: ${arg}`);
    }
    positional.push(arg);
  }
  [args.sceneFile, args.sceneName] = positional;
  if (!args.help && positional.length !== 2) {
    throw new Error("scene file and scene name are required");
  }
  if (!Object.hasOwn(QUALITY_MAP, args.quality)) {
    throw new Error(`--quality must be one of: ${Object.keys(QUALITY_MAP).join(", ")}`);
  }
  if (!Object.hasOwn(FORMAT_MAP, args.format)) {
    throw new Error(`--format must be one of: ${Object.keys(FORMAT_MAP).join(", ")}`);
  }
  return args;
}

export function resolveOutputPath(output, format) {
  if (!output) return null;
  let outputPath = resolve(output);
  const suffix = extname(outputPath);
  if (!suffix) {
    outputPath = `${outputPath}.${format}`;
  } else if (suffix.toLowerCase() !== `.${format}`) {
    throw new Error(`ERROR: output extension ${suffix} does not match --format ${format}`);
  }
  return outputPath;
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }

  const scenePath = resolve(args.sceneFile);
  if (!existsSync(scenePath)) {
    throw new Error(`ERROR: Scene file not found: ${scenePath}`);
  }
  const outputPath = resolveOutputPath(args.output, args.format);

  if (!ensureManimInstalled()) {
    throw new Error("ERROR: Manim is not installed. Run: pip install manim --break-system-packages");
  }

  const [qualityFlag, qualityDir] = QUALITY_MAP[args.quality];
  const formatFlag = FORMAT_MAP[args.format];
  const mediaDir = args.mediaDir ? resolve(args.mediaDir) : join(dirname(scenePath), "media");
  const python = defaultPython();
  const command = [
    python,
    "-m", "manim", "render",
    qualityFlag,
    formatFlag,
    `--media_dir=${mediaDir}`,
    scenePath,
    args.sceneName,
  ];

  console.log(`Rendering: ${args.sceneName} @ ${args.quality} quality (${args.format})`);
  console.log(`Command: ${command.join(" ")}`);
  console.log();

  const result = spawnSync(command[0], command.slice(1), { stdio: "inherit", encoding: "utf-8" });
  if (result.status !== 0) {
    throw new Error(`\nERROR: Manim render failed with exit code ${result.status ?? 1}`);
  }

  const rendered = findRenderedFile(mediaDir, args.sceneName, qualityDir, args.format);
  if (!rendered) {
    console.error(`\nWARNING: Could not locate rendered file. Check ${mediaDir} manually.`);
    console.error("Contents of media dir:");
    for (const item of walk(mediaDir).sort()) {
      try {
        if (statSync(item).isFile()) {
          console.error(`  ${item} (${statSync(item).size.toLocaleString("en-US")} bytes)`);
        }
      } catch {
        // Ignore files that disappear while listing.
      }
    }
    return 1;
  }

  let finalPath = rendered;
  if (outputPath) {
    mkdirSync(dirname(outputPath), { recursive: true });
    cpSync(rendered, outputPath, { preserveTimestamps: true });
    finalPath = outputPath;
  }

  const size = statSync(finalPath).size;
  console.log(`\nRendered: ${finalPath}`);
  console.log(`  Quality:   ${args.quality} (${qualityDir})`);
  console.log(`  Format:    ${args.format}`);
  console.log(`  File size: ${size.toLocaleString("en-US")} bytes (${(size / 1024).toFixed(1)} KB)`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
