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

describe("build/pipeline agents and hooks", () => {
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
    expect(() =>
      validateAgentOutputFormat({
        ...fixture.agent,
        outputFormat: {
          kind: "markdown",
          title: "Bad\nTitle",
          sections: [defineAgentOutputSection({ title: "Summary", body: "done" })],
        },
      })
    ).toThrow("outputFormat.title must be a single line");
    const circularExample: any = {};
    circularExample.self = circularExample;
    expect(() =>
      validateAgentOutputFormat({
        ...fixture.agent,
        outputFormat: { kind: "json", example: circularExample },
      })
    ).toThrow("outputFormat.example must be JSON-serializable");
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
    expect(() => validateRegistry({
      ...fixture.registry,
      agents: [{ ...fixture.agent, inputs: [defineAgentInput({ name: "bad name", description: "invalid name" })] }],
    })).toThrow("inputs[0].name must start with a letter");

    const out = createTempDir("ai-experts-agent-out-");
    await emitAgent(fixture.agent, out, Platform.Claude);
    await emitAgent(fixture.agent, out, Platform.Codex);
    const claudeAgent = readFileSync(join(out, "agents", "fixture-agent.md"), "utf-8");
    expect(claudeAgent).toContain("## Bash 使用边界");
    expect(claudeAgent).toContain("tools: Bash, mcp__fixture__agent, Read");
    expect(claudeAgent).toContain("当列出的 skill 与任务相关时，必须显式按该 skill 的工作流执行。");
    const codexAgent = readFileSync(join(out, "agents", "fixture-agent.toml"), "utf-8");
    expect(codexAgent).toContain("developer_instructions");
    expect(codexAgent).toContain("~/.agents/skills/fixture-skill/SKILL.md");
    expect(codexAgent).toContain("当列出的 skill 与任务相关时，必须显式按该 skill 的工作流执行。");

    await emitAgent(fixture.agent, out, Platform.Codex, new Set());
    const filteredCodexAgent = readFileSync(join(out, "agents", "fixture-agent.toml"), "utf-8");
    expect(filteredCodexAgent).not.toContain("~/.agents/skills/fixture-skill/SKILL.md");
    expect(filteredCodexAgent).not.toContain("当列出的 skill 与任务相关时，必须显式按该 skill 的工作流执行。");
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
    expect(() =>
      validateAgentOutputFormat({
        ...fileSetAgent,
        outputFormat: defineAgentOutputFormat({
          kind: "file-set",
          introduction: "写入文件结构：",
          files: ["report.md\nextra.md"],
        }),
      })
    ).toThrow("outputFormat.files[0] must be a single line");
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

    const missingEventValue = spawnSync(process.execPath, [join(hooksOut, "dispatch.mjs"), "--event", "--bad"], {
      input: JSON.stringify({ prompt: "normal prompt" }),
      encoding: "utf-8",
    });
    expect(missingEventValue.status).toBe(1);
    expect(missingEventValue.stderr).toContain("--event requires a value");

    const unknownEvent = spawnSync(process.execPath, [join(hooksOut, "dispatch.mjs"), "--event", "PreToolUse"], {
      input: JSON.stringify({ prompt: "normal prompt" }),
      encoding: "utf-8",
    });
    expect(unknownEvent.status).toBe(1);
    expect(unknownEvent.stderr).toContain("Unknown --event: PreToolUse");

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
    expect(renderCodexConfig()).toContain("[agents]\nmax_depth = 1");
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

});
