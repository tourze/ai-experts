import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  convertFile,
  parseArgs as parseBatchArgs,
} from "../../src/components/procedures/sources/markitdown/batch_convert.ts";
import {
  convertPaper,
  createIndex,
  parseArgs as parseLiteratureArgs,
} from "../../src/components/procedures/sources/markitdown/convert_literature.ts";
import {
  convertWithAi,
  parseArgs as parseAiArgs,
} from "../../src/components/procedures/sources/markitdown/convert_with_ai.ts";

describe("markitdown conversion procedures", () => {
  test("track explicit overwrite state from argv", () => {
    expect(parseBatchArgs(["input", "output"])).toMatchObject({
      overwrite: false,
    });
    expect(parseBatchArgs(["input", "output", "--overwrite"])).toMatchObject({
      overwrite: true,
    });

    expect(parseAiArgs(["input.png", "output.md"])).toMatchObject({
      overwrite: false,
    });
    expect(parseAiArgs(["input.png", "output.md", "--overwrite"])).toMatchObject({
      overwrite: true,
    });

    expect(parseLiteratureArgs(["papers", "output"])).toMatchObject({
      overwrite: false,
    });
    expect(parseLiteratureArgs(["papers", "output", "--overwrite"])).toMatchObject({
      overwrite: true,
    });
  });

  test("refuse existing markdown outputs before calling converters", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-markitdown-"));
    try {
      const batchOutputDir = join(workDir, "batch");
      const batchOutput = join(batchOutputDir, "doc.md");
      mkdirSync(batchOutputDir, { recursive: true });
      writeFileSync(batchOutput, "keep\n", { flag: "wx" });

      await expect(convertFile(join(workDir, "doc.pdf"), batchOutputDir)).rejects.toThrow(
        /output file already exists/,
      );
      expect(readFileSync(batchOutput, "utf8")).toBe("keep\n");

      const aiOutput = join(workDir, "ai.md");
      writeFileSync(aiOutput, "keep\n", "utf8");
      await expect(
        convertWithAi(join(workDir, "image.png"), aiOutput, {
          apiKey: "test",
          model: "test-model",
          promptType: "general",
        }),
      ).rejects.toThrow(/output file already exists/);
      expect(readFileSync(aiOutput, "utf8")).toBe("keep\n");

      const literatureOutputDir = join(workDir, "literature");
      const literatureOutput = join(literatureOutputDir, "Smith_2024_Test.md");
      mkdirSync(literatureOutputDir, { recursive: true });
      writeFileSync(literatureOutput, "keep\n", { flag: "wx" });
      await expect(
        convertPaper(join(workDir, "Smith_2024_Test.pdf"), literatureOutputDir),
      ).rejects.toThrow(/output file already exists/);
      expect(readFileSync(literatureOutput, "utf8")).toBe("keep\n");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  test("refuse existing literature index outputs unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-markitdown-"));
    try {
      writeFileSync(join(workDir, "INDEX.md"), "keep index\n", "utf8");
      writeFileSync(join(workDir, "catalog.json"), "[]\n", "utf8");

      expect(() => createIndex([], workDir)).toThrow(/output file already exists/);
      expect(readFileSync(join(workDir, "INDEX.md"), "utf8")).toBe("keep index\n");

      createIndex([], workDir, { overwrite: true });
      expect(readFileSync(join(workDir, "INDEX.md"), "utf8")).toContain(
        "Literature Review Index",
      );
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
