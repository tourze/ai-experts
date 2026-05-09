#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
  realpathSync,
} from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { convertDocument } from "./markitdown_runtime";

export const procedure = defineCliProcedure({
  id: "markitdown-convert-literature",
  entry: procedureEntry(import.meta.url),
  description:
    "批量转换学术 PDF 文献为带元数据的 Markdown，支持按年份归档和生成索引目录。",
  owners: { skillIds: ["markitdown"] },
  target: "scripts/convert_literature.mjs",
  runtime: "node",
  params: [
    {
      flag: "--organize-by-year",
      type: "",
      description: "按年份归档到子目录，传此标志即启用",
      required: false,
    },
    {
      flag: "--create-index",
      type: "",
      description: "生成 INDEX.md 和 catalog.json，传此标志即启用",
      required: false,
    },
    {
      flag: "--recursive",
      type: "",
      description: "递归搜索子目录",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "允许覆盖已存在的 Markdown、INDEX.md 和 catalog.json 输出；仅在确认目标文件可替换后使用",
      required: false,
    },
  ],

  exampleArgs: {
    args: ["papers_dir", "output_dir", "--organize-by-year", "--create-index"],
  },
});

function usage(): any {
  console.log(`Usage: node convert_literature.mjs <input_dir> <output_dir> [options]

Options:
  --organize-by-year, -y  Organize output into year subdirectories
  --create-index, -i      Create an index/catalog of all papers
  --recursive, -r         Search subdirectories recursively
  --overwrite             Replace existing Markdown/index outputs after confirmation`);
}
export function parseArgs(argv: readonly string[]): any {
  const positional: any[] = [];
  const options: Record<string, any> = {
    organizeByYear: false,
    createIndex: false,
    recursive: false,
    overwrite: false,
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
    } else if (arg === "--overwrite") {
      options.overwrite = true;
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
export function extractMetadataFromFilename(filename: any): any {
  const metadata: Record<string, any> = {};
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
function collectPdfFiles(inputDir: any, recursive: any): any {
  const files: any[] = [];
  function walk(dir: any) {
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
export async function convertPaper(
  inputFile: any,
  outputDir: any,
  options: any = {},
): Promise<any> {
  console.log(`Converting: ${basename(inputFile)}`);
  const metadata: Record<string, any> = {
    ...extractMetadataFromFilename(inputFile),
    source_file: basename(inputFile),
    converted_date: new Date().toISOString(),
  };
  const outputSubdir =
    options.organizeByYear && metadata.year
      ? join(outputDir, metadata.year)
      : outputDir;
  const outputFile = join(
    outputSubdir,
    `${basename(inputFile, extname(inputFile))}.md`,
  );
  if (existsSync(outputFile) && !options.overwrite) {
    throw new Error(
      `output file already exists: ${outputFile}; pass --overwrite only after confirming it can be replaced`,
    );
  }
  const result = await convertDocument(inputFile);
  if (!metadata.title && result.title) {
    metadata.title = result.title;
  }
  mkdirSync(outputSubdir, { recursive: true });
  const lines: any[] = [
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
  lines.push(
    "---",
    "",
    `# ${metadata.title || basename(inputFile, extname(inputFile))}`,
    "",
    "## Document Information",
    "",
  );
  if (metadata.author) {
    lines.push(`**Author**: ${metadata.author}`);
  }
  if (metadata.year) {
    lines.push(`**Year**: ${metadata.year}`);
  }
  lines.push(`**Source File**: ${metadata.source_file}`);
  lines.push(
    `**Converted**: ${metadata.converted_date}`,
    "",
    "---",
    "",
    result.text_content,
  );
  writeFileSync(outputFile, lines.join("\n"), "utf-8");
  console.log(`Saved to: ${outputFile}`);
  return metadata;
}
function assertIndexOutputsWritable(outputDir: any, options: any = {}): void {
  const indexFile = join(outputDir, "INDEX.md");
  const catalogFile = join(outputDir, "catalog.json");
  for (const outputFile of [indexFile, catalogFile]) {
    if (existsSync(outputFile) && !options.overwrite) {
      throw new Error(
        `output file already exists: ${outputFile}; pass --overwrite only after confirming it can be replaced`,
      );
    }
  }
}
export function createIndex(papers: any, outputDir: any, options: any = {}): any {
  assertIndexOutputsWritable(outputDir, options);
  const papersSorted = [...papers].sort((left: any, right: any) => {
    const year = String(left.year ?? "9999").localeCompare(
      String(right.year ?? "9999"),
    );
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
  const lines: any[] = [
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
      const markdownFile =
        paper.year && paper.year !== "Unknown"
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
  writeFileSync(
    join(outputDir, "catalog.json"),
    JSON.stringify(papersSorted, null, 2),
    "utf-8",
  );
  console.log(`\nCreated index: ${join(outputDir, "INDEX.md")}`);
  console.log(`Created catalog: ${join(outputDir, "catalog.json")}`);
}
export async function main(argv: readonly string[]): Promise<any> {
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
  if (args.createIndex) {
    try {
      assertIndexOutputsWritable(resolve(args.outputDir), args);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      return 1;
    }
  }
  console.log(`Found ${pdfFiles.length} PDF file(s)`);
  const results: any[] = [];
  let successCount = 0;
  for (const pdfFile of pdfFiles) {
    try {
      results.push(await convertPaper(pdfFile, resolve(args.outputDir), args));
      successCount += 1;
    } catch (error: any) {
      console.log(`Error converting ${basename(pdfFile)}: ${error.message}`);
    }
  }
  if (args.createIndex && results.length > 0) {
    try {
      createIndex(results, resolve(args.outputDir), args);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      return 1;
    }
  }
  console.log("\n==================================================");
  console.log("CONVERSION SUMMARY");
  console.log("==================================================");
  console.log(`Total papers:    ${pdfFiles.length}`);
  console.log(`Successful:      ${successCount}`);
  console.log(`Failed:          ${pdfFiles.length - successCount}`);
  console.log(
    `Success rate:    ${((successCount / pdfFiles.length) * 100).toFixed(1)}%`,
  );
  return successCount === pdfFiles.length ? 0 : 1;
}
