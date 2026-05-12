import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, test } from "vitest";
import { Platform, writeText } from "../../src/build/core.ts";
import { emitPlatform, renderInstruction, validateRegistry } from "../../src/build/platform.ts";
import { renderRuleMd } from "../../src/build/rules.ts";
import { Platform as ComponentPlatform, defineRule, defineRuleBody } from "../../src/components/sdk.ts";
import { createFixture, createTempDir } from "./pipeline.fixture";

describe("build/pipeline registry rule validation", () => {
  test("registry rule validation enforces shape and path constraints", () => {
    const fixture = createFixture();

    expect(() => validateRegistry({ ...fixture.registry, rules: undefined as any })).toThrow(
      "registry.rules must be an array",
    );
    expect(() =>
      validateRegistry({ ...fixture.registry, rules: [fixture.rule, { ...fixture.rule }] })
    ).toThrow("Duplicate rule id: fixture-rule");
    expect(() =>
      validateRegistry({ ...fixture.registry, rules: [{ ...fixture.rule, paths: [] }] })
    ).toThrow("Rule fixture-rule paths must be a non-empty array");
    expect(() =>
      validateRegistry({ ...fixture.registry, rules: [{ ...fixture.rule, paths: ["/abs/**"] }] })
    ).toThrow("without absolute paths");
    expect(() =>
      validateRegistry({ ...fixture.registry, rules: [{ ...fixture.rule, paths: ["src/../**"] }] })
    ).toThrow("parent traversal");
    expect(() =>
      validateRegistry({ ...fixture.registry, rules: [{ ...fixture.rule, paths: ["src\\**"] }] })
    ).toThrow("backslashes");
    expect(() =>
      validateRegistry({ ...fixture.registry, rules: [{ ...fixture.rule, title: "Bad\nRule" }] })
    ).toThrow("Rule fixture-rule title must be a single line");
    expect(() =>
      validateRegistry({ ...fixture.registry, rules: [{ ...fixture.rule, description: "" }] })
    ).toThrow("Rule fixture-rule description must be a non-empty string");
    expect(() =>
      validateRegistry({
        ...fixture.registry,
        rules: [{ ...fixture.rule, body: pathToFileURL(join(fixture.root, "rules", "missing.md")) }],
      })
    ).toThrow("Rule fixture-rule body is missing");
    expect(() =>
      validateRegistry({ ...fixture.registry, rules: [{ ...fixture.rule, references: [] } as any] })
    ).toThrow("must not define unsupported field(s): references");

    const longRuleBody = join(fixture.root, "rules", "long-rule.md");
    writeText(longRuleBody, Array.from({ length: 121 }, (_, index) => `line ${index + 1}`).join("\n"));
    const longRule = defineRule({
      ...fixture.rule,
      id: "long-rule",
      body: pathToFileURL(longRuleBody),
    });
    expect(() =>
      validateRegistry({ ...fixture.registry, rules: [longRule] })
    ).toThrow("body must be 120 lines or fewer");

    const inlineRule = defineRule({
      ...fixture.rule,
      id: "inline-rule",
      body: defineRuleBody({
        lines: [
          "- inline context line one",
          "- inline context line two",
        ],
      }),
    });
    expect(() =>
      validateRegistry({ ...fixture.registry, rules: [inlineRule] })
    ).not.toThrow();
  });

  test("rule renderer and platform emission use Claude rules and Codex context-rules", async () => {
    const fixture = createFixture();
    const surface = validateRegistry(fixture.registry);
    const renderedRule = renderRuleMd(fixture.rule);
    expect(renderedRule).toContain('description: "Fixture context rule used for build tests."');
    expect(renderedRule).toContain('  - "**/*.fixture.ts"');
    expect(renderedRule).toContain("# Fixture Rule");
    expect(renderedRule).toContain("Fixture rule body for matched files.");

    const outDir = createTempDir("ai-experts-rule-platform-");
    await emitPlatform(surface, outDir, Platform.Claude);
    await emitPlatform(surface, outDir, Platform.Codex);

    const claudeRulePath = join(outDir, "claude", "rules", "fixture-rule.md");
    const codexRulePath = join(outDir, "codex", "context-rules", "fixture-rule.md");
    expect(existsSync(claudeRulePath)).toBe(true);
    expect(existsSync(codexRulePath)).toBe(true);
    expect(existsSync(join(outDir, "codex", "rules"))).toBe(false);
    expect(readFileSync(codexRulePath, "utf-8")).toContain("Fixture rule body for matched files.");
    expect(readFileSync(join(outDir, "codex", "context-rules", "index.md"), "utf-8")).toContain(
      "[fixture-rule](fixture-rule.md)",
    );

    const claudeManifest = JSON.parse(readFileSync(join(outDir, "claude", "manifest.json"), "utf-8"));
    const codexManifest = JSON.parse(readFileSync(join(outDir, "codex", "manifest.json"), "utf-8"));
    expect(claudeManifest.schema).toBe(6);
    expect(codexManifest.schema).toBe(6);
    expect(claudeManifest.rules).toEqual(["fixture-rule"]);
    expect(codexManifest.rules).toEqual(["fixture-rule"]);
    expect(claudeManifest.install.rootEntries).toContain("rules/");
    expect(codexManifest.install.rootEntries).toContain("context-rules/");
    expect(codexManifest.install.rootEntries).not.toContain("rules/");
    expect(codexManifest.install.forbiddenRootEntries).toContain("rules/");

    const codexInstruction = readFileSync(join(outDir, "codex", "AGENTS.md"), "utf-8");
    expect(codexInstruction).toContain("Context Rule 路由补充");
    expect(codexInstruction).toContain("fixture-rule");
    expect(codexInstruction).toContain("~/.codex/context-rules/fixture-rule.md");
    expect(codexInstruction).not.toContain("Fixture rule body for matched files.");
    expect(readFileSync(join(outDir, "claude", "CLAUDE.md"), "utf-8")).not.toContain(
      "Fixture rule body for matched files.",
    );
    expect(renderInstruction(surface, ComponentPlatform.Codex)).toContain("Context Rule 路由补充");
  });
});
