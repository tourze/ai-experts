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

describe("build/pipeline registry agent and hook validation", () => {
  test("registry agent and hook validation enforces platform/tool/matcher constraints", () => {
    const fixture = createFixture();
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

    const invalidAgentMcpServerRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{ ...fixture.agent, tools: [{ kind: "mcp", server: "" } as any] }],
    };
    expect(() => validateRegistry(invalidAgentMcpServerRegistry)).toThrow(
      "Agent fixture-agent tools[0] mcp.server must be a non-empty string",
    );

    const invalidAgentMcpToolRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{ ...fixture.agent, tools: [{ kind: "mcp", server: "fixture", tool: "   " } as any] }],
    };
    expect(() => validateRegistry(invalidAgentMcpToolRegistry)).toThrow(
      "Agent fixture-agent tools[0] mcp.tool must be a non-empty string when defined",
    );

    const invalidAgentMcpToolWhitespaceRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{ ...fixture.agent, tools: [{ kind: "mcp", server: "fixture", tool: "bad tool" } as any] }],
    };
    expect(() => validateRegistry(invalidAgentMcpToolWhitespaceRegistry)).toThrow(
      "Agent fixture-agent tools[0] mcp.tool must not contain whitespace",
    );

    const invalidAgentMcpToolDelimiterRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{ ...fixture.agent, tools: [{ kind: "mcp", server: "fixture", tool: "bad__tool" } as any] }],
    };
    expect(() => validateRegistry(invalidAgentMcpToolDelimiterRegistry)).toThrow(
      "Agent fixture-agent tools[0] mcp.tool must not contain \"__\"",
    );

    const invalidAgentMcpServerPathRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{ ...fixture.agent, tools: [{ kind: "mcp", server: "github/github-mcp-server", tool: "issue_write" }] }],
    };
    expect(() => validateRegistry(invalidAgentMcpServerPathRegistry)).toThrow(
      "Agent fixture-agent tools[0] mcp.server must not contain path separators",
    );

    const invalidAgentMatcherKindRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{ ...fixture.agent, tools: [{ kind: "unknown" } as any] }],
    };
    expect(() => validateRegistry(invalidAgentMatcherKindRegistry)).toThrow(
      "Agent fixture-agent tools[0] uses unsupported matcher kind: unknown",
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

    const sessionStartMatcherRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{ ...fixture.hook, event: HookEvent.SessionStart, matcher: ["startup|resume"] }],
    };
    expect(() => validateRegistry(sessionStartMatcherRegistry)).not.toThrow();

    const claudePreCompactMatcherRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{
        ...fixture.hook,
        platforms: [ComponentPlatform.Claude],
        event: HookEvent.PreCompact,
        matcher: ["manual|auto"],
      }],
    };
    expect(() => validateRegistry(claudePreCompactMatcherRegistry)).not.toThrow();

    const invalidSessionStartMcpMatcherRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{
        ...fixture.hook,
        event: HookEvent.SessionStart,
        matcher: [{ kind: "mcp", server: "memory", tool: "read" }],
      }],
    };
    expect(() => validateRegistry(invalidSessionStartMcpMatcherRegistry)).toThrow(
      "mcp matcher is only supported for tool events",
    );

    const invalidHookMcpServerRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{
        ...fixture.hook,
        event: HookEvent.PermissionRequest,
        matcher: [{ kind: "mcp", server: "", tool: "read" } as any],
      }],
    };
    expect(() => validateRegistry(invalidHookMcpServerRegistry)).toThrow(
      "Hook fixture-hook matcher[0] mcp.server must be a non-empty string",
    );

    const invalidHookMcpToolRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{
        ...fixture.hook,
        event: HookEvent.PermissionRequest,
        matcher: [{ kind: "mcp", server: "fixture", tool: "   " } as any],
      }],
    };
    expect(() => validateRegistry(invalidHookMcpToolRegistry)).toThrow(
      "Hook fixture-hook matcher[0] mcp.tool must be a non-empty string when defined",
    );

    const invalidHookMcpServerWhitespaceRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{
        ...fixture.hook,
        event: HookEvent.PermissionRequest,
        matcher: [{ kind: "mcp", server: "bad server", tool: "read" } as any],
      }],
    };
    expect(() => validateRegistry(invalidHookMcpServerWhitespaceRegistry)).toThrow(
      "Hook fixture-hook matcher[0] mcp.server must not contain whitespace",
    );

    const invalidHookMcpToolDelimiterRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{
        ...fixture.hook,
        event: HookEvent.PermissionRequest,
        matcher: [{ kind: "mcp", server: "fixture", tool: "bad__tool" } as any],
      }],
    };
    expect(() => validateRegistry(invalidHookMcpToolDelimiterRegistry)).toThrow(
      "Hook fixture-hook matcher[0] mcp.tool must not contain \"__\"",
    );

    const invalidHookRegexSourceRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{
        ...fixture.hook,
        event: HookEvent.PermissionRequest,
        matcher: [{ kind: "regex", source: "  " } as any],
      }],
    };
    expect(() => validateRegistry(invalidHookRegexSourceRegistry)).toThrow(
      "Hook fixture-hook matcher[0] regex.source must be a non-empty string",
    );

    const invalidHookRegexSyntaxRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{
        ...fixture.hook,
        event: HookEvent.PermissionRequest,
        matcher: [{ kind: "regex", source: "[" } as any],
      }],
    };
    expect(() => validateRegistry(invalidHookRegexSyntaxRegistry)).toThrow(
      "Hook fixture-hook matcher[0] regex.source must be a valid regex pattern",
    );

    const invalidHookMatcherKindRegistry: ComponentRegistry = {
      ...fixture.registry,
      hooks: [{
        ...fixture.hook,
        event: HookEvent.PermissionRequest,
        matcher: [{ kind: "unknown" } as any],
      }],
    };
    expect(() => validateRegistry(invalidHookMatcherKindRegistry)).toThrow(
      "Hook fixture-hook matcher[0] uses unsupported matcher kind: unknown",
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

    const duplicateAgentRouteTriggerRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{
        ...fixture.agent,
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
        skills: [{ id: fixture.skill.id, mode: SkillUseMode.Route, reason: "fixture routing" }],
      }],
    };
    expect(() => validateRegistry(duplicateAgentRouteTriggerRegistry)).toThrow(
      "Agent fixture-agent workflow.routes[0] contains duplicate trigger: 需要技能",
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

    const duplicateAgentSkillsRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{
        ...fixture.agent,
        skills: [
          { id: fixture.skill.id, mode: SkillUseMode.Route, reason: "fixture routing" },
          { id: fixture.skill.id, mode: SkillUseMode.Preload, reason: "duplicate fixture routing" },
        ],
      }],
    };
    expect(() => validateRegistry(duplicateAgentSkillsRegistry)).toThrow(
      "Agent fixture-agent contains duplicate skill reference(s): fixture-skill",
    );

    const multilineAgentSkillReasonRegistry: ComponentRegistry = {
      ...fixture.registry,
      agents: [{
        ...fixture.agent,
        skills: [{ id: fixture.skill.id, mode: SkillUseMode.Route, reason: "bad\nreason" }],
      }],
    };
    expect(() => validateRegistry(multilineAgentSkillReasonRegistry)).toThrow(
      "Agent fixture-agent skill fixture-skill reason must be a single line",
    );
  });
});
