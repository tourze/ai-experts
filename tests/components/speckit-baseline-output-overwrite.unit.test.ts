import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { assertOutputWritable } from "../../src/components/procedures/sources/speckit-baseline/output_guard.ts";
import { parseArgs as parseSetupPlanArgs } from "../../src/components/procedures/sources/speckit-baseline/setup-plan.ts";

describe("speckit baseline output overwrite guards", () => {
  test("tracks explicit overwrite state for setup plan", () => {
    expect(parseSetupPlanArgs(["--json"])).toMatchObject({
      jsonMode: true,
      overwrite: false,
    });
    expect(parseSetupPlanArgs(["--json", "--overwrite"])).toMatchObject({
      jsonMode: true,
      overwrite: true,
    });
  });

  test("refuses existing plan output unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-speckit-output-"));
    try {
      const planFile = join(workDir, "plan.md");
      writeFileSync(planFile, "keep\n", "utf8");

      expect(() => assertOutputWritable(planFile)).toThrow(/output file already exists/);
      expect(() => assertOutputWritable(planFile, true)).not.toThrow();
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
