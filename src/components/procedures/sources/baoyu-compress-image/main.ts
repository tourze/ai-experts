#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";

export const procedure = defineCliProcedure({
  id: "baoyu-compress-image-main",
  entry: procedureEntry(import.meta.url),
  description:
    "压缩图片或批量转换图片格式：支持 webp/png/jpeg 输出，自动选择系统工具或 sharp 后端。",
  owners: { skillIds: ["baoyu-compress-image"] },
  target: "scripts/main.mjs",
  runtime: "node",
  params: [
    {
      flag: "--output",
      type: "路径",
      description: "输出文件路径（仅单文件输入可用）",
      required: false,
    },
    {
      flag: "--format",
      type: "webp|png|jpeg",
      description: "输出格式（默认 webp）",
      required: false,
    },
    {
      flag: "--quality",
      type: "数字",
      description: "压缩质量（默认 80）",
      required: false,
    },
    { flag: "--keep", type: "", description: "保留原始文件（默认行为）", required: false },
    {
      flag: "--delete-original",
      type: "",
      description: "成功转码后删除原始文件；仅在用户确认源文件可删除后使用",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "允许覆盖已存在的输出文件；仅在确认目标文件可覆盖后使用",
      required: false,
    },
    {
      flag: "--recursive",
      type: "",
      description: "递归处理子目录",
      required: false,
    },
    {
      flag: "--json",
      type: "",
      description: "JSON 格式输出，传此标志即启用",
      required: false,
    },
  ],

  exampleArgs: { args: ["input.png", "--format", "webp", "--quality", "80"] },
});

const SUPPORTED_EXTS: any[] = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".tiff",
];
async function commandExists(cmd: any): Promise<any> {
  const binary = process.platform === "win32" ? "where" : "which";
  try {
    const proc = spawn(binary, [cmd], { stdio: "pipe" });
    return new Promise((res: any) => {
      proc.on("close", (code: any) => res(code === 0));
      proc.on("error", () => res(false));
    });
  } catch {
    return false;
  }
}
async function detectCompressor(format: any): Promise<any> {
  if (format === "webp") {
    if (await commandExists("cwebp")) return "cwebp";
    if ((await commandExists("magick")) || (await commandExists("convert")))
      return "imagemagick";
    return "sharp";
  }
  if (process.platform === "darwin") return "sips";
  if ((await commandExists("magick")) || (await commandExists("convert")))
    return "imagemagick";
  return "sharp";
}
function runCmd(cmd: any, args: any): any {
  return new Promise((res: any) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (d: any) => (stderr += d.toString()));
    proc.on("close", (code: any) => res({ code: code ?? 1, stderr }));
    proc.on("error", (e: any) => res({ code: 1, stderr: e.message }));
  });
}
async function compressWithSips(
  input: any,
  output: any,
  format: any,
  quality: any,
): Promise<any> {
  const fmt = format === "jpeg" ? "jpeg" : format;
  const args: any[] = [
    "-s",
    "format",
    fmt,
    "-s",
    "formatOptions",
    String(quality),
    input,
    "--out",
    output,
  ];
  const { code, stderr } = await runCmd("sips", args);
  if (code !== 0) throw new Error(`sips failed: ${stderr}`);
}
async function compressWithCwebp(
  input: any,
  output: any,
  quality: any,
): Promise<any> {
  const args: any[] = ["-q", String(quality), input, "-o", output];
  const { code, stderr } = await runCmd("cwebp", args);
  if (code !== 0) throw new Error(`cwebp failed: ${stderr}`);
}
async function compressWithImagemagick(
  input: any,
  output: any,
  quality: any,
): Promise<any> {
  const command = (await commandExists("magick")) ? "magick" : "convert";
  const args =
    command === "magick"
      ? [input, "-quality", String(quality), output]
      : [input, "-quality", String(quality), output];
  const { code, stderr } = await runCmd(command, args);
  if (code !== 0) throw new Error(`${command} failed: ${stderr}`);
}
function isModuleNotFoundError(error: any): any {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ERR_MODULE_NOT_FOUND"
  );
}
function runtimeRootForInstall(): string {
  const runtimeRoot = (globalThis as { __aiExpertsRuntimeRoot?: unknown })
    .__aiExpertsRuntimeRoot;
  return typeof runtimeRoot === "string" && runtimeRoot.trim() !== ""
    ? runtimeRoot
    : "<runtime-root>";
}
export function sharpInstallGuidance(runtimeRoot: string = runtimeRootForInstall()): string {
  return [
    "sharp is not installed.",
    "Use a system backend such as sips/cwebp/ImageMagick, or after explicit user confirmation",
    `install sharp into the runtime root with \`npm install --prefix ${runtimeRoot} sharp\`; do not install it globally.`,
  ].join(" ");
}
async function compressWithSharp(
  input: any,
  output: any,
  format: any,
  quality: any,
): Promise<any> {
  try {
    const sharp = (await import("sharp")).default;
    let pipeline = sharp(input);
    if (format === "webp") pipeline = pipeline.webp({ quality });
    else if (format === "png") pipeline = pipeline.png({ quality });
    else if (format === "jpeg") pipeline = pipeline.jpeg({ quality });
    await pipeline.toFile(output);
  } catch (error: any) {
    if (isModuleNotFoundError(error)) {
      throw new Error(sharpInstallGuidance());
    }
    throw error;
  }
}
async function compress(
  compressor: any,
  input: any,
  output: any,
  format: any,
  quality: any,
): Promise<any> {
  switch (compressor) {
    case "sips":
      await compressWithSips(input, output, format, quality);
      break;
    case "cwebp":
      if (format !== "webp") {
        await compressWithSharp(input, output, format, quality);
      } else {
        await compressWithCwebp(input, output, quality);
      }
      break;
    case "imagemagick":
      await compressWithImagemagick(input, output, quality);
      break;
    case "sharp":
      await compressWithSharp(input, output, format, quality);
      break;
  }
}
export function getOutputPath(
  input: any,
  format: any,
  keep: any,
  customOutput: any,
): any {
  if (customOutput) return resolve(customOutput);
  const dir = dirname(input);
  const base = basename(input, extname(input));
  const ext = format === "jpeg" ? ".jpg" : `.${format}`;
  if (keep && extname(input).toLowerCase() === ext) {
    return join(dir, `${base}-compressed${ext}`);
  }
  return join(dir, `${base}${ext}`);
}
function formatSize(bytes: any): any {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
function getTempOutputPath(output: any): any {
  const ext = extname(output);
  if (!ext) {
    return `${output}.tmp`;
  }
  return output.slice(0, -ext.length) + `.tmp${ext}`;
}
async function processFile(
  compressor: any,
  input: any,
  opts: any,
): Promise<any> {
  const absInput = resolve(input);
  const inputSize = statSync(absInput).size;
  const output = getOutputPath(absInput, opts.format, opts.keep, opts.output);
  const tempOutput = getTempOutputPath(output);
  mkdirSync(dirname(output), { recursive: true });
  await compress(compressor, absInput, tempOutput, opts.format, opts.quality);
  const outputSize = statSync(tempOutput).size;
  if (existsSync(output)) {
    const replacingInput = output === absInput && !opts.keep;
    if (!replacingInput && !opts.overwrite) {
      unlinkSync(tempOutput);
      throw new Error(
        `output file already exists: ${output}; pass --overwrite only after confirming it can be replaced`,
      );
    }
    unlinkSync(output);
  }
  renameSync(tempOutput, output);
  if (!opts.keep && absInput !== output && existsSync(absInput)) {
    unlinkSync(absInput);
  }
  return {
    input: absInput,
    output,
    inputSize,
    outputSize,
    ratio: outputSize / inputSize,
    compressor,
  };
}
function collectFiles(dir: any, recursive: any): any {
  const files: any[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && recursive) {
      files.push(...collectFiles(full, recursive));
    } else if (
      entry.isFile() &&
      SUPPORTED_EXTS.includes(extname(entry.name).toLowerCase())
    ) {
      files.push(full);
    }
  }
  return files;
}
function printHelp(): any {
  console.log(`Usage: node scripts/main.mjs <input> [options]

Options:
  -o, --output <path>   Output path
  -f, --format <fmt>    Output format: webp, png, jpeg (default: webp)
  -q, --quality <n>     Quality 0-100 (default: 80)
  -k, --keep            Keep original file (default)
      --delete-original Delete original file after successful conversion (confirm first)
      --overwrite       Replace an existing output file (confirm first)
  -r, --recursive       Process directories recursively
      --json            JSON output
  -h, --help            Show help`);
}
export function parseArgs(args: any): any {
  const opts: Record<string, any> = {
    input: "",
    format: "webp",
    quality: 80,
    keep: true,
    deleteOriginal: false,
    overwrite: false,
    recursive: false,
    json: false,
  };
  let sawKeep = false;
  let sawDeleteOriginal = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (arg === "-o" || arg === "--output") {
      opts.output = args[++i];
    } else if (arg === "-f" || arg === "--format") {
      const fmt = args[++i]?.toLowerCase();
      if (fmt === "webp" || fmt === "png" || fmt === "jpeg" || fmt === "jpg") {
        opts.format = fmt === "jpg" ? "jpeg" : fmt;
      } else {
        console.error(`Invalid format: ${fmt}`);
        return null;
      }
    } else if (arg === "-q" || arg === "--quality") {
      const q = parseInt(args[++i], 10);
      if (isNaN(q) || q < 0 || q > 100) {
        console.error(`Invalid quality: ${args[i]}`);
        return null;
      }
      opts.quality = q;
    } else if (arg === "-k" || arg === "--keep") {
      opts.keep = true;
      sawKeep = true;
    } else if (arg === "--delete-original") {
      opts.keep = false;
      opts.deleteOriginal = true;
      sawDeleteOriginal = true;
    } else if (arg === "--overwrite") {
      opts.overwrite = true;
    } else if (arg === "-r" || arg === "--recursive") {
      opts.recursive = true;
    } else if (arg === "--json") {
      opts.json = true;
    } else if (!arg.startsWith("-") && !opts.input) {
      opts.input = arg;
    }
  }
  if (sawKeep && sawDeleteOriginal) {
    console.error("Error: --keep and --delete-original cannot be used together");
    return null;
  }
  if (!opts.input) {
    console.error("Error: Input file or directory required");
    printHelp();
    return null;
  }
  return opts;
}
export async function main(argv: readonly string[]): Promise<any> {
  const args = argv;
  const opts = parseArgs(args);
  if (!opts) process.exit(1);
  const input = resolve(opts.input);
  if (!existsSync(input)) {
    console.error(`Error: ${input} not found`);
    process.exit(1);
  }
  const compressor = await detectCompressor(opts.format);
  const isDir = statSync(input).isDirectory();
  if (isDir) {
    if (opts.output) {
      console.error("Error: --output is only supported for single-file input");
      process.exit(1);
    }
    const files = collectFiles(input, opts.recursive);
    if (files.length === 0) {
      console.error("No supported images found");
      process.exit(1);
    }
    const results: any[] = [];
    for (const file of files) {
      try {
        const r = await processFile(compressor, file, {
          ...opts,
          output: undefined,
        });
        results.push(r);
        if (!opts.json) {
          const reduction = Math.round((1 - r.ratio) * 100);
          console.log(
            `${r.input} → ${r.output} (${formatSize(r.inputSize)} → ${formatSize(r.outputSize)}, ${reduction}% reduction)`,
          );
        }
      } catch (e: any) {
        if (!opts.json) console.error(`Error processing ${file}: ${e.message}`);
      }
    }
    if (results.length === 0) {
      console.error("Error: all files failed to process");
      process.exit(1);
    }
    if (opts.json) {
      const totalInput = results.reduce((s: any, r: any) => s + r.inputSize, 0);
      const totalOutput = results.reduce(
        (s: any, r: any) => s + r.outputSize,
        0,
      );
      console.log(
        JSON.stringify(
          {
            files: results,
            summary: {
              totalFiles: results.length,
              totalInputSize: totalInput,
              totalOutputSize: totalOutput,
              ratio: totalInput > 0 ? totalOutput / totalInput : 0,
              compressor,
            },
          },
          null,
          2,
        ),
      );
    } else {
      const totalInput = results.reduce((s: any, r: any) => s + r.inputSize, 0);
      const totalOutput = results.reduce(
        (s: any, r: any) => s + r.outputSize,
        0,
      );
      const reduction =
        totalInput > 0 ? Math.round((1 - totalOutput / totalInput) * 100) : 0;
      console.log(
        `\nProcessed ${results.length} files: ${formatSize(totalInput)} → ${formatSize(totalOutput)} (${reduction}% reduction)`,
      );
    }
  } else {
    try {
      const r = await processFile(compressor, input, opts);
      if (opts.json) {
        console.log(JSON.stringify(r, null, 2));
      } else {
        const reduction = Math.round((1 - r.ratio) * 100);
        console.log(
          `${r.input} → ${r.output} (${formatSize(r.inputSize)} → ${formatSize(r.outputSize)}, ${reduction}% reduction)`,
        );
      }
    } catch (e: any) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  }
}
