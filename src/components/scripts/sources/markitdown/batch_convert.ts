#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync, realpathSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { convertDocument, normalizeExtensions } from "./markitdown_runtime";

const DEFAULT_EXTENSIONS = [".pdf", ".docx", ".pptx", ".xlsx", ".html", ".jpg", ".png"];

function usage() {
  console.log(`Usage: node batch_convert.mjs <input_dir> <output_dir> [options]

Options:
  --extensions, -e <ext...>  File extensions to convert
  --recursive, -r           Search subdirectories recursively
  --workers, -w <n>         Number of parallel workers (default: 4)
  --verbose, -v             Print detailed messages
  --plugins, -p             Enable MarkItDown plugins`);
}

function parseArgs(argv) {
  const positional = [];
  const options = {
    extensions: null,
    recursive: false,
    workers: 4,
    verbose: false,
    enablePlugins: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }
    if (arg === "--recursive" || arg === "-r") {
      options.recursive = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--plugins" || arg === "-p") {
      options.enablePlugins = true;
    } else if (arg === "--workers" || arg === "-w") {
      options.workers = Number.parseInt(argv[++index] ?? "", 10);
    } else if (arg === "--extensions" || arg === "-e") {
      options.extensions = [];
      while (argv[index + 1] && !argv[index + 1].startsWith("-")) {
        options.extensions.push(argv[++index]);
      }
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 2 || !Number.isInteger(options.workers) || options.workers < 1) {
    return { error: "Invalid arguments" };
  }

  return {
    inputDir: positional[0],
    outputDir: positional[1],
    ...options,
  };
}

function collectFiles(inputDir, extensions, recursive) {
  const normalized = new Set(normalizeExtensions(extensions).map((extension) => extension.toLowerCase()));
  const files = [];

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const next = join(dir, entry.name);
      if (entry.isDirectory() && recursive) {
        walk(next);
      } else if (entry.isFile() && normalized.has(extname(entry.name).toLowerCase())) {
        files.push(next);
      }
    }
  }

  walk(inputDir);
  return files.sort();
}

async function mapLimit(items, limit, worker) {
  const results = [];
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runWorker));
  return results;
}

export async function convertFile(filePath, outputDir, options = {}) {
  if (options.verbose) {
    console.log(`Converting: ${filePath}`);
  }

  const result = await convertDocument(filePath, {
    enablePlugins: options.enablePlugins,
  });
  const sourceName = basename(filePath);
  const stem = sourceName.slice(0, sourceName.length - extname(sourceName).length);
  const outputFile = join(outputDir, `${stem}.md`);
  const content = [
    `# ${result.title || stem}`,
    "",
    `**Source**: ${sourceName}`,
    `**Format**: ${extname(sourceName)}`,
    "",
    "---",
    "",
    result.text_content,
  ].join("\n");

  writeFileSync(outputFile, content, "utf-8");
  return {
    file: filePath,
    success: true,
    message: `Converted to ${basename(outputFile)}`,
  };
}

export async function batchConvert(inputDir, outputDir, options = {}) {
  const extensions = options.extensions ?? DEFAULT_EXTENSIONS;
  mkdirSync(outputDir, { recursive: true });

  const files = collectFiles(inputDir, extensions, Boolean(options.recursive));
  if (files.length === 0) {
    console.log(`No files found with extensions: ${extensions.join(", ")}`);
    return { total: 0, success: 0, failed: 0, details: [] };
  }

  console.log(`Found ${files.length} file(s) to convert`);

  const details = await mapLimit(files, options.workers ?? 4, async (filePath) => {
    try {
      const detail = await convertFile(filePath, outputDir, options);
      console.log(detail.message);
      return detail;
    } catch (error) {
      const detail = {
        file: filePath,
        success: false,
        message: `Error: ${error.message}`,
      };
      console.log(detail.message);
      return detail;
    }
  });

  const success = details.filter((detail) => detail.success).length;
  return {
    total: files.length,
    success,
    failed: files.length - success,
    details,
  };
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    usage();
    return 0;
  }
  if (args.error) {
    console.error(`Error: ${args.error}`);
    usage();
    return 1;
  }

  const inputDir = resolve(args.inputDir);
  if (!existsSync(inputDir)) {
    console.error(`Error: Input directory '${args.inputDir}' does not exist`);
    return 1;
  }
  if (!statSync(inputDir).isDirectory()) {
    console.error(`Error: '${args.inputDir}' is not a directory`);
    return 1;
  }

  const results = await batchConvert(inputDir, resolve(args.outputDir), args);
  console.log("\n==================================================");
  console.log("CONVERSION SUMMARY");
  console.log("==================================================");
  console.log(`Total files:     ${results.total}`);
  console.log(`Successful:      ${results.success}`);
  console.log(`Failed:          ${results.failed}`);
  console.log(results.total > 0 ? `Success rate:    ${((results.success / results.total) * 100).toFixed(1)}%` : "N/A");

  if (results.failed > 0) {
    console.log("\nFailed conversions:");
    for (const detail of results.details) {
      if (!detail.success) {
        console.log(`  - ${detail.file}: ${detail.message}`);
      }
    }
  }

  return results.failed === 0 ? 0 : 1;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    (status) => {
      process.exitCode = status;
    },
    (error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    },
  );
}
