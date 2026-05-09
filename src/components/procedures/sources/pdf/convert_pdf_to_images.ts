#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const procedure = defineCliProcedure({
  id: "pdf-convert-pdf-to-images",
  entry: procedureEntry(import.meta.url),
  description:
    "使用 @pdfme/converter 将 PDF 各页渲染为 PNG 图片，自动缩放以适应页面尺寸。",
  owners: { skillIds: ["pdf"] },
  target: "scripts/convert_pdf_to_images.mjs",
  runtime: "node",
  params: [
    {
      flag: "<input.pdf>",
      type: "路径",
      description: "输入 PDF 文件路径",
      required: true,
    },
    {
      flag: "<output-dir>",
      type: "路径",
      description: "输出图片目录路径",
      required: true,
    },
  ],

  exampleArgs: { args: ["input.pdf", "output_images/"] },
});

type PdfPageSize = {
  width: number;
  height: number;
};
type PdfmeConverter = {
  pdf2img(
    pdf: ArrayBuffer,
    options: {
      imageType: "png";
      scale: number;
      range: {
        start: number;
        end: number;
      };
    },
  ): Promise<ArrayBuffer[]>;
  pdf2size(
    pdf: ArrayBuffer,
    options: {
      scale: number;
    },
  ): Promise<PdfPageSize[]>;
};
const requireFromScript = createRequire(import.meta.url);
const MAX_DIMENSION = 1000;
const SOURCE_DPI_SCALE = 200 / 72;
function usage(): string {
  return "Usage: convert_pdf_to_images.mjs [input pdf] [output directory]";
}
function npmGlobalRoot(): string {
  const result = spawnSync("npm", ["root", "-g"], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}
async function importPdfmeConverter(): Promise<PdfmeConverter> {
  try {
    return (await import("@pdfme/converter")) as PdfmeConverter;
  } catch (localError: any) {
    const root = npmGlobalRoot();
    if (root) {
      const modulePath = join(
        root,
        "@pdfme",
        "converter",
        "dist",
        "index.node.js",
      );
      if (existsSync(modulePath)) {
        return (await import(pathToFileURL(modulePath).href)) as PdfmeConverter;
      }
      try {
        return requireFromScript(
          join(root, "@pdfme", "converter"),
        ) as PdfmeConverter;
      } catch {
        // Report the normal install guidance below.
      }
    }
    throw new Error(
      `@pdfme/converter is not installed. Ask before installing it in the runtime root, for example \`npm install --prefix <runtime-root> @pdfme/converter\`; do not install it globally. Original error: ${localError instanceof Error ? localError.message : String(localError)}`,
    );
  }
}
function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}
function scaleForPage(
  size: PdfPageSize,
  maxDimension: any = MAX_DIMENSION,
): number {
  const largestDimension = Math.max(size.width, size.height);
  if (largestDimension <= 0) {
    return 1;
  }
  return Math.min(SOURCE_DPI_SCALE, maxDimension / largestDimension);
}
async function convert(pdfPath: string, outputDir: string): Promise<void> {
  const { pdf2img, pdf2size } = await importPdfmeConverter();
  const pdf = bufferToArrayBuffer(readFileSync(pdfPath));
  mkdirSync(outputDir, { recursive: true });
  const pageSizes = await pdf2size(pdf, { scale: 1 });
  for (let pageIndex = 0; pageIndex < pageSizes.length; pageIndex += 1) {
    const pageNumber = pageIndex + 1;
    const scale = scaleForPage(pageSizes[pageIndex]);
    const images = await pdf2img(pdf, {
      imageType: "png",
      scale,
      range: { start: pageIndex, end: pageIndex },
    });
    const image = images[0];
    if (!image) {
      throw new Error(`No rendered image returned for page ${pageNumber}`);
    }
    const imagePath = join(outputDir, `page_${pageNumber}.png`);
    writeFileSync(imagePath, Buffer.from(image));
    const width = Math.round(pageSizes[pageIndex].width * scale);
    const height = Math.round(pageSizes[pageIndex].height * scale);
    console.log(
      `Saved page ${pageNumber} as ${imagePath} (size: ${width}x${height})`,
    );
  }
  console.log(`Converted ${pageSizes.length} pages to PNG images`);
}
export async function main(argv: readonly string[]): Promise<number> {
  if (argv.length !== 2) {
    console.log(usage());
    return 1;
  }
  await convert(argv[0], argv[1]);
  return 0;
}
