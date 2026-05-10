import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { assertOutputWritable } from "../../src/components/procedures/sources/speckit-baseline/output_guard.ts";
import {
  main as bootstrapSpecifyMain,
  parseArgs as parseBootstrapArgs,
  plannedBootstrapOutputFiles,
} from "../../src/components/procedures/sources/speckit-baseline/bootstrap-specify.ts";
import {
  parseArgs as parseCreateFeatureArgs,
  writeCurrentFeatureJson,
} from "../../src/components/procedures/sources/speckit-baseline/create-new-feature.ts";
import { parseArgs as parseSetupPlanArgs } from "../../src/components/procedures/sources/speckit-baseline/setup-plan.ts";

describe("speckit baseline output overwrite guards", () => {
  test("tracks explicit overwrite state for bootstrap and setup plan", () => {
    expect(parseBootstrapArgs(["skill-root", ".specify"])).toMatchObject({
      skillRoot: "skill-root",
      targetDir: ".specify",
      overwrite: false,
    });
    expect(parseBootstrapArgs(["skill-root", ".specify", "--overwrite"]))
      .toMatchObject({
        skillRoot: "skill-root",
        targetDir: ".specify",
        overwrite: true,
      });

    expect(parseCreateFeatureArgs(["--short-name", "one", "Feature one"]))
      .toMatchObject({
        shortName: "one",
        overwrite: false,
      });
    expect(parseCreateFeatureArgs(["--short-name", "one", "--overwrite", "Feature one"]))
      .toMatchObject({
        shortName: "one",
        overwrite: true,
      });

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

  test("refuses existing bootstrap wrappers and templates unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-speckit-bootstrap-"));
    try {
      const skillRoot = join(process.cwd(), "src/components/skills/speckit-baseline");
      const targetDir = join(workDir, ".specify");
      const existingWrapper = join(targetDir, "scripts", "setup-plan.mjs");
      mkdirSync(join(targetDir, "scripts"), { recursive: true });
      writeFileSync(existingWrapper, "keep-wrapper\n", "utf8");

      const plannedFiles = plannedBootstrapOutputFiles(skillRoot, targetDir);
      expect(plannedFiles).toContain(existingWrapper);
      expect(bootstrapSpecifyMain([skillRoot, targetDir])).toBe(1);
      expect(readFileSync(existingWrapper, "utf8")).toBe("keep-wrapper\n");

      expect(bootstrapSpecifyMain([skillRoot, targetDir, "--overwrite"])).toBe(0);
      expect(existsSync(join(targetDir, "templates", "spec-template.md"))).toBe(true);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  test("refuses to replace the current feature pointer unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-speckit-feature-"));
    try {
      mkdirSync(join(workDir, ".specify"), { recursive: true });
      const featureJson = join(workDir, ".specify", "feature.json");
      writeFileSync(
        featureJson,
        `${JSON.stringify({ feature_directory: ".specify/features/old" }, null, 2)}\n`,
        "utf8",
      );

      expect(() => writeCurrentFeatureJson(workDir, "new"))
        .toThrow(/output file already exists/);
      expect(readFileSync(featureJson, "utf8")).toContain("old");
      expect(writeCurrentFeatureJson(workDir, "new", true)).toBe(featureJson);
      expect(readFileSync(featureJson, "utf8")).toContain(".specify/features/new");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
