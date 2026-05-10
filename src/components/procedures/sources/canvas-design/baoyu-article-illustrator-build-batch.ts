import { defineCliProcedure, procedureEntry } from "../../definition";
import path from "node:path";
import process from "node:process";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { assertOutputWritable } from "./output_guard";

export const procedure = defineCliProcedure({
  id: "canvas-design-baoyu-article-illustrator-build-batch",
  entry: procedureEntry(import.meta.url),
  description:
    "从文章大纲 markdown 和提示词目录批量生成文章插图 baoyu-imagine 任务配置文件。",
  owners: { skillIds: ["canvas-design"] },
  target: "scripts/baoyu-article-illustrator-build-batch.mjs",
  runtime: "node",
  params: [
    {
      flag: "--outline",
      type: "路径",
      description: "大纲 markdown 文件路径",
      required: true,
    },
    {
      flag: "--prompts",
      type: "路径",
      description: "提示词目录路径",
      required: true,
    },
    {
      flag: "--output",
      type: "路径",
      description: "输出 batch.json 路径",
      required: true,
    },
    {
      flag: "--images-dir",
      type: "路径",
      description: "生成图片的输出目录",
      required: false,
    },
    {
      flag: "--provider",
      type: "字符串",
      description: "baoyu-imagine 任务提供商（默认 replicate）",
      required: false,
    },
    {
      flag: "--model",
      type: "字符串",
      description: "baoyu-imagine 任务模型（默认 google/nano-banana-pro）",
      required: false,
    },
    {
      flag: "--ar",
      type: "数字",
      description: "图片宽高比（默认 16:9）",
      required: false,
    },
    {
      flag: "--quality",
      type: "数字",
      description: "图片质量（默认 2k）",
      required: false,
    },
    {
      flag: "--jobs",
      type: "数字",
      description: "推荐 worker 数量",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "允许覆盖已存在的 batch JSON 输出；仅在确认目标文件可替换后使用",
      required: false,
    },
  ],

  exampleArgs: {
    args: [
      "--outline",
      "outline.md",
      "--prompts",
      "prompts",
      "--output",
      "batch.json",
      "--images-dir",
      "attachments",
    ],
  },
});

function printUsage(): any {
  console.log(`Usage:
  node scripts/baoyu-article-illustrator-build-batch.mjs --outline outline.md --prompts prompts --output batch.json --images-dir attachments

Options:
  --outline <path>     Path to outline.md
  --prompts <path>     Path to prompts directory
  --output <path>      Path to output batch.json
  --images-dir <path>  Directory for generated images
  --provider <name>    Provider for baoyu-imagine batch tasks (default: replicate)
  --model <id>         Model for baoyu-imagine batch tasks (default: google/nano-banana-pro)
  --ar <ratio>         Aspect ratio for all tasks (default: 16:9)
  --quality <level>    Quality for all tasks (default: 2k)
  --jobs <count>       Recommended worker count metadata (optional)
  --overwrite          Replace an existing batch JSON output after confirmation
  -h, --help           Show help`);
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    outlinePath: null,
    promptsDir: null,
    outputPath: null,
    imagesDir: null,
    provider: "replicate",
    model: "google/nano-banana-pro",
    aspectRatio: "16:9",
    quality: "2k",
    jobs: null,
    overwrite: false,
    help: false,
  };
  const readOptionValue = (index: number, flag: string): string => {
    const value = argv[index + 1];
    if (value == null || value.startsWith("--")) {
      throw new Error(`${flag} requires a value`);
    }
    return value;
  };
  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (current === "--outline") args.outlinePath = readOptionValue(i++, current);
    else if (current === "--prompts")
      args.promptsDir = readOptionValue(i++, current);
    else if (current === "--output")
      args.outputPath = readOptionValue(i++, current);
    else if (current === "--images-dir")
      args.imagesDir = readOptionValue(i++, current);
    else if (current === "--provider")
      args.provider = readOptionValue(i++, current);
    else if (current === "--model") args.model = readOptionValue(i++, current);
    else if (current === "--ar")
      args.aspectRatio = readOptionValue(i++, current);
    else if (current === "--quality")
      args.quality = readOptionValue(i++, current);
    else if (current === "--jobs") {
      args.jobs = parseInt(readOptionValue(i++, current), 10);
    } else if (current === "--help" || current === "-h") {
      args.help = true;
    } else if (current === "--overwrite") {
      args.overwrite = true;
    }
  }
  return args;
}
function parseOutline(content: any): any {
  const entries: any[] = [];
  const blocks = content.split(/^## Illustration\s+/m).slice(1);
  for (const block of blocks) {
    const indexMatch = block.match(/^(\d+)/);
    const filenameMatch = block.match(/\*\*Filename\*\*:\s*(.+)/);
    if (indexMatch && filenameMatch) {
      entries.push({
        index: parseInt(indexMatch[1], 10),
        filename: filenameMatch[1].trim(),
      });
    }
  }
  return entries;
}
async function findPromptFile(promptsDir: any, entry: any): Promise<any> {
  const files = (await readdir(promptsDir)).sort();
  const prefix = String(entry.index).padStart(2, "0");
  const match = files.find(
    (f: any) => f.startsWith(prefix) && f.endsWith(".md"),
  );
  return match ? path.join(promptsDir, match) : null;
}
export async function main(argv: readonly string[]): Promise<any> {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
  if (args.help) {
    printUsage();
    return;
  }
  if (!args.outlinePath) {
    console.error("Error: --outline is required");
    process.exit(1);
  }
  if (!args.promptsDir) {
    console.error("Error: --prompts is required");
    process.exit(1);
  }
  if (!args.outputPath) {
    console.error("Error: --output is required");
    process.exit(1);
  }
  if (args.jobs !== null && (!Number.isInteger(args.jobs) || args.jobs <= 0)) {
    console.error("Error: --jobs must be a positive integer");
    process.exit(1);
  }
  assertOutputWritable(args.outputPath, args.overwrite);
  const outlineStat = await stat(args.outlinePath).catch(() => null);
  if (!outlineStat?.isFile()) {
    console.error(`Error: outline file not found: ${args.outlinePath}`);
    process.exit(1);
  }
  const promptsStat = await stat(args.promptsDir).catch(() => null);
  if (!promptsStat?.isDirectory()) {
    console.error(`Error: prompts directory not found: ${args.promptsDir}`);
    process.exit(1);
  }
  const outlineContent = await readFile(args.outlinePath, "utf8");
  const entries = parseOutline(outlineContent);
  if (entries.length === 0) {
    console.error("No illustration entries found in outline.");
    process.exit(1);
  }
  const tasks: any[] = [];
  for (const entry of entries) {
    const promptFile = await findPromptFile(args.promptsDir, entry);
    if (!promptFile) {
      console.error(
        `Warning: No prompt file found for illustration ${entry.index}, skipping.`,
      );
      continue;
    }
    const imageDir = args.imagesDir ?? path.dirname(args.outputPath);
    tasks.push({
      id: `illustration-${String(entry.index).padStart(2, "0")}`,
      promptFiles: [promptFile],
      image: path.join(imageDir, entry.filename),
      provider: args.provider,
      model: args.model,
      ar: args.aspectRatio,
      quality: args.quality,
    });
  }
  if (tasks.length === 0) {
    console.error(
      "Error: no batch tasks were generated. Check outline filenames and prompts directory.",
    );
    process.exit(1);
  }
  const output: Record<string, any> = { tasks };
  if (args.jobs) output.jobs = args.jobs;
  await writeFile(args.outputPath, JSON.stringify(output, null, 2) + "\n");
  console.log(`Batch file written: ${args.outputPath} (${tasks.length} tasks)`);
}
