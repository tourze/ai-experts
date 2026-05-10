import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  generatePattern,
  parseArgs as parsePatternArgs,
} from "../../src/components/procedures/sources/modern-web-design/pattern_generator.ts";
import { parseArgs as parseAuditArgs } from "../../src/components/procedures/sources/modern-web-design/design_audit.ts";
import { assertOutputWritable } from "../../src/components/procedures/sources/modern-web-design/output_guard.ts";

describe("modern web design output overwrite guards", () => {
  test("tracks explicit overwrite state", () => {
    expect(parsePatternArgs(["--pattern", "hero", "--output", "hero.html"]))
      .toMatchObject({
        overwrite: false,
      });
    expect(parsePatternArgs(["--pattern", "hero", "--output", "hero.html", "--overwrite"]))
      .toMatchObject({
        overwrite: true,
      });

    expect(parseAuditArgs(["--file", "index.html", "--report", "audit.txt"]))
      .toMatchObject({
        overwrite: false,
      });
    expect(parseAuditArgs(["--file", "index.html", "--report", "audit.txt", "--overwrite"]))
      .toMatchObject({
        overwrite: true,
      });
  });

  test("rejects option tokens where values are required", () => {
    expect(() => parsePatternArgs(["--pattern", "-h"]))
      .toThrow(/--pattern requires a value/);
    expect(() => parsePatternArgs(["--pattern", "hero", "--output", "-o"]))
      .toThrow(/--output requires a value/);
    expect(() => parseAuditArgs(["--file", "-h"]))
      .toThrow(/--file requires a value/);
    expect(() => parseAuditArgs(["--file", "index.html", "--report", "-o"]))
      .toThrow(/--report requires a value/);
  });

  test("refuses existing output files unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-modern-web-output-"));
    try {
      const outputFile = join(workDir, "hero.html");
      writeFileSync(outputFile, "keep\n", "utf8");

      expect(() => assertOutputWritable(outputFile)).toThrow(/output file already exists/);
      expect(() => generatePattern("hero", outputFile, () => {})).toThrow(/output file already exists/);
      expect(readFileSync(outputFile, "utf8")).toBe("keep\n");

      generatePattern("hero", outputFile, () => {}, { overwrite: true });
      expect(readFileSync(outputFile, "utf8")).toContain("<!DOCTYPE html>");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
