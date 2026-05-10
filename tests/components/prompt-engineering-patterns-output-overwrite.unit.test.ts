import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  assertOutputWritable,
  main as optimizePromptMain,
  parseArgs,
} from "../../src/components/procedures/sources/prompt-engineering-patterns/optimize-prompt.ts";

describe("prompt engineering optimize-prompt output guards", () => {
  test("tracks explicit output and overwrite state", () => {
    expect(parseArgs([])).toMatchObject({
      output: "optimization_results.json",
      overwrite: false,
    });
    expect(parseArgs(["--output", "results.json", "--overwrite"])).toMatchObject({
      output: "results.json",
      overwrite: true,
    });
  });

  test("rejects option tokens where output value is required", () => {
    expect(() => parseArgs(["--output", "-h"]))
      .toThrow(/--output requires a value/);
  });

  test("refuses existing optimization outputs unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-prompt-output-"));
    try {
      const outputFile = join(workDir, "optimization_results.json");
      writeFileSync(outputFile, "keep\n", "utf8");

      expect(() => assertOutputWritable(outputFile)).toThrow(/output file already exists/);
      expect(() => optimizePromptMain(["--output", outputFile])).toThrow(/output file already exists/);
      expect(readFileSync(outputFile, "utf8")).toBe("keep\n");

      expect(() => optimizePromptMain(["--output", outputFile, "--overwrite"])).not.toThrow();
      const parsed = JSON.parse(readFileSync(outputFile, "utf8"));
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
