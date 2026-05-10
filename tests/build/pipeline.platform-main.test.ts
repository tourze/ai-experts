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

describe("build/pipeline platform and main entrypoint", () => {
  test("platform renderer validates and emits platform outputs", async () => {
    const fixture = createFixture();
    expect(() => validateId("bad_id", "skill")).toThrow();
    const surface = validateRegistry(fixture.registry);
    expect(surface.skills.length).toBe(1);
    expect(renderInstruction(surface, Platform.Claude)).not.toContain("可用能力索引");
    const codexInstruction = renderInstruction(surface, Platform.Codex);
    expect(codexInstruction).toContain("Codex Skill 路由补充");
    expect(codexInstruction).toContain("~/.agents/skills/*/SKILL.md");
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
