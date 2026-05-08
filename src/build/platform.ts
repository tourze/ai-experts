import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import type {
  AgentDefinition,
  HookDefinition,
  InstructionDefinition,
  ProcedureDefinition,
  RelatedSkillDefinition,
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
} from "./core.ts";
import {
  emitAgent,
  hasStringTool,
  validateAgentBashBoundary,
  validateAgentInputs,
  validateAgentOutputFormat,
  validateAgentQualityStandards,
  validateAgentWorkflow,
} from "./agents.ts";
import { compileHookModules, renderCodexConfig, renderHookConfig } from "./hooks.ts";
import { materializeRegistry } from "./registry.ts";
import { listProcedureUses } from "./procedure-uses.ts";
import type { ResolvedProcedureUse } from "./procedure-uses.ts";
import { emitProcedureRuntime } from "./procedures.ts";
import {
  emitSkill,
  skillSourceRoot,
  validateAntiPatterns,
  validateParameters,
  validateSkillGoal,
  validateSkillOutputs,
  validateSkillWorkflow,
  validateTextList,
} from "./skills.ts";
import type { ComponentRegistry, ComponentSurface } from "./types.ts";

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
const codexSystemSkillIds = new Set(["imagegen", "openai-docs", "plugin-creator", "skill-creator", "skill-installer"]);

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

function procedureOwnerKey(ownerId: string, procedureId: string): string {
  return `${ownerId}\0${procedureId}`;
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
  const missingPlatforms = usePlatforms.filter((platform) => !procedurePlatforms.includes(platform));
  if (missingPlatforms.length > 0) {
    throw new Error(
      `${component.kind} ${component.id} references procedure ${procedureUse.id} unavailable on platform(s): ${missingPlatforms.join(", ")}`,
    );
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

function validateHookMatcher(hook: HookDefinition): void {
  if (!hook.matcher || hook.matcher.length === 0) return;
  if (hookEventsWithToolMatcher.has(hook.event)) return;
  throw new Error(
    `Hook ${hook.id} defines matcher for ${hook.event}; matcher is only supported for tool events: ` +
    "PermissionRequest, PostToolUse, PreToolUse",
  );
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
    const matcher = tool as Extract<ToolMatcher, { kind: string }>;
    if (matcher.kind === "regex") {
      throw new Error(`${kind} ${component.id} tools[${index}] must not use regex matcher; use a concrete tool name or MCP matcher`);
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
    }
    for (const ownerAgentId of ownerAgentIds) {
      validateId(ownerAgentId, `procedure owner agent in ${procedure.id}`);
      if (!agentIds.has(ownerAgentId)) {
        throw new Error(`Procedure ${procedure.id} references missing owner agent: ${ownerAgentId}`);
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
    if (skill.platforms.includes(Platform.Codex) && codexSystemSkillIds.has(skill.id)) {
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
      if (seenRelatedSkills.has(related.id)) {
        throw new Error(`Skill ${skill.id} has a duplicate related skill entry: ${related.id}`);
      }
      seenRelatedSkills.add(related.id);
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
    for (const reference of skill.references ?? []) {
      validateId(reference.id, `reference in ${skill.id}`);
      if (seenReferences.has(reference.id)) throw new Error(`Duplicate reference id in ${skill.id}: ${reference.id}`);
      seenReferences.add(reference.id);
      const referenceSource = toAbsolutePath(reference.source);
      const referenceTarget = defaultReferenceTarget(reference);
      if (
        reference.id === "evals" ||
        referenceTarget === "references/evals" ||
        referenceTarget.startsWith("references/evals/") ||
        isSameOrInsidePath(referenceSource, join(sourceRoot, "evals"))
      ) {
        throw new Error(`Skill ${skill.id} must not register evals/ as a reference`);
      }
      if (!existsSync(referenceSource)) {
        throw new Error(`Skill ${skill.id} reference is missing: ${displayPath(reference.source)}`);
      }
    }
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
    for (const skill of agent.skills ?? []) {
      if (!skillIds.has(skill.id)) throw new Error(`Agent ${agent.id} references missing skill: ${skill.id}`);
      validateAgentSkillSharedPlatform(agent, skill.id, skillsById);
      if (typeof skill.reason !== "string" || skill.reason.trim().length === 0) {
        throw new Error(`Agent ${agent.id} skill ${skill.id} must include a non-empty reason`);
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
        `Hook ${hook.id} uses a legacy lifecycle directory: ${displayPath(hook.entry)}. ` +
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
  for (const skill of componentSurface.skills) {
    if (skill.platforms.includes(platform)) await emitSkill(skill, root, platform, proceduresById, platformSkillIds);
  }
  for (const agent of componentSurface.agents) {
    if (agent.platforms.includes(platform)) await emitAgent(agent, root, platform, platformSkillIds);
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
