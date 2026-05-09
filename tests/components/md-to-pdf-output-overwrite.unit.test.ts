import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  assertOutputWritable as assertKatexOutputWritable,
  parseArgs as parseKatexArgs,
  renderKatexFile,
} from "../../src/components/procedures/sources/md-to-pdf/katex_render.ts";
import {
  assertOutputWritable as assertMdToPdfOutputWritable,
  main as mdToPdfMain,
  parseArgs as parseMdToPdfArgs,
} from "../../src/components/procedures/sources/md-to-pdf/md_to_pdf.ts";

describe("md-to-pdf output overwrite guards", () => {
  test("tracks explicit overwrite state", () => {
    expect(parseMdToPdfArgs(["input.md", "output.pdf"])).toMatchObject({
      overwrite: false,
    });
    expect(parseMdToPdfArgs(["input.md", "output.pdf", "--overwrite"]))
      .toMatchObject({
        overwrite: true,
      });

    expect(parseKatexArgs(["input.html", "output.html"])).toMatchObject({
      overwrite: false,
    });
    expect(parseKatexArgs(["input.html", "output.html", "--overwrite"]))
      .toMatchObject({
        overwrite: true,
      });
  });

  test("refuses existing md-to-pdf outputs before rendering", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-md-to-pdf-"));
    try {
      const inputFile = join(workDir, "input.md");
      const outputFile = join(workDir, "output.pdf");
      writeFileSync(inputFile, "# Title\n", "utf8");
      writeFileSync(outputFile, "keep\n", "utf8");

      expect(() => assertMdToPdfOutputWritable(outputFile)).toThrow(/output file already exists/);
      await expect(mdToPdfMain([inputFile, outputFile])).rejects.toThrow(/output file already exists/);
      expect(readFileSync(outputFile, "utf8")).toBe("keep\n");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  test("refuses existing katex outputs before loading dependencies", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-katex-"));
    try {
      const inputFile = join(workDir, "input.html");
      const outputFile = join(workDir, "output.html");
      writeFileSync(inputFile, "<span class=\"math inline\">x</span>", "utf8");
      writeFileSync(outputFile, "keep\n", "utf8");

      expect(() => assertKatexOutputWritable(outputFile)).toThrow(/output file already exists/);
      expect(() => renderKatexFile(inputFile, outputFile)).toThrow(/output file already exists/);
      expect(readFileSync(outputFile, "utf8")).toBe("keep\n");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
