import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, test } from "vitest";
import { exportResults, parseArgs } from "../../src/components/procedures/sources/data-analysis/analyze.ts";

describe("data analysis exports", () => {
  test("tracks explicit overwrite state", () => {
    expect(parseArgs(["--files", "data.csv", "--action", "inspect"])).toMatchObject({
      overwrite: false,
    });
    expect(parseArgs(["--files", "data.csv", "--action", "query", "--sql", "select * from data", "--overwrite"]))
      .toMatchObject({
        overwrite: true,
      });
  });

  test("rejects option flags without values", () => {
    expect(() => parseArgs(["--files", "--action", "inspect"]))
      .toThrow(/--files requires a value/);
    expect(() => parseArgs(["--files", "data.csv", "--action", "--sql"]))
      .toThrow(/--action requires a value/);
    expect(() => parseArgs(["--files", "data.csv", "--action", "query", "--sql", "--overwrite"]))
      .toThrow(/--sql requires a value/);
    expect(() => parseArgs(["--files", "data.csv", "--action", "inspect", "--output-file"]))
      .toThrow(/--output-file requires a value/);
  });

  test("refuses to replace an existing export unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-data-analysis-"));
    try {
      const outputFile = join(workDir, "result.json");
      writeFileSync(outputFile, "{}\n", "utf8");

      expect(() => exportResults([{ name: "Ada" }], outputFile)).toThrow(/output file already exists/);
      expect(readFileSync(outputFile, "utf8")).toBe("{}\n");

      exportResults([{ name: "Ada" }], outputFile, true);
      expect(readFileSync(outputFile, "utf8")).toContain("Ada");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
