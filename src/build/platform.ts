import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type {
  AgentDefinition,
  HookDefinition,
  InstructionDefinition,
  SkillDefinition,
  SkillScriptDefinition,
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
  validateAgentOutputFormat,
  validateAgentQualityStandards,
  validateAgentWorkflow,
} from "./agents.ts";
import { compileHookModules, renderCodexConfig, renderHookConfig } from "./hooks.ts";
import { hasH2SectionMatching, startsWithH2Section } from "./markdown.ts";
import { materializeProfile } from "./registry.ts";
import { emitSkill, validateAntiPatterns, validateParameters, validateTextList } from "./skills.ts";
import type { ComponentRegistry, ProfileSurface } from "./types.ts";

export function renderInstruction(profileSurface: ProfileSurface, platform: Platform): string {
  const title = platform === Platform.Claude ? "CLAUDE.md" : "AGENTS.md";
  const instructions = profileSurface.instructions
    .filter((instruction) => instruction.platforms.includes(platform))
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || a.id.localeCompare(b.id));
  const body = instructions
    .map((instruction) => readComponentText(instruction.body).trimEnd())
    .join("\n\n");

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
    "## Generated Profile",
    "",
    `- Profile: ${profileSurface.profile.id}`,
    `- Generated file: ${title}`,
    `- Source of truth: src/components/`,
    "",
    list("Skills", profileSurface.skills.filter((item) => item.platforms.includes(platform))),
    "",
    list("Agents", profileSurface.agents.filter((item) => item.platforms.includes(platform))),
    "",
    list("Hooks", profileSurface.hooks.filter((item) => item.platforms.includes(platform))),
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

export function validateRegistry(registry: ComponentRegistry): ProfileSurface {
  if (!registry || !Array.isArray(registry.skills)) throw new Error("registry.skills must be an array");
  if (!Array.isArray(registry.instructions)) throw new Error("registry.instructions must be an array");
  if (!Array.isArray(registry.agents)) throw new Error("registry.agents must be an array");
  if (!Array.isArray(registry.hooks)) throw new Error("registry.hooks must be an array");
  if (!Array.isArray(registry.profiles)) throw new Error("registry.profiles must be an array");

  const surface = materializeProfile(registry);
  const skillIds = new Set(registry.skills.map((skill) => skill.id));

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
    if (/\]\(\.\.\/[^)]+\/SKILL\.md\)|\]\([a-z0-9-]+-expert:[a-z0-9-]+\)/u.test(bodySource)) {
      throw new Error(`Skill ${skill.id} must move explicit cross-skill links from SKILL.body.md to relatedSkills`);
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
      const key = `${related.id}\0${related.label ?? ""}`;
      if (seenRelatedSkills.has(key)) {
        throw new Error(`Skill ${skill.id} has a duplicate related skill entry: ${related.id}`);
      }
      seenRelatedSkills.add(key);
    }

    const skillSourceRoot = dirname(toAbsolutePath(skill.body));
    const seenScripts = new Set<string>();
    for (const script of skill.scripts ?? []) {
      validateId(script.id, `script in ${skill.id}`);
      if (seenScripts.has(script.id)) throw new Error(`Duplicate script id in ${skill.id}: ${script.id}`);
      seenScripts.add(script.id);
      if (!existsSync(toAbsolutePath(script.entry))) {
        throw new Error(`Skill ${skill.id} script is missing: ${displayPath(script.entry)}`);
      }
    }
    const scriptsDir = join(skillSourceRoot, "scripts");
    if (existsSync(scriptsDir)) {
      const skillScripts: readonly SkillScriptDefinition[] = skill.scripts ?? [];
      const registeredEntries = new Set(skillScripts.map((script) => toAbsolutePath(script.entry)));
      for (const entry of readdirSync(scriptsDir, { withFileTypes: true })) {
        const absoluteEntry = join(scriptsDir, entry.name);
        if (entry.isFile() && entry.name.endsWith(".ts") && !registeredEntries.has(absoluteEntry)) {
          const source = readFileSync(absoluteEntry, "utf-8");
          if (source.startsWith("#!")) {
            throw new Error(
              `Skill ${skill.id} has an unregistered executable script: ${relative(skillSourceRoot, absoluteEntry)}`,
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
      throw new Error(`Agent ${agent.id} must move role definition from AGENT.body.md to index.ts role field`);
    }
    if (agentBodySource.trim() !== "" && !startsWithH2Section(agentBodySource)) {
      throw new Error(`Agent ${agent.id} body must start with an H2 section (##); move non-section content to index.ts role field`);
    }
    if (hasH2SectionMatching(agentBodySource, (title) => title === "Bash 使用边界")) {
      throw new Error(`Agent ${agent.id} must move ## Bash 使用边界 from AGENT.body.md to bashBoundary`);
    }
    if (hasH2SectionMatching(agentBodySource, (title) => title === "质量标准")) {
      throw new Error(`Agent ${agent.id} must move ## 质量标准 from AGENT.body.md to qualityStandards`);
    }
    if (hasH2SectionMatching(agentBodySource, (title) => title === "输出格式")) {
      throw new Error(`Agent ${agent.id} must move ## 输出格式 from AGENT.body.md to outputFormat`);
    }
    if (hasH2SectionMatching(agentBodySource, (title) => ["工作方式", "必经门禁", "场景路由", "编排顺序"].includes(title))) {
      throw new Error(`Agent ${agent.id} must move workflow sections from AGENT.body.md to workflow`);
    }
    validateAgentOutputFormat(agent);
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
  }

  for (const hook of registry.hooks) {
    validateId(hook.id, "hook");
    if (!existsSync(toAbsolutePath(hook.entry))) {
      throw new Error(`Hook ${hook.id} entry is missing: ${displayPath(hook.entry)}`);
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

  for (const skill of profileSurface.skills) {
    if (skill.platforms.includes(platform)) await emitSkill(skill, root, platform);
  }
  for (const agent of profileSurface.agents) {
    if (agent.platforms.includes(platform)) await emitAgent(agent, root, platform);
  }

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
    files: checksumFiles(root),
  }, null, 2) + "\n");
}
