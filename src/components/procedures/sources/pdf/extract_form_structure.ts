#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  assertOutputWritable,
  parseOverwriteArgs,
  type OverwriteArgs,
} from "./output_guard";

export const procedure = defineCliProcedure({
  id: "pdf-extract-form-structure",
  entry: procedureEntry(import.meta.url),
  description:
    "使用 pdfjs-dist 分析视觉型 PDF 表单结构：文本标签、水平分隔线、复选框和行边界。",
  owners: { skillIds: ["pdf"] },
  target: "scripts/extract_form_structure.mjs",
  runtime: "node",
  params: [
    {
      flag: "<input.pdf>",
      type: "路径",
      description: "输入 PDF 文件路径",
      required: true,
    },
    {
      flag: "<output.json>",
      type: "路径",
      description: "输出结构 JSON 文件路径",
      required: true,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "允许覆盖已存在的输出 JSON；仅在确认目标文件可替换后使用",
      required: false,
    },
  ],

  exampleArgs: { args: ["input.pdf", "structure.json"] },
});

type PdfjsModule = {
  getDocument(params: Record<string, unknown>): {
    promise: Promise<PdfDocumentProxy>;
  };
  OPS: {
    constructPath: number;
  };
};
type PdfDocumentProxy = {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPageProxy>;
  destroy?: () => Promise<void>;
};
type PdfPageProxy = {
  getViewport(params: { scale: number }): {
    width: number;
    height: number;
  };
  getTextContent(): Promise<{
    items: TextItem[];
  }>;
  getOperatorList(): Promise<{
    fnArray: number[];
    argsArray: unknown[][];
  }>;
};
type TextItem = {
  str?: string;
  width?: number;
  height?: number;
  transform?: number[];
};
type FormStructure = {
  pages: Array<{
    page_number: number;
    width: number;
    height: number;
  }>;
  labels: Array<{
    page: number;
    text: string;
    x0: number;
    top: number;
    x1: number;
    bottom: number;
  }>;
  lines: Array<{
    page: number;
    y: number;
    x0: number;
    x1: number;
  }>;
  checkboxes: Array<{
    page: number;
    x0: number;
    top: number;
    x1: number;
    bottom: number;
    center_x: number;
    center_y: number;
  }>;
  row_boundaries: Array<{
    page: number;
    row_top: number;
    row_bottom: number;
    row_height: number;
  }>;
};
function usage(): string {
  return "Usage: extract_form_structure.mjs <input.pdf> <output.json> [--overwrite]";
}
export function parseArgs(argv: readonly string[]): OverwriteArgs {
  return parseOverwriteArgs(argv, 2);
}
function npmGlobalRoot(): string {
  const result = spawnSync("npm", ["root", "-g"], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}
function pdfjsStandardFontDataUrl(): string | undefined {
  const root = npmGlobalRoot();
  return root ? `${join(root, "pdfjs-dist", "standard_fonts")}/` : undefined;
}
async function importPdfjs(): Promise<PdfjsModule> {
  try {
    return (await import("pdfjs-dist/legacy/build/pdf.mjs")) as PdfjsModule;
  } catch (localError: any) {
    const root = npmGlobalRoot();
    if (root) {
      const modulePath = join(root, "pdfjs-dist", "legacy", "build", "pdf.mjs");
      try {
        return (await import(pathToFileURL(modulePath).href)) as PdfjsModule;
      } catch {
        // Report the normal install guidance below.
      }
    }
    throw new Error(
      `pdfjs-dist is not installed. Ask before installing it in the runtime root, for example \`npm install --prefix <runtime-root> pdfjs-dist\`; do not install it globally. Original error: ${localError instanceof Error ? localError.message : String(localError)}`,
    );
  }
}
function round(value: number): number {
  return Math.round(value * 10) / 10;
}
function pathMinMaxToTopDown(
  minMax: unknown,
  pageHeight: number,
): {
  x0: number;
  top: number;
  x1: number;
  bottom: number;
} | null {
  if (!Array.isArray(minMax) && !(minMax instanceof Float32Array)) {
    return null;
  }
  const values = Array.from(minMax as ArrayLike<number>).map(Number);
  if (
    values.length < 4 ||
    values.some((value: any): any => !Number.isFinite(value))
  ) {
    return null;
  }
  const [minX, minY, maxX, maxY] = values;
  return {
    x0: Math.min(minX, maxX),
    top: pageHeight - Math.max(minY, maxY),
    x1: Math.max(minX, maxX),
    bottom: pageHeight - Math.min(minY, maxY),
  };
}
function addTextLabels(
  structure: FormStructure,
  pageNumber: number,
  pageHeight: number,
  items: TextItem[],
): void {
  for (const item of items) {
    const text = item.str?.trim();
    const transform = item.transform;
    if (!text || !Array.isArray(transform) || transform.length < 6) {
      continue;
    }
    const x = Number(transform[4]);
    const y = Number(transform[5]);
    const width = Number(item.width ?? 0);
    const height = Math.abs(Number(item.height ?? transform[3] ?? 0));
    if (![x, y, width, height].every(Number.isFinite)) {
      continue;
    }
    structure.labels.push({
      page: pageNumber,
      text,
      x0: round(x),
      top: round(pageHeight - y - height),
      x1: round(x + width),
      bottom: round(pageHeight - y),
    });
  }
}
function addPathStructures(
  structure: FormStructure,
  pdfjs: PdfjsModule,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number,
  fnArray: number[],
  argsArray: unknown[][],
): void {
  for (let index = 0; index < fnArray.length; index += 1) {
    if (fnArray[index] !== pdfjs.OPS.constructPath) {
      continue;
    }
    const minMax = argsArray[index]?.[2];
    const rect = pathMinMaxToTopDown(minMax, pageHeight);
    if (!rect) {
      continue;
    }
    const width = rect.x1 - rect.x0;
    const height = rect.bottom - rect.top;
    const isUnpositionedAppearancePath =
      rect.x0 < 2 && rect.bottom > pageHeight - 2;
    if (width > pageWidth * 0.5 && height <= 2) {
      structure.lines.push({
        page: pageNumber,
        y: round(rect.top),
        x0: round(rect.x0),
        x1: round(rect.x1),
      });
    }
    if (
      !isUnpositionedAppearancePath &&
      width >= 5 &&
      width <= 15 &&
      height >= 5 &&
      height <= 15 &&
      Math.abs(width - height) < 2
    ) {
      structure.checkboxes.push({
        page: pageNumber,
        x0: round(rect.x0),
        top: round(rect.top),
        x1: round(rect.x1),
        bottom: round(rect.bottom),
        center_x: round((rect.x0 + rect.x1) / 2),
        center_y: round((rect.top + rect.bottom) / 2),
      });
    }
  }
}
function addRowBoundaries(structure: FormStructure): void {
  const linesByPage = new Map<number, number[]>();
  for (const line of structure.lines) {
    const lines = linesByPage.get(line.page) ?? [];
    lines.push(line.y);
    linesByPage.set(line.page, lines);
  }
  for (const [page, yCoordinates] of linesByPage.entries()) {
    const unique = [...new Set(yCoordinates)].sort(
      (left: any, right: any): any => left - right,
    );
    for (let index = 0; index < unique.length - 1; index += 1) {
      structure.row_boundaries.push({
        page,
        row_top: unique[index],
        row_bottom: unique[index + 1],
        row_height: round(unique[index + 1] - unique[index]),
      });
    }
  }
}
export async function extractFormStructure(
  pdfPath: string,
): Promise<FormStructure> {
  const pdfjs = await importPdfjs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(readFileSync(pdfPath)),
    disableWorker: true,
    standardFontDataUrl: pdfjsStandardFontDataUrl(),
  });
  const pdf = await loadingTask.promise;
  const structure: FormStructure = {
    pages: [],
    labels: [],
    lines: [],
    checkboxes: [],
    row_boundaries: [],
  };
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      structure.pages.push({
        page_number: pageNumber,
        width: round(viewport.width),
        height: round(viewport.height),
      });
      const textContent = await page.getTextContent();
      addTextLabels(structure, pageNumber, viewport.height, textContent.items);
      const operatorList = await page.getOperatorList();
      addPathStructures(
        structure,
        pdfjs,
        pageNumber,
        viewport.width,
        viewport.height,
        operatorList.fnArray,
        operatorList.argsArray,
      );
    }
  } finally {
    await pdf.destroy?.();
  }
  addRowBoundaries(structure);
  return structure;
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
  const [inputPdfPath, outputJsonPath] = args.positional;
  assertOutputWritable(outputJsonPath, args.overwrite);
  console.log(`Extracting structure from ${inputPdfPath}...`);
  const structure = await extractFormStructure(inputPdfPath);
  writeFileSync(outputJsonPath, `${JSON.stringify(structure, null, 2)}\n`, "utf8");
  console.log("Found:");
  console.log(`  - ${structure.pages.length} pages`);
  console.log(`  - ${structure.labels.length} text labels`);
  console.log(`  - ${structure.lines.length} horizontal lines`);
  console.log(`  - ${structure.checkboxes.length} checkboxes`);
  console.log(`  - ${structure.row_boundaries.length} row boundaries`);
  console.log(`Saved to ${outputJsonPath}`);
  return 0;
}
