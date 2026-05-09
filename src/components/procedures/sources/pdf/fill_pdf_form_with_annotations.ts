#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

export const procedure = defineCliProcedure({
  id: "pdf-fill-pdf-form-with-annotations",
  entry: procedureEntry(import.meta.url),
  description:
    "在视觉型 PDF 表单上根据 bounding box 坐标写入文本批注，支持自定义字体和颜色。",
  owners: { skillIds: ["pdf"] },
  target: "scripts/fill_pdf_form_with_annotations.mjs",
  runtime: "node",
  params: [
    {
      flag: "<input.pdf>",
      type: "路径",
      description: "输入 PDF 文件路径",
      required: true,
    },
    {
      flag: "<fields.json>",
      type: "路径",
      description: "字段定义 JSON 文件路径（含 bounding box、字体、颜色）",
      required: true,
    },
    {
      flag: "<output.pdf>",
      type: "路径",
      description: "输出 PDF 文件路径",
      required: true,
    },
  ],

  exampleArgs: { args: ["input.pdf", "fields.json", "output.pdf"] },
});

type Rect = [number, number, number, number];
type PageInfo = {
  page_number: number;
  pdf_width?: number;
  pdf_height?: number;
  image_width?: number;
  image_height?: number;
};
type FormField = {
  page_number: number;
  entry_bounding_box: Rect;
  entry_text?: {
    text?: string;
    font?: string;
    font_size?: number;
    font_color?: string;
  };
};
type FieldsData = {
  pages: PageInfo[];
  form_fields: FormField[];
};
type PdfLib = {
  PDFDocument: {
    load(
      bytes: Uint8Array,
      options?: Record<string, unknown>,
    ): Promise<PdfDocument>;
  };
  StandardFonts: {
    Helvetica: string;
    TimesRoman: string;
    Courier: string;
  };
  rgb(red: number, green: number, blue: number): unknown;
};
type PdfDocument = {
  getPages(): PdfPage[];
  embedFont(font: string): Promise<unknown>;
  save(options?: Record<string, unknown>): Promise<Uint8Array>;
};
type PdfPage = {
  getWidth(): number;
  getHeight(): number;
  drawText(text: string, options: Record<string, unknown>): void;
};
const requireFromScript = createRequire(import.meta.url);
function usage(): string {
  return "Usage: fill_pdf_form_with_annotations.mjs [input pdf] [fields.json] [output pdf]";
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
function transformFromImageCoords(
  bbox: Rect,
  imageWidth: number,
  imageHeight: number,
  pdfWidth: number,
  pdfHeight: number,
): Rect {
  const xScale = pdfWidth / imageWidth;
  const yScale = pdfHeight / imageHeight;
  return [
    bbox[0] * xScale,
    pdfHeight - bbox[3] * yScale,
    bbox[2] * xScale,
    pdfHeight - bbox[1] * yScale,
  ];
}
function transformFromPdfCoords(bbox: Rect, pdfHeight: number): Rect {
  return [bbox[0], pdfHeight - bbox[3], bbox[2], pdfHeight - bbox[1]];
}
function parseColor(hex: string | undefined, rgb: PdfLib["rgb"]): unknown {
  const normalized = (hex ?? "000000").replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return rgb(0, 0, 0);
  }
  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return rgb(red, green, blue);
}
function standardFontForName(
  fontName: string | undefined,
  pdfLib: PdfLib,
): string {
  const normalized = (fontName ?? "").toLowerCase();
  if (normalized.includes("times")) {
    return pdfLib.StandardFonts.TimesRoman;
  }
  if (normalized.includes("courier")) {
    return pdfLib.StandardFonts.Courier;
  }
  return pdfLib.StandardFonts.Helvetica;
}
function pageInfoFor(fieldsData: FieldsData, pageNumber: number): PageInfo {
  const pageInfo = fieldsData.pages.find(
    (page: any): any => page.page_number === pageNumber,
  );
  if (!pageInfo) {
    throw new Error(`Missing page metadata for page ${pageNumber}`);
  }
  return pageInfo;
}
async function fillPdfForm(
  inputPdfPath: string,
  fieldsJsonPath: string,
  outputPdfPath: string,
): Promise<void> {
  const fieldsData = JSON.parse(
    readFileSync(fieldsJsonPath, "utf8"),
  ) as FieldsData;
  const pdfLib = requireNodeModule<PdfLib>("pdf-lib");
  const pdfDoc = await pdfLib.PDFDocument.load(readFileSync(inputPdfPath), {
    ignoreEncryption: true,
  });
  const pages = pdfDoc.getPages();
  const fontCache = new Map<string, unknown>();
  let annotations = 0;
  for (const field of fieldsData.form_fields ?? []) {
    const page = pages[field.page_number - 1];
    if (!page) {
      throw new Error(`PDF does not contain page ${field.page_number}`);
    }
    if (!field.entry_text?.text) {
      continue;
    }
    const pageInfo = pageInfoFor(fieldsData, field.page_number);
    const pdfWidth = page.getWidth();
    const pdfHeight = page.getHeight();
    const rect =
      pageInfo.pdf_width !== undefined
        ? transformFromPdfCoords(field.entry_bounding_box, pdfHeight)
        : transformFromImageCoords(
            field.entry_bounding_box,
            pageInfo.image_width ?? pdfWidth,
            pageInfo.image_height ?? pdfHeight,
            pdfWidth,
            pdfHeight,
          );
    const text = String(field.entry_text.text);
    const fontSize = Number(field.entry_text.font_size ?? 14);
    const standardFont = standardFontForName(field.entry_text.font, pdfLib);
    if (!fontCache.has(standardFont)) {
      fontCache.set(standardFont, await pdfDoc.embedFont(standardFont));
    }
    const [left, bottom, right, top] = rect;
    const boxHeight = Math.max(0, top - bottom);
    page.drawText(text, {
      x: left,
      y: bottom + Math.max(1, (boxHeight - fontSize) / 2),
      maxWidth: Math.max(1, right - left),
      size: fontSize,
      font: fontCache.get(standardFont),
      color: parseColor(field.entry_text.font_color, pdfLib.rgb),
    });
    annotations += 1;
  }
  writeFileSync(outputPdfPath, await pdfDoc.save());
  console.log(`Successfully filled PDF form and saved to ${outputPdfPath}`);
  console.log(`Added ${annotations} text annotations`);
}
export async function main(argv: readonly string[]): Promise<number> {
  if (argv.length !== 3) {
    console.log(usage());
    return 1;
  }
  await fillPdfForm(argv[0], argv[1], argv[2]);
  return 0;
}
