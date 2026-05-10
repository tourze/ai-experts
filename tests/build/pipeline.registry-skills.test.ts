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

describe("build/pipeline registry skill validation", () => {
  test("registry skill validation enforces workflow/tool/asset/reference constraints", () => {
    const fixture = createFixture();
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

    const invalidSkillMcpServerRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, tools: [{ kind: "mcp", server: "", tool: "lookup" } as any] }],
    };
    expect(() => validateRegistry(invalidSkillMcpServerRegistry)).toThrow(
      "Skill fixture-skill tools[0] mcp.server must be a non-empty string",
    );

    const invalidSkillMcpToolRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, tools: [{ kind: "mcp", server: "fixture", tool: "   " } as any] }],
    };
    expect(() => validateRegistry(invalidSkillMcpToolRegistry)).toThrow(
      "Skill fixture-skill tools[0] mcp.tool must be a non-empty string when defined",
    );

    const invalidSkillMcpServerWhitespaceRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, tools: [{ kind: "mcp", server: "bad server", tool: "lookup" } as any] }],
    };
    expect(() => validateRegistry(invalidSkillMcpServerWhitespaceRegistry)).toThrow(
      "Skill fixture-skill tools[0] mcp.server must not contain whitespace",
    );

    const invalidSkillMcpServerDelimiterRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, tools: [{ kind: "mcp", server: "bad__server", tool: "lookup" } as any] }],
    };
    expect(() => validateRegistry(invalidSkillMcpServerDelimiterRegistry)).toThrow(
      "Skill fixture-skill tools[0] mcp.server must not contain \"__\"",
    );

    const invalidSkillMatcherKindRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{ ...fixture.skill, tools: [{ kind: "unknown" } as any] }],
    };
    expect(() => validateRegistry(invalidSkillMatcherKindRegistry)).toThrow(
      "Skill fixture-skill tools[0] uses unsupported matcher kind: unknown",
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

    const invalidDirectoryAssetTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        assets: [
          defineAsset({
            id: "bad-directory-asset-target",
            source: pathToFileURL(join(fixture.root, "skill", "assets")),
            target: "assets/archive.md",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(invalidDirectoryAssetTargetRegistry)).toThrow(
      "source is a directory but target looks like a file: assets/archive.md",
    );

    const invalidFileAssetTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        assets: [
          defineAsset({
            id: "bad-file-asset-target",
            source: pathToFileURL(join(fixture.root, "skill", "assets", "asset.txt")),
            target: "assets/archive/",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(invalidFileAssetTargetRegistry)).toThrow(
      "source is a file but target must not end with /: assets/archive/",
    );

    const reservedAssetIndexTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        assets: [
          defineAsset({
            id: "reserved-asset-index-target",
            source: pathToFileURL(join(fixture.root, "skill", "assets", "asset.txt")),
            target: "assets/index.md",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(reservedAssetIndexTargetRegistry)).toThrow(
      "target is reserved: assets/index.md",
    );

    const invalidAssetBackslashTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        assets: [
          defineAsset({
            id: "invalid-asset-backslash-target",
            source: pathToFileURL(join(fixture.root, "skill", "assets", "asset.txt")),
            target: "assets\\windows.txt",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(invalidAssetBackslashTargetRegistry)).toThrow(
      "target must stay under assets/: assets\\windows.txt",
    );

    const invalidDirectoryReferenceTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        references: [
          defineReference({
            id: "bad-directory-reference-target",
            source: pathToFileURL(join(fixture.root, "skill", "references")),
            target: "references/rules.md",
            title: "Bad Directory Ref",
            summary: "invalid directory target",
            loadWhen: "never",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(invalidDirectoryReferenceTargetRegistry)).toThrow(
      "source is a directory but target looks like a file: references/rules.md",
    );

    const invalidFileReferenceTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        references: [
          defineReference({
            id: "bad-file-reference-target",
            source: pathToFileURL(join(fixture.root, "skill", "references", "reference.md")),
            target: "references/reference/",
            title: "Bad File Ref",
            summary: "invalid file target",
            loadWhen: "never",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(invalidFileReferenceTargetRegistry)).toThrow(
      "source is a file but target must not end with /: references/reference/",
    );

    const invalidReferenceTargetRootRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        references: [
          defineReference({
            id: "bad-reference-target-root",
            source: pathToFileURL(join(fixture.root, "skill", "references", "reference.md")),
            target: "assets/reference.md",
            title: "Bad Reference Root",
            summary: "invalid reference target root",
            loadWhen: "never",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(invalidReferenceTargetRootRegistry)).toThrow(
      "target must stay under references/: assets/reference.md",
    );

    const invalidReferenceTargetTraversalRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        references: [
          defineReference({
            id: "bad-reference-target-traversal",
            source: pathToFileURL(join(fixture.root, "skill", "references", "reference.md")),
            target: "references/../reference.md",
            title: "Bad Reference Traversal",
            summary: "invalid reference target traversal",
            loadWhen: "never",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(invalidReferenceTargetTraversalRegistry)).toThrow(
      "target must stay under references/: references/../reference.md",
    );

    const reservedReferenceIndexTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        references: [
          defineReference({
            id: "reserved-reference-index-target",
            source: pathToFileURL(join(fixture.root, "skill", "references", "reference.md")),
            target: "references/index.md",
            title: "Reserved Reference Target",
            summary: "reserved reference target",
            loadWhen: "never",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(reservedReferenceIndexTargetRegistry)).toThrow(
      "target is reserved: references/index.md",
    );

    const duplicateReferenceTargetRegistry: ComponentRegistry = {
      ...fixture.registry,
      skills: [{
        ...fixture.skill,
        references: [
          defineReference({
            id: "duplicate-reference-target-a",
            source: pathToFileURL(join(fixture.root, "skill", "references", "reference.md")),
            target: "references/shared.md",
            title: "Duplicate Reference Target A",
            summary: "duplicate reference target",
            loadWhen: "never",
          }),
          defineReference({
            id: "duplicate-reference-target-b",
            source: pathToFileURL(join(fixture.root, "skill", "references", "reference.md")),
            target: "references/shared.md",
            title: "Duplicate Reference Target B",
            summary: "duplicate reference target",
            loadWhen: "never",
          }),
        ],
      }],
    };
    expect(() => validateRegistry(duplicateReferenceTargetRegistry)).toThrow(
      "Duplicate reference target in fixture-skill: references/shared.md",
    );
  });
});
