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
import { convertDocument, normalizeExtensions } from "./markitdown_runtime";

export const procedure = defineCliProcedure({
  id: "markitdown-batch-convert",
  entry: procedureEntry(import.meta.url),
  description:
    "批量转换目录中的 Office/图片/HTML/音频等文件为 Markdown，支持并发和递归遍历。",
  owners: { skillIds: ["markitdown"] },
  target: "scripts/batch_convert.mjs",
  runtime: "node",
  params: [
    {
      flag: "--extensions",
      type: "字符串",
      description: "要转换的文件扩展名列表（如 .pdf .docx .pptx）",
      required: false,
    },
    {
      flag: "--recursive",
      type: "",
      description: "递归搜索子目录",
      required: false,
    },
    {
      flag: "--workers",
      type: "数字",
      description: "并行 worker 数量（默认 4）",
      required: false,
    },
    {
      flag: "--verbose",
      type: "",
      description: "输出详细日志，传此标志即启用",
      required: false,
    },
    {
      flag: "--plugins",
      type: "",
      description: "启用 MarkItDown 插件，传此标志即启用",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "允许覆盖已存在的 Markdown 输出；仅在确认目标文件可替换后使用",
      required: false,
    },
  ],

  exampleArgs: {
    args: [
      "input_dir",
      "output_dir",
      "--recursive",
      "--extensions",
      ".pdf",
      ".docx",
    ],
  },
});

const DEFAULT_EXTENSIONS: any[] = [
  ".pdf",
  ".docx",
  ".pptx",
  ".xlsx",
  ".html",
  ".jpg",
  ".png",
];
function usage(): any {
  console.log(`Usage: node batch_convert.mjs <input_dir> <output_dir> [options]

Options:
  --extensions, -e <ext...>  File extensions to convert
  --recursive, -r           Search subdirectories recursively
  --workers, -w <n>         Number of parallel workers (default: 4)
  --verbose, -v             Print detailed messages
  --plugins, -p             Enable MarkItDown plugins
  --overwrite               Replace existing Markdown outputs after confirmation`);
}
export function parseArgs(argv: readonly string[]): any {
  const positional: any[] = [];
  const options: Record<string, any> = {
    extensions: null,
    recursive: false,
    workers: 4,
    verbose: false,
    enablePlugins: false,
    overwrite: false,
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
    } else if (arg === "--overwrite") {
      options.overwrite = true;
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
  if (
    positional.length !== 2 ||
    !Number.isInteger(options.workers) ||
    options.workers < 1
  ) {
    return { error: "Invalid arguments" };
  }
  return {
    inputDir: positional[0],
    outputDir: positional[1],
    ...options,
  };
}
function collectFiles(inputDir: any, extensions: any, recursive: any): any {
  const normalized = new Set(
    normalizeExtensions(extensions).map((extension: any) =>
      extension.toLowerCase(),
    ),
  );
  const files: any[] = [];
  function walk(dir: any) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const next = join(dir, entry.name);
      if (entry.isDirectory() && recursive) {
        walk(next);
      } else if (
        entry.isFile() &&
        normalized.has(extname(entry.name).toLowerCase())
      ) {
        files.push(next);
      }
    }
  }
  walk(inputDir);
  return files.sort();
}
async function mapLimit(items: any, limit: any, worker: any): Promise<any> {
  const results: any[] = [];
  let nextIndex = 0;
  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, runWorker),
  );
  return results;
}
export async function convertFile(
  filePath: any,
  outputDir: any,
  options: any = {},
): Promise<any> {
  if (options.verbose) {
    console.log(`Converting: ${filePath}`);
  }
  const sourceName = basename(filePath);
  const stem = sourceName.slice(
    0,
    sourceName.length - extname(sourceName).length,
  );
  const outputFile = join(outputDir, `${stem}.md`);
  if (existsSync(outputFile) && !options.overwrite) {
    throw new Error(
      `output file already exists: ${outputFile}; pass --overwrite only after confirming it can be replaced`,
    );
  }
  const result = await convertDocument(filePath, {
    enablePlugins: options.enablePlugins,
  });
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
export async function batchConvert(
  inputDir: any,
  outputDir: any,
  options: any = {},
): Promise<any> {
  const extensions = options.extensions ?? DEFAULT_EXTENSIONS;
  mkdirSync(outputDir, { recursive: true });
  const files = collectFiles(inputDir, extensions, Boolean(options.recursive));
  if (files.length === 0) {
    console.log(`No files found with extensions: ${extensions.join(", ")}`);
    return { total: 0, success: 0, failed: 0, details: [] };
  }
  console.log(`Found ${files.length} file(s) to convert`);
  const details = await mapLimit(
    files,
    options.workers ?? 4,
    async (filePath: any) => {
      try {
        const detail = await convertFile(filePath, outputDir, options);
        console.log(detail.message);
        return detail;
      } catch (error: any) {
        const detail: Record<string, any> = {
          file: filePath,
          success: false,
          message: `Error: ${error.message}`,
        };
        console.log(detail.message);
        return detail;
      }
    },
  );
  const success = details.filter((detail: any) => detail.success).length;
  return {
    total: files.length,
    success,
    failed: files.length - success,
    details,
  };
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
  const results = await batchConvert(inputDir, resolve(args.outputDir), args);
  console.log("\n==================================================");
  console.log("CONVERSION SUMMARY");
  console.log("==================================================");
  console.log(`Total files:     ${results.total}`);
  console.log(`Successful:      ${results.success}`);
  console.log(`Failed:          ${results.failed}`);
  console.log(
    results.total > 0
      ? `Success rate:    ${((results.success / results.total) * 100).toFixed(1)}%`
      : "N/A",
  );
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
