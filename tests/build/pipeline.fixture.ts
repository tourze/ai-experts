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

const tempDirs: string[] = [];

export function createTempDir(prefix: string): string {
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

export function createFixture() {
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
    checklist: ["输出是否包含可核查证据和真实验证结果？"],
    antiPatterns: [{ fail: "直接跳过验证。", pass: "执行并验证输出。" }],
    invocation: InvocationPolicy.ExplicitOnly,
    platforms: [ComponentPlatform.Claude, ComponentPlatform.Codex],
    sourceDir: pathToFileURL(`${skillRoot}/`),
    workflow: defineWorkflow({
      steps: [defineWorkflowStep({ id: "inspect", label: "执行检查。" })],
    }),
    outputs: defineSkillOutputs({ items: ["检查结论、证据文件和真实命令结果。"] }),
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
    qualityStandards: ["输出必须包含可复现证据。"],
    outputFormat: defineAgentOutputFormat({
      kind: "markdown",
      title: "Fixture Report",
      sections: [
        defineAgentOutputSection({
          title: "Summary",
          body: "done with evidence",
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
