#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

export const procedure = defineCliProcedure({
  id: "pdf-fill-fillable-fields",
  entry: procedureEntry(import.meta.url),
  description:
    "根据字段值 JSON 回填 PDF 可填写表单，支持文本框、复选框、单选组和下拉选择。",
  owners: { skillIds: ["pdf"] },
  target: "scripts/fill_fillable_fields.mjs",
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
      description: "字段值 JSON 文件路径（含 field_id、page、value）",
      required: true,
    },
    {
      flag: "<output.pdf>",
      type: "路径",
      description: "输出 PDF 文件路径",
      required: true,
    },
  ],

  exampleArgs: { args: ["input.pdf", "field_values.json", "output.pdf"] },
});

type Rect = [number, number, number, number];
type FieldValue = {
  field_id: string;
  page: number;
  value?: unknown;
};
type FieldInfo = {
  field_id: string;
  type: string;
  page?: number;
  checked_value?: string;
  unchecked_value?: string;
  radio_options?: Array<{
    value: string;
    select_value: string;
    rect: Rect;
  }>;
  choice_options?: Array<{
    value: string;
    text: string;
  }>;
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
  embedFont(font: string): Promise<unknown>;
  save(options?: Record<string, unknown>): Promise<Uint8Array>;
  context: {
    getObjectRef(object: unknown): unknown;
  };
};
type PdfForm = {
  getFields(): PdfField[];
  getField(name: string): PdfField;
  updateFieldAppearances(font?: unknown): void;
};
type PdfField = {
  getName(): string;
  acroField: {
    getWidgets(): PdfWidget[];
    getOnValue?: () => PdfName | undefined;
    getOnValues?: () => PdfName[];
  };
  setText?: (value: string | undefined) => void;
  check?: () => void;
  uncheck?: () => void;
  select?: (value: string | string[]) => void;
  getOptions?: () => string[];
};
type PdfName = {
  decodeText(): string;
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
  return "Usage: fill_fillable_fields.mjs [input pdf] [field_values.json] [output pdf]";
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
      `${request} is not installed. Run \`npm install -g ${request}\`. Original error: ${localError instanceof Error ? localError.message : String(localError)}`,
    );
  }
}
function pdfNameValue(
  name: PdfName | undefined,
  fallback: any = "Yes",
): string {
  return `/${name?.decodeText?.() ?? fallback}`;
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
function widgetRect(widget: PdfWidget): Rect {
  const { x, y, width, height } = widget.getRectangle();
  return [x, y, x + width, y + height];
}
function firstWidgetPage(
  pdfDoc: PdfDocument,
  field: PdfField,
): number | undefined {
  const widget = field.acroField.getWidgets()[0];
  return widget ? widgetPage(pdfDoc, widget) : undefined;
}
function getFieldInfo(pdfDoc: PdfDocument, pdfLib: any): FieldInfo[] {
  const fields: FieldInfo[] = [];
  for (const field of pdfDoc.getForm().getFields() as any[]) {
    const fieldId = field.getName();
    const page = firstWidgetPage(pdfDoc, field);
    if (!page) {
      continue;
    }
    if (field instanceof pdfLib.PDFTextField) {
      fields.push({ field_id: fieldId, type: "text", page });
    } else if (field instanceof pdfLib.PDFCheckBox) {
      fields.push({
        field_id: fieldId,
        type: "checkbox",
        page,
        checked_value: pdfNameValue(field.acroField.getOnValue?.()),
        unchecked_value: "/Off",
      });
    } else if (field instanceof pdfLib.PDFRadioGroup) {
      const widgets = field.acroField.getWidgets();
      const onValues = field.acroField.getOnValues?.() ?? [];
      const options = field.getOptions?.() ?? [];
      fields.push({
        field_id: fieldId,
        type: "radio_group",
        page,
        radio_options: widgets.flatMap((widget: any, index: any): any => {
          const onValue = widget.getOnValue?.() ?? onValues[index];
          if (!onValue) {
            return [];
          }
          return [
            {
              value: pdfNameValue(onValue),
              select_value: options[index] ?? onValue.decodeText(),
              rect: widgetRect(widget),
            },
          ];
        }),
      });
    } else if (
      field instanceof pdfLib.PDFDropdown ||
      field instanceof pdfLib.PDFOptionList
    ) {
      const options = field.getOptions?.() ?? [];
      fields.push({
        field_id: fieldId,
        type: "choice",
        page,
        choice_options: options.map((option: any): any => ({
          value: option,
          text: option,
        })),
      });
    } else {
      fields.push({
        field_id: fieldId,
        type: `unknown (${field.constructor.name})`,
        page,
      });
    }
  }
  return fields;
}
function normalizePdfValue(value: unknown): string {
  return String(value ?? "");
}
function stripLeadingSlash(value: string): string {
  return value.startsWith("/") ? value.slice(1) : value;
}
function validationErrorForFieldValue(
  fieldInfo: FieldInfo,
  fieldValue: unknown,
): string | null {
  const value = normalizePdfValue(fieldValue);
  const fieldId = fieldInfo.field_id;
  if (fieldInfo.type === "checkbox") {
    const checked = fieldInfo.checked_value ?? "/Yes";
    const unchecked = fieldInfo.unchecked_value ?? "/Off";
    if (
      value !== checked &&
      value !== unchecked &&
      `/${value}` !== checked &&
      `/${value}` !== unchecked
    ) {
      return `ERROR: Invalid value "${value}" for checkbox field "${fieldId}". The checked value is "${checked}" and the unchecked value is "${unchecked}"`;
    }
  } else if (fieldInfo.type === "radio_group") {
    const validValues =
      fieldInfo.radio_options?.map((option: any): any => option.value) ?? [];
    const selectValues =
      fieldInfo.radio_options?.map((option: any): any => option.select_value) ??
      [];
    if (
      !validValues.includes(value) &&
      !selectValues.includes(value) &&
      !validValues.includes(`/${value}`)
    ) {
      return `ERROR: Invalid value "${value}" for radio group field "${fieldId}". Valid values are: ${JSON.stringify(validValues)}`;
    }
  } else if (fieldInfo.type === "choice") {
    const choiceValues =
      fieldInfo.choice_options?.map((option: any): any => option.value) ?? [];
    if (!choiceValues.includes(value)) {
      return `ERROR: Invalid value "${value}" for choice field "${fieldId}". Valid values are: ${JSON.stringify(choiceValues)}`;
    }
  }
  return null;
}
function selectRadioValue(fieldInfo: FieldInfo, value: string): string {
  const option = fieldInfo.radio_options?.find(
    (candidate: any): any =>
      candidate.value === value ||
      candidate.select_value === value ||
      candidate.value === `/${value}` ||
      stripLeadingSlash(candidate.value) === value,
  );
  return option?.select_value ?? stripLeadingSlash(value);
}
function fillField(field: any, fieldInfo: FieldInfo, value: unknown): void {
  const stringValue = normalizePdfValue(value);
  if (fieldInfo.type === "text") {
    field.setText?.(stringValue);
  } else if (fieldInfo.type === "checkbox") {
    const checked = fieldInfo.checked_value ?? "/Yes";
    if (stringValue === checked || `/${stringValue}` === checked) {
      field.check?.();
    } else {
      field.uncheck?.();
    }
  } else if (fieldInfo.type === "radio_group") {
    field.select?.(selectRadioValue(fieldInfo, stringValue));
  } else if (fieldInfo.type === "choice") {
    field.select?.(stringValue);
  }
}
async function fillPdfFields(
  inputPdfPath: string,
  fieldsJsonPath: string,
  outputPdfPath: string,
): Promise<void> {
  const fields = JSON.parse(
    readFileSync(fieldsJsonPath, "utf8"),
  ) as FieldValue[];
  const pdfLib = requireNodeModule<PdfLib>("pdf-lib");
  const pdfDoc = await pdfLib.PDFDocument.load(readFileSync(inputPdfPath), {
    ignoreEncryption: true,
  });
  const form = pdfDoc.getForm();
  const fieldInfo = getFieldInfo(pdfDoc, pdfLib as any);
  const fieldsById = new Map<string, any>(
    fieldInfo.map((field: any): any => [field.field_id, field]),
  );
  let hasError = false;
  for (const field of fields) {
    const existingField = fieldsById.get(field.field_id);
    if (!existingField) {
      hasError = true;
      console.log(`ERROR: \`${field.field_id}\` is not a valid field ID`);
      continue;
    }
    if (field.page !== existingField.page) {
      hasError = true;
      console.log(
        `ERROR: Incorrect page number for \`${field.field_id}\` (got ${field.page}, expected ${existingField.page})`,
      );
      continue;
    }
    if ("value" in field) {
      const error = validationErrorForFieldValue(
        existingField as FieldInfo,
        field.value,
      );
      if (error) {
        hasError = true;
        console.log(error);
      }
    }
  }
  if (hasError) {
    process.exit(1);
  }
  for (const fieldValue of fields) {
    if (!("value" in fieldValue)) {
      continue;
    }
    const info = fieldsById.get(fieldValue.field_id);
    if (!info) {
      continue;
    }
    fillField(
      form.getField(fieldValue.field_id),
      info as FieldInfo,
      fieldValue.value,
    );
  }
  const helvetica = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica);
  form.updateFieldAppearances(helvetica);
  writeFileSync(outputPdfPath, await pdfDoc.save());
}
export async function main(argv: readonly string[]): Promise<number> {
  if (argv.length !== 3) {
    console.log(usage());
    return 1;
  }
  await fillPdfFields(argv[0], argv[1], argv[2]);
  return 0;
}
