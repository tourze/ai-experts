import { describe, expect, test } from "vitest";
import {
  buildProcedureCommandRewrites,
  type ProcedureCommandRewriteCandidate,
} from "../../src/build/procedures.ts";

function candidate(
  id: string,
  target: string,
  owners: ProcedureCommandRewriteCandidate["owners"],
): ProcedureCommandRewriteCandidate {
  return { id, target, owners };
}

describe("build/procedures", () => {
  test("procedure command rewrites always include an owning trigger", () => {
    const rewrites = buildProcedureCommandRewrites([
      candidate("skill-owned", "scripts/skill.mjs", { skillIds: ["skill-a"], agentIds: [] }),
      candidate("agent-owned", "scripts/agent.mjs", { skillIds: [], agentIds: ["agent-a"] }),
    ]);

    expect(rewrites[JSON.stringify(["skill", "skill-a", "scripts/skill.mjs"])]).toEqual({
      id: "skill-owned",
      triggerKind: "skill",
      triggerId: "skill-a",
    });
    expect(rewrites[JSON.stringify(["", "", "scripts/skill.mjs"])]).toEqual({
      id: "skill-owned",
      triggerKind: "skill",
      triggerId: "skill-a",
    });
    expect(rewrites[JSON.stringify(["agent", "agent-a", "scripts/agent.mjs"])]).toEqual({
      id: "agent-owned",
      triggerKind: "agent",
      triggerId: "agent-a",
    });
    expect(rewrites[JSON.stringify(["", "", "scripts/agent.mjs"])]).toEqual({
      id: "agent-owned",
      triggerKind: "agent",
      triggerId: "agent-a",
    });
    expect(Object.values(rewrites).every((rewrite) => Boolean(rewrite.triggerKind && rewrite.triggerId))).toBe(true);
  });

  test("procedure command rewrites skip ambiguous global targets", () => {
    const rewrites = buildProcedureCommandRewrites([
      candidate("first", "scripts/shared.mjs", { skillIds: ["skill-a"], agentIds: [] }),
      candidate("second", "scripts/shared.mjs", { skillIds: ["skill-b"], agentIds: [] }),
    ]);

    expect(rewrites[JSON.stringify(["", "", "scripts/shared.mjs"])]).toBeUndefined();
    expect(rewrites[JSON.stringify(["skill", "skill-a", "scripts/shared.mjs"])]).toEqual({
      id: "first",
      triggerKind: "skill",
      triggerId: "skill-a",
    });
    expect(rewrites[JSON.stringify(["skill", "skill-b", "scripts/shared.mjs"])]).toEqual({
      id: "second",
      triggerKind: "skill",
      triggerId: "skill-b",
    });
  });
});
