import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { afterEach, describe, expect, test, vi } from "vitest";
import { emitAgent, hasStringTool, validateAgentBashBoundary, validateAgentOutputFormat, validateAgentQualityStandards, validateAgentWorkflow } from "../../src/build/agents.ts";
import { Platform, ensureDir, writeText } from "../../src/build/core.ts";
import {
  DEFAULT_COMMAND_HOOK_TIMEOUT_SECONDS,
  compileHookModules,
  renderCodexConfig,
  renderHookConfig,
} from "../../src/build/hooks.ts";
import { main } from "../../src/build/main.ts";
import { emitPlatform, renderInstruction, validateId, validateRegistry } from "../../src/build/platform.ts";
import { byId, compileRegistry, materializeRegistry } from "../../src/build/registry.ts";
import {
  compactCodexOpenAiShortDescription,
  emitSkill,
  renderSkillMd,
  validateAntiPatterns,
  validateParameters,
  validateSkillWorkflow,
  validateTextList,
} from "../../src/build/skills.ts";
import { validateMermaidSyntax } from "../../src/build/mermaid.ts";
import type { ComponentRegistry } from "../../src/build/types.ts";
import { renderWorkflowMermaidSource } from "../../src/build/workflows.ts";
import {
  AgentSandbox,
  ComponentKind,
  HookEvent,
  InvocationPolicy,
  KnownTool,
  Platform as ComponentPlatform,
  SkillUseMode,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineAgentOutputTemplate,
  defineWorkflow,
  defineWorkflowGate,
  defineWorkflowRoute,
  defineWorkflowStep,
  defineAsset,
  defineHook,
  defineAgentInput,
  defineInstruction,
  defineProcedure,
  defineProcedureUse,
  defineReference,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
} from "../../src/components/sdk.ts";
import { debugMethodologyDebugChecklist, procedureUse } from "../../src/components/procedures/index.ts";
import { createFixture, createTempDir } from "./pipeline.fixture";

describe("build/pipeline registry procedure validation", () => {
  test("registry procedure validation enforces id/runtime/target constraints", () => {
    const fixture = createFixture();
    const duplicateProcedureRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [fixture.procedure, { ...fixture.procedure }],
    };
    expect(() => validateRegistry(duplicateProcedureRegistry)).toThrow("Duplicate procedure id");

    const invalidRuntimeRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [{ ...fixture.procedure, runtime: "python3" as any }],
    };
    expect(() => validateRegistry(invalidRuntimeRegistry)).toThrow("runtime must be node");

    const invalidProcedurePlatformRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [{ ...fixture.procedure, platforms: ["unknown-cli"] as any }],
    };
    expect(() => validateRegistry(invalidProcedurePlatformRegistry)).toThrow(
      "Procedure fixture-procedure platforms contain unsupported platform(s): unknown-cli",
    );

    const emptyProcedureTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [{ ...fixture.procedure, target: "" }],
    };
    expect(() => validateRegistry(emptyProcedureTargetRegistry)).toThrow(
      "Procedure fixture-procedure target must be a non-empty string when defined",
    );

    const traversalProcedureTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [{ ...fixture.procedure, target: "../bad.mjs" }],
    };
    expect(() => validateRegistry(traversalProcedureTargetRegistry)).toThrow(
      "Procedure fixture-procedure target must be a relative file path without traversal: ../bad.mjs",
    );

    const windowsProcedureTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [{ ...fixture.procedure, target: "scripts\\bad.mjs" }],
    };
    expect(() => validateRegistry(windowsProcedureTargetRegistry)).toThrow(
      "Procedure fixture-procedure target must use POSIX / separators: scripts\\bad.mjs",
    );

    const duplicateSkillOwnerProcedureTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        procedures: [
          defineProcedureUse({ id: fixture.procedure.id }),
          defineProcedureUse({ id: "duplicate-skill-target-procedure" }),
        ],
      }],
      procedures: [
        fixture.procedure,
        { ...fixture.procedure, id: "duplicate-skill-target-procedure" },
      ],
    };
    expect(() => validateRegistry(duplicateSkillOwnerProcedureTargetRegistry)).toThrow(
      "Procedure duplicate-skill-target-procedure target scripts/debug-checklist.mjs duplicates procedure fixture-procedure for owner skill fixture-skill",
    );

    const duplicateAgentOwnerProcedureTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{
        ...fixture.agent,
        procedures: [
          defineProcedureUse({ id: "duplicate-agent-target-a" }),
          defineProcedureUse({ id: "duplicate-agent-target-b" }),
        ],
      }],
      procedures: [
        fixture.procedure,
        {
          ...fixture.procedure,
          id: "duplicate-agent-target-a",
          owners: { skillIds: [], agentIds: [fixture.agent.id] },
        },
        {
          ...fixture.procedure,
          id: "duplicate-agent-target-b",
          owners: { skillIds: [], agentIds: [fixture.agent.id] },
        },
      ],
    };
    expect(() => validateRegistry(duplicateAgentOwnerProcedureTargetRegistry)).toThrow(
      "Procedure duplicate-agent-target-b target scripts/debug-checklist.mjs duplicates procedure duplicate-agent-target-a for owner agent fixture-agent",
    );

    const invalidProcedureArgsTypeNameRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [{
        ...fixture.procedure,
        args: { typeName: "Bad Type", fields: {} },
      }],
    };
    expect(() => validateRegistry(invalidProcedureArgsTypeNameRegistry)).toThrow(
      "Procedure fixture-procedure args.typeName must be a TypeScript identifier",
    );

    const invalidProcedureOutputFieldRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [{
        ...fixture.procedure,
        output: {
          typeName: "FixtureOutput",
          fields: {
            result: { type: "string", description: "" },
          },
        },
      }],
    };
    expect(() => validateRegistry(invalidProcedureOutputFieldRegistry)).toThrow(
      "Procedure fixture-procedure output.fields.result.description must be a non-empty string",
    );

    const invalidProcedureFieldRequiredRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [{
        ...fixture.procedure,
        args: {
          typeName: "FixtureArgs",
          fields: {
            input: { type: "string", description: "fixture input", required: "yes" as any },
          },
        },
      }],
    };
    expect(() => validateRegistry(invalidProcedureFieldRequiredRegistry)).toThrow(
      "Procedure fixture-procedure args.fields.input.required must be a boolean when defined",
    );

    const unreferencedProcedureRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [
        fixture.procedure,
        { ...fixture.procedure, id: "unused-procedure" },
      ],
    };
    expect(() => validateRegistry(unreferencedProcedureRegistry)).toThrow(
      "Procedure unused-procedure is registered but not referenced by any skill or agent",
    );
  });
});
