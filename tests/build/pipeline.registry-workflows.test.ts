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

describe("build/pipeline registry workflow validation", () => {
  test("registry workflow validation enforces skill ownership and platform constraints", () => {
    const fixture = createFixture();
    const codexSkillWorkflowWithClaudeOnlySkillRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [
        { ...fixture.skill, platforms: [ComponentPlatform.Claude] },
        {
          ...fixture.skill,
          id: "workflow-skill",
          fullName: "Workflow Skill",
          procedures: [],
          references: [],
          assets: [],
          workflow: defineWorkflow({
            gates: [
              defineWorkflowGate({
                id: "gate-check",
                skill: fixture.skill.id,
                label: "门禁",
                checks: "检查证据",
              }),
            ],
          }),
        },
      ],
      agents: [{
        ...fixture.agent,
        workflow: defineWorkflow({
          steps: [defineWorkflowStep({ id: "skill-workflow-platform-check", label: "检查 skill workflow 平台。" })],
        }),
        skills: [],
      }],
    };
    expect(() => validateRegistry(codexSkillWorkflowWithClaudeOnlySkillRegistry)).toThrow(
      "Skill workflow-skill workflow gate references skill fixture-skill unavailable on platform(s): codex-cli",
    );

    const codexSkillRouteWithClaudeOnlySkillRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [
        { ...fixture.skill, platforms: [ComponentPlatform.Claude] },
        {
          ...fixture.skill,
          id: "workflow-skill",
          fullName: "Workflow Skill",
          procedures: [],
          references: [],
          assets: [],
          workflow: defineWorkflow({
            routes: [
              defineWorkflowRoute({
                id: "route-a",
                triggers: ["需要技能"],
                skill: fixture.skill.id,
                checks: "路由检查",
                output: "产出结果",
              }),
            ],
          }),
        },
      ],
      agents: [{
        ...fixture.agent,
        workflow: defineWorkflow({
          steps: [defineWorkflowStep({ id: "skill-route-platform-check", label: "检查 skill route 平台。" })],
        }),
        skills: [],
      }],
    };
    expect(() => validateRegistry(codexSkillRouteWithClaudeOnlySkillRegistry)).toThrow(
      "Skill workflow-skill workflow route references skill fixture-skill unavailable on platform(s): codex-cli",
    );

    const duplicateSkillRouteTriggerRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        workflow: defineWorkflow({
          routes: [
            defineWorkflowRoute({
              id: "route-a",
              triggers: ["需要技能", "需要技能"],
              skill: fixture.skill.id,
              checks: "路由检查",
              output: "产出结果",
            }),
          ],
        }),
      }],
      agents: [{
        ...fixture.agent,
        workflow: defineWorkflow({
          steps: [defineWorkflowStep({ id: "skill-route-check", label: "检查 skill route。" })],
        }),
        skills: [{ id: fixture.skill.id, mode: SkillUseMode.Route, reason: "fixture routing" }],
      }],
    };
    expect(() => validateRegistry(duplicateSkillRouteTriggerRegistry)).toThrow(
      "Skill fixture-skill workflow.routes[0] contains duplicate trigger: 需要技能",
    );

    const missingOwnerRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [{ ...fixture.procedure, owners: { skillIds: ["missing-skill"] } }],
    };
    expect(() => validateRegistry(missingOwnerRegistry)).toThrow("missing owner skill");

    const duplicateOwnerRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [{
        ...fixture.procedure,
        owners: { skillIds: [fixture.skill.id, fixture.skill.id] },
      }],
    };
    expect(() => validateRegistry(duplicateOwnerRegistry)).toThrow(
      "Procedure fixture-procedure contains duplicate owner skill(s): fixture-skill",
    );

    const extraOwnerSkill = {
      ...fixture.skill,
      id: "extra-owner-skill",
      fullName: "Extra Owner Skill",
      procedures: [],
    };
    const unreciprocatedOwnerRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [fixture.skill, extraOwnerSkill],
      procedures: [{
        ...fixture.procedure,
        owners: { skillIds: [fixture.skill.id, extraOwnerSkill.id] },
      }],
    };
    expect(() => validateRegistry(unreciprocatedOwnerRegistry)).toThrow(
      "Procedure fixture-procedure lists owner skill extra-owner-skill but that skill does not reference the procedure",
    );

    const unreciprocatedAgentOwnerRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [{
        ...fixture.procedure,
        owners: { skillIds: [fixture.skill.id], agentIds: [fixture.agent.id] },
      }],
    };
    expect(() => validateRegistry(unreciprocatedAgentOwnerRegistry)).toThrow(
      "Procedure fixture-procedure lists owner agent fixture-agent but that agent does not reference the procedure",
    );

    const missingProcedureReferenceRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, procedures: [defineProcedureUse({ id: "missing-procedure" })] }],
    };
    expect(() => validateRegistry(missingProcedureReferenceRegistry)).toThrow("references missing procedure");

    const claudeOnlyProcedure = {
      ...fixture.procedure,
      platforms: [ComponentPlatform.Claude],
    };
    const unscopedClaudeOnlyProcedureUseRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [claudeOnlyProcedure],
    };
    expect(() => validateRegistry(unscopedClaudeOnlyProcedureUseRegistry)).toThrow(
      "skill fixture-skill references platform-limited procedure fixture-procedure without explicit procedure use platforms",
    );

    const scopedClaudeOnlyProcedureUseRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [claudeOnlyProcedure],
      skills: [{
        ...fixture.skill,
        procedures: [defineProcedureUse({ id: fixture.procedure.id, platforms: [ComponentPlatform.Claude] })],
      }],
    };
    expect(() => validateRegistry(scopedClaudeOnlyProcedureUseRegistry)).not.toThrow();

    const claudeOnlySkillUnscopedProcedureUseRegistry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [claudeOnlyProcedure],
      skills: [{
        ...fixture.skill,
        platforms: [ComponentPlatform.Claude],
      }],
      agents: [{ ...fixture.agent, platforms: [ComponentPlatform.Claude] }],
      hooks: [{ ...fixture.hook, platforms: [ComponentPlatform.Claude] }],
    };
    expect(() => validateRegistry(claudeOnlySkillUnscopedProcedureUseRegistry)).toThrow(
      "skill fixture-skill references platform-limited procedure fixture-procedure without explicit procedure use platforms",
    );

    const unsupportedProcedureUsePlatformRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        platforms: [ComponentPlatform.Claude],
        procedures: [defineProcedureUse({ id: fixture.procedure.id, platforms: [ComponentPlatform.Codex] })],
      }],
      agents: [{ ...fixture.agent, platforms: [ComponentPlatform.Claude] }],
      hooks: [{ ...fixture.hook, platforms: [ComponentPlatform.Claude] }],
    };
    expect(() => validateRegistry(unsupportedProcedureUsePlatformRegistry)).toThrow(
      "skill fixture-skill references procedure fixture-procedure for unsupported platform(s): codex-cli",
    );

    const otherSkill = defineSkill({
      ...fixture.skill,
      id: "other-skill",
      fullName: "Other Skill",
      relatedSkills: [],
      procedures: [],
    });
    const claudeOnlySkill = defineSkill({
      ...fixture.skill,
      id: "claude-only-skill",
      fullName: "Claude Only Skill",
      platforms: [ComponentPlatform.Claude],
      relatedSkills: [],
      procedures: [],
    });

    const duplicateRelatedSkillRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        relatedSkills: [
          { get skill() { return otherSkill; }, reason: "first route" },
          { get skill() { return otherSkill; }, reason: "duplicate route" },
        ],
      }],
    };
    expect(() => validateRegistry(duplicateRelatedSkillRegistry)).toThrow("references missing related skill");

    expect(() =>
      validateRegistry({
        ...fixture.registry,
        procedures: [],
        skills: [{
          ...fixture.skill,
          procedures: [],
          relatedSkills: [{ get skill() { return otherSkill; }, reason: "bad\nreason" }],
        }, otherSkill],
      })
    ).toThrow("related skill other-skill reason must be a single line");

    expect(() =>
      validateRegistry({
        ...fixture.registry,
        procedures: [],
        skills: [{
          ...fixture.skill,
          procedures: [],
          relatedSkills: [{ get skill() { return claudeOnlySkill; }, reason: "Claude-only route" }],
        }, claudeOnlySkill],
      })
    ).toThrow("related skill claude-only-skill unavailable on platform(s): codex-cli");

    expect(() =>
      validateRegistry({
        ...fixture.registry,
        procedures: [],
        skills: [{
          ...fixture.skill,
          procedures: [],
          relatedSkills: [
            { get skill() { return otherSkill; }, reason: "first route" },
            { get skill() { return otherSkill; }, reason: "duplicate route" },
          ],
        }, otherSkill],
      })
    ).toThrow("duplicate related skill entry: other-skill");

  });
});
