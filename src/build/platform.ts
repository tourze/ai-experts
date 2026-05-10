import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import type {
  AgentDefinition,
  HookDefinition,
  InstructionDefinition,
  ProcedureDefinition,
  RelatedSkillDefinition,
  SkillAssetDefinition,
  SkillDefinition,
  ToolMatcher,
} from "../components/sdk";
import { HookEvent } from "../components/sdk";
import {
  collectFiles,
  defaultReferenceTarget,
  displayPath,
  ensureDir,
  InvocationPolicy,
  isSameOrInsidePath,
  Platform,
  readComponentText,
  toAbsolutePath,
  writeText,
} from "./core";
import {
  emitAgent,
  hasStringTool,
  validateAgentBashBoundary,
  validateAgentInputs,
  validateAgentOutputFormat,
  validateAgentQualityStandards,
  validateAgentWorkflow,
} from "./agents";
import { compileHookModules, renderCodexConfig, renderHookConfig } from "./hooks";
import { materializeRegistry } from "./registry";
import { listProcedureUses } from "./procedure-uses";
import type { ResolvedProcedureUse } from "./procedure-uses";
import { emitProcedureRuntime, procedureRuntimeTarget, validateProcedureTarget } from "./procedures";
import {
  emitSkill,
  skillSourceRoot,
  validateAntiPatterns,
  validateParameters,
  validateSkillGoal,
  validateSkillOutputs,
  validateSkillWorkflow,
  validateTextList,
} from "./skills";
import type { ComponentRegistry, ComponentSurface } from "./types";

const manifestSchemaVersion = 5;

export function renderInstruction(componentSurface: ComponentSurface, platform: Platform): string {
  const instructions = componentSurface.instructions
    .filter((instruction) => instruction.platforms.includes(platform))
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || a.id.localeCompare(b.id));
  const body = instructions
    .map((instruction) => readComponentText(instruction.body).trimEnd())
    .join("\n\n");

  if (platform === Platform.Claude) {
    return `${body}\n`;
  }

  type ListedItem = SkillDefinition | AgentDefinition | HookDefinition | InstructionDefinition;
  const describeItem = (item: ListedItem): string => ("description" in item ? item.description : item.title);
  const platformAgents = componentSurface.agents.filter((item) => item.platforms.includes(platform));
  const agentRows = platformAgents.length > 0
    ? platformAgents.map((item) => `- ${item.id}: ${describeItem(item)}`)
    : ["- none"];

  return [
    body,
    "",
    "## Codex Skill 路由补充",
    "",
    "当可用 skill 数量很大时，Codex 可能只在 `skills_instructions` 中注入 skill 名称和路径，省略 description。若无法仅凭注入列表判断是否命中 skill，先用 `rg -n \"description: .*<关键词>|<关键词>\" ~/.agents/skills/*/SKILL.md` 定位候选，再读取候选 `SKILL.md`；在仓库内审计生成物时搜索 `dist/codex/skills/*/SKILL.md`。不要因为列表缺 description 就跳过本地 skill。",
    "",
    "## Agent 索引",
    "",
    "Codex 原生 Skill discovery 会注入可用 Skill 列表；本节只补充当前安装的自定义 Agent，用于需要隔离上下文时选择角色。",
    "",
    ...agentRows,
    "",
  ].join("\n");
}

export function checksumFiles(root: string): Record<string, string> {
  return Object.fromEntries(
    collectFiles(root).map((file) => {
      const hash = createHash("sha256").update(readFileSync(file)).digest("hex");
      return [relative(root, file), hash];
    }),
  );
}

function renderInstallManifest(
  platform: Platform,
  skillIds: readonly string[],
): {
  configRoot: string;
  skillSourceRoot: string;
  skillRoot: string;
  rootEntries: string[];
  skillEntries: string[];
  forbiddenRootEntries: string[];
  forbiddenSkillEntries: string[];
} {
  const isClaude = platform === Platform.Claude;
  return {
    configRoot: isClaude ? "~/.claude" : "~/.codex",
    skillSourceRoot: "skills/",
    skillRoot: isClaude ? "~/.claude/skills" : "~/.agents/skills",
    rootEntries: isClaude
      ? ["CLAUDE.md", "settings.json", "agents/", "hooks/", "procedures.js", "manifest.json"]
      : ["AGENTS.md", "config.toml", "hooks.json", "agents/", "hooks/", "procedures.js", "manifest.json"],
    skillEntries: skillIds.map((skillId) => `${skillId}/`),
    forbiddenRootEntries: isClaude ? [] : ["skills/", "installation_id"],
    forbiddenSkillEntries: isClaude ? [] : [".system/"],
  };
}

export function validateId(id: string, kind: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id)) {
    throw new Error(`Invalid ${kind} id: ${id}`);
  }
}

function validateUniqueProcedureUses(componentId: string, procedureUses: readonly ResolvedProcedureUse[]): void {
  const seenProcedureIds = new Set<string>();
  for (const procedureUse of procedureUses) {
    if (seenProcedureIds.has(procedureUse.id)) {
      throw new Error(`Duplicate procedure id in ${componentId}: ${procedureUse.id}`);
    }
    seenProcedureIds.add(procedureUse.id);
  }
}

const validPlatformValues = new Set<string>(Object.values(Platform));
export const codexSystemSkillIds = ["imagegen", "openai-docs", "plugin-creator", "skill-creator", "skill-installer"] as const;
const codexSystemSkillIdSet = new Set<string>(codexSystemSkillIds);

function validatePlatformList(
  platforms: readonly unknown[] | undefined,
  context: string,
  options: { optional?: boolean } = {},
): void {
  if (platforms === undefined) {
    if (options.optional) return;
    throw new Error(`${context} platforms must be a non-empty platform array`);
  }
  if (!Array.isArray(platforms) || platforms.length === 0) {
    throw new Error(`${context} platforms must be a non-empty platform array`);
  }

  const invalidPlatforms = platforms.filter(
    (platform) => typeof platform !== "string" || !validPlatformValues.has(platform),
  );
  if (invalidPlatforms.length > 0) {
    throw new Error(
      `${context} platforms contain unsupported platform(s): ${invalidPlatforms.map(String).join(", ")}`,
    );
  }

  const duplicatePlatforms = duplicateValues(platforms as string[]);
  if (duplicatePlatforms.length > 0) {
    throw new Error(
      `${context} platforms contain duplicate platform(s): ${duplicatePlatforms.join(", ")}`,
    );
  }
}

function duplicateValues(values: readonly string[]): string[] {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

function validateSingleLineMetadata(context: string, value: string): void {
  if (/\r|\n/u.test(value)) {
    throw new Error(`${context} must be a single line`);
  }
}

function procedureOwnerKey(ownerId: string, procedureId: string): string {
  return `${ownerId}\0${procedureId}`;
}

function validateUniqueProcedureTargetForOwner(
  seenTargets: Map<string, string>,
  procedure: ProcedureDefinition,
  ownerKind: "skill" | "agent",
  ownerId: string,
  target: string,
): void {
  const key = `${ownerKind}\0${ownerId}\0${target}`;
  const existingProcedureId = seenTargets.get(key);
  if (existingProcedureId) {
    throw new Error(
      `Procedure ${procedure.id} target ${target} duplicates procedure ${existingProcedureId} for owner ${ownerKind} ${ownerId}`,
    );
  }
  seenTargets.set(key, procedure.id);
}

function validateAgentSkillPlatform(
  agent: AgentDefinition,
  skillId: string,
  skillsById: ReadonlyMap<string, SkillDefinition>,
  context: string,
): void {
  const skill = skillsById.get(skillId);
  if (!skill) return;
  const missingPlatforms = agent.platforms.filter((platform) => !skill.platforms.includes(platform));
  if (missingPlatforms.length > 0) {
    throw new Error(
      `Agent ${agent.id} ${context} ${skillId} unavailable on platform(s): ${missingPlatforms.join(", ")}`,
    );
  }
}

function validateAgentSkillSharedPlatform(
  agent: AgentDefinition,
  skillId: string,
  skillsById: ReadonlyMap<string, SkillDefinition>,
): void {
  const skill = skillsById.get(skillId);
  if (!skill) return;
  if (agent.platforms.some((platform) => skill.platforms.includes(platform))) return;
  throw new Error(
    `Agent ${agent.id} references skill ${skillId} without a shared platform`,
  );
}

function validateRelatedSkillPlatform(
  skill: SkillDefinition,
  related: RelatedSkillDefinition,
  skillsById: ReadonlyMap<string, SkillDefinition>,
): void {
  const relatedSkill = skillsById.get(related.id);
  if (!relatedSkill) return;
  const relationPlatforms = related.platforms ?? skill.platforms;
  const unsupportedSkillPlatforms = relationPlatforms.filter((platform) => !skill.platforms.includes(platform));
  if (unsupportedSkillPlatforms.length > 0) {
    throw new Error(
      `Skill ${skill.id} related skill ${related.id} applies to unsupported platform(s): ${unsupportedSkillPlatforms.join(", ")}`,
    );
  }
  const missingPlatforms = relationPlatforms.filter((platform) => !relatedSkill.platforms.includes(platform));
  if (missingPlatforms.length > 0) {
    throw new Error(
      `Skill ${skill.id} related skill ${related.id} unavailable on platform(s): ${missingPlatforms.join(", ")}`,
    );
  }
}

function validateSkillWorkflowSkillPlatform(
  skill: SkillDefinition,
  targetSkillId: string,
  skillsById: ReadonlyMap<string, SkillDefinition>,
  context: string,
): void {
  const targetSkill = skillsById.get(targetSkillId);
  if (!targetSkill) return;
  const missingPlatforms = skill.platforms.filter((platform) => !targetSkill.platforms.includes(platform));
  if (missingPlatforms.length > 0) {
    throw new Error(
      `Skill ${skill.id} ${context} ${targetSkillId} unavailable on platform(s): ${missingPlatforms.join(", ")}`,
    );
  }
}

function validateProcedureUsePlatforms(
  component: SkillDefinition | AgentDefinition,
  procedureUse: ResolvedProcedureUse,
  procedure: ProcedureDefinition,
): void {
  const usePlatforms = procedureUse.platforms ?? component.platforms;
  const unsupportedUsePlatforms = usePlatforms.filter((platform) => !component.platforms.includes(platform));
  if (unsupportedUsePlatforms.length > 0) {
    throw new Error(
      `${component.kind} ${component.id} references procedure ${procedureUse.id} for unsupported platform(s): ${unsupportedUsePlatforms.join(", ")}`,
    );
  }

  const procedurePlatforms = procedure.platforms;
  if (!procedurePlatforms) return;
  if (!procedureUse.platforms) {
    throw new Error(
      `${component.kind} ${component.id} references platform-limited procedure ${procedureUse.id} without explicit procedure use platforms`,
    );
  }
  const missingPlatforms = usePlatforms.filter((platform) => !procedurePlatforms.includes(platform));
  if (missingPlatforms.length > 0) {
    throw new Error(
      `${component.kind} ${component.id} references procedure ${procedureUse.id} unavailable on platform(s): ${missingPlatforms.join(", ")}`,
    );
  }
}

function validateProcedureSchema(
  procedure: ProcedureDefinition,
  property: "args" | "output",
): void {
  const schema = procedure[property];
  if (schema === undefined) return;
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    throw new Error(`Procedure ${procedure.id} ${property} schema must be an object when defined`);
  }
  if (typeof schema.typeName !== "string" || schema.typeName.trim() === "") {
    throw new Error(`Procedure ${procedure.id} ${property}.typeName must be a non-empty string`);
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(schema.typeName)) {
    throw new Error(`Procedure ${procedure.id} ${property}.typeName must be a TypeScript identifier`);
  }
  if (!schema.fields || typeof schema.fields !== "object" || Array.isArray(schema.fields)) {
    throw new Error(`Procedure ${procedure.id} ${property}.fields must be an object`);
  }
  for (const [fieldName, field] of Object.entries(schema.fields)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(fieldName)) {
      throw new Error(`Procedure ${procedure.id} ${property}.fields contains invalid field name: ${fieldName}`);
    }
    if (!field || typeof field !== "object" || Array.isArray(field)) {
      throw new Error(`Procedure ${procedure.id} ${property}.fields.${fieldName} must be an object`);
    }
    if (typeof field.type !== "string" || field.type.trim() === "") {
      throw new Error(`Procedure ${procedure.id} ${property}.fields.${fieldName}.type must be a non-empty string`);
    }
    if (typeof field.description !== "string" || field.description.trim() === "") {
      throw new Error(`Procedure ${procedure.id} ${property}.fields.${fieldName}.description must be a non-empty string`);
    }
    if (field.required !== undefined && typeof field.required !== "boolean") {
      throw new Error(`Procedure ${procedure.id} ${property}.fields.${fieldName}.required must be a boolean when defined`);
    }
  }
}

const hookEventsWithToolMatcher = new Set<HookEvent>([
  HookEvent.PermissionRequest,
  HookEvent.PostToolUse,
  HookEvent.PreToolUse,
]);

const codexHookEvents = new Set<HookEvent>([
  HookEvent.PermissionRequest,
  HookEvent.PostToolUse,
  HookEvent.PreToolUse,
  HookEvent.SessionStart,
  HookEvent.Stop,
  HookEvent.UserPromptSubmit,
]);

function validateMcpMatcherPart(
  owner: string,
  property: "server" | "tool",
  value: string,
): void {
  if (/\s/u.test(value)) {
    throw new Error(`${owner} mcp.${property} must not contain whitespace`);
  }
  if (value.includes("__")) {
    throw new Error(`${owner} mcp.${property} must not contain "__"`);
  }
}

function validateHookMatcher(hook: HookDefinition): void {
  if (!hook.matcher || hook.matcher.length === 0) return;
  if (!hookEventsWithToolMatcher.has(hook.event)) {
    throw new Error(
      `Hook ${hook.id} defines matcher for ${hook.event}; matcher is only supported for tool events: ` +
      "PermissionRequest, PostToolUse, PreToolUse",
    );
  }
  for (const [index, matcher] of hook.matcher.entries()) {
    if (typeof matcher === "string") continue;
    if (!matcher || typeof matcher !== "object" || Array.isArray(matcher)) {
      throw new Error(`Hook ${hook.id} matcher[${index}] must be a tool name or matcher object`);
    }
    if (matcher.kind === "mcp") {
      if (typeof matcher.server !== "string" || matcher.server.trim() === "") {
        throw new Error(`Hook ${hook.id} matcher[${index}] mcp.server must be a non-empty string`);
      }
      validateMcpMatcherPart(`Hook ${hook.id} matcher[${index}]`, "server", matcher.server);
      if (matcher.tool !== undefined && (typeof matcher.tool !== "string" || matcher.tool.trim() === "")) {
        throw new Error(`Hook ${hook.id} matcher[${index}] mcp.tool must be a non-empty string when defined`);
      }
      if (typeof matcher.tool === "string") {
        validateMcpMatcherPart(`Hook ${hook.id} matcher[${index}]`, "tool", matcher.tool);
      }
      continue;
    }
    if (matcher.kind === "regex") {
      if (typeof matcher.source !== "string" || matcher.source.trim() === "") {
        throw new Error(`Hook ${hook.id} matcher[${index}] regex.source must be a non-empty string`);
      }
      try {
        // Match runtime behavior: dispatch uses /^(?:<matcher>)$/ for tool-name filtering.
        void new RegExp(`^(?:${matcher.source})$`);
      } catch {
        throw new Error(`Hook ${hook.id} matcher[${index}] regex.source must be a valid regex pattern`);
      }
      continue;
    }
    throw new Error(`Hook ${hook.id} matcher[${index}] uses unsupported matcher kind: ${(matcher as { kind?: unknown }).kind}`);
  }
}

function validateRuntimeToolMatchers(
  component: SkillDefinition | AgentDefinition,
): void {
  const kind = component.kind === "skill" ? "Skill" : "Agent";
  for (const [index, tool] of (component.tools ?? []).entries()) {
    if (typeof tool === "string") continue;
    if (!tool || typeof tool !== "object" || Array.isArray(tool)) {
      throw new Error(`${kind} ${component.id} tools[${index}] must be a tool name or matcher object`);
    }
    const matcher = tool as { kind?: unknown; server?: unknown; tool?: unknown };
    if (matcher.kind === "regex") {
      throw new Error(`${kind} ${component.id} tools[${index}] must not use regex matcher; use a concrete tool name or MCP matcher`);
    }
    if (matcher.kind !== "mcp") {
      throw new Error(`${kind} ${component.id} tools[${index}] uses unsupported matcher kind: ${String(matcher.kind)}`);
    }
    if (typeof matcher.server !== "string" || matcher.server.trim() === "") {
      throw new Error(`${kind} ${component.id} tools[${index}] mcp.server must be a non-empty string`);
    }
    validateMcpMatcherPart(`${kind} ${component.id} tools[${index}]`, "server", matcher.server);
    if (matcher.tool !== undefined && (typeof matcher.tool !== "string" || matcher.tool.trim() === "")) {
      throw new Error(`${kind} ${component.id} tools[${index}] mcp.tool must be a non-empty string when defined`);
    }
    if (typeof matcher.tool === "string") {
      validateMcpMatcherPart(`${kind} ${component.id} tools[${index}]`, "tool", matcher.tool);
    }
  }
}

function defaultAssetTarget(asset: SkillAssetDefinition): string {
  return asset.target ?? `assets/${basename(toAbsolutePath(asset.source))}`;
}

function validateSkillAssets(skill: SkillDefinition): void {
  const seenAssetIds = new Set<string>();
  const seenAssetTargets = new Set<string>();
  for (const asset of skill.assets ?? []) {
    validateId(asset.id, `asset in ${skill.id}`);
    if (seenAssetIds.has(asset.id)) {
      throw new Error(`Duplicate asset id in ${skill.id}: ${asset.id}`);
    }
    seenAssetIds.add(asset.id);

    const source = toAbsolutePath(asset.source);
    if (!existsSync(source)) {
      throw new Error(`Skill ${skill.id} asset is missing: ${displayPath(asset.source)}`);
    }

    const target = defaultAssetTarget(asset);
    if (!target.startsWith("assets/") || target.includes("..") || target.startsWith("/") || target.includes("\\")) {
      throw new Error(`Skill ${skill.id} asset ${asset.id} target must stay under assets/: ${target}`);
    }
    if (target.replace(/\/+$/u, "") === "assets/index.md") {
      throw new Error(`Skill ${skill.id} asset ${asset.id} target is reserved: assets/index.md`);
    }
    if (seenAssetTargets.has(target)) {
      throw new Error(`Duplicate asset target in ${skill.id}: ${target}`);
    }
    seenAssetTargets.add(target);

    const sourceStat = statSync(source);
    const normalizedTarget = target.replace(/\/+$/u, "");
    const targetLooksFile = /\.[^/]+$/u.test(normalizedTarget);
    if (sourceStat.isDirectory() && targetLooksFile) {
      throw new Error(
        `Skill ${skill.id} asset ${asset.id} source is a directory but target looks like a file: ${target}`,
      );
    }
    if (sourceStat.isFile() && target.endsWith("/")) {
      throw new Error(
        `Skill ${skill.id} asset ${asset.id} source is a file but target must not end with /: ${target}`,
      );
    }
  }
}

export function validateRegistry(registry: ComponentRegistry): ComponentSurface {
  if (!registry || !Array.isArray(registry.skills)) throw new Error("registry.skills must be an array");
  if (!Array.isArray(registry.instructions)) throw new Error("registry.instructions must be an array");
  if (!Array.isArray(registry.procedures)) {
    throw new Error("registry.procedures must be an array");
  }
  if (!Array.isArray(registry.agents)) throw new Error("registry.agents must be an array");
  if (!Array.isArray(registry.hooks)) throw new Error("registry.hooks must be an array");
  const surface = materializeRegistry(registry);
  const skillIds = new Set(registry.skills.map((skill) => skill.id));
  const skillsById = new Map(registry.skills.map((skill) => [skill.id, skill]));
  const agentIds = new Set(registry.agents.map((agent) => agent.id));
  const proceduresById = new Map<string, ProcedureDefinition>();
  const procedures = registry.procedures;
  const surfaceProcedureIds = new Set(surface.procedures.map((procedure) => procedure.id));
  const skillProcedureUseOwners = new Set<string>();
  const agentProcedureUseOwners = new Set<string>();
  const procedureTargetsByOwner = new Map<string, string>();

  for (const procedure of procedures) {
    validateId(procedure.id, "procedure");
    if (proceduresById.has(procedure.id)) {
      throw new Error(`Duplicate procedure id: ${procedure.id}`);
    }
    const runtime = procedure.runtime ?? "node";
    if (runtime !== "node") {
      throw new Error(`Procedure ${procedure.id} runtime must be node`);
    }
    validatePlatformList(procedure.platforms, `Procedure ${procedure.id}`, { optional: true });
    if (!existsSync(toAbsolutePath(procedure.entry))) {
      throw new Error(`Procedure ${procedure.id} entry is missing: ${displayPath(procedure.entry)}`);
    }
    validateProcedureTarget(procedure);
    validateProcedureSchema(procedure, "args");
    validateProcedureSchema(procedure, "output");
    const procedureTarget = procedureRuntimeTarget(procedure);
    const procedureIsReferenced = surfaceProcedureIds.has(procedure.id);

    const ownerSkillIds = procedure.owners.skillIds ?? [];
    const ownerAgentIds = procedure.owners.agentIds ?? [];
    if (ownerSkillIds.length === 0 && ownerAgentIds.length === 0) {
      throw new Error(`Procedure ${procedure.id} must define at least one owner`);
    }
    const duplicateOwnerSkillIds = duplicateValues(ownerSkillIds);
    if (duplicateOwnerSkillIds.length > 0) {
      throw new Error(
        `Procedure ${procedure.id} contains duplicate owner skill(s): ${duplicateOwnerSkillIds.join(", ")}`,
      );
    }
    const duplicateOwnerAgentIds = duplicateValues(ownerAgentIds);
    if (duplicateOwnerAgentIds.length > 0) {
      throw new Error(
        `Procedure ${procedure.id} contains duplicate owner agent(s): ${duplicateOwnerAgentIds.join(", ")}`,
      );
    }
    for (const ownerSkillId of ownerSkillIds) {
      validateId(ownerSkillId, `procedure owner skill in ${procedure.id}`);
      if (!skillIds.has(ownerSkillId)) {
        throw new Error(`Procedure ${procedure.id} references missing owner skill: ${ownerSkillId}`);
      }
      if (procedureIsReferenced) {
        validateUniqueProcedureTargetForOwner(
          procedureTargetsByOwner,
          procedure,
          "skill",
          ownerSkillId,
          procedureTarget,
        );
      }
    }
    for (const ownerAgentId of ownerAgentIds) {
      validateId(ownerAgentId, `procedure owner agent in ${procedure.id}`);
      if (!agentIds.has(ownerAgentId)) {
        throw new Error(`Procedure ${procedure.id} references missing owner agent: ${ownerAgentId}`);
      }
      if (procedureIsReferenced) {
        validateUniqueProcedureTargetForOwner(
          procedureTargetsByOwner,
          procedure,
          "agent",
          ownerAgentId,
          procedureTarget,
        );
      }
    }
    proceduresById.set(procedure.id, procedure);
  }
  for (const procedure of procedures) {
    if (!surfaceProcedureIds.has(procedure.id)) {
      throw new Error(`Procedure ${procedure.id} is registered but not referenced by any skill or agent`);
    }
  }

  for (const instruction of registry.instructions) {
    validateId(instruction.id, "instruction");
    validatePlatformList(instruction.platforms, `Instruction ${instruction.id}`);
    if (!existsSync(toAbsolutePath(instruction.body))) {
      throw new Error(`Instruction ${instruction.id} body is missing: ${displayPath(instruction.body)}`);
    }
  }

  for (const skill of registry.skills) {
    validateId(skill.id, "skill");
    validatePlatformList(skill.platforms, `Skill ${skill.id}`);
    if (!skill.description || skill.description.length < 20) {
      throw new Error(`Skill ${skill.id} has a weak description`);
    }
    if (skill.invocation === InvocationPolicy.Disabled) {
      throw new Error(`Skill ${skill.id} uses unsupported disabled invocation policy`);
    }
    if (skill.invocation === InvocationPolicy.ModelOnly && skill.platforms.includes(Platform.Codex)) {
      throw new Error(`Skill ${skill.id} uses model-only invocation on Codex, which cannot hide explicit skill invocation`);
    }
    if (skill.platforms.includes(Platform.Codex) && codexSystemSkillIdSet.has(skill.id)) {
      throw new Error(`Skill ${skill.id} collides with a Codex system skill name; do not emit it as a Codex user skill`);
    }
    validateRuntimeToolMatchers(skill);
    validateTextList(skill, "useCases", "useCase");
    validateTextList(skill, "constraints", "constraint");
    if (skill.sourceDir === undefined) {
      throw new Error(`Skill ${skill.id} must define sourceDir`);
    }
    if (skill.sourceDir !== undefined && !existsSync(toAbsolutePath(skill.sourceDir))) {
      throw new Error(`Skill ${skill.id} sourceDir is missing: ${displayPath(skill.sourceDir)}`);
    }
    validateSkillGoal(skill);
    const skillWorkflow = validateSkillWorkflow(skill);
    if (!skillWorkflow) {
      throw new Error(`Skill ${skill.id} must define workflow`);
    }
    for (const gate of skillWorkflow?.gates ?? []) {
      if (!skillIds.has(gate.skill)) throw new Error(`Skill ${skill.id} workflow gate references missing skill: ${gate.skill}`);
      validateSkillWorkflowSkillPlatform(skill, gate.skill, skillsById, "workflow gate references skill");
    }
    for (const route of skillWorkflow?.routes ?? []) {
      if (!skillIds.has(route.skill)) throw new Error(`Skill ${skill.id} workflow route references missing skill: ${route.skill}`);
      validateSkillWorkflowSkillPlatform(skill, route.skill, skillsById, "workflow route references skill");
    }
    validateSkillOutputs(skill);
    if (skill.checklist !== undefined) {
      validateTextList(skill, "checklist", "checklist item");
    }
    validateAntiPatterns(skill);
    validateParameters(skill);

    const seenRelatedSkills = new Set<string>();
    for (const related of skill.relatedSkills ?? []) {
      validateId(related.id, `related skill in ${skill.id}`);
      if (!skillIds.has(related.id)) {
        throw new Error(`Skill ${skill.id} references missing related skill: ${related.id}`);
      }
      validatePlatformList(related.platforms, `Skill ${skill.id} related skill ${related.id}`, { optional: true });
      validateRelatedSkillPlatform(skill, related, skillsById);
      if (related.id === skill.id) {
        throw new Error(`Skill ${skill.id} must not reference itself as a related skill`);
      }
      if ("label" in related) {
        throw new Error(`Skill ${skill.id} related skill ${related.id} must not define a label alias`);
      }
      if (typeof related.reason !== "string" || related.reason.trim() === "") {
        throw new Error(`Skill ${skill.id} related skill ${related.id} has an empty reason`);
      }
      validateSingleLineMetadata(`Skill ${skill.id} related skill ${related.id} reason`, related.reason);
      if (seenRelatedSkills.has(related.id)) {
        throw new Error(`Skill ${skill.id} has a duplicate related skill entry: ${related.id}`);
      }
      seenRelatedSkills.add(related.id);
    }
    for (const workflowSkillId of new Set([
      ...(skillWorkflow?.gates ?? []).map((gate) => gate.skill),
      ...(skillWorkflow?.routes ?? []).map((route) => route.skill),
    ])) {
      if (workflowSkillId === skill.id) continue;
      if (!seenRelatedSkills.has(workflowSkillId)) {
        throw new Error(`Skill ${skill.id} workflow references skill ${workflowSkillId} but relatedSkills does not include it`);
      }
    }

    const sourceRoot = skillSourceRoot(skill);
    const procedureUses = listProcedureUses(skill);
    validateUniqueProcedureUses(skill.id, procedureUses);
    for (const procedureUse of procedureUses) {
      const procedureId = procedureUse.id;
      validateId(procedureId, `procedure in ${skill.id}`);
      const procedure = proceduresById.get(procedureId);
      if (!procedure) {
        throw new Error(`Skill ${skill.id} references missing procedure: ${procedureId}`);
      }
      const ownerSkills = procedure.owners.skillIds ?? [];
      if (!ownerSkills.includes(skill.id)) {
        throw new Error(`Skill ${skill.id} references procedure ${procedureId} without skill ownership`);
      }
      skillProcedureUseOwners.add(procedureOwnerKey(skill.id, procedureId));
      validateProcedureUsePlatforms(skill, procedureUse, procedure);
    }
    if (existsSync(join(sourceRoot, "scripts"))) {
      throw new Error(
        `Skill ${skill.id} must move local scripts/ sources to src/components/procedures/sources/ and reference them through procedures`,
      );
    }

    const seenReferences = new Set<string>();
    const seenReferenceTargets = new Set<string>();
    for (const reference of skill.references ?? []) {
      validateId(reference.id, `reference in ${skill.id}`);
      if (seenReferences.has(reference.id)) throw new Error(`Duplicate reference id in ${skill.id}: ${reference.id}`);
      seenReferences.add(reference.id);
      const referenceSource = toAbsolutePath(reference.source);
      const referenceTarget = defaultReferenceTarget(reference);
      const normalizedReferenceTarget = referenceTarget.replace(/\/+$/u, "");
      if (
        reference.id === "evals" ||
        referenceTarget === "references/evals" ||
        referenceTarget.startsWith("references/evals/") ||
        isSameOrInsidePath(referenceSource, join(sourceRoot, "evals"))
      ) {
        throw new Error(`Skill ${skill.id} must not register evals/ as a reference`);
      }
      if (
        !referenceTarget.startsWith("references/") ||
        referenceTarget.startsWith("/") ||
        referenceTarget.includes("..") ||
        referenceTarget.includes("\\")
      ) {
        throw new Error(`Skill ${skill.id} reference ${reference.id} target must stay under references/: ${referenceTarget}`);
      }
      if (normalizedReferenceTarget === "references/index.md") {
        throw new Error(`Skill ${skill.id} reference ${reference.id} target is reserved: references/index.md`);
      }
      if (seenReferenceTargets.has(normalizedReferenceTarget)) {
        throw new Error(`Duplicate reference target in ${skill.id}: ${normalizedReferenceTarget}`);
      }
      seenReferenceTargets.add(normalizedReferenceTarget);
      if (!existsSync(referenceSource)) {
        throw new Error(`Skill ${skill.id} reference is missing: ${displayPath(reference.source)}`);
      }
      const sourceStat = statSync(referenceSource);
      const targetLooksFile = /\.[^/]+$/u.test(normalizedReferenceTarget);
      if (sourceStat.isDirectory() && targetLooksFile) {
        throw new Error(
          `Skill ${skill.id} reference ${reference.id} source is a directory but target looks like a file: ${referenceTarget}`,
        );
      }
      if (sourceStat.isFile() && referenceTarget.endsWith("/")) {
        throw new Error(
          `Skill ${skill.id} reference ${reference.id} source is a file but target must not end with /: ${referenceTarget}`,
        );
      }
    }
    validateSkillAssets(skill);
  }

  for (const agent of registry.agents) {
    validateId(agent.id, "agent");
    validatePlatformList(agent.platforms, `Agent ${agent.id}`);
    if (!agent.role || agent.role.trim() === "") {
      throw new Error(`Agent ${agent.id} must define a non-empty role`);
    }
    validateAgentOutputFormat(agent);
    validateAgentInputs(agent);
    validateRuntimeToolMatchers(agent);
    const workflow = validateAgentWorkflow(agent);
    if (!workflow) {
      throw new Error(`Agent ${agent.id} must define workflow`);
    }
    for (const gate of workflow?.gates ?? []) {
      if (!skillIds.has(gate.skill)) throw new Error(`Agent ${agent.id} workflow gate references missing skill: ${gate.skill}`);
      validateAgentSkillPlatform(agent, gate.skill, skillsById, "workflow gate references skill");
    }
    for (const route of workflow?.routes ?? []) {
      if (!skillIds.has(route.skill)) throw new Error(`Agent ${agent.id} workflow route references missing skill: ${route.skill}`);
      validateAgentSkillPlatform(agent, route.skill, skillsById, "workflow route references skill");
    }
    validateAgentQualityStandards(agent);
    const hasBashTool = hasStringTool(agent, "Bash");
    const bashBoundary = validateAgentBashBoundary(agent);
    if (hasBashTool && bashBoundary.length === 0) {
      throw new Error(`Agent ${agent.id} uses KnownTool.Bash and must define bashBoundary`);
    }
    if (!hasBashTool && bashBoundary.length > 0) {
      throw new Error(`Agent ${agent.id} defines bashBoundary but does not include KnownTool.Bash`);
    }
    const duplicateAgentSkillIds = duplicateValues(
      (agent.skills ?? []).map((skill: NonNullable<AgentDefinition["skills"]>[number]) => skill.id),
    );
    if (duplicateAgentSkillIds.length > 0) {
      throw new Error(`Agent ${agent.id} contains duplicate skill reference(s): ${duplicateAgentSkillIds.join(", ")}`);
    }
    const agentSkillIds = new Set<string>();
    for (const skill of agent.skills ?? []) {
      if (!skillIds.has(skill.id)) throw new Error(`Agent ${agent.id} references missing skill: ${skill.id}`);
      validateAgentSkillSharedPlatform(agent, skill.id, skillsById);
      if (typeof skill.reason !== "string" || skill.reason.trim().length === 0) {
        throw new Error(`Agent ${agent.id} skill ${skill.id} must include a non-empty reason`);
      }
      validateSingleLineMetadata(`Agent ${agent.id} skill ${skill.id} reason`, skill.reason);
      agentSkillIds.add(skill.id);
    }
    for (const workflowSkillId of new Set([
      ...(workflow?.gates ?? []).map((gate) => gate.skill),
      ...(workflow?.routes ?? []).map((route) => route.skill),
    ])) {
      if (!agentSkillIds.has(workflowSkillId)) {
        throw new Error(`Agent ${agent.id} workflow references skill ${workflowSkillId} but agent.skills does not include it`);
      }
    }
    const procedureUses = listProcedureUses(agent);
    validateUniqueProcedureUses(agent.id, procedureUses);
    for (const procedureUse of procedureUses) {
      const procedureId = procedureUse.id;
      validateId(procedureId, `procedure in ${agent.id}`);
      const procedure = proceduresById.get(procedureId);
      if (!procedure) {
        throw new Error(`Agent ${agent.id} references missing procedure: ${procedureId}`);
      }
      const ownerAgents = procedure.owners.agentIds ?? [];
      if (!ownerAgents.includes(agent.id)) {
        throw new Error(`Agent ${agent.id} references procedure ${procedureId} without agent ownership`);
      }
      agentProcedureUseOwners.add(procedureOwnerKey(agent.id, procedureId));
      validateProcedureUsePlatforms(agent, procedureUse, procedure);
    }
  }

  for (const procedure of procedures) {
    for (const ownerSkillId of procedure.owners.skillIds ?? []) {
      if (!skillProcedureUseOwners.has(procedureOwnerKey(ownerSkillId, procedure.id))) {
        throw new Error(
          `Procedure ${procedure.id} lists owner skill ${ownerSkillId} but that skill does not reference the procedure`,
        );
      }
    }
    for (const ownerAgentId of procedure.owners.agentIds ?? []) {
      if (!agentProcedureUseOwners.has(procedureOwnerKey(ownerAgentId, procedure.id))) {
        throw new Error(
          `Procedure ${procedure.id} lists owner agent ${ownerAgentId} but that agent does not reference the procedure`,
        );
      }
    }
  }

  for (const hook of registry.hooks) {
    validateId(hook.id, "hook");
    validatePlatformList(hook.platforms, `Hook ${hook.id}`);
    if (hook.platforms.includes(Platform.Codex) && !codexHookEvents.has(hook.event)) {
      throw new Error(`Hook ${hook.id} event ${hook.event} is unavailable on platform: ${Platform.Codex}`);
    }
    validateHookMatcher(hook);
    const hookEntryPath = toAbsolutePath(hook.entry);
    if (!existsSync(hookEntryPath)) {
      throw new Error(`Hook ${hook.id} entry is missing: ${displayPath(hook.entry)}`);
    }
    const normalizedHookEntryPath = hookEntryPath.replaceAll("\\", "/");
    if (/\/hooks\/(pre-tool-use|post-tool-use|session-start|user-prompt-submit|stop|pre-compact)\//.test(normalizedHookEntryPath)) {
      throw new Error(
        `Hook ${hook.id} uses an unsupported lifecycle directory: ${displayPath(hook.entry)}. ` +
        "Move it to business workflow groups under src/components/hooks/.",
      );
    }
  }

  return surface;
}

export async function emitPlatform(
  componentSurface: ComponentSurface,
  outDir: string,
  platform: Platform,
): Promise<void> {
  const root = join(outDir, platform === Platform.Claude ? "claude" : "codex");
  rmSync(root, { recursive: true, force: true });
  ensureDir(root);
  ensureDir(join(root, "skills"));
  ensureDir(join(root, "agents"));
  ensureDir(join(root, "hooks"));

  const instructionName = platform === Platform.Claude ? "CLAUDE.md" : "AGENTS.md";
  writeText(join(root, instructionName), renderInstruction(componentSurface, platform));

  const platformHooks = componentSurface.hooks.filter((hook) => hook.platforms.includes(platform));
  await compileHookModules(platformHooks, join(root, "hooks"), platform);

  if (platform === Platform.Claude) {
    writeText(join(root, "settings.json"), JSON.stringify(renderHookConfig(platformHooks, platform), null, 2) + "\n");
  } else {
    writeText(join(root, "hooks.json"), JSON.stringify(renderHookConfig(platformHooks, platform), null, 2) + "\n");
    writeText(join(root, "config.toml"), renderCodexConfig());
  }

  const procedureRuntime = await emitProcedureRuntime(componentSurface, root, platform);
  const platformProcedureIds = new Set(procedureRuntime.procedures.map((procedure) => procedure.id));
  const proceduresById = new Map(
    componentSurface.procedures
      .filter((procedure) => platformProcedureIds.has(procedure.id))
      .map((procedure) => [procedure.id, procedure]),
  );

  const platformSkillIds = new Set(
    componentSurface.skills
      .filter((skill) => skill.platforms.includes(platform))
      .map((skill) => skill.id),
  );
  const claudePreloadableSkillIds = new Set(
    componentSurface.skills
      .filter((skill) => skill.platforms.includes(platform))
      .filter((skill) => platform !== Platform.Claude || skill.invocation !== InvocationPolicy.ExplicitOnly)
      .map((skill) => skill.id),
  );
  for (const skill of componentSurface.skills) {
    if (skill.platforms.includes(platform)) await emitSkill(skill, root, platform, proceduresById, platformSkillIds);
  }
  for (const agent of componentSurface.agents) {
    if (agent.platforms.includes(platform)) {
      await emitAgent(agent, root, platform, platformSkillIds, claudePreloadableSkillIds);
    }
  }

  const files = checksumFiles(root);
  const skillIds = componentSurface.skills
    .filter((item) => item.platforms.includes(platform))
    .map((item) => item.id)
    .sort();
  writeText(join(root, "manifest.json"), JSON.stringify({
    schema: manifestSchemaVersion,
    platform,
    instructions: componentSurface.instructions
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    skills: skillIds,
    agents: componentSurface.agents
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    hooks: componentSurface.hooks
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    procedures: {
      proceduresFile: procedureRuntime.proceduresFile,
      bundleChecksum: procedureRuntime.bundleChecksum,
      items: procedureRuntime.procedures.map((procedure) => ({
        id: procedure.id,
        target: procedure.target,
        bundled: procedure.bundled,
        runtime: procedure.runtime,
        description: procedure.description,
        owners: procedure.owners,
        argsSchema: procedure.argsSchema,
        outputSchema: procedure.outputSchema,
      })),
    },
    install: renderInstallManifest(platform, skillIds),
    files,
  }, null, 2) + "\n");
}
