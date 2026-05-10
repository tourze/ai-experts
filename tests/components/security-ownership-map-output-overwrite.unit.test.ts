import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  assertOutputFilesWritable,
  parseArgs as parseBuildArgs,
  plannedOwnershipMapOutputFiles,
} from "../../src/components/procedures/sources/security-ownership-map/build_ownership_map.ts";
import {
  buildOwnershipMapArgs,
  parseArgs as parseRunArgs,
} from "../../src/components/procedures/sources/security-ownership-map/run_ownership_map.ts";
import { parseArgs as parseCommunityArgs } from "../../src/components/procedures/sources/security-ownership-map/community_maintainers.ts";

describe("security ownership map output overwrite guards", () => {
  test("tracks explicit overwrite state for build and run wrappers", () => {
    expect(parseBuildArgs(["--repo", "."])).toMatchObject({
      overwrite: false,
    });
    expect(parseBuildArgs(["--repo", ".", "--overwrite"])).toMatchObject({
      overwrite: true,
    });

    expect(parseRunArgs(["--repo", "."])).toMatchObject({
      overwrite: false,
    });
    const runArgs = parseRunArgs(["--repo", ".", "--overwrite"]);
    expect(runArgs).toMatchObject({ overwrite: true });
    expect(buildOwnershipMapArgs(runArgs)).toContain("--overwrite");
  });

  test("community maintainers parse documented argv flags", () => {
    expect(parseCommunityArgs([
      "--data-dir",
      "ownership-map-out",
      "--file",
      "src/auth.ts",
      "--bucket",
      "quarter",
      "--weight",
      "recency",
      "--ignore-author-regex",
      "bot",
    ])).toMatchObject({
      dataDir: "ownership-map-out",
      file: "src/auth.ts",
      bucket: "quarter",
      weight: "recency",
      ignoreAuthorRegex: "bot",
    });
    expect(() => parseCommunityArgs(["--out", "ownership-map-out"]))
      .toThrow(/unrecognized argument: --out/);
  });

  test("refuses existing ownership map outputs unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-ownership-map-"));
    try {
      const args = parseBuildArgs([
        "--out",
        workDir,
        "--emit-commits",
        "--graphml",
      ]);
      const plannedFiles = plannedOwnershipMapOutputFiles(args, workDir);
      expect(plannedFiles).toContain(join(workDir, "summary.json"));
      expect(plannedFiles).toContain(join(workDir, "commits.jsonl"));
      expect(plannedFiles).toContain(join(workDir, "cochange_edges.csv"));
      expect(plannedFiles).toContain(join(workDir, "ownership.graphml"));

      writeFileSync(join(workDir, "summary.json"), "keep\n", "utf8");
      expect(() => assertOutputFilesWritable(plannedFiles)).toThrow(/output file already exists/);
      expect(() => assertOutputFilesWritable(plannedFiles, true)).not.toThrow();
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
