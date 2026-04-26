#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { convertDocument } from "./markitdown_runtime.mjs";

function usage() {
  console.log(`Usage: node convert_literature.mjs <input_dir> <output_dir> [options]

Options:
  --organize-by-year, -y  Organize output into year subdirectories
  --create-index, -i      Create an index/catalog of all papers
  --recursive, -r         Search subdirectories recursively`);
}

function parseArgs(argv) {
  const positional = [];
  const options = {
    organizeByYear: false,
    createIndex: false,
    recursive: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }
    if (arg === "--organize-by-year" || arg === "-y") {
      options.organizeByYear = true;
    } else if (arg === "--create-index" || arg === "-i") {
      options.createIndex = true;
    } else if (arg === "--recursive" || arg === "-r") {
      options.recursive = true;
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 2) {
    return { error: "Invalid arguments" };
  }

  return {
    inputDir: positional[0],
    outputDir: positional[1],
    ...options,
  };
}

export function extractMetadataFromFilename(filename) {
  const metadata = {};
  const stem = basename(filename, extname(filename));
  const yearMatch = stem.match(/(?:^|[_\-\s])((?:19|20)\d{2})(?=$|[_\-\s])/);
  if (yearMatch) {
    metadata.year = yearMatch[1];
  }

  const parts = stem.split(/[_-]/);
  if (parts.length >= 2) {
    metadata.author = parts[0].replaceAll("_", " ");
    metadata.title = parts.slice(1).join(" ").replaceAll("_", " ");
  } else {
    metadata.title = stem.replaceAll("_", " ");
  }

  return metadata;
}

function collectPdfFiles(inputDir, recursive) {
  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const next = join(dir, entry.name);
      if (entry.isDirectory() && recursive) {
        walk(next);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
        files.push(next);
      }
    }
  }
  walk(inputDir);
  return files.sort();
}

export async function convertPaper(inputFile, outputDir, options = {}) {
  console.log(`Converting: ${basename(inputFile)}`);
  const result = await convertDocument(inputFile);
  const metadata = {
    ...extractMetadataFromFilename(inputFile),
    source_file: basename(inputFile),
    converted_date: new Date().toISOString(),
  };
  if (!metadata.title && result.title) {
    metadata.title = result.title;
  }

  const outputSubdir = options.organizeByYear && metadata.year ? join(outputDir, metadata.year) : outputDir;
  mkdirSync(outputSubdir, { recursive: true });

  const outputFile = join(outputSubdir, `${basename(inputFile, extname(inputFile))}.md`);
  const lines = [
    "---",
    `title: "${metadata.title || basename(inputFile, extname(inputFile))}"`,
  ];
  if (metadata.author) {
    lines.push(`author: "${metadata.author}"`);
  }
  if (metadata.year) {
    lines.push(`year: ${metadata.year}`);
  }
  lines.push(`source: "${metadata.source_file}"`);
  lines.push(`converted: "${metadata.converted_date}"`);
  lines.push("---", "", `# ${metadata.title || basename(inputFile, extname(inputFile))}`, "", "## Document Information", "");
  if (metadata.author) {
    lines.push(`**Author**: ${metadata.author}`);
  }
  if (metadata.year) {
    lines.push(`**Year**: ${metadata.year}`);
  }
  lines.push(`**Source File**: ${metadata.source_file}`);
  lines.push(`**Converted**: ${metadata.converted_date}`, "", "---", "", result.text_content);

  writeFileSync(outputFile, lines.join("\n"), "utf-8");
  console.log(`Saved to: ${outputFile}`);
  return metadata;
}

export function createIndex(papers, outputDir) {
  const papersSorted = [...papers].sort((left, right) => {
    const year = String(left.year ?? "9999").localeCompare(String(right.year ?? "9999"));
    if (year !== 0) {
      return year;
    }
    return String(left.title ?? "").localeCompare(String(right.title ?? ""));
  });

  const byYear = new Map();
  for (const paper of papersSorted) {
    const year = paper.year ?? "Unknown";
    if (!byYear.has(year)) {
      byYear.set(year, []);
    }
    byYear.get(year).push(paper);
  }

  const lines = [
    "# Literature Review Index",
    "",
    `**Generated**: ${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
    `**Total Papers**: ${papers.length}`,
    "",
    "---",
    "",
  ];

  for (const year of [...byYear.keys()].sort()) {
    lines.push(`## ${year}`, "");
    for (const paper of byYear.get(year)) {
      const title = paper.title ?? paper.source_file ?? "Unknown";
      const author = paper.author ?? "Unknown Author";
      const source = paper.source_file ?? "";
      const markdownFile = paper.year && paper.year !== "Unknown"
        ? `${paper.year}/${basename(source, extname(source))}.md`
        : `${basename(source, extname(source))}.md`;
      lines.push(`- **${title}**`);
      lines.push(`  - Author: ${author}`);
      lines.push(`  - Source: ${source}`);
      lines.push(`  - [Read Markdown](${markdownFile})`, "");
    }
  }

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "INDEX.md"), lines.join("\n"), "utf-8");
  writeFileSync(join(outputDir, "catalog.json"), JSON.stringify(papersSorted, null, 2), "utf-8");
  console.log(`\nCreated index: ${join(outputDir, "INDEX.md")}`);
  console.log(`Created catalog: ${join(outputDir, "catalog.json")}`);
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

  const pdfFiles = collectPdfFiles(inputDir, args.recursive);
  if (pdfFiles.length === 0) {
    console.log("No PDF files found");
    return 1;
  }

  console.log(`Found ${pdfFiles.length} PDF file(s)`);
  const results = [];
  let successCount = 0;

  for (const pdfFile of pdfFiles) {
    try {
      results.push(await convertPaper(pdfFile, resolve(args.outputDir), args));
      successCount += 1;
    } catch (error) {
      console.log(`Error converting ${basename(pdfFile)}: ${error.message}`);
    }
  }

  if (args.createIndex && results.length > 0) {
    createIndex(results, resolve(args.outputDir));
  }

  console.log("\n==================================================");
  console.log("CONVERSION SUMMARY");
  console.log("==================================================");
  console.log(`Total papers:    ${pdfFiles.length}`);
  console.log(`Successful:      ${successCount}`);
  console.log(`Failed:          ${pdfFiles.length - successCount}`);
  console.log(`Success rate:    ${((successCount / pdfFiles.length) * 100).toFixed(1)}%`);

  return successCount === pdfFiles.length ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
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
