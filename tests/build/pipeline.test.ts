import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, test, vi } from "vitest";
import { emitAgent, hasStringTool, validateAgentBashBoundary, validateAgentOutputFormat, validateAgentQualityStandards, validateAgentWorkflow } from "../../src/build/agents.ts";
import { Platform, ensureDir, writeText } from "../../src/build/core.ts";
import { compileHookModules, renderCodexConfig, renderHookConfig } from "../../src/build/hooks.ts";
import { main } from "../../src/build/main.ts";
import { emitPlatform, renderInstruction, validateId, validateRegistry } from "../../src/build/platform.ts";
import { byId, compileRegistry, materializeRegistry } from "../../src/build/registry.ts";
import { emitSkill, renderSkillMd, validateAntiPatterns, validateTextList } from "../../src/build/skills.ts";
import type { ComponentRegistry } from "../../src/build/types.ts";
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
  defineAgentWorkflow,
  defineAgentWorkflowGate,
  defineAgentWorkflowRoute,
  defineAgentWorkflowStep,
  defineAsset,
  defineHook,
  defineAgentInput,
  defineInstruction,
  defineReference,
  defineScript,
  defineScriptUse,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../src/components/sdk.ts";
import { procedureUse, scriptUse } from "../../src/components/procedures/index.ts";

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
  const agentRoot = join(root, "agent");
  const hooksRoot = join(root, "hooks");
  const instructionRoot = join(root, "instruction");
  ensureDir(skillRoot);
  ensureDir(agentRoot);
  ensureDir(hooksRoot);
  ensureDir(instructionRoot);

  const skillBody = join(skillRoot, "SKILL.body.md");
  const skillReference = join(skillRoot, "reference.md");
  const skillAsset = join(skillRoot, "asset.txt");
  writeText(skillBody, "## 步骤\n\n执行检查。\n");
  writeText(skillReference, "# Ref\n");
  writeText(skillAsset, "asset");

  const script = defineScript({
    id: "fixture-script",
    entry: pathToFileURL(join(process.cwd(), "src/components/procedures/sources/debug-methodology/debug-checklist.ts")),
    description: "fixture script",
    owners: { skillIds: ["fixture-skill"] },
    runtime: "node",
  });

  const agentBody = join(agentRoot, "AGENT.body.md");
  writeText(agentBody, "## 执行策略\n\n按流程执行。\n");

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
    body: pathToFileURL(skillBody),
    tools: [KnownTool.Read, KnownTool.Grep],
    scripts: [script.id],
    references: [
      defineReference({
        id: "fixture-ref",
        source: pathToFileURL(skillReference),
        title: "Fixture Ref",
        summary: "fixture summary",
        loadWhen: "需要参考样例时",
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
    body: pathToFileURL(agentBody),
    tools: [KnownTool.Bash, KnownTool.Read],
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
    workflow: defineAgentWorkflow({
      steps: [defineAgentWorkflowStep({ id: "analyze", label: "分析" })],
      gates: [defineAgentWorkflowGate({ id: "gate-check", skill: skill.id, label: "门禁", checks: "检查证据" })],
      routes: [defineAgentWorkflowRoute({ id: "route-a", triggers: ["需要技能"], skill: skill.id, checks: "路由检查", output: "产出结果" })],
      finalSteps: [defineAgentWorkflowStep({ id: "finalize", label: "收尾" })],
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
    matcher: [KnownTool.Read],
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
    scripts: [script],
    skills: [skill],
    agents: [agent],
    hooks: [hook],
  };
  return { root, script, skill, agent, hook, instruction, registry };
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
    const scriptMap = new Map([[fixture.script.id, fixture.script]]);
    expect(renderSkillMd(fixture.skill, Platform.Claude, scriptMap)).toContain("## 适用场景");
    expect(renderSkillMd(fixture.skill, Platform.Codex, scriptMap)).toContain("# Fixture Skill");
    const relatedSkillMd = renderSkillMd(
      {
        ...fixture.skill,
        relatedSkills: [
          { id: "other-skill", reason: "first route" },
          { id: "other-skill", label: "other alias", reason: "duplicate route" },
        ],
      },
      Platform.Claude,
      scriptMap,
    );
    expect(relatedSkillMd.match(/\.\.\/other-skill\/SKILL\.md/g)?.length).toBe(1);
    expect(() => validateTextList({ ...fixture.skill, useCases: [] }, "useCases", "useCase")).toThrow();
    expect(() => validateAntiPatterns({ ...fixture.skill, antiPatterns: [] })).toThrow();

    const structuredSkill = defineSkill({
      ...fixture.skill,
      id: "structured-skill",
      fullName: "Structured Skill",
      body: undefined,
      sourceDir: pathToFileURL(`${fixture.root}/skill/`),
      procedures: [],
      scripts: [],
      goal: defineSkillGoal({ body: "明确流程目标。" }),
      workflow: defineSkillWorkflow({
        steps: [
          "读取输入。",
          "执行检查。",
        ],
      }),
      outputs: defineSkillOutputs({ items: ["结论", "后续动作"] }),
    });
    expect(() => validateRegistry({ ...fixture.registry, skills: [fixture.skill, structuredSkill] })).not.toThrow();
    const structuredRendered = renderSkillMd(structuredSkill, Platform.Claude, scriptMap);
    expect(structuredRendered).toContain("## 目标\n\n明确流程目标。");
    expect(structuredRendered).toContain("## 执行步骤\n\n1. 读取输入。\n2. 执行检查。");
    expect(structuredRendered).toContain("## 输出\n\n- 结论\n- 后续动作");
    expect(() =>
      validateRegistry({
        ...fixture.registry,
        skills: [fixture.skill, {
          ...structuredSkill,
          sourceDir: undefined,
          goal: undefined,
          workflow: undefined,
          outputs: undefined,
        }],
      })
    ).toThrow("must define body or sourceDir");

    const codexRoot = createTempDir("ai-experts-emit-skill-");
    await emitSkill(fixture.skill, codexRoot, Platform.Codex, scriptMap);
    expect(existsSync(join(codexRoot, "skills", fixture.skill.id, "SKILL.md"))).toBe(true);
    expect(existsSync(join(codexRoot, "skills", fixture.skill.id, "agents", "openai.yaml"))).toBe(true);
    expect(existsSync(join(codexRoot, "skills", fixture.skill.id, "references", "index.md"))).toBe(true);
  });

  test("registry procedure validation enforces owner/runtime/id constraints", () => {
    const fixture = createFixture();
    const duplicateScriptRegistry: ComponentRegistry = {
      ...fixture.registry,
      scripts: [fixture.script, { ...fixture.script }],
    };
    expect(() => validateRegistry(duplicateScriptRegistry)).toThrow("Duplicate procedure id");

    const invalidRuntimeRegistry: ComponentRegistry = {
      ...fixture.registry,
      scripts: [{ ...fixture.script, runtime: "python3" as any }],
    };
    expect(() => validateRegistry(invalidRuntimeRegistry)).toThrow("runtime must be node");

    const missingOwnerRegistry: ComponentRegistry = {
      ...fixture.registry,
      scripts: [{ ...fixture.script, owners: { skillIds: ["missing-skill"] } }],
    };
    expect(() => validateRegistry(missingOwnerRegistry)).toThrow("missing owner skill");

    const missingScriptReferenceRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, scripts: ["missing-script"] }],
    };
    expect(() => validateRegistry(missingScriptReferenceRegistry)).toThrow("references missing procedure");

    const duplicateRelatedSkillRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        relatedSkills: [
          { id: "other-skill", reason: "first route" },
          { id: "other-skill", label: "other alias", reason: "duplicate route" },
        ],
      }],
    };
    expect(() => validateRegistry(duplicateRelatedSkillRegistry)).toThrow("references missing related skill");

    const otherSkill = defineSkill({
      ...fixture.skill,
      id: "other-skill",
      fullName: "Other Skill",
      relatedSkills: [],
      scripts: [],
      procedures: [],
    });
    expect(() =>
      validateRegistry({
        ...fixture.registry,
        scripts: [],
        skills: [{
          ...fixture.skill,
          scripts: [],
          procedures: [],
          relatedSkills: [
            { id: otherSkill.id, reason: "first route" },
            { id: otherSkill.id, label: "other alias", reason: "duplicate route" },
          ],
        }, otherSkill],
      })
    ).toThrow("duplicate related skill entry: other-skill");

    const bodyWithMissingSkillLink = join(fixture.root, "skill", "missing-link.body.md");
    writeText(bodyWithMissingSkillLink, "## 步骤\n\n参见 [missing](../missing-skill/SKILL.md)。\n");
    expect(() =>
      validateRegistry({
        ...fixture.registry,
        skills: [{
          ...fixture.skill,
          body: pathToFileURL(bodyWithMissingSkillLink),
        }],
      })
    ).toThrow("markdown link to missing skill: missing-skill");
  });

  test("procedure references support structured links and scripts helper guard", () => {
    const fixture = createFixture();
    const agentScript = defineScript({
      id: "fixture-agent-script",
      entry: fixture.script.entry,
      description: "fixture agent script",
      owners: { agentIds: [fixture.agent.id] },
      runtime: "node",
    });
    const structuredScriptRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        scripts: [
          defineScriptUse({
            id: fixture.script.id,
            reason: "用于 fixture 场景校验",
          }),
        ],
      }],
      scripts: [...fixture.registry.scripts, agentScript],
      agents: [{
        ...fixture.agent,
        scripts: [
          defineScriptUse({
            id: agentScript.id,
            reason: "用于 fixture agent 关联校验",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(structuredScriptRegistry)).not.toThrow();
    const skillMd = renderSkillMd(
      structuredScriptRegistry.skills[0]!,
      Platform.Claude,
      new Map([[fixture.script.id, fixture.script]]),
    );
    expect(skillMd).toContain("调用目的");
    expect(skillMd).toContain("参数");
    expect(skillMd).toContain("返回值");
    expect(skillMd).toContain("用于 fixture 场景校验");

    const duplicateScriptUsesRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        scripts: [
          defineScriptUse({
            id: fixture.script.id,
            useId: "mode-a",
            label: "模式 A",
            exampleArgs: { args: ["--mode", "a"] },
          }),
          defineScriptUse({
            id: fixture.script.id,
            useId: "mode-b",
            label: "模式 B",
            exampleArgs: { args: ["--mode", "b"] },
          }),
        ],
      }],
    };
    expect(() => validateRegistry(duplicateScriptUsesRegistry)).toThrow("Duplicate procedure id in fixture-skill: fixture-script");

    const duplicateScriptUsesWithoutUseIdRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        scripts: [
          defineScriptUse({ id: fixture.script.id, label: "模式 A" }),
          defineScriptUse({ id: fixture.script.id, label: "模式 B" }),
        ],
      }],
    };
    expect(() => validateRegistry(duplicateScriptUsesWithoutUseIdRegistry)).toThrow("Duplicate procedure id in fixture-skill: fixture-script");

    const invalidReasonRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        scripts: [
          defineScriptUse({
            id: fixture.script.id,
            reason: "",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(invalidReasonRegistry)).toThrow("reason must be a non-empty string");

    expect(() => procedureUse("debug-methodology-debug-checklist")).not.toThrow();
    expect(() => scriptUse("debug-methodology-debug-checklist")).not.toThrow();
    expect(() => procedureUse("missing-script-id")).toThrow("Unknown component procedure id");
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
    expect(() => validateRegistry({
      ...fixture.registry,
      agents: [{ ...fixture.agent, inputs: [defineAgentInput({ name: "", description: "missing name" })] }],
    })).toThrow("inputs[0].name");

    const out = createTempDir("ai-experts-agent-out-");
    await emitAgent(fixture.agent, out, Platform.Claude);
    await emitAgent(fixture.agent, out, Platform.Codex);
    expect(readFileSync(join(out, "agents", "fixture-agent.md"), "utf-8")).toContain("## Bash 使用边界");
    expect(readFileSync(join(out, "agents", "fixture-agent.toml"), "utf-8")).toContain("developer_instructions");
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
      [join(hooksOut, "dispatch.mjs"), "--platform", "codex-cli", "--event", "UserPromptSubmit"],
      {
        input: JSON.stringify({ prompt: "normal prompt", tool_name: "Read", tool_input: {} }),
        encoding: "utf-8",
      },
    );
    expect(output).toContain("fixture context");

    const denyOutput = execFileSync(
      process.execPath,
      [join(hooksOut, "dispatch.mjs"), "--platform", "codex-cli", "--event", "UserPromptSubmit"],
      {
        input: JSON.stringify({ prompt: "please deny", tool_name: "Read", tool_input: {} }),
        encoding: "utf-8",
      },
    );
    expect(denyOutput).toContain("\"decision\": \"block\"");

    const config = renderHookConfig([fixture.hook], Platform.Codex);
    expect(config.hooks.UserPromptSubmit[0]?.hooks[0]?.statusMessage).toBe("running fixture hook");
    const hookCommand = config.hooks.UserPromptSubmit[0]?.hooks[0]?.command ?? "";
    expect(hookCommand).toContain("$HOME/.codex/hooks/dispatch.mjs");
    expect(hookCommand).not.toContain(":-");
    expect(renderCodexConfig()).toContain("codex_hooks = true");
  });

  test("platform renderer validates and emits platform outputs", async () => {
    const fixture = createFixture();
    expect(() => validateId("bad_id", "skill")).toThrow();
    const surface = validateRegistry(fixture.registry);
    expect(surface.skills.length).toBe(1);
    expect(renderInstruction(surface, Platform.Claude)).not.toContain("可用能力索引");
    expect(renderInstruction(surface, Platform.Codex)).toContain("可用能力索引");

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
    } finally {
      process.argv = argvBackup;
    }

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.resetModules();
    vi.doMock("../../src/build/main.ts", () => ({ main: vi.fn().mockRejectedValue(new Error("fixture boom")) }));
    await import("../../src/build.ts?case=error-stack");
    await new Promise((resolve) => setTimeout(resolve, 0));

    vi.resetModules();
    vi.doMock("../../src/build/main.ts", () => ({ main: vi.fn().mockRejectedValue({ message: "fixture message" }) }));
    await import("../../src/build.ts?case=error-message");
    await new Promise((resolve) => setTimeout(resolve, 0));

    vi.resetModules();
    vi.doMock("../../src/build/main.ts", () => ({ main: vi.fn().mockRejectedValue("fixture raw") }));
    await import("../../src/build.ts?case=error-raw");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("component build failed"));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
