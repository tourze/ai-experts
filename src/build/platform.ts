import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type {
  AgentDefinition,
  HookDefinition,
  InstructionDefinition,
  ProcedureDefinition,
  SkillDefinition,
} from "../components/sdk";
import {
  collectFiles,
  defaultReferenceTarget,
  displayPath,
  ensureDir,
  isSameOrInsidePath,
  Platform,
  readComponentText,
  readOptionalComponentText,
  toAbsolutePath,
  writeText,
} from "./core.ts";
import {
  emitAgent,
  hasStringTool,
  validateAgentBashBoundary,
  validateAgentInputs,
  validateAgentModes,
  validateAgentOutputFormat,
  validateAgentQualityStandards,
  validateAgentWorkflow,
} from "./agents.ts";
import { compileHookModules, renderCodexConfig, renderHookConfig } from "./hooks.ts";
import { hasH2SectionMatching, startsWithH2Section } from "./markdown.ts";
import { materializeProfile } from "./registry.ts";
import { listProcedureUses } from "./script-uses.ts";
import type { ResolvedProcedureUse } from "./script-uses.ts";
import { emitScriptRuntime } from "./scripts.ts";
import { emitSkill, validateAntiPatterns, validateParameters, validateTextList } from "./skills.ts";
import type { ComponentRegistry, ProfileSurface } from "./types.ts";

export function renderInstruction(profileSurface: ProfileSurface, platform: Platform): string {
  const instructions = profileSurface.instructions
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
  const list = (
    label: string,
    items: readonly ListedItem[],
  ): string => [
    `### ${label}`,
    ...(items.length > 0 ? items.map((item) => `- ${item.id}: ${describeItem(item)}`) : ["- none"]),
  ].join("\n");

  return [
    body,
    "",
    "## 可用能力索引",
    "",
    "以下索引用于帮助模型识别当前安装的可用能力；具体执行规则以对应 Skill / Agent 文件为准。",
    "",
    list("Skill 索引", profileSurface.skills.filter((item) => item.platforms.includes(platform))),
    "",
    list("Agent 索引", profileSurface.agents.filter((item) => item.platforms.includes(platform))),
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

function validateSkillBodyCrossSkillLinks(skill: SkillDefinition, bodySource: string, skillIds: ReadonlySet<string>): void {
  for (const match of bodySource.matchAll(/\]\(\.\.\/([a-z0-9]+(?:-[a-z0-9]+)*)\/SKILL\.md(?:#[^)]+)?\)/gu)) {
    const targetSkillId = match[1] as string;
    if (!skillIds.has(targetSkillId)) {
      throw new Error(`Skill ${skill.id} contains a markdown link to missing skill: ${targetSkillId}`);
    }
  }
}

export function validateRegistry(registry: ComponentRegistry): ProfileSurface {
  if (!registry || !Array.isArray(registry.skills)) throw new Error("registry.skills must be an array");
  if (!Array.isArray(registry.instructions)) throw new Error("registry.instructions must be an array");
  if (!Array.isArray(registry.procedures ?? registry.scripts)) {
    throw new Error("registry.procedures or registry.scripts must be an array");
  }
  if (!Array.isArray(registry.agents)) throw new Error("registry.agents must be an array");
  if (!Array.isArray(registry.hooks)) throw new Error("registry.hooks must be an array");
  if (!Array.isArray(registry.profiles)) throw new Error("registry.profiles must be an array");

  const surface = materializeProfile(registry);
  const skillIds = new Set(registry.skills.map((skill) => skill.id));
  const agentIds = new Set(registry.agents.map((agent) => agent.id));
  const proceduresById = new Map<string, ProcedureDefinition>();
  const procedures = registry.procedures ?? registry.scripts ?? [];

  for (const procedure of procedures) {
    validateId(procedure.id, "procedure");
    if (proceduresById.has(procedure.id)) {
      throw new Error(`Duplicate procedure id: ${procedure.id}`);
    }
    const runtime = procedure.runtime ?? "node";
    if (runtime !== "node") {
      throw new Error(`Procedure ${procedure.id} runtime must be node`);
    }
    if (!existsSync(toAbsolutePath(procedure.entry))) {
      throw new Error(`Procedure ${procedure.id} entry is missing: ${displayPath(procedure.entry)}`);
    }

    const ownerSkillIds = procedure.owners.skillIds ?? [];
    const ownerAgentIds = procedure.owners.agentIds ?? [];
    if (ownerSkillIds.length === 0 && ownerAgentIds.length === 0) {
      throw new Error(`Procedure ${procedure.id} must define at least one owner`);
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

  for (const instruction of registry.instructions) {
    validateId(instruction.id, "instruction");
    if (!existsSync(toAbsolutePath(instruction.body))) {
      throw new Error(`Instruction ${instruction.id} body is missing: ${displayPath(instruction.body)}`);
    }
  }

  for (const skill of registry.skills) {
    validateId(skill.id, "skill");
    if (!skill.description || skill.description.length < 20) {
      throw new Error(`Skill ${skill.id} has a weak description`);
    }
    validateTextList(skill, "useCases", "useCase");
    validateTextList(skill, "constraints", "constraint");
    if (!existsSync(toAbsolutePath(skill.body))) {
      throw new Error(`Skill ${skill.id} body is missing: ${displayPath(skill.body)}`);
    }
    const bodySource = readComponentText(skill.body);
    if (!startsWithH2Section(bodySource)) {
      throw new Error(`Skill ${skill.id} body must start with an H2 section; move intro text to index.ts fields`);
    }
    if (hasH2SectionMatching(bodySource, (title) => title === "适用场景")) {
      throw new Error(`Skill ${skill.id} must move ## 适用场景 from SKILL.body.md to useCases`);
    }
    if (hasH2SectionMatching(bodySource, (title) => title.startsWith("核心约束"))) {
      throw new Error(`Skill ${skill.id} must move ## 核心约束 from SKILL.body.md to constraints`);
    }
    if (hasH2SectionMatching(bodySource, (title) => title === "检查清单")) {
      throw new Error(`Skill ${skill.id} must move ## 检查清单 from SKILL.body.md to checklist`);
    }
    if (skill.checklist !== undefined) {
      validateTextList(skill, "checklist", "checklist item");
    }
    if (hasH2SectionMatching(bodySource, (title) => title === "反模式")) {
      throw new Error(`Skill ${skill.id} must move ## 反模式 from SKILL.body.md to antiPatterns`);
    }
    if (hasH2SectionMatching(bodySource, (title) => title === "用户输入")) {
      throw new Error(`Skill ${skill.id} must move ## 用户输入 from SKILL.body.md to parameters`);
    }
    if (hasH2SectionMatching(bodySource, (title) => title === "交叉引用")) {
      throw new Error(`Skill ${skill.id} must move ## 交叉引用 from SKILL.body.md to relatedSkills`);
    }
    validateAntiPatterns(skill);
    validateParameters(skill);
    validateSkillBodyCrossSkillLinks(skill, bodySource, skillIds);
    if (/\]\(\.\.\/[^)]+\/SKILL\.md\)|\]\([a-z0-9-]+-expert:[a-z0-9-]+\)/u.test(bodySource)) {
      throw new Error(`Skill ${skill.id} must move explicit cross-skill links from SKILL.body.md to relatedSkills`);
    }
    if (/node\s+(?:\.\/)?scripts\/[A-Za-z0-9._/-]+\.mjs/u.test(bodySource)) {
      throw new Error(`Skill ${skill.id} must move legacy local script commands from SKILL.body.md to procedures`);
    }

    const seenRelatedSkills = new Set<string>();
    for (const related of skill.relatedSkills ?? []) {
      validateId(related.id, `related skill in ${skill.id}`);
      if (!skillIds.has(related.id)) {
        throw new Error(`Skill ${skill.id} references missing related skill: ${related.id}`);
      }
      if (related.id === skill.id) {
        throw new Error(`Skill ${skill.id} must not reference itself as a related skill`);
      }
      if (related.label !== undefined && (typeof related.label !== "string" || related.label.trim() === "")) {
        throw new Error(`Skill ${skill.id} related skill ${related.id} has an empty label`);
      }
      if (typeof related.reason !== "string" || related.reason.trim() === "") {
        throw new Error(`Skill ${skill.id} related skill ${related.id} has an empty reason`);
      }
      if (seenRelatedSkills.has(related.id)) {
        throw new Error(`Skill ${skill.id} has a duplicate related skill entry: ${related.id}`);
      }
      seenRelatedSkills.add(related.id);
    }

    const skillSourceRoot = dirname(toAbsolutePath(skill.body));
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
    }
    const scriptsDir = join(skillSourceRoot, "scripts");
    if (existsSync(scriptsDir)) {
      const registeredEntries = new Set(
        procedures
          .filter((procedure) => (procedure.owners.skillIds ?? []).includes(skill.id))
          .map((procedure) => toAbsolutePath(procedure.entry)),
      );
      for (const entry of readdirSync(scriptsDir, { withFileTypes: true })) {
        const absoluteEntry = join(scriptsDir, entry.name);
        if (entry.isFile() && entry.name.endsWith(".ts") && !registeredEntries.has(absoluteEntry)) {
          const source = readFileSync(absoluteEntry, "utf-8");
          if (source.startsWith("#!")) {
            throw new Error(
              `Skill ${skill.id} has an unregistered executable procedure source: ${relative(skillSourceRoot, absoluteEntry)}`,
            );
          }
        }
      }
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
        isSameOrInsidePath(referenceSource, join(skillSourceRoot, "evals"))
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
    if (!agent.role || agent.role.trim() === "") {
      throw new Error(`Agent ${agent.id} must define a non-empty role`);
    }
    if (agent.body !== undefined && !existsSync(toAbsolutePath(agent.body))) {
      throw new Error(`Agent ${agent.id} body is missing: ${displayPath(agent.body)}`);
    }
    const agentBodySource = readOptionalComponentText(agent.body);
    if (/^你是/.test(agentBodySource.trimStart())) {
      throw new Error(`Agent ${agent.id} must move role definition from agent body to index.ts role field`);
    }
    if (agentBodySource.trim() !== "" && !startsWithH2Section(agentBodySource)) {
      throw new Error(`Agent ${agent.id} body must start with an H2 section (##); move non-section content to index.ts role field`);
    }
    if (hasH2SectionMatching(agentBodySource, (title) => title === "Bash 使用边界")) {
      throw new Error(`Agent ${agent.id} must move ## Bash 使用边界 from agent body to bashBoundary`);
    }
    if (hasH2SectionMatching(agentBodySource, (title) => title === "质量标准")) {
      throw new Error(`Agent ${agent.id} must move ## 质量标准 from agent body to qualityStandards`);
    }
    if (hasH2SectionMatching(agentBodySource, (title) => title === "输出格式")) {
      throw new Error(`Agent ${agent.id} must move ## 输出格式 from agent body to outputFormat`);
    }
    if (hasH2SectionMatching(agentBodySource, (title) => ["工作方式", "必经门禁", "场景路由", "编排顺序"].includes(title))) {
      throw new Error(`Agent ${agent.id} must move workflow sections from agent body to workflow`);
    }
    validateAgentOutputFormat(agent);
    validateAgentInputs(agent);
    validateAgentModes(agent);
    const workflow = validateAgentWorkflow(agent);
    for (const gate of workflow?.gates ?? []) {
      if (!skillIds.has(gate.skill)) throw new Error(`Agent ${agent.id} workflow gate references missing skill: ${gate.skill}`);
    }
    for (const route of workflow?.routes ?? []) {
      if (!skillIds.has(route.skill)) throw new Error(`Agent ${agent.id} workflow route references missing skill: ${route.skill}`);
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
    }
  }

  for (const hook of registry.hooks) {
    validateId(hook.id, "hook");
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
  profileSurface: ProfileSurface,
  outDir: string,
  platform: Platform,
): Promise<void> {
  const root = join(outDir, platform === Platform.Claude ? "claude" : "codex");
  rmSync(root, { recursive: true, force: true });
  ensureDir(root);
  ensureDir(join(root, "skills"));
  ensureDir(join(root, "agents"));
  ensureDir(join(root, "hooks"));
  ensureDir(join(root, "rules"));

  const instructionName = platform === Platform.Claude ? "CLAUDE.md" : "AGENTS.md";
  writeText(join(root, instructionName), renderInstruction(profileSurface, platform));

  const platformHooks = profileSurface.hooks.filter((hook) => hook.platforms.includes(platform));
  await compileHookModules(platformHooks, join(root, "hooks"), platform);

  if (platform === Platform.Claude) {
    writeText(join(root, "settings.json"), JSON.stringify(renderHookConfig(platformHooks, platform), null, 2) + "\n");
  } else {
    writeText(join(root, "hooks.json"), JSON.stringify(renderHookConfig(platformHooks, platform), null, 2) + "\n");
    writeText(join(root, "config.toml"), renderCodexConfig());
  }

  const procedureRuntime = await emitScriptRuntime(profileSurface, root, platform);
  const proceduresById = new Map(profileSurface.procedures.map((procedure) => [procedure.id, procedure]));

  for (const skill of profileSurface.skills) {
    if (skill.platforms.includes(platform)) await emitSkill(skill, root, platform, proceduresById);
  }
  for (const agent of profileSurface.agents) {
    if (agent.platforms.includes(platform)) await emitAgent(agent, root, platform);
  }

  const files = checksumFiles(root);
  writeText(join(root, "manifest.json"), JSON.stringify({
    schema: 2,
    profile: profileSurface.profile.id,
    platform,
    instructions: profileSurface.instructions
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    skills: profileSurface.skills
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    agents: profileSurface.agents
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    hooks: profileSurface.hooks
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
    files,
  }, null, 2) + "\n");
}
