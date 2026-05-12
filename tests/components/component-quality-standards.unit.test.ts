import assert from "node:assert/strict";
import { describe, test } from "vitest";
import {
  validateChecklistQuestions,
  validateSkillOutputsEvidence,
} from "../../src/build/skills";
import { validateAgentOutputEvidence } from "../../src/build/agents";
import { registry } from "../../src/components/registry";

describe("representative component quality standards", () => {
  test("representative skills use question checklists and evidence-oriented outputs", () => {
    const skillsById = new Map(registry.skills.map((skill) => [skill.id, skill]));
    const representativeSkillIds = [
      "typescript-type-safety",
      "testing-patterns",
      "debug-methodology",
      "pre-landing-review",
      "user-guide-writing",
    ];

    for (const skillId of representativeSkillIds) {
      const skill = skillsById.get(skillId);
      assert.ok(skill, `missing representative skill: ${skillId}`);
      assert.doesNotThrow(() => validateChecklistQuestions(skill));
      assert.doesNotThrow(() => validateSkillOutputsEvidence(skill));
    }
  });

  test("representative agents state evidence fields in output expectations", () => {
    const agentsById = new Map(registry.agents.map((agent) => [agent.id, agent]));
    for (const agentId of ["code-reviewer", "typescript-reviewer"]) {
      const agent = agentsById.get(agentId);
      assert.ok(agent, `missing representative agent: ${agentId}`);
      assert.doesNotThrow(() => validateAgentOutputEvidence(agent));
    }
  });
});
