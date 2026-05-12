import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { describe, test } from "vitest";
import { collectFiles, repoRoot } from "./test-helpers";

function assertNonEmptyStringArray(value: unknown, label: string): void {
  assert.equal(Array.isArray(value), true, `${label} should be a non-empty array`);
  assert.ok((value as unknown[]).length > 0, `${label} should be a non-empty array`);
  for (const item of value as unknown[]) {
    assert.equal(typeof item, "string", `${label} entries should be strings`);
    assert.notEqual(String(item).trim(), "", `${label} entries should be non-empty`);
  }
}

describe("component eval scenario conventions", () => {
  test("documents source-side eval scenarios and validates representative scenario files", () => {
    const docsPath = join(repoRoot, "docs/component-quality-standards.md");
    assert.equal(existsSync(docsPath), true, "component quality standards doc should exist");
    const docs = readFileSync(docsPath, "utf-8");
    for (const requiredText of [
      "scenario_version: 1",
      "expected_trigger",
      "success_criteria",
      "must_report_evidence",
      "prohibited_behaviors",
      "`evals/` 是源码侧质量验证材料",
    ]) {
      assert.match(docs, new RegExp(requiredText.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
    }

    const scenarioFiles = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(join("evals", "scenarios.yaml")),
    );
    assert.ok(scenarioFiles.length >= 3, "at least three representative skills should define eval scenarios");

    for (const file of scenarioFiles) {
      const parsed = parseYaml(readFileSync(file, "utf-8")) as Record<string, unknown>;
      const label = relative(repoRoot, file);
      assert.equal(parsed.scenario_version, 1, `${label} should declare scenario_version: 1`);
      assert.equal(Array.isArray(parsed.cases), true, `${label} should define cases`);
      assert.ok((parsed.cases as unknown[]).length > 0, `${label} cases should not be empty`);

      for (const [index, item] of (parsed.cases as Record<string, unknown>[]).entries()) {
        const caseLabel = `${label} cases[${index}]`;
        assert.equal(typeof item.id, "string", `${caseLabel} should define id`);
        assert.notEqual(String(item.id).trim(), "", `${caseLabel} id should not be empty`);
        assert.equal(typeof item.prompt, "string", `${caseLabel} should define prompt`);
        assert.notEqual(String(item.prompt).trim(), "", `${caseLabel} prompt should not be empty`);
        assert.equal(typeof item.trigger_expected, "boolean", `${caseLabel} should define trigger_expected`);

        const expectedTrigger = item.expected_trigger as Record<string, unknown> | undefined;
        assert.equal(Boolean(expectedTrigger && typeof expectedTrigger === "object"), true, `${caseLabel} should define expected_trigger`);
        const skills = expectedTrigger?.skills;
        const agents = expectedTrigger?.agents;
        assert.equal(Array.isArray(skills), true, `${caseLabel} expected_trigger.skills should be an array`);
        assert.equal(Array.isArray(agents), true, `${caseLabel} expected_trigger.agents should be an array`);
        assert.ok(
          (skills as unknown[]).length + (agents as unknown[]).length > 0,
          `${caseLabel} should expect at least one skill or agent`,
        );

        assert.equal(Array.isArray(item.fixtures), true, `${caseLabel} should define fixtures`);
        assert.ok((item.fixtures as unknown[]).length > 0, `${caseLabel} fixtures should not be empty`);
        assertNonEmptyStringArray(item.success_criteria, `${caseLabel} success_criteria`);
        assertNonEmptyStringArray(item.must_report_evidence, `${caseLabel} must_report_evidence`);
        assertNonEmptyStringArray(item.prohibited_behaviors, `${caseLabel} prohibited_behaviors`);
      }
    }
  });
});
