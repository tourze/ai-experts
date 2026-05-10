import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { test } from "vitest";
import { defaultReferenceTarget, toAbsolutePath } from "../../src/build/core.ts";
import { validateMermaidSyntax } from "../../src/build/mermaid.ts";
import { codexSystemSkillIds } from "../../src/build/platform.ts";
import { listProcedureUses, procedureUseAppliesToPlatform } from "../../src/build/procedure-uses.ts";
import { compactCodexOpenAiShortDescription } from "../../src/build/skills.ts";
import { registry } from "../../src/components/registry.ts";
import { InvocationPolicy, Platform, type SkillReferenceDefinition } from "../../src/components/sdk.ts";
import {
  assertSingleDispatcherHookGroups,
  collectFiles,
  countH2OutsideCodeFence,
  markdownDestination,
  repoRoot,
  stripFrontmatter,
  stripMarkdownCode,
} from "./test-helpers";
import {
  assertHookGroupTimeoutsMatchManifest,
  assertInstallManifestEntriesExist,
  buildComponents,
  collectMarkdownAnchors,
  collectMermaidCodeBlocks,
  collectSymlinks,
  countMarkdownTablePipes,
  decodeMarkdownAnchor,
  escapeRegExp,
  findRuntimeCommandsMissingPassthroughSeparator,
  getTmpDistDir,
  componentBuildSetupTimeoutMs,
  isLikelyLocalDefinitionPath,
  isMarkdownTableSeparator,
  normalizeMarkdownReferenceLabel,
  parseGeneratedToml,
  parseMarkdownFrontmatter,
  referenceDirectoryIndexTarget,
} from "./component-build.test-context";

export function registerComponentBuildProcedureBundleTests(): void {
  test("provides bundled procedures.js protocol", () => {
    const proceduresPath = join(getTmpDistDir(), "claude/procedures.js");
    assert.equal(existsSync(proceduresPath), true);

    const runPath = join(getTmpDistDir(), "claude/run.js");
    assert.equal(existsSync(runPath), false);

    function runProcedureProcess(args: string[]): { status: number | null; payload: any; stderr: string } {
      const result = spawnSync(process.execPath, [proceduresPath, ...args], { encoding: "utf-8" });
      assert.equal(result.stderr, "", `procedure runtime should emit machine-readable errors on stdout: ${result.stderr}`);
      return {
        status: result.status,
        payload: JSON.parse(result.stdout),
        stderr: result.stderr,
      };
    }

    const missingScriptIdResult = runProcedureProcess([]);
    assert.equal(missingScriptIdResult.status, 1);
    const missingScriptId = missingScriptIdResult.payload;
    assert.equal(missingScriptId.ok, false);
    assert.equal(missingScriptId.error.code, "RUNNER_ERROR");
    assert.match(missingScriptId.error.message, /--procedure-id is required/);

    const shortOptionAsProcedureIdResult = runProcedureProcess([
      "--procedure-id",
      "-h",
      "--trigger-skill",
      "debug-methodology",
    ]);
    assert.equal(shortOptionAsProcedureIdResult.status, 1);
    assert.match(shortOptionAsProcedureIdResult.payload.error.message, /--procedure-id requires a value/);

    const shortOptionAsTriggerResult = runProcedureProcess([
      "--procedure-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "-h",
    ]);
    assert.equal(shortOptionAsTriggerResult.status, 1);
    assert.match(shortOptionAsTriggerResult.payload.error.message, /--trigger-skill requires a value/);

    const unknownScriptResult = runProcedureProcess([
      "--procedure-id",
      "not-exists",
      "--trigger-skill",
      "debug-methodology",
    ]);
    assert.equal(unknownScriptResult.status, 1);
    const unknownScript = unknownScriptResult.payload;
    assert.equal(unknownScript.ok, false);
    assert.match(unknownScript.error.message, /procedure not found/);

    const helperOnlyProcedureResult = runProcedureProcess([
      "--procedure-id",
      "android-device-automation-common",
      "--trigger-skill",
      "android-device-automation",
    ]);
    assert.equal(helperOnlyProcedureResult.status, 1);
    const helperOnlyProcedure = helperOnlyProcedureResult.payload;
    assert.equal(helperOnlyProcedure.ok, false);
    assert.match(helperOnlyProcedure.error.message, /procedure not found/);

    const ownerMismatchResult = runProcedureProcess([
      "--procedure-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "screenshot",
      "--",
      "--title",
      "owner-mismatch",
    ]);
    assert.equal(ownerMismatchResult.status, 1);
    const ownerMismatch = ownerMismatchResult.payload;
    assert.equal(ownerMismatch.ok, false);
    assert.match(ownerMismatch.error.message, /not callable by trigger skill/);

    const childOwnerMismatch = spawnSync(process.execPath, [
      proceduresPath,
      "--__procedure-child",
      JSON.stringify({
        procedureId: "debug-methodology-debug-checklist",
        triggerSkill: "screenshot",
        triggerAgent: "",
        sessionId: "",
        args: ["--title", "child-owner-mismatch"],
      }),
    ], { encoding: "utf-8" });
    assert.equal(childOwnerMismatch.status, 1);
    assert.match(childOwnerMismatch.stderr, /not callable by trigger skill: screenshot/);
    assert.doesNotMatch(childOwnerMismatch.stdout, /Debug Checklist: child-owner-mismatch/);

    const success = JSON.parse(execFileSync(process.execPath, [
      proceduresPath,
      "--procedure-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "debug-methodology",
      "--session-id",
      "fixture-session",
      "--",
      "--title",
      "fixture-checklist",
    ], { encoding: "utf-8" }));
    assert.equal(success.ok, true);
    assert.equal(success.procedureId, "debug-methodology-debug-checklist");
    assert.equal(success.sessionId, "fixture-session");
    assert.equal(success.trigger.skillId, "debug-methodology");
    assert.equal(success.error, null);
    assert.equal(typeof success.timingMs, "number");
    assert.match(success.result.stdout, /Debug Checklist: fixture-checklist/);

    const directArgs = JSON.parse(execFileSync(process.execPath, [
      proceduresPath,
      "--procedure-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "debug-methodology",
      "--title",
      "direct-args",
    ], { encoding: "utf-8" }));
    assert.equal(directArgs.ok, true);
    assert.equal(directArgs.procedureId, "debug-methodology-debug-checklist");
    assert.match(directArgs.result.stdout, /Debug Checklist: direct-args/);

    const invalidDirectArgsResult = runProcedureProcess([
      "--procedure-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "debug-methodology",
      "--unknown",
    ]);
    assert.equal(invalidDirectArgsResult.status, 1);
    assert.equal(invalidDirectArgsResult.payload.error.code, "PROCEDURE_EXECUTION_FAILED");
    assert.match(invalidDirectArgsResult.payload.result.stderr, /Unknown argument: --unknown/);
    assert.doesNotMatch(invalidDirectArgsResult.payload.result.stderr, /procedures\.js:\d+/);

    const executionFailureResult = runProcedureProcess([
      "--procedure-id",
      "web-content-fetcher-fetch",
      "--trigger-skill",
      "web-content-fetcher",
      "--",
      "--invalid",
    ]);
    assert.notEqual(executionFailureResult.status, 0);
    const executionFailure = executionFailureResult.payload;
    assert.equal(executionFailure.ok, false);
    assert.equal(executionFailure.error.code, "PROCEDURE_EXECUTION_FAILED");
    assert.equal(typeof executionFailure.result.exitCode, "number");

    const passthroughArgs = JSON.parse(execFileSync(process.execPath, [
      proceduresPath,
      "--procedure-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "debug-methodology",
      "--",
      "--title",
      "passthrough-mode",
    ], { encoding: "utf-8" }));
    assert.equal(passthroughArgs.ok, true);
    assert.equal(passthroughArgs.procedureId, "debug-methodology-debug-checklist");
    assert.match(passthroughArgs.result.stdout, /Debug Checklist: passthrough-mode/);

    const rewrittenHelp = JSON.parse(execFileSync(process.execPath, [
      proceduresPath,
      "--procedure-id",
      "screenshot-take-screenshot",
      "--trigger-skill",
      "screenshot",
      "--",
      "--help",
    ], { encoding: "utf-8" }));
    assert.equal(rewrittenHelp.ok, true);
    assert.match(
      rewrittenHelp.result.stdout,
      /Usage: node ~\/\.claude\/procedures\.js --procedure-id screenshot-take-screenshot --trigger-skill screenshot -- \[options\]/,
    );
    assert.match(rewrittenHelp.result.stdout, /Parameters:/);
    assert.match(rewrittenHelp.result.stdout, /--path <路径>/);
    assert.doesNotMatch(rewrittenHelp.result.stdout, /node scripts\/take_screenshot\.mjs/);

    const genericProcedureHelp = JSON.parse(execFileSync(process.execPath, [
      proceduresPath,
      "--procedure-id",
      "complexity-reducer-complexity-report",
      "--trigger-skill",
      "complexity-reducer",
      "--",
      "--help",
    ], { encoding: "utf-8" }));
    assert.equal(genericProcedureHelp.ok, true);
    assert.match(genericProcedureHelp.result.stdout, /complexity-reducer-complexity-report/);
    assert.match(genericProcedureHelp.result.stdout, /--format <json\|markdown>/);
    assert.doesNotMatch(genericProcedureHelp.result.stderr, /Unknown option/);

    const runtimeHelp = JSON.parse(execFileSync(process.execPath, [
      proceduresPath,
      "--help",
    ], { encoding: "utf-8" }));
    assert.equal(runtimeHelp.ok, true);
    assert.match(
      runtimeHelp.result.usage,
      /node ~\/\.claude\/procedures\.js --procedure-id <id>/,
    );
  });

  test("executes representative bundled procedures with real fixtures", () => {
    const proceduresPath = join(getTmpDistDir(), "claude/procedures.js");
    const runtimeTmp = mkdtempSync(join(tmpdir(), "ai-experts-procedure-runtime-"));

    function runProcedureCommand(args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): any {
      const result = spawnSync(process.execPath, [proceduresPath, ...args], {
        cwd: options.cwd,
        encoding: "utf-8",
        env: options.env,
        timeout: 20_000,
      });
      assert.ifError(result.error);
      assert.equal(result.stderr, "", `procedure runtime should emit machine-readable errors on stdout: ${result.stderr}`);
      const payload = JSON.parse(result.stdout);
      if (payload.ok) {
        assert.equal(result.status, 0, payload.result?.stderr ?? payload.error?.message);
      } else {
        assert.notEqual(result.status, 0, payload.result?.stderr ?? payload.error?.message);
      }
      return payload;
    }

    function runProcedure(id: string, skillId: string, args: string[]): any {
      return runProcedureCommand([
        "--procedure-id",
        id,
        "--trigger-skill",
        skillId,
        "--",
        ...args,
      ]);
    }

    let jsonInputCounter = 0;
    function runProcedureWithJsonInput(id: string, skillId: string, input: Record<string, unknown>): any {
      const inputFile = join(runtimeTmp, `input-${jsonInputCounter += 1}.json`);
      writeFileSync(inputFile, JSON.stringify(input));
      return runProcedureCommand([
        "--procedure-id",
        id,
        "--trigger-skill",
        skillId,
        "--",
        "--input",
        inputFile,
      ]);
    }

    function runProcedureWithEnv(id: string, skillId: string, args: string[], env: NodeJS.ProcessEnv): any {
      return runProcedureCommand([
        "--procedure-id",
        id,
        "--trigger-skill",
        skillId,
        "--",
        ...args,
      ], { env: { ...process.env, ...env } });
    }

    function runProcedureInCwd(id: string, skillId: string, args: string[], cwd: string): any {
      return runProcedureCommand([
        "--procedure-id",
        id,
        "--trigger-skill",
        skillId,
        "--",
        ...args,
      ], { cwd });
    }

    try {
      const tscOutput = join(runtimeTmp, "tsc.txt");
      writeFileSync(tscOutput, [
        "src/a.ts(1,2): error TS2322: Type string is not assignable to type number.",
        "src/b.ts(3,4): error TS7006: Parameter x implicitly has an any type.",
      ].join("\n"));
      const tsErrors = runProcedure("typescript-type-safety-extract-ts-errors", "typescript-type-safety", [
        "--input",
        tscOutput,
      ]);
      assert.equal(tsErrors.ok, true);
      assert.equal(JSON.parse(tsErrors.result.stdout).total, 2);

      const metadataOptimizer = runProcedureWithJsonInput(
        "app-store-optimization-metadata-optimizer",
        "app-store-optimization",
        {
          platform: "apple",
          appInfo: {
            name: "Focus Timer",
            primary_benefit: "stay focused during deep work",
            features: ["focus sessions", "progress tracking"],
          },
          targetKeywords: ["focus", "timer"],
        },
      );
      assert.equal(metadataOptimizer.ok, true, metadataOptimizer.result?.stderr);
      const metadata = JSON.parse(metadataOptimizer.result.stdout);
      assert.equal(metadata.platform, "apple");
      assert.equal(typeof metadata.title.recommendation, "string");

      const workspace = join(runtimeTmp, "review-workspace");
      mkdirSync(join(workspace, "case-1", "outputs"), { recursive: true });
      writeFileSync(join(workspace, "case-1", "eval_metadata.json"), JSON.stringify({
        eval_id: 1,
        prompt: "Review fixture prompt",
      }));
      writeFileSync(join(workspace, "case-1", "outputs", "answer.md"), "# Fixture Answer\n");
      const staticHtml = join(runtimeTmp, "review.html");
      const review = runProcedure("skill-creator-generate-review", "skill-creator", [
        workspace,
        "--skill-name",
        "fixture-skill",
        "--static",
        staticHtml,
      ]);
      assert.equal(review.ok, true, review.result?.stderr);
      assert.equal(existsSync(staticHtml), true);
      assert.match(readFileSync(staticHtml, "utf-8"), /fixture-skill/);

      const curateRepo = join(runtimeTmp, "curate-repo");
      const curateSkillDir = join(curateRepo, "src", "components", "skills", "stub-skill");
      mkdirSync(curateSkillDir, { recursive: true });
      writeFileSync(
        join(curateSkillDir, "index.ts"),
        [
          'import { defineSkill, defineWorkflow, defineWorkflowStep } from "../../sdk";',
          "",
          "export const stubSkill = defineSkill({",
          '  id: "stub-skill",',
          '  fullName: "Stub Skill",',
          '  description: "TODO",',
          '  useCases: ["TODO"],',
          '  constraints: ["TODO"],',
          '  sourceDir: new URL("./", import.meta.url),',
          '  workflow: defineWorkflow({ steps: [defineWorkflowStep({ id: "step-1", label: "TODO" })] }),',
          "});",
          "",
        ].join("\n"),
        "utf-8",
      );
      const curate = runProcedure("skills-prune-and-sync-readme-curate-skills", "skills-prune-and-sync-readme", [
        "audit",
        "--repo-root",
        curateRepo,
        "--format",
        "json",
      ]);
      assert.equal(curate.ok, true, curate.result?.stderr);
      const curateReport = JSON.parse(curate.result.stdout);
      assert.equal(curateReport.low_quality_candidates.some((item: any) => item.skill === "stub-skill"), true);

      const activationAudit = runProcedure(
        "skill-activation-analyzer-cso-audit",
        "skill-activation-analyzer",
        ["--json", "--severity", "critical"],
      );
      assert.equal(activationAudit.ok, true, activationAudit.result?.stderr);
      const activationReport = JSON.parse(activationAudit.result.stdout);
      assert.equal(activationReport.total, 335);
      assert.equal(typeof activationReport.pass_rate, "string");

      const explicitSkillsDirActivationAudit = runProcedure(
        "skill-activation-analyzer-cso-audit",
        "skill-activation-analyzer",
        ["--skills-dir", join(getTmpDistDir(), "codex/skills"), "--json", "--severity", "critical"],
      );
      assert.equal(explicitSkillsDirActivationAudit.ok, true, explicitSkillsDirActivationAudit.result?.stderr);
      const explicitSkillsDirActivationReport = JSON.parse(explicitSkillsDirActivationAudit.result.stdout);
      assert.equal(
        explicitSkillsDirActivationReport.total,
        registry.skills.filter((skill) => skill.platforms.includes(Platform.Codex)).length,
      );

      const canonicalSkillsRoot = join(runtimeTmp, "canonical-skills");
      const canonicalSkillDir = join(canonicalSkillsRoot, "alpha-skill");
      const nestedNonCanonicalSkillDir = join(canonicalSkillsRoot, "package-a", "skills", "nested-skill");
      mkdirSync(canonicalSkillDir, { recursive: true });
      mkdirSync(nestedNonCanonicalSkillDir, { recursive: true });
      writeFileSync(join(canonicalSkillDir, "SKILL.md"), [
        "---",
        "name: alpha-skill",
        "description: Use when auditing a canonical skill fixture.",
        "---",
        "",
        "# Alpha Skill",
      ].join("\n"));
      writeFileSync(join(nestedNonCanonicalSkillDir, "SKILL.md"), [
        "---",
        "name: nested-skill",
        "description: Use when auditing a nested non-canonical fixture.",
        "---",
        "",
        "# Nested Skill",
      ].join("\n"));
      const canonicalSkillsRootAudit = runProcedure(
        "skill-activation-analyzer-cso-audit",
        "skill-activation-analyzer",
        ["--skills-dir", canonicalSkillsRoot, "--json"],
      );
      assert.equal(canonicalSkillsRootAudit.ok, true, canonicalSkillsRootAudit.result?.stderr);
      const canonicalSkillsRootReport = JSON.parse(canonicalSkillsRootAudit.result.stdout);
      assert.equal(canonicalSkillsRootReport.total, 1);

      const nestedLayoutRoot = join(runtimeTmp, "nested-layout");
      const nestedLayoutSkillDir = join(nestedLayoutRoot, "package-a", "skills", "alpha-skill");
      mkdirSync(nestedLayoutSkillDir, { recursive: true });
      writeFileSync(join(nestedLayoutSkillDir, "SKILL.md"), [
        "---",
        "name: alpha-skill",
        "description: Use when auditing a nested layout fixture.",
        "---",
        "",
        "# Alpha Skill",
      ].join("\n"));
      const nestedLayoutRootAudit = runProcedure(
        "skill-activation-analyzer-cso-audit",
        "skill-activation-analyzer",
        ["--skills-dir", nestedLayoutRoot, "--json"],
      );
      assert.equal(nestedLayoutRootAudit.ok, false);
      assert.match(nestedLayoutRootAudit.result.stderr, /cannot find component skills directory/);

      const persona = runProcedure(
        "ux-researcher-designer-persona-generator",
        "ux-researcher-designer",
        ["--sample", "--output-format", "json"],
      );
      assert.equal(persona.ok, true, persona.result?.stderr);
      assert.equal(typeof JSON.parse(persona.result.stdout).name, "string");

      const removedPersonaJsonArg = runProcedure(
        "ux-researcher-designer-persona-generator",
        "ux-researcher-designer",
        ["--sample", "json"],
      );
      assert.equal(removedPersonaJsonArg.ok, false);
      assert.match(removedPersonaJsonArg.result.stderr, /unrecognized arguments: json/);

      const screenshotOutput = join(runtimeTmp, "screen.png");
      const screenshot = runProcedureWithEnv(
        "screenshot-take-screenshot",
        "screenshot",
        ["--mode", "temp", "--path", screenshotOutput],
        {
          AI_EXPERTS_SCREENSHOT_TEST_MODE: "1",
          AI_EXPERTS_SCREENSHOT_TEST_PLATFORM: "Darwin",
          AI_EXPERTS_SCREENSHOT_TEST_DISPLAYS: "1,2",
        },
      );
      assert.equal(screenshot.ok, true, screenshot.result?.stderr);
      const screenshotPaths = screenshot.result.stdout.trim().split(/\r?\n/);
      assert.deepEqual(
        screenshotPaths,
        [
          join(runtimeTmp, "screen-d1.png"),
          join(runtimeTmp, "screen-d2.png"),
        ],
      );
      for (const path of screenshotPaths) {
        assert.equal(existsSync(path), true, `${path} should be written by screenshot test mode`);
      }

      const speckitRepo = join(runtimeTmp, "speckit-repo");
      mkdirSync(speckitRepo, { recursive: true });
      const bootstrap = runProcedureInCwd(
        "speckit-baseline-bootstrap-specify",
        "speckit-baseline",
        [],
        speckitRepo,
      );
      assert.equal(bootstrap.ok, true, bootstrap.result?.stderr);
      const speckitScriptsDir = join(speckitRepo, ".specify", "scripts");
      const speckitTemplatesDir = join(speckitRepo, ".specify", "templates");
      const createFeatureScript = join(speckitScriptsDir, "create-new-feature.mjs");
      const setupPlanScript = join(speckitScriptsDir, "setup-plan.mjs");
      const checkPrerequisitesScript = join(speckitScriptsDir, "check-prerequisites.mjs");
      assert.equal(existsSync(createFeatureScript), true);
      assert.equal(existsSync(setupPlanScript), true);
      assert.equal(existsSync(checkPrerequisitesScript), true);
      assert.equal(existsSync(join(speckitTemplatesDir, "spec-template.md")), true);
      assert.equal(existsSync(join(speckitTemplatesDir, "plan-template.md")), true);
      const createFeatureWrapper = readFileSync(createFeatureScript, "utf-8");
      assert.doesNotMatch(createFeatureWrapper, /\.claude|\.codex|homedir/);
      assert.match(createFeatureWrapper, new RegExp(proceduresPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

      const wrapperEnv = { ...process.env };
      delete wrapperEnv.AI_EXPERTS_PROCEDURES_FILE;
      delete wrapperEnv.AI_EXPERTS_PROCEDURE_RUNTIME;
      const feature = JSON.parse(execFileSync(process.execPath, [
        createFeatureScript,
        "--json",
        "--short-name",
        "demo-feature",
        "Demo feature",
      ], { cwd: speckitRepo, encoding: "utf-8", env: wrapperEnv, stdio: ["ignore", "pipe", "pipe"], timeout: 20_000 }));
      assert.equal(feature.SLUG, "demo-feature");
      const plan = JSON.parse(execFileSync(process.execPath, [
        setupPlanScript,
        "--json",
      ], { cwd: speckitRepo, encoding: "utf-8", env: wrapperEnv, stdio: ["ignore", "pipe", "pipe"], timeout: 20_000 }));
      const expectedFeatureDir = realpathSync(join(speckitRepo, ".specify", "features", "demo-feature"));
      assert.equal(plan.SPECS_DIR, expectedFeatureDir);
      assert.equal(existsSync(join(expectedFeatureDir, "plan.md")), true);
      const prerequisites = JSON.parse(execFileSync(process.execPath, [
        checkPrerequisitesScript,
        "--json",
        "--paths-only",
      ], { cwd: speckitRepo, encoding: "utf-8", env: wrapperEnv, stdio: ["ignore", "pipe", "pipe"], timeout: 20_000 }));
      assert.equal(prerequisites.FEATURE_DIR, expectedFeatureDir);
    } finally {
      rmSync(runtimeTmp, { recursive: true, force: true });
    }
  }, 30_000);

}
