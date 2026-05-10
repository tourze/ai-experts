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

describe("build/pipeline procedure references", () => {
  test("procedure references support structured links and helper guard", () => {
    const fixture = createFixture();
    const agentProcedure = defineProcedure({
      id: "fixture-agent-procedure",
      entry: fixture.procedure.entry,
      description: "fixture agent procedure",
      owners: { agentIds: [fixture.agent.id] },
      runtime: "node",
    });
    const structuredProcedureRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        procedures: [
          defineProcedureUse({
            id: fixture.procedure.id,
            reason: "用于 fixture 场景校验",
          }),
        ],
      }],
      procedures: [...fixture.registry.procedures, agentProcedure],
      agents: [{
        ...fixture.agent,
        procedures: [
          defineProcedureUse({
            id: agentProcedure.id,
            reason: "用于 fixture agent 关联校验",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(structuredProcedureRegistry)).not.toThrow();
    const skillMd = renderSkillMd(
      structuredProcedureRegistry.skills[0]!,
      Platform.Claude,
      new Map([[fixture.procedure.id, fixture.procedure]]),
    );
    expect(skillMd).toContain("用于 fixture 场景校验");
    expect(skillMd).toContain("## Procedure 调用说明");
    expect(skillMd).toContain("### `fixture-procedure`");
    expect(skillMd).toContain("**调用示例：**");

    const compactProcedure = {
      ...fixture.procedure,
      params: [{
        flag: "--mode",
        type: "字符串",
        description: "fixture mode",
        required: false,
      }],
    };
    const compactProcedureSkillMd = renderSkillMd(
      {
        ...structuredProcedureRegistry.skills[0]!,
        procedures: [defineProcedureUse({ id: fixture.procedure.id, showParams: false })],
      },
      Platform.Claude,
      new Map([[fixture.procedure.id, compactProcedure]]),
    );
    expect(compactProcedureSkillMd).toContain("完整参数以该 Procedure 的 `--help` 输出为准");
    expect(compactProcedureSkillMd).not.toContain("| `--mode` |");

    const duplicateProcedureUsesRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        procedures: [
          defineProcedureUse({
            id: fixture.procedure.id,
            useId: "mode-a",
            label: "模式 A",
            exampleArgs: { args: ["--mode", "a"] },
          }),
          defineProcedureUse({
            id: fixture.procedure.id,
            useId: "mode-b",
            label: "模式 B",
            exampleArgs: { args: ["--mode", "b"] },
          }),
        ],
      }],
    };
    expect(() => validateRegistry(duplicateProcedureUsesRegistry)).toThrow("Duplicate procedure id in fixture-skill: fixture-procedure");

    const duplicateProcedureUsesWithoutUseIdRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        procedures: [
          defineProcedureUse({ id: fixture.procedure.id, label: "模式 A" }),
          defineProcedureUse({ id: fixture.procedure.id, label: "模式 B" }),
        ],
      }],
    };
    expect(() => validateRegistry(duplicateProcedureUsesWithoutUseIdRegistry)).toThrow("Duplicate procedure id in fixture-skill: fixture-procedure");

    const invalidReasonRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        procedures: [
          defineProcedureUse({
            id: fixture.procedure.id,
            reason: "",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(invalidReasonRegistry)).toThrow("reason must be a non-empty string");

    const invalidExampleArgsRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        procedures: [
          defineProcedureUse({
            id: fixture.procedure.id,
            exampleArgs: { args: [Number.NaN] },
          }),
        ],
      }],
    };
    expect(() => validateRegistry(invalidExampleArgsRegistry)).toThrow(
      "procedure reference fixture-procedure exampleArgs must be JSON-serializable",
    );

    const invalidExpectedOutputRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        procedures: [
          defineProcedureUse({
            id: fixture.procedure.id,
            expectedOutput: { run: () => "ok" } as any,
          }),
        ],
      }],
    };
    expect(() => validateRegistry(invalidExpectedOutputRegistry)).toThrow(
      "procedure reference fixture-procedure expectedOutput must be JSON-serializable",
    );

    expect(() => procedureUse(debugMethodologyDebugChecklist)).not.toThrow();
    expect(() =>
      procedureUse({
        ...debugMethodologyDebugChecklist,
        id: "missing-procedure-id",
      })
    ).toThrow("Unknown component procedure id");
  });

  test("procedure runtime help keeps omitted params required by default", async () => {
    const fixture = createFixture();
    const procedure = defineProcedure({
      ...fixture.procedure,
      params: [
        {
          flag: "--input",
          type: "路径",
          description: "输入文件",
        },
        {
          flag: "--optional",
          type: "字符串",
          description: "可选参数",
          required: false,
        },
      ],
    });
    const registry: ComponentRegistry = {
      ...fixture.registry,
      procedures: [procedure],
    };
    const outDir = createTempDir("ai-experts-procedure-help-");
    await emitPlatform(validateRegistry(registry), outDir, Platform.Claude);

    const result = spawnSync(
      process.execPath,
      [
        join(outDir, "claude", "procedures.js"),
        "--procedure-id",
        procedure.id,
        "--trigger-skill",
        fixture.skill.id,
        "--",
        "--help",
      ],
      { encoding: "utf-8" },
    );

    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout);
    const help = output.result.stdout;
    expect(help).toContain("--input <路径> (required)");
    expect(help).toContain("--optional <字符串>");
    expect(help).not.toContain("--optional <字符串> (required)");
  });

});
