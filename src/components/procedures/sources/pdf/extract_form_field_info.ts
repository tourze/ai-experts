#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

export const procedure = defineCliProcedure({
  id: "pdf-extract-form-field-info",
  entry: procedureEntry(import.meta.url),
  description:
    "使用 pdf-lib 提取 PDF 可填写表单字段详细信息：类型、页码、位置、选项值。",
  owners: { skillIds: ["pdf"] },
  target: "scripts/extract_form_field_info.mjs",
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
      description: "输出字段信息 JSON 文件路径",
      required: true,
    },
  ],

  exampleArgs: { args: ["input.pdf", "fields.json"] },
});

type Rect = [number, number, number, number];
type FieldInfo =
  | {
      field_id: string;
      type: "text" | "checkbox" | "choice" | `unknown (${string})`;
      page?: number;
      rect?: Rect;
      checked_value?: string;
      unchecked_value?: string;
      choice_options?: Array<{
        value: string;
        text: string;
      }>;
    }
  | {
      field_id: string;
      type: "radio_group";
      page: number;
      radio_options: Array<{
        value: string;
        rect: Rect;
      }>;
    };
type PdfLib = {
  PDFDocument: {
    load(
      bytes: Uint8Array,
      options?: Record<string, unknown>,
    ): Promise<PdfDocument>;
  };
  PDFTextField: abstract new (...args: never[]) => PdfField;
  PDFCheckBox: abstract new (...args: never[]) => PdfField;
  PDFRadioGroup: abstract new (...args: never[]) => PdfField;
  PDFDropdown: abstract new (...args: never[]) => PdfField;
  PDFOptionList: abstract new (...args: never[]) => PdfField;
};
type PdfDocument = {
  getForm(): PdfForm;
  getPages(): PdfPage[];
  context: {
    getObjectRef(object: unknown): unknown;
  };
};
type PdfForm = {
  getFields(): PdfField[];
};
type PdfField = {
  getName(): string;
  acroField: {
    getWidgets(): PdfWidget[];
    getOnValue?: () => PdfName | undefined;
    getOnValues?: () => PdfName[];
    getExportValues?: () =>
      | Array<{
          decodeText(): string;
        }>
      | undefined;
  };
  getOptions?: () => string[];
};
type PdfName = {
  decodeText(): string;
  asString?(): string;
};
type PdfWidget = {
  P?: () => unknown;
  dict: unknown;
  getRectangle(): {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  getOnValue?: () => PdfName | undefined;
};
type PdfPage = {
  ref: unknown;
  node: {
    Annots?: () =>
      | {
          indexOf?: (ref: unknown) => number;
          size?: () => number;
          get?: (index: number) => unknown;
        }
      | undefined;
  };
};
const requireFromScript = createRequire(import.meta.url);
function usage(): string {
  return "Usage: extract_form_field_info.mjs [input pdf] [output json]";
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
function pdfNameValue(
  name: PdfName | undefined,
  fallback: any = "Yes",
): string {
  return `/${name?.decodeText?.() ?? fallback}`;
}
function widgetRect(widget: PdfWidget): Rect {
  const { x, y, width, height } = widget.getRectangle();
  return [x, y, x + width, y + height];
}
function pageHasAnnotation(page: PdfPage, ref: unknown): boolean {
  const annots = page.node.Annots?.();
  if (!annots) {
    return false;
  }
  if (typeof annots.indexOf === "function") {
    return annots.indexOf(ref) !== -1;
  }
  if (typeof annots.size === "function" && typeof annots.get === "function") {
    for (let index = 0; index < annots.size(); index += 1) {
      if (annots.get(index) === ref) {
        return true;
      }
    }
  }
  return false;
}
function widgetPage(
  pdfDoc: PdfDocument,
  widget: PdfWidget,
): number | undefined {
  const pages = pdfDoc.getPages();
  const pageRef = widget.P?.();
  if (pageRef) {
    const pageIndex = pages.findIndex((page: any): any => page.ref === pageRef);
    if (pageIndex !== -1) {
      return pageIndex + 1;
    }
  }
  const widgetRef = pdfDoc.context.getObjectRef(widget.dict);
  const pageIndex = pages.findIndex((page: any): any =>
    pageHasAnnotation(page, widgetRef),
  );
  return pageIndex === -1 ? undefined : pageIndex + 1;
}
function firstWidgetLocation(
  pdfDoc: PdfDocument,
  field: PdfField,
): {
  page?: number;
  rect?: Rect;
} {
  const widget = field.acroField.getWidgets()[0];
  if (!widget) {
    return {};
  }
  return {
    page: widgetPage(pdfDoc, widget),
    rect: widgetRect(widget),
  };
}
function makeFieldInfo(
  pdfDoc: PdfDocument,
  field: any,
  pdfLib: any,
): FieldInfo | null {
  const fieldId = field.getName();
  const location = firstWidgetLocation(pdfDoc, field);
  if (field instanceof pdfLib.PDFTextField) {
    return { field_id: fieldId, type: "text", ...location };
  }
  if (field instanceof pdfLib.PDFCheckBox) {
    return {
      field_id: fieldId,
      type: "checkbox",
      ...location,
      checked_value: pdfNameValue(field.acroField.getOnValue?.()),
      unchecked_value: "/Off",
    };
  }
  if (
    field instanceof pdfLib.PDFDropdown ||
    field instanceof pdfLib.PDFOptionList
  ) {
    const options = field.getOptions?.() ?? [];
    return {
      field_id: fieldId,
      type: "choice",
      ...location,
      choice_options: options.map((option: any): any => ({
        value: option,
        text: option,
      })),
    };
  }
  if (field instanceof pdfLib.PDFRadioGroup) {
    const widgets = field.acroField.getWidgets();
    const onValues = field.acroField.getOnValues?.() ?? [];
    const radioOptions: Array<{
      value: string;
      rect: Rect;
    }> = [];
    let page: number | undefined;
    for (let index = 0; index < widgets.length; index += 1) {
      const widget = widgets[index];
      page ??= widgetPage(pdfDoc, widget);
      const onValue = widget.getOnValue?.() ?? onValues[index];
      if (!onValue) {
        continue;
      }
      radioOptions.push({
        value: pdfNameValue(onValue),
        rect: widgetRect(widget),
      });
    }
    return page && radioOptions.length > 0
      ? {
          field_id: fieldId,
          type: "radio_group",
          page,
          radio_options: radioOptions,
        }
      : null;
  }
  return {
    field_id: fieldId,
    type: `unknown (${field.constructor.name})`,
    ...location,
  };
}
export async function getFieldInfo(pdfPath: string): Promise<FieldInfo[]> {
  const pdfLib = requireNodeModule<PdfLib>("pdf-lib");
  const pdfDoc = await pdfLib.PDFDocument.load(readFileSync(pdfPath), {
    ignoreEncryption: true,
  });
  const fieldInfo: FieldInfo[] = [];
  for (const field of pdfDoc.getForm().getFields()) {
    const info = makeFieldInfo(pdfDoc, field as any, pdfLib as any);
    if (!info) {
      console.log(
        `Unable to determine location for field id: ${field.getName()}, ignoring`,
      );
      continue;
    }
    if ("page" in info && info.page) {
      fieldInfo.push(info);
    } else {
      console.log(
        `Unable to determine location for field id: ${info.field_id}, ignoring`,
      );
    }
  }
  fieldInfo.sort((left: any, right: any): any => {
    const leftRect =
      "radio_options" in left ? left.radio_options[0]?.rect : left.rect;
    const rightRect =
      "radio_options" in right ? right.radio_options[0]?.rect : right.rect;
    const leftPage = "page" in left ? (left.page ?? 0) : 0;
    const rightPage = "page" in right ? (right.page ?? 0) : 0;
    return (
      leftPage - rightPage ||
      -(leftRect ?? [0, 0, 0, 0])[1] + (rightRect ?? [0, 0, 0, 0])[1] ||
      (leftRect ?? [0, 0, 0, 0])[0] - (rightRect ?? [0, 0, 0, 0])[0]
    );
  });
  return fieldInfo;
}
export async function main(argv: readonly string[]): Promise<number> {
  if (argv.length !== 2) {
    console.log(usage());
    return 1;
  }
  const fieldInfo = await getFieldInfo(argv[0]);
  writeFileSync(argv[1], `${JSON.stringify(fieldInfo, null, 2)}\n`, "utf8");
  console.log(`Wrote ${fieldInfo.length} fields to ${argv[1]}`);
  return 0;
}
