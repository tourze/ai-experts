import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "vitest";
import {
  normalizeEvalSet,
  parseEvalCasesYaml,
} from "../../src/components/procedures/sources/skill-creator/run_eval.ts";
import { validateSkill } from "../../src/components/procedures/sources/skill-creator/quick_validate.ts";

describe("skill creator eval set loading", () => {
  test("parses source cases.yaml trigger evals", () => {
    const cases = parseEvalCasesYaml(`
cases:
  - id: should_trigger
    prompt: "帮我把上线检查流程做成 skill。"
    fixtures: []
    rubric:
      - "触发 skill 创建流程"
    trigger_expected: true

  - id: folded_prompt
    prompt: >
      Review this skill,
      but do not create a new one.
    trigger_expected: false
`);

    assert.deepEqual(normalizeEvalSet({ cases }).map(({ id, query, should_trigger }) => ({
      id,
      query,
      should_trigger,
    })), [
      {
        id: "should_trigger",
        query: "帮我把上线检查流程做成 skill。",
        should_trigger: true,
      },
      {
        id: "folded_prompt",
        query: "Review this skill, but do not create a new one.",
        should_trigger: false,
      },
    ]);
  });

  test("keeps legacy json eval arrays compatible", () => {
    assert.deepEqual(normalizeEvalSet([
      { query: "Create a skill", should_trigger: true },
      { prompt: "Score this skill only", trigger_expected: false },
    ]).map(({ query, should_trigger }) => ({ query, should_trigger })), [
      { query: "Create a skill", should_trigger: true },
      { query: "Score this skill only", should_trigger: false },
    ]);
  });

  test("quick validator accepts current Claude skill frontmatter keys", () => {
    const skillDir = mkdtempSync(join(tmpdir(), "ai-experts-skill-validate-"));
    try {
      writeFileSync(
        join(skillDir, "SKILL.md"),
        [
          "---",
          "name: speckit-baseline",
          "description: \"Valid skill description for generated frontmatter coverage.\"",
          "argument-hint: \"[用户输入]\"",
          "arguments:",
          "  - arguments",
          "allowed-tools:",
          "  - Read",
          "  - Bash",
          "disable-model-invocation: true",
          "user-invocable: false",
          "---",
          "",
          "# Generated Skill",
          "",
          "## 工作流",
          "",
        ].join("\n"),
      );

      assert.deepEqual(validateSkill(skillDir), [true, "Skill 校验通过！"]);
    } finally {
      rmSync(skillDir, { recursive: true, force: true });
    }
  });
});
