import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  createIndex,
  extractMetadataFromFilename,
} from "../skills/markitdown/scripts/convert_literature.mjs";

test("convert_literature.mjs extracts author, year, and title from filenames", () => {
  assert.deepEqual(extractMetadataFromFilename("Smith_2023_Machine_Learning.pdf"), {
    author: "Smith",
    year: "2023",
    title: "2023 Machine Learning",
  });
  assert.deepEqual(extractMetadataFromFilename("Untitled paper.pdf"), {
    title: "Untitled paper",
  });
});

test("convert_literature.mjs creates markdown and JSON indexes", () => {
  const outputDir = mkdtempSync(join(tmpdir(), "docs-markitdown-"));
  createIndex(
    [
      {
        title: "Paper A",
        author: "Ada",
        year: "2024",
        source_file: "Ada_2024_Paper_A.pdf",
      },
    ],
    outputDir,
  );

  assert.equal(existsSync(join(outputDir, "INDEX.md")), true);
  assert.equal(existsSync(join(outputDir, "catalog.json")), true);
  assert.match(readFileSync(join(outputDir, "INDEX.md"), "utf-8"), /Paper A/);
});

test("convert_with_ai.mjs lists prompt presets without external dependencies", () => {
  const result = spawnSync("node", ["plugins/docs-expert/skills/markitdown/scripts/convert_with_ai.mjs", "--list-prompts"], {
    cwd: process.cwd(),
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\[scientific\]/);
  assert.match(result.stdout, /\[presentation\]/);
});
