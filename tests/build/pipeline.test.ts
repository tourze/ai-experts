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

describe("build/pipeline modules", () => {
  test("registry helpers and compileRegistry work", async () => {
    const fixture = createFixture();
    expect(byId(fixture.registry.skills, "skill").get("fixture-skill")?.id).toBe("fixture-skill");
    expect(() => byId([...fixture.registry.skills, fixture.skill], "skill")).toThrow("Duplicate skill id");
    expect(materializeRegistry(fixture.registry).skills[0].id).toBe("fixture-skill");

    const compiled = await compileRegistry();
    expect(compiled.registry.skills.length).toBeGreaterThan(0);
    expect(compiled.registry.agents.length).toBeGreaterThan(0);
    rmSync(compiled.tempDir, { recursive: true, force: true });
  });

  test("skill helpers render and emit skill surfaces", async () => {
    const fixture = createFixture();
    expect(validateTextList(fixture.skill, "useCases", "useCase")[0]).toContain("fixture");
    expect(validateAntiPatterns(fixture.skill).length).toBe(1);
    const procedureMap = new Map([[fixture.procedure.id, fixture.procedure]]);
    expect(renderSkillMd(fixture.skill, Platform.Claude, procedureMap)).toContain("## 适用场景");
    expect(renderSkillMd(fixture.skill, Platform.Codex, procedureMap)).toContain("# Fixture Skill");
    const procedureWithDefaultArgs = {
      ...fixture.procedure,
      exampleArgs: { args: ["--default", "procedure value"] },
    };
    const procedureUseOverrideSkill = {
      ...fixture.skill,
      procedures: [
        defineProcedureUse({
          id: fixture.procedure.id,
          exampleArgs: { args: ["--override", "use value"] },
        }),
      ],
    };
    const procedureUseOverrideMd = renderSkillMd(
      procedureUseOverrideSkill,
      Platform.Claude,
      new Map([[fixture.procedure.id, procedureWithDefaultArgs]]),
    );
    expect(procedureUseOverrideMd).toContain("--override 'use value'");
    expect(procedureUseOverrideMd).not.toContain("--default 'procedure value'");
    const relatedSkillMd = renderSkillMd(
      {
        ...fixture.skill,
        relatedSkills: [
          { id: "other-skill", reason: "first route" },
          { id: "other-skill", reason: "duplicate route" },
        ],
      },
      Platform.Claude,
      procedureMap,
    );
    expect(relatedSkillMd.match(/\.\.\/other-skill\/SKILL\.md/g)?.length).toBe(1);
    expect(() => validateTextList({ ...fixture.skill, useCases: [] }, "useCases", "useCase")).toThrow();
    expect(() => validateAntiPatterns({ ...fixture.skill, antiPatterns: [] })).toThrow();

    const structuredSkill = defineSkill({
      ...fixture.skill,
      id: "structured-skill",
      fullName: "Structured Skill",
      sourceDir: pathToFileURL(`${fixture.root}/skill/`),
      procedures: [],
      goal: defineSkillGoal({ title: "完成条件", body: "明确流程目标。" }),
      workflow: defineWorkflow({
        steps: [
          defineWorkflowStep({ id: "step-1", label: "读取输入。" }),
          defineWorkflowStep({ id: "step-2", label: "执行检查。" }),
        ],
      }),
      outputs: defineSkillOutputs({ items: ["结论", "后续动作"] }),
    });
    expect(() => validateRegistry({ ...fixture.registry, skills: [fixture.skill, structuredSkill] })).not.toThrow();
    const structuredRendered = renderSkillMd(structuredSkill, Platform.Claude, procedureMap);
    expect(structuredRendered).toContain("## 完成条件\n\n明确流程目标。");
    expect(structuredRendered).toContain("## 工作流\n\n```mermaid\nflowchart TD");
    expect(structuredRendered).toContain('step_1["读取输入。"]\n  start --> step_1');
    expect(structuredRendered).toContain('step_2["执行检查。"]\n  step_1 --> step_2');
    expect(structuredRendered).toContain("## 输出\n\n- 结论\n- 后续动作");
    expect(() =>
      renderSkillMd({ ...structuredSkill, fullName: "Bad\nName" }, Platform.Claude, procedureMap)
    ).toThrow("fullName must be a single line");
    const structuredWorkflow = validateSkillWorkflow(structuredSkill);
    expect(structuredWorkflow).not.toBeNull();
    if (!structuredWorkflow) throw new Error("expected structured workflow");
    expect(() =>
      validateSkillWorkflow({
        ...structuredSkill,
        workflow: defineWorkflow({
          steps: [defineWorkflowStep({ id: "BadStep", label: "invalid id" })],
        }),
      })
    ).toThrow("workflow.steps[0].id must use lowercase kebab-case");
    expect(() =>
      validateSkillWorkflow({
        ...structuredSkill,
        workflow: defineWorkflow({
          steps: [defineWorkflowStep({ id: "step-", label: "invalid id" })],
        }),
      })
    ).toThrow("workflow.steps[0].id must use lowercase kebab-case");
    await expect(
      validateMermaidSyntax("structured skill", renderWorkflowMermaidSource(structuredWorkflow)),
    ).resolves.toBeUndefined();
    await expect(
      validateMermaidSyntax("broken workflow", "flowchart TD\n  start -->"),
    ).rejects.toThrow("broken workflow generated Mermaid diagram is invalid");

    const workflowHelperSkill = defineSkill({
      ...fixture.skill,
      id: "workflow-helper-skill",
      fullName: "Workflow Helper Skill",
      procedures: [],
      references: [],
      assets: [],
      workflow: defineWorkflow({
        steps: [defineWorkflowStep({ id: "assist", label: "辅助检查。" })],
      }),
    });
    const complexWorkflowSkill = defineSkill({
      ...fixture.skill,
      id: "complex-workflow-skill",
      fullName: "Complex Workflow Skill",
      procedures: [],
      references: [],
      assets: [],
      workflow: defineWorkflow({
        steps: [defineWorkflowStep({ id: "collect", label: "收集上下文。" })],
        gates: [
          defineWorkflowGate({
            id: "evidence-gate",
            skill: workflowHelperSkill.id,
            label: "证据门禁",
            checks: "证据完整后再路由。",
          }),
        ],
        routes: [
          defineWorkflowRoute({
            id: "specialist-route",
            triggers: ["需要专项处理"],
            skill: workflowHelperSkill.id,
            checks: "专项检查完成。",
            output: "专项结论。",
          }),
        ],
        finalSteps: [defineWorkflowStep({ id: "finalize", label: "收束结论。" })],
      }),
      relatedSkills: [{ id: workflowHelperSkill.id, reason: "workflow gate and route helper" }],
    });
    expect(() =>
      validateRegistry({
        ...fixture.registry,
        skills: [fixture.skill, workflowHelperSkill, complexWorkflowSkill],
      })
    ).not.toThrow();
    expect(() =>
      validateRegistry({
        ...fixture.registry,
        skills: [fixture.skill, workflowHelperSkill, { ...complexWorkflowSkill, relatedSkills: [] }],
      })
    ).toThrow("workflow references skill workflow-helper-skill but relatedSkills does not include it");
    const complexRendered = renderSkillMd(complexWorkflowSkill, Platform.Claude, procedureMap);
    expect(complexRendered).toContain("## 工作流\n\n```mermaid\nflowchart TD");
    expect(complexRendered).toContain('evidence_gate["workflow-helper-skill');
    expect(complexRendered).toContain('route{"选择工作流分支"}');
    expect(complexRendered).not.toContain("匹配场景路由");
    expect(complexRendered).toContain('route -->|"需要专项处理"| specialist_route');
    expect(complexRendered).toContain("specialist_route --> join");
    expect(complexRendered).toContain("join --> finalize");

    expect(() =>
      validateRegistry({
        ...fixture.registry,
        skills: [fixture.skill, {
          ...structuredSkill,
          sourceDir: undefined,
          goal: undefined,
          outputs: undefined,
        }],
      })
    ).toThrow("must define sourceDir");

    const codexRoot = createTempDir("ai-experts-emit-skill-");
    await emitSkill(fixture.skill, codexRoot, Platform.Codex, procedureMap, new Set([fixture.skill.id]));
    expect(existsSync(join(codexRoot, "skills", fixture.skill.id, "SKILL.md"))).toBe(true);
    expect(existsSync(join(codexRoot, "skills", fixture.skill.id, "agents", "openai.yaml"))).toBe(true);
    const codexSkillMetadata = readFileSync(join(codexRoot, "skills", fixture.skill.id, "agents", "openai.yaml"), "utf-8");
    expect(parseYaml(codexSkillMetadata)).toEqual({
      interface: {
        display_name: fixture.skill.fullName,
        short_description: compactCodexOpenAiShortDescription(fixture.skill.description),
      },
      policy: {
        allow_implicit_invocation: false,
      },
    });
    expect(compactCodexOpenAiShortDescription(
      "当需要审计认证会话安全、密钥管理、敏感数据暴露或批量赋值漏洞时使用。适用于 token/JWT/session/cookie/OAuth 认证链路。",
    )).toBe("当需要审计认证会话安全、密钥管理、敏感数据暴露或批量赋值漏洞时使用。");
    const claudeSkill = renderSkillMd(fixture.skill, Platform.Claude, procedureMap);
    expect(claudeSkill).toContain("  - mcp__fixture__lookup");
    expect(claudeSkill).toContain(
      "| [fixture-ref](references/reference.md) | fixture summary<br>with detail | 需要参考 \\| 样例时 |",
    );
    const parameterSkill = {
      ...fixture.skill,
      parameters: [{ name: "scope", description: "包含 A | B\n换行", type: "string" as const }],
    };
    expect(renderSkillMd(parameterSkill, Platform.Codex, procedureMap)).toContain(
      "| `scope` | string | 是 | 包含 A \\| B<br>换行 |",
    );
    expect(() =>
      validateParameters({
        ...fixture.skill,
        parameters: [{ name: "bad name", description: "invalid name" }],
      })
    ).toThrow("parameters[0].name must start with a letter");
    expect(existsSync(join(codexRoot, "skills", fixture.skill.id, "references", "index.md"))).toBe(true);
    const referenceIndex = readFileSync(join(codexRoot, "skills", fixture.skill.id, "references", "index.md"), "utf-8");
    expect(referenceIndex).toContain("Fixture \\| Ref");
    expect(referenceIndex).toContain("fixture summary<br>with detail");
    expect(referenceIndex).toContain("需要参考 \\| 样例时");
  });

});
