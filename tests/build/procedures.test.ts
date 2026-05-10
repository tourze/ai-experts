import { describe, expect, test } from "vitest";
import {
  buildProcedureCommandRewrites,
  collectPlatformProcedureOwners,
  type ProcedureCommandRewriteCandidate,
} from "../../src/build/procedures.ts";
import {
  renderProceduresEntrypoint,
  type RuntimeProcedureModule,
} from "../../src/build/procedure-runtime-entry.ts";
import type { ComponentSurface } from "../../src/build/types.ts";
import { Platform, type ProcedureDefinition } from "../../src/components/sdk.ts";

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

  test("procedure runtime owners only include platform-applicable procedure uses", () => {
    const procedure = {
      id: "shared-procedure",
      owners: {
        skillIds: ["skill-a", "skill-b"],
        agentIds: ["agent-a", "agent-b"],
      },
    };
    const surface = {
      instructions: [],
      procedures: [procedure],
      skills: [
        {
          id: "skill-a",
          platforms: [Platform.Claude, Platform.Codex],
          procedures: [{ id: procedure.id, platforms: [Platform.Claude] }],
        },
        {
          id: "skill-b",
          platforms: [Platform.Claude, Platform.Codex],
          procedures: [{ id: procedure.id }],
        },
      ],
      agents: [
        {
          id: "agent-a",
          platforms: [Platform.Claude, Platform.Codex],
          procedures: [{ id: procedure.id, platforms: [Platform.Codex] }],
        },
        {
          id: "agent-b",
          platforms: [Platform.Claude],
          procedures: [{ id: procedure.id }],
        },
      ],
      hooks: [],
    } as unknown as ComponentSurface;

    expect(
      collectPlatformProcedureOwners(surface, procedure as unknown as ProcedureDefinition, Platform.Claude),
    ).toEqual({
      skillIds: ["skill-a", "skill-b"],
      agentIds: ["agent-b"],
    });
    expect(
      collectPlatformProcedureOwners(surface, procedure as unknown as ProcedureDefinition, Platform.Codex),
    ).toEqual({
      skillIds: ["skill-b"],
      agentIds: ["agent-a"],
    });
  });

  test("procedure runtime template replacement does not rewrite injected metadata", () => {
    const markerDescription = "__AI_EXPERTS_PLATFORM_JSON__ __AI_EXPERTS_RUNTIME_PATH_JSON__";
    const rendered = renderProceduresEntrypoint([
      {
        id: "marker-procedure",
        target: "scripts/marker.mjs",
        runtime: "node",
        description: markerDescription,
        owners: { skillIds: ["marker-skill"], agentIds: [] },
        argsSchema: null,
        outputSchema: null,
        sourcePath: "/tmp/__AI_EXPERTS_PLATFORM_JSON__/marker.ts",
      } satisfies RuntimeProcedureModule,
    ], Platform.Codex);

    expect(rendered).toContain(JSON.stringify(markerDescription));
    expect(rendered).toContain('const platform = "codex-cli";');
    expect(rendered).toContain('const procedureRuntimePath = "~/.codex/procedures.js";');
  });
});
