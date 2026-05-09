import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { parseArgs as parseConvertPdfToImagesArgs } from "../../src/components/procedures/sources/pdf/convert_pdf_to_images.ts";
import { parseArgs as parseCreateValidationImageArgs } from "../../src/components/procedures/sources/pdf/create_validation_image.ts";
import { parseArgs as parseExtractFormFieldInfoArgs } from "../../src/components/procedures/sources/pdf/extract_form_field_info.ts";
import { parseArgs as parseExtractFormStructureArgs } from "../../src/components/procedures/sources/pdf/extract_form_structure.ts";
import { parseArgs as parseFillFillableFieldsArgs } from "../../src/components/procedures/sources/pdf/fill_fillable_fields.ts";
import { parseArgs as parseFillPdfFormWithAnnotationsArgs } from "../../src/components/procedures/sources/pdf/fill_pdf_form_with_annotations.ts";
import {
  assertOutputFilesWritable,
  assertOutputWritable,
} from "../../src/components/procedures/sources/pdf/output_guard.ts";

describe("pdf output overwrite guards", () => {
  test("tracks explicit overwrite state for output-producing procedures", () => {
    const cases = [
      [parseConvertPdfToImagesArgs, ["input.pdf", "pages"]],
      [parseCreateValidationImageArgs, ["1", "fields.json", "page_1.png", "validated.png"]],
      [parseExtractFormFieldInfoArgs, ["input.pdf", "fields.json"]],
      [parseExtractFormStructureArgs, ["input.pdf", "structure.json"]],
      [parseFillFillableFieldsArgs, ["input.pdf", "values.json", "output.pdf"]],
      [parseFillPdfFormWithAnnotationsArgs, ["input.pdf", "fields.json", "output.pdf"]],
    ] as const;

    for (const [parseArgs, args] of cases) {
      expect(parseArgs(args)).toMatchObject({
        overwrite: false,
        positional: args,
      });
      expect(parseArgs([...args, "--overwrite"])).toMatchObject({
        overwrite: true,
        positional: args,
      });
    }
  });

  test("refuses existing output files unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-pdf-output-"));
    try {
      const outputFile = join(workDir, "output.pdf");
      writeFileSync(outputFile, "keep\n", "utf8");

      expect(() => assertOutputWritable(outputFile)).toThrow(/output file already exists/);
      expect(() => assertOutputWritable(outputFile, true)).not.toThrow();
      expect(() => assertOutputFilesWritable([outputFile])).toThrow(/output file already exists/);
      expect(() => assertOutputFilesWritable([outputFile], true)).not.toThrow();
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
