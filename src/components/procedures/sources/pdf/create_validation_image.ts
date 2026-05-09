#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import {
  assertOutputWritable,
  parseOverwriteArgs,
  type OverwriteArgs,
} from "./output_guard";

export const procedure = defineCliProcedure({
  id: "pdf-create-validation-image",
  entry: procedureEntry(import.meta.url),
  description:
    "在指定页面图片上叠加 bounding box 框线（红色=录入框，蓝色=标签框）生成校验图。",
  owners: { skillIds: ["pdf"] },
  target: "scripts/create_validation_image.mjs",
  runtime: "node",
  params: [
    {
      flag: "<page-number>",
      type: "数字",
      description: "页码（从 1 开始）",
      required: true,
    },
    {
      flag: "<fields.json>",
      type: "路径",
      description: "fields JSON 文件路径",
      required: true,
    },
    {
      flag: "<input-image>",
      type: "路径",
      description: "输入页面图片路径",
      required: true,
    },
    {
      flag: "<output-image>",
      type: "路径",
      description: "输出校验图片路径",
      required: true,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "允许覆盖已存在的输出图片；仅在确认目标文件可替换后使用",
      required: false,
    },
  ],

  exampleArgs: {
    args: ["1", "fields.json", "page_1.png", "page_1_validated.png"],
  },
});

type Rect = [number, number, number, number];
type FormField = {
  page_number: number;
  label_bounding_box?: Rect;
  entry_bounding_box?: Rect;
};
type FieldsFile = {
  form_fields?: FormField[];
};
type SharpFactory = (input: string | Buffer) => {
  metadata(): Promise<{
    width?: number;
    height?: number;
  }>;
  composite(
    layers: Array<{
      input: Buffer;
    }>,
  ): {
    toFile(outputPath: string): Promise<unknown>;
  };
};
const requireFromScript = createRequire(import.meta.url);
function usage(): string {
  return "Usage: create_validation_image.mjs [page number] [fields.json file] [input image path] [output image path] [--overwrite]";
}
export function parseArgs(argv: readonly string[]): OverwriteArgs {
  return parseOverwriteArgs(argv, 4);
}
function npmGlobalRoot(): string {
  const result = spawnSync("npm", ["root", "-g"], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}
function requireNodeModule<T>(request: string): T {
  try {
    return requireFromScript(request) as T;
  } catch (localError: any) {
    const root = npmGlobalRoot();
    if (root) {
      try {
        return requireFromScript(join(root, request)) as T;
      } catch {
        // Report the normal install guidance below.
      }
    }
    throw new Error(
      `${request} is not installed. Ask before installing it in the runtime root, for example \`npm install --prefix <runtime-root> ${request}\`; do not install it globally. Original error: ${localError instanceof Error ? localError.message : String(localError)}`,
    );
  }
}
function parseRect(value: unknown): Rect | null {
  if (!Array.isArray(value) || value.length !== 4) {
    return null;
  }
  const rect = value.map(Number);
  return rect.every(Number.isFinite) ? (rect as Rect) : null;
}
function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function rectElement(rect: Rect, color: "red" | "blue"): string {
  const [x0, y0, x1, y1] = rect;
  const x = Math.min(x0, x1);
  const y = Math.min(y0, y1);
  const width = Math.abs(x1 - x0);
  const height = Math.abs(y1 - y0);
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${escapeXml(color)}" stroke-width="2"/>`;
}
async function createValidationImage(
  pageNumber: number,
  fieldsJsonPath: string,
  inputPath: string,
  outputPath: string,
  options: { overwrite?: boolean } = {},
): Promise<void> {
  assertOutputWritable(outputPath, Boolean(options.overwrite));
  const sharpModule = requireNodeModule<
    | SharpFactory
    | {
        default: SharpFactory;
      }
  >("sharp");
  const sharp =
    typeof sharpModule === "function" ? sharpModule : sharpModule.default;
  const fields = JSON.parse(readFileSync(fieldsJsonPath, "utf8")) as FieldsFile;
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const width = metadata.width ?? 1;
  const height = metadata.height ?? 1;
  let numBoxes = 0;
  const rectangles: string[] = [];
  for (const field of fields.form_fields ?? []) {
    if (field.page_number !== pageNumber) {
      continue;
    }
    const entryBox = parseRect(field.entry_bounding_box);
    if (entryBox) {
      rectangles.push(rectElement(entryBox, "red"));
      numBoxes += 1;
    }
    const labelBox = parseRect(field.label_bounding_box);
    if (labelBox) {
      rectangles.push(rectElement(labelBox, "blue"));
      numBoxes += 1;
    }
  }
  const overlay = Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${rectangles.join("")}</svg>`,
    "utf8",
  );
  await image.composite([{ input: overlay }]).toFile(outputPath);
  console.log(
    `Created validation image at ${outputPath} with ${numBoxes} bounding boxes`,
  );
}
export async function main(argv: readonly string[]): Promise<number> {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (args.error) {
    console.error(`Error: ${args.error}`);
    console.log(usage());
    return 1;
  }
  const [pageNumberArg, fieldsJsonPath, inputPath, outputPath] = args.positional;
  const pageNumber = Number.parseInt(pageNumberArg, 10);
  if (!Number.isInteger(pageNumber)) {
    throw new Error(`Invalid page number: ${pageNumberArg}`);
  }
  if (!existsSync(inputPath)) {
    throw new Error(`Input image not found: ${inputPath}`);
  }
  await createValidationImage(pageNumber, fieldsJsonPath, inputPath, outputPath, args);
  return 0;
}
