import { execFileSync } from "node:child_process";
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
import { emitSkill, renderSkillMd, validateAntiPatterns, validateSkillWorkflow, validateTextList } from "../../src/build/skills.ts";
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

const tempDirs: string[] = [];

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop() as string, { recursive: true, force: true });
  }
});

function createFixture() {
  const root = createTempDir("ai-experts-build-pipeline-");
  const skillRoot = join(root, "skill");
  const hooksRoot = join(root, "hooks");
  const instructionRoot = join(root, "instruction");
  ensureDir(skillRoot);
  ensureDir(join(skillRoot, "references"));
  ensureDir(join(skillRoot, "assets"));
  ensureDir(hooksRoot);
  ensureDir(instructionRoot);

  const skillReference = join(skillRoot, "references", "reference.md");
  const skillAsset = join(skillRoot, "assets", "asset.txt");
  writeText(skillReference, "# Ref\n");
  writeText(skillAsset, "asset");

  const procedure = defineProcedure({
    id: "fixture-procedure",
    entry: pathToFileURL(join(process.cwd(), "src/components/procedures/sources/debug-methodology/debug-checklist.ts")),
    description: "fixture procedure",
    owners: { skillIds: ["fixture-skill"] },
    runtime: "node",
  });

  const hookEntry = join(hooksRoot, "hook.ts");
  writeText(
    hookEntry,
    [
      "export async function run(payload) {",
      "  if (payload?.prompt && payload.prompt.includes('deny')) {",
      "    return { kind: 'deny', message: 'blocked by fixture' };",
      "  }",
      "  return { kind: 'add-context', message: 'fixture context' };",
      "}",
      "",
    ].join("\n"),
  );

  const instructionBody = join(instructionRoot, "INSTRUCTION.md");
  writeText(instructionBody, "## Runtime Model\n\nTest instruction.\n");

  const skill = defineSkill({
    id: "fixture-skill",
    fullName: "Fixture Skill",
    description: "A fixture skill used for build tests and validation checks.",
    useCases: ["处理 fixture 场景。"],
    constraints: ["必须产出可执行证据。"],
    checklist: ["验证输出是否完整。"],
    antiPatterns: [{ fail: "直接跳过验证。", pass: "执行并验证输出。" }],
    invocation: InvocationPolicy.ExplicitOnly,
    platforms: [ComponentPlatform.Claude, ComponentPlatform.Codex],
    sourceDir: pathToFileURL(`${skillRoot}/`),
    workflow: defineWorkflow({
      steps: [defineWorkflowStep({ id: "inspect", label: "执行检查。" })],
    }),
    outputs: defineSkillOutputs({ items: ["检查结论"] }),
    tools: [KnownTool.Read, { kind: "mcp", server: "fixture", tool: "lookup" }, KnownTool.Grep],
    procedures: [defineProcedureUse({ id: procedure.id })],
    references: [
      defineReference({
        id: "fixture-ref",
        source: pathToFileURL(skillReference),
        title: "Fixture | Ref",
        summary: "fixture summary\nwith detail",
        loadWhen: "需要参考 | 样例时",
      }),
    ],
    assets: [
      defineAsset({
        id: "fixture-asset",
        source: pathToFileURL(skillAsset),
      }),
    ],
  });

  const agent = defineAgent({
    id: "fixture-agent",
    description: "Fixture agent used for build tests.",
    role: "你是 fixture agent。",
    platforms: [ComponentPlatform.Claude, ComponentPlatform.Codex],
    tools: [KnownTool.Bash, { kind: "mcp", server: "fixture", tool: "agent" }, KnownTool.Read],
    bashBoundary: ["禁止执行破坏性命令。"],
    qualityStandards: ["输出必须可复现。"],
    outputFormat: defineAgentOutputFormat({
      kind: "markdown",
      title: "Fixture Report",
      sections: [
        defineAgentOutputSection({
          title: "Summary",
          body: "done",
        }),
      ],
    }),
    workflow: defineWorkflow({
      steps: [defineWorkflowStep({ id: "analyze", label: "分析" })],
      gates: [defineWorkflowGate({ id: "gate-check", skill: skill.id, label: "门禁", checks: "检查证据" })],
      routes: [defineWorkflowRoute({ id: "route-a", triggers: ["需要技能"], skill: skill.id, checks: "路由检查", output: "产出结果" })],
      finalSteps: [defineWorkflowStep({ id: "finalize", label: "收尾" })],
    }),
    skills: [{ id: skill.id, mode: SkillUseMode.Route, reason: "fixture routing" }],
    sandbox: AgentSandbox.WorkspaceWrite,
    model: "sonnet",
    reasoningEffort: "high",
  });

  const hook = defineHook({
    id: "fixture-hook",
    description: "fixture hook",
    platforms: [ComponentPlatform.Claude, ComponentPlatform.Codex],
    event: HookEvent.UserPromptSubmit,
    entry: pathToFileURL(hookEntry),
    order: 10,
    timeoutSeconds: 12,
    statusMessage: "running fixture hook",
  });

  const instruction = defineInstruction({
    id: "fixture-instruction",
    title: "Fixture Instruction",
    platforms: [ComponentPlatform.Claude, ComponentPlatform.Codex],
    body: pathToFileURL(instructionBody),
  });

  const registry: ComponentRegistry = {
    version: 1,
    instructions: [instruction],
    procedures: [procedure],
    skills: [skill],
    agents: [agent],
    hooks: [hook],
  };
  return { root, procedure, skill, agent, hook, instruction, registry };
}

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
        short_description: fixture.skill.description,
      },
      policy: {
        allow_implicit_invocation: false,
      },
    });
    const claudeSkill = renderSkillMd(fixture.skill, Platform.Claude, procedureMap);
    expect(claudeSkill).toContain("  - mcp__fixture__lookup");
    expect(existsSync(join(codexRoot, "skills", fixture.skill.id, "references", "index.md"))).toBe(true);
    const referenceIndex = readFileSync(join(codexRoot, "skills", fixture.skill.id, "references", "index.md"), "utf-8");
    expect(referenceIndex).toContain("Fixture \\| Ref");
    expect(referenceIndex).toContain("fixture summary<br>with detail");
    expect(referenceIndex).toContain("需要参考 \\| 样例时");
  });

  test("registry procedure validation enforces owner/runtime/id constraints", () => {
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

    const duplicateSkillPlatformRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, platforms: [ComponentPlatform.Claude, ComponentPlatform.Claude] }],
    };
    expect(() => validateRegistry(duplicateSkillPlatformRegistry)).toThrow(
      "Skill fixture-skill platforms contain duplicate platform(s): claude-code",
    );

    const missingSkillWorkflowRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, workflow: undefined as any }],
    };
    expect(() => validateRegistry(missingSkillWorkflowRegistry)).toThrow("Skill fixture-skill must define workflow");

    const invalidSkillRegexToolRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, tools: [{ kind: "regex", source: "Read|Grep" }] }],
    };
    expect(() => validateRegistry(invalidSkillRegexToolRegistry)).toThrow(
      "Skill fixture-skill tools[0] must not use regex matcher",
    );

    const missingSkillAssetRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        assets: [
          defineAsset({
            id: "missing-asset",
            source: pathToFileURL(join(fixture.root, "skill", "assets", "missing.txt")),
          }),
        ],
      }],
    };
    expect(() => validateRegistry(missingSkillAssetRegistry)).toThrow("Skill fixture-skill asset is missing");

    const invalidSkillAssetTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        assets: [
          defineAsset({
            id: "bad-asset-target",
            source: pathToFileURL(join(fixture.root, "skill", "assets", "asset.txt")),
            target: "../asset.txt",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(invalidSkillAssetTargetRegistry)).toThrow(
      "Skill fixture-skill asset bad-asset-target target must stay under assets/",
    );

    const invalidInstructionPlatformRegistry: ComponentRegistry = {
      ...fixture.registry,
      instructions: [{ ...fixture.instruction, platforms: ["unsupported-instruction-cli"] as any }],
    };
    expect(() => validateRegistry(invalidInstructionPlatformRegistry)).toThrow(
      "Instruction fixture-instruction platforms contain unsupported platform(s): unsupported-instruction-cli",
    );

    const invalidAgentPlatformRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{ ...fixture.agent, platforms: ["unsupported-agent-cli"] as any }],
    };
    expect(() => validateRegistry(invalidAgentPlatformRegistry)).toThrow(
      "Agent fixture-agent platforms contain unsupported platform(s): unsupported-agent-cli",
    );

    const missingAgentWorkflowRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{ ...fixture.agent, workflow: undefined as any }],
    };
    expect(() => validateRegistry(missingAgentWorkflowRegistry)).toThrow("Agent fixture-agent must define workflow");

    const invalidAgentRegexToolRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{ ...fixture.agent, tools: [{ kind: "regex", source: "Read|Grep" }] }],
    };
    expect(() => validateRegistry(invalidAgentRegexToolRegistry)).toThrow(
      "Agent fixture-agent tools[0] must not use regex matcher",
    );

    const invalidHookPlatformRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{ ...fixture.hook, platforms: ["unsupported-hook-cli"] as any }],
    };
    expect(() => validateRegistry(invalidHookPlatformRegistry)).toThrow(
      "Hook fixture-hook platforms contain unsupported platform(s): unsupported-hook-cli",
    );

    const codexUnsupportedHookEventRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{
        ...fixture.hook,
        platforms: [ComponentPlatform.Codex],
        event: HookEvent.PreCompact,
      }],
    };
    expect(() => validateRegistry(codexUnsupportedHookEventRegistry)).toThrow(
      "Hook fixture-hook event PreCompact is unavailable on platform: codex-cli",
    );

    const invalidHookMatcherRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{ ...fixture.hook, matcher: [KnownTool.Read] }],
    };
    expect(() => validateRegistry(invalidHookMatcherRegistry)).toThrow(
      "Hook fixture-hook defines matcher for UserPromptSubmit",
    );

    const disabledInvocationRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, invocation: InvocationPolicy.Disabled }],
    };
    expect(() => validateRegistry(disabledInvocationRegistry)).toThrow("unsupported disabled invocation policy");

    const codexModelOnlyInvocationRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, invocation: InvocationPolicy.ModelOnly }],
    };
    expect(() => validateRegistry(codexModelOnlyInvocationRegistry)).toThrow(
      "model-only invocation on Codex",
    );

    const claudeModelOnlyInvocationRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, invocation: InvocationPolicy.ModelOnly, platforms: [ComponentPlatform.Claude] }],
      agents: [{ ...fixture.agent, platforms: [ComponentPlatform.Claude] }],
      hooks: [{ ...fixture.hook, platforms: [ComponentPlatform.Claude] }],
    };
    expect(() => validateRegistry(claudeModelOnlyInvocationRegistry)).not.toThrow();

    const crossPlatformAgentWithClaudeOnlySkillRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, platforms: [ComponentPlatform.Claude] }],
      agents: [{
        ...fixture.agent,
        workflow: defineWorkflow({
          steps: [defineWorkflowStep({ id: "shared-platform-check", label: "检查共享平台。" })],
        }),
        skills: [{ id: fixture.skill.id, mode: SkillUseMode.Route, reason: "fixture routing" }],
      }],
    };
    expect(() => validateRegistry(crossPlatformAgentWithClaudeOnlySkillRegistry)).not.toThrow();

    const codexOnlyAgentWithClaudeOnlySkillRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, platforms: [ComponentPlatform.Claude] }],
      agents: [{
        ...fixture.agent,
        platforms: [ComponentPlatform.Codex],
        workflow: defineWorkflow({
          steps: [defineWorkflowStep({ id: "shared-platform-check", label: "检查共享平台。" })],
        }),
        skills: [{ id: fixture.skill.id, mode: SkillUseMode.Route, reason: "fixture routing" }],
      }],
    };
    expect(() => validateRegistry(codexOnlyAgentWithClaudeOnlySkillRegistry)).toThrow(
      "references skill fixture-skill without a shared platform",
    );

    const codexAgentWorkflowWithClaudeOnlySkillRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, platforms: [ComponentPlatform.Claude] }],
      agents: [{
        ...fixture.agent,
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
        skills: [],
      }],
    };
    expect(() => validateRegistry(codexAgentWorkflowWithClaudeOnlySkillRegistry)).toThrow(
      "workflow gate references skill fixture-skill unavailable on platform(s): codex-cli",
    );

    const codexAgentRouteWithClaudeOnlySkillRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, platforms: [ComponentPlatform.Claude] }],
      agents: [{
        ...fixture.agent,
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
        skills: [],
      }],
    };
    expect(() => validateRegistry(codexAgentRouteWithClaudeOnlySkillRegistry)).toThrow(
      "workflow route references skill fixture-skill unavailable on platform(s): codex-cli",
    );

    const agentWorkflowMissingDeclaredSkillRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{
        ...fixture.agent,
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
        skills: [],
      }],
    };
    expect(() => validateRegistry(agentWorkflowMissingDeclaredSkillRegistry)).toThrow(
      "Agent fixture-agent workflow references skill fixture-skill but agent.skills does not include it",
    );

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
      "skill fixture-skill references procedure fixture-procedure unavailable on platform(s): codex-cli",
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

    const duplicateRelatedSkillRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        relatedSkills: [
          { id: "other-skill", reason: "first route" },
          { id: "other-skill", reason: "duplicate route" },
        ],
      }],
    };
    expect(() => validateRegistry(duplicateRelatedSkillRegistry)).toThrow("references missing related skill");

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
    expect(() =>
      validateRegistry({
        ...fixture.registry,
        procedures: [],
        skills: [{
          ...fixture.skill,
          procedures: [],
          relatedSkills: [{ id: claudeOnlySkill.id, reason: "Claude-only route" }],
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
            { id: otherSkill.id, reason: "first route" },
            { id: otherSkill.id, reason: "duplicate route" },
          ],
        }, otherSkill],
      })
    ).toThrow("duplicate related skill entry: other-skill");

  });

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
    expect(skillMd).toContain("调用目的");
    expect(skillMd).toContain("参数");
    expect(skillMd).toContain("返回值");
    expect(skillMd).toContain("用于 fixture 场景校验");

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

    expect(() => procedureUse(debugMethodologyDebugChecklist)).not.toThrow();
    expect(() =>
      procedureUse({
        ...debugMethodologyDebugChecklist,
        id: "missing-procedure-id",
      })
    ).toThrow("Unknown component procedure id");
  });

  test("agent helpers validate and emit claude/codex agents", async () => {
    const fixture = createFixture();
    expect(hasStringTool(fixture.agent, "Bash")).toBe(true);
    expect(validateAgentBashBoundary(fixture.agent).length).toBe(1);
    expect(validateAgentQualityStandards(fixture.agent).length).toBe(1);
    expect(validateAgentOutputFormat(fixture.agent)?.kind).toBe("markdown");
    expect(validateAgentWorkflow(fixture.agent)?.routes?.length).toBe(1);
    expect(() => validateAgentBashBoundary({ ...fixture.agent, bashBoundary: [] })).toThrow();
    expect(() => validateAgentQualityStandards({ ...fixture.agent, qualityStandards: [] })).toThrow();
    expect(() => validateAgentOutputFormat({ ...fixture.agent, outputFormat: { kind: "raw", body: "" } })).toThrow();
    expect(() => validateAgentWorkflow({ ...fixture.agent, workflow: { steps: [] } })).toThrow();
    expect(() =>
      validateAgentWorkflow({
        ...fixture.agent,
        workflow: defineWorkflow({
          steps: [defineWorkflowStep({ id: "BadStep", label: "invalid id" })],
        }),
      })
    ).toThrow("workflow.steps[0].id must use lowercase kebab-case");
    expect(() => validateRegistry({
      ...fixture.registry,
      agents: [{ ...fixture.agent, inputs: [defineAgentInput({ name: "", description: "missing name" })] }],
    })).toThrow("inputs[0].name");

    const out = createTempDir("ai-experts-agent-out-");
    await emitAgent(fixture.agent, out, Platform.Claude);
    await emitAgent(fixture.agent, out, Platform.Codex);
    const claudeAgent = readFileSync(join(out, "agents", "fixture-agent.md"), "utf-8");
    expect(claudeAgent).toContain("## Bash 使用边界");
    expect(claudeAgent).toContain("tools: Bash, mcp__fixture__agent, Read");
    const codexAgent = readFileSync(join(out, "agents", "fixture-agent.toml"), "utf-8");
    expect(codexAgent).toContain("developer_instructions");
    expect(codexAgent).toContain("~/.agents/skills/fixture-skill/SKILL.md");

    await emitAgent(fixture.agent, out, Platform.Codex, new Set());
    const filteredCodexAgent = readFileSync(join(out, "agents", "fixture-agent.toml"), "utf-8");
    expect(filteredCodexAgent).not.toContain("~/.agents/skills/fixture-skill/SKILL.md");
  });

  test("agent output formats render structured json and file sets", async () => {
    const fixture = createFixture();
    const out = createTempDir("ai-experts-agent-output-");
    const jsonAgent = defineAgent({
      ...fixture.agent,
      id: "json-agent",
      outputFormat: defineAgentOutputFormat({
        kind: "json",
        example: {
          ok: true,
          count: 2,
          items: ["alpha", "beta"],
        },
        notes: ["省略不可验证的字段。"],
      }),
    });
    const fileSetAgent = defineAgent({
      ...fixture.agent,
      id: "file-set-agent",
      outputFormat: defineAgentOutputFormat({
        kind: "file-set",
        introduction: "写入文件结构：",
        files: ["report.md", "evidence/", "  trace.md"],
        templates: [
          defineAgentOutputTemplate({
            intro: "报告使用以下结构：",
            title: "报告：<scope>",
            sections: [
              defineAgentOutputSection({
                title: "摘要",
                body: "[关键结论]",
              }),
            ],
          }),
        ],
        notes: ["文件名按实际 scope 调整。"],
      }),
    });

    expect(validateAgentOutputFormat(jsonAgent)?.kind).toBe("json");
    expect(validateAgentOutputFormat(fileSetAgent)?.kind).toBe("file-set");
    await emitAgent(jsonAgent, out, Platform.Claude);
    await emitAgent(fileSetAgent, out, Platform.Claude);
    const jsonAgentBody = readFileSync(join(out, "agents", "json-agent.md"), "utf-8");
    const fileSetAgentBody = readFileSync(join(out, "agents", "file-set-agent.md"), "utf-8");

    expect(jsonAgentBody).toContain("```json\n{\n  \"ok\": true,");
    expect(jsonAgentBody).toContain("省略不可验证的字段。");
    expect(fileSetAgentBody).toContain("```\nreport.md\nevidence/\n  trace.md\n```");
    expect(fileSetAgentBody).toContain("# 报告：<scope>");
    expect(fileSetAgentBody).toContain("## 摘要");
  });

  test("hook compiler and renderer produce runtime config", async () => {
    const fixture = createFixture();
    const hooksOut = createTempDir("ai-experts-hooks-out-");
    const manifest = await compileHookModules([fixture.hook], hooksOut, Platform.Codex);
    expect(manifest[0]?.id).toBe("fixture-hook");
    expect(existsSync(join(hooksOut, "dispatch.mjs"))).toBe(true);

    const output = execFileSync(
      process.execPath,
      [join(hooksOut, "dispatch.mjs"), "--event", "UserPromptSubmit"],
      {
        input: JSON.stringify({ prompt: "normal prompt", tool_name: "Read", tool_input: {} }),
        encoding: "utf-8",
      },
    );
    expect(output).toContain("fixture context");

    const denyOutput = execFileSync(
      process.execPath,
      [join(hooksOut, "dispatch.mjs"), "--event", "UserPromptSubmit"],
      {
        input: JSON.stringify({ prompt: "please deny", tool_name: "Read", tool_input: {} }),
        encoding: "utf-8",
      },
    );
    expect(denyOutput).toContain("\"decision\": \"block\"");

    const permissionDenyHook = defineHook({
      id: "fixture-permission-deny-hook",
      description: "permission deny fixture hook",
      platforms: [ComponentPlatform.Codex],
      event: HookEvent.PermissionRequest,
      entry: fixture.hook.entry,
      matcher: [KnownTool.Bash],
      order: 10,
    });
    const permissionDenyOut = createTempDir("ai-experts-hooks-permission-deny-");
    await compileHookModules([permissionDenyHook], permissionDenyOut, Platform.Codex);
    const permissionDenyOutput = execFileSync(
      process.execPath,
      [join(permissionDenyOut, "dispatch.mjs"), "--event", "PermissionRequest"],
      {
        input: JSON.stringify({ prompt: "please deny", tool_name: "Bash", tool_input: { command: "npm install" } }),
        encoding: "utf-8",
      },
    );
    expect(JSON.parse(permissionDenyOutput)).toEqual({
      hookSpecificOutput: {
        hookEventName: "PermissionRequest",
        decision: {
          behavior: "deny",
          message: "blocked by fixture",
        },
      },
    });

    const allowHookEntry = join(fixture.root, "permission-allow-hook.ts");
    writeText(
      allowHookEntry,
      [
        "export async function run() {",
        "  return { kind: 'allow' };",
        "}",
        "",
      ].join("\n"),
    );
    const permissionAllowHook = defineHook({
      id: "fixture-permission-allow-hook",
      description: "permission allow fixture hook",
      platforms: [ComponentPlatform.Codex],
      event: HookEvent.PermissionRequest,
      entry: pathToFileURL(allowHookEntry),
      matcher: [KnownTool.Bash],
      order: 10,
    });
    const permissionAllowOut = createTempDir("ai-experts-hooks-permission-allow-");
    await compileHookModules([permissionAllowHook], permissionAllowOut, Platform.Codex);
    const permissionAllowOutput = execFileSync(
      process.execPath,
      [join(permissionAllowOut, "dispatch.mjs"), "--event", "PermissionRequest"],
      {
        input: JSON.stringify({ tool_name: "Bash", tool_input: { command: "npm test" } }),
        encoding: "utf-8",
      },
    );
    expect(JSON.parse(permissionAllowOutput)).toEqual({
      hookSpecificOutput: {
        hookEventName: "PermissionRequest",
        decision: { behavior: "allow" },
      },
    });

    const nativeDecisionHookEntry = join(fixture.root, "native-decision-hook.ts");
    writeText(
      nativeDecisionHookEntry,
      [
        "export async function run() {",
        "  return {",
        "    hookSpecificOutput: {",
        "      hookEventName: 'PreToolUse',",
        "      permissionDecision: 'deny',",
        "      permissionDecisionReason: 'native deny reason',",
        "    },",
        "  };",
        "}",
        "",
      ].join("\n"),
    );
    const nativeDecisionHook = defineHook({
      id: "fixture-native-decision-hook",
      description: "native decision fixture hook",
      platforms: [ComponentPlatform.Codex],
      event: HookEvent.PreToolUse,
      entry: pathToFileURL(nativeDecisionHookEntry),
      matcher: [KnownTool.Bash],
      order: 10,
    });
    const nativeDecisionOut = createTempDir("ai-experts-hooks-native-decision-");
    await compileHookModules([nativeDecisionHook], nativeDecisionOut, Platform.Codex);
    const nativeDecisionOutput = execFileSync(
      process.execPath,
      [join(nativeDecisionOut, "dispatch.mjs"), "--event", "PreToolUse"],
      {
        input: JSON.stringify({ tool_name: "Bash", tool_input: { command: "npm install" } }),
        encoding: "utf-8",
      },
    );
    expect(JSON.parse(nativeDecisionOutput)).toEqual({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "native deny reason",
      },
    });

    const config = renderHookConfig([fixture.hook], Platform.Codex);
    expect(config.hooks.UserPromptSubmit[0]?.hooks[0]?.statusMessage).toBe("running fixture hook");
    const hookCommand = config.hooks.UserPromptSubmit[0]?.hooks[0]?.command ?? "";
    expect(hookCommand).toContain("$HOME/.codex/hooks/dispatch.mjs");
    expect(hookCommand).not.toContain("--platform");
    expect(hookCommand).not.toContain(":-");

    const firstToolHook = defineHook({
      id: "fixture-first-tool-hook",
      description: "first fixture tool hook",
      platforms: [ComponentPlatform.Claude, ComponentPlatform.Codex],
      event: HookEvent.PreToolUse,
      entry: fixture.hook.entry,
      matcher: [KnownTool.Read],
      order: 10,
      timeoutSeconds: 12,
      statusMessage: "running fixture hook",
    });
    const secondHook = defineHook({
      id: "fixture-second-hook",
      description: "second fixture hook",
      platforms: [ComponentPlatform.Claude, ComponentPlatform.Codex],
      event: HookEvent.PreToolUse,
      entry: fixture.hook.entry,
      matcher: [KnownTool.Read],
      order: 20,
      timeoutSeconds: 7,
      statusMessage: "running second fixture hook",
    });
    const defaultTimeoutHook = defineHook({
      id: "fixture-default-timeout-hook",
      description: "default timeout fixture hook",
      platforms: [ComponentPlatform.Claude, ComponentPlatform.Codex],
      event: HookEvent.PreToolUse,
      entry: fixture.hook.entry,
      matcher: [KnownTool.Read],
      order: 30,
    });
    const defaultOnlyConfig = renderHookConfig([defaultTimeoutHook], Platform.Claude);
    expect(defaultOnlyConfig.hooks.PreToolUse[0]?.hooks[0]?.timeout).toBe(
      DEFAULT_COMMAND_HOOK_TIMEOUT_SECONDS,
    );

    const groupedConfig = renderHookConfig([firstToolHook, secondHook, defaultTimeoutHook], Platform.Codex);
    expect(groupedConfig.hooks.PreToolUse).toHaveLength(1);
    expect(groupedConfig.hooks.PreToolUse[0]?.hooks[0]?.timeout).toBe(
      19 + DEFAULT_COMMAND_HOOK_TIMEOUT_SECONDS,
    );
    expect(groupedConfig.hooks.PreToolUse[0]?.hooks[0]?.statusMessage).toBeUndefined();

    expect(renderCodexConfig()).toContain("codex_hooks = true");
  });

  test("hook dispatcher fans out patch file targets to single-file hook payloads", async () => {
    const root = createTempDir("ai-experts-hooks-fanout-");
    const hookEntry = join(root, "fanout-hook.ts");
    writeText(
      hookEntry,
      [
        "export async function run(payload) {",
        "  const filePath = payload?.tool?.input?.file_path;",
        "  if (!filePath) return null;",
        "  return { kind: 'report', message: `target=${filePath}; targets=${(payload.tool.fileTargets || []).join(',')}` };",
        "}",
        "",
      ].join("\n"),
    );

    const hook = defineHook({
      id: "fixture-fanout-hook",
      description: "fanout fixture hook",
      platforms: [ComponentPlatform.Claude, ComponentPlatform.Codex],
      event: HookEvent.PreToolUse,
      entry: pathToFileURL(hookEntry),
      matcher: [KnownTool.ApplyPatch],
      order: 10,
    });
    const hooksOut = createTempDir("ai-experts-hooks-fanout-out-");
    await compileHookModules([hook], hooksOut, Platform.Codex);

    const output = execFileSync(
      process.execPath,
      [join(hooksOut, "dispatch.mjs"), "--event", "PreToolUse"],
      {
        input: JSON.stringify({
          tool_name: "apply_patch",
          tool_input: {
            command: [
              "*** Begin Patch",
              "*** Add File: .env",
              "+API_KEY=test",
              "*** Update File: src/app.ts",
              "*** Move to: src/app.config.ts",
              "@@",
              "+const value = 1;",
              "*** End Patch",
            ].join("\n"),
          },
        }),
        encoding: "utf-8",
      },
    );

    expect(output).toContain("target=.env; targets=.env");
    expect(output).toContain("target=src/app.ts; targets=src/app.ts");
    expect(output).toContain("target=src/app.config.ts; targets=src/app.config.ts");
  });

  test("platform renderer validates and emits platform outputs", async () => {
    const fixture = createFixture();
    expect(() => validateId("bad_id", "skill")).toThrow();
    const surface = validateRegistry(fixture.registry);
    expect(surface.skills.length).toBe(1);
    expect(renderInstruction(surface, Platform.Claude)).not.toContain("可用能力索引");
    const codexInstruction = renderInstruction(surface, Platform.Codex);
    expect(codexInstruction).toContain("Agent 索引");
    expect(codexInstruction).toContain("fixture-agent");
    expect(codexInstruction).not.toContain("Skill 索引");
    expect(codexInstruction).not.toContain("fixture-skill");

    const out = createTempDir("ai-experts-platform-out-");
    await emitPlatform(surface, out, Platform.Claude);
    await emitPlatform(surface, out, Platform.Codex);
    expect(existsSync(join(out, "claude", "manifest.json"))).toBe(true);
    expect(existsSync(join(out, "codex", "hooks.json"))).toBe(true);
  });

  test("main supports help path and wrapper build.ts delegates errors", async () => {
    const argvBackup = process.argv.slice();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    process.argv = ["node", "build.ts", "--help"];
    try {
      await main();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Usage: tsx src/build.ts"));

      process.argv = ["node", "build.ts", "--check"];
      await main();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("component build: claude skills="));
      expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/procedures=\d+ codex skills=\d+/));
      expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/codex skills=\d+ agents=\d+ hooks=\d+ procedures=\d+ out=/));
    } finally {
      process.argv = argvBackup;
    }

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.resetModules();
    vi.doMock("../../src/build/main.ts", () => ({ main: vi.fn().mockRejectedValue(new Error("fixture boom")) }));
    // @ts-expect-error Vite query import is used to force a fresh wrapper module instance.
    await import("../../src/build.ts?case=error-stack");
    await new Promise((resolve) => setTimeout(resolve, 0));

    vi.resetModules();
    vi.doMock("../../src/build/main.ts", () => ({ main: vi.fn().mockRejectedValue({ message: "fixture message" }) }));
    // @ts-expect-error Vite query import is used to force a fresh wrapper module instance.
    await import("../../src/build.ts?case=error-message");
    await new Promise((resolve) => setTimeout(resolve, 0));

    vi.resetModules();
    vi.doMock("../../src/build/main.ts", () => ({ main: vi.fn().mockRejectedValue("fixture raw") }));
    // @ts-expect-error Vite query import is used to force a fresh wrapper module instance.
    await import("../../src/build.ts?case=error-raw");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("component build failed"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
