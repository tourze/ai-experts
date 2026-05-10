import { join } from "node:path";
import type {
  AgentDefinition,
  AgentInputDefinition,
  AgentOutputFormatDefinition,
  AgentOutputSectionDefinition,
  AgentOutputTemplateDefinition,
  ToolMatcher,
  WorkflowDefinition,
} from "../components/sdk";
import { SkillUseMode } from "../components/sdk";
import {
  Platform,
  renderToolMatcher,
  renderYamlFrontmatter,
  tomlBoolean,
  tomlMultiline,
  tomlString,
  writeText,
} from "./core";
import { renderMarkdownBulletList } from "./markdown";
import { validateMermaidSyntax } from "./mermaid";
import { renderWorkflowMermaidSource, renderWorkflowSection, validateWorkflow } from "./workflows";

const AGENT_SKILL_ROUTING_GUIDANCE = "当列出的 skill 与任务相关时，必须显式按该 skill 的工作流执行。";

function validateSingleLineText(owner: string, property: string, value: string): void {
  if (/\r|\n/u.test(value)) {
    throw new Error(`${owner} ${property} must be a single line`);
  }
}

export function hasStringTool(
  component: { tools?: readonly ToolMatcher[] },
  toolName: string,
): boolean {
  return (component.tools ?? []).some((tool) => tool === toolName);
}

export function validateAgentBashBoundary(agent: AgentDefinition): readonly string[] {
  const boundary = agent.bashBoundary;
  if (boundary === undefined) return [];
  if (!Array.isArray(boundary) || boundary.length === 0) {
    throw new Error(`Agent ${agent.id} bashBoundary must be a non-empty string array when defined`);
  }
  for (const [index, item] of boundary.entries()) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new Error(`Agent ${agent.id} bashBoundary[${index}] must be a non-empty string`);
    }
  }
  return boundary;
}

export function validateAgentQualityStandards(agent: AgentDefinition): readonly string[] {
  const standards = agent.qualityStandards;
  if (standards === undefined) return [];
  if (!Array.isArray(standards) || standards.length === 0) {
    throw new Error(`Agent ${agent.id} qualityStandards must be a non-empty string array when defined`);
  }
  for (const [index, item] of standards.entries()) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new Error(`Agent ${agent.id} qualityStandards[${index}] must be a non-empty string`);
    }
  }
  return standards;
}

export function validateAgentInputs(agent: AgentDefinition): readonly AgentInputDefinition[] {
  const inputs = agent.inputs;
  if (inputs === undefined) return [];
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new Error(`Agent ${agent.id} inputs must be a non-empty array when defined`);
  }
  const seen = new Set<string>();
  for (const [index, input] of inputs.entries()) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new Error(`Agent ${agent.id} inputs[${index}] must be an object`);
    }
    if (typeof input.name !== "string" || input.name.trim() === "") {
      throw new Error(`Agent ${agent.id} inputs[${index}].name must be a non-empty string`);
    }
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/u.test(input.name.trim())) {
      throw new Error(
        `Agent ${agent.id} inputs[${index}].name must start with a letter and only contain letters, numbers, "_", or "-"`,
      );
    }
    const inputName = input.name.trim();
    if (seen.has(inputName)) {
      throw new Error(`Agent ${agent.id} contains duplicate input: ${inputName}`);
    }
    seen.add(inputName);
    if (typeof input.description !== "string" || input.description.trim() === "") {
      throw new Error(`Agent ${agent.id} inputs[${index}].description must be a non-empty string`);
    }
    if (input.required !== undefined && typeof input.required !== "boolean") {
      throw new Error(`Agent ${agent.id} inputs[${index}].required must be a boolean when defined`);
    }
  }
  return inputs;
}

function validateAgentOutputSection(
  agent: AgentDefinition,
  section: AgentOutputSectionDefinition,
  index: number,
): void {
  if (!section || typeof section !== "object" || Array.isArray(section)) {
    throw new Error(`Agent ${agent.id} outputFormat.sections[${index}] must be an object`);
  }
  if (typeof section.title !== "string" || section.title.trim() === "") {
    throw new Error(`Agent ${agent.id} outputFormat.sections[${index}].title must be a non-empty string`);
  }
  validateSingleLineText(`Agent ${agent.id}`, `outputFormat.sections[${index}].title`, section.title);
  if (typeof section.body !== "string") {
    throw new Error(`Agent ${agent.id} outputFormat.sections[${index}].body must be a string`);
  }
}

function validateStringArray(
  agentId: string,
  value: readonly string[] | undefined,
  property: string,
  options: { required?: boolean } = {},
): readonly string[] {
  if (value === undefined) {
    if (options.required) throw new Error(`Agent ${agentId} ${property} must be a non-empty string array`);
    return [];
  }
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Agent ${agentId} ${property} must be a non-empty string array`);
  }
  for (const [index, item] of value.entries()) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new Error(`Agent ${agentId} ${property}[${index}] must be a non-empty string`);
    }
  }
  return value;
}

function validateJsonValue(value: unknown, seen: WeakSet<object>): boolean {
  if (value === null) return true;
  if (typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) {
    if (seen.has(value)) return false;
    seen.add(value);
    return value.every((item) => validateJsonValue(item, seen));
  }
  if (typeof value === "object") {
    if (seen.has(value)) return false;
    seen.add(value);
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return false;
    return Object.values(value as Record<string, unknown>).every((item) => validateJsonValue(item, seen));
  }
  return false;
}

function validateAgentOutputTemplate(
  agent: AgentDefinition,
  template: AgentOutputTemplateDefinition,
  index: number,
): void {
  if (!template || typeof template !== "object" || Array.isArray(template)) {
    throw new Error(`Agent ${agent.id} outputFormat.templates[${index}] must be an object`);
  }
  if (template.heading !== undefined && (typeof template.heading !== "string" || template.heading.trim() === "")) {
    throw new Error(`Agent ${agent.id} outputFormat.templates[${index}].heading must be non-empty when defined`);
  }
  if (template.heading !== undefined) {
    validateSingleLineText(`Agent ${agent.id}`, `outputFormat.templates[${index}].heading`, template.heading);
  }
  if (template.intro !== undefined && (typeof template.intro !== "string" || template.intro.trim() === "")) {
    throw new Error(`Agent ${agent.id} outputFormat.templates[${index}].intro must be non-empty when defined`);
  }
  if (typeof template.title !== "string" || template.title.trim() === "") {
    throw new Error(`Agent ${agent.id} outputFormat.templates[${index}].title must be a non-empty string`);
  }
  validateSingleLineText(`Agent ${agent.id}`, `outputFormat.templates[${index}].title`, template.title);
  if (!Array.isArray(template.sections) || template.sections.length === 0) {
    throw new Error(`Agent ${agent.id} outputFormat.templates[${index}].sections must be a non-empty array`);
  }
  for (const [sectionIndex, section] of template.sections.entries()) {
    validateAgentOutputSection(agent, section, sectionIndex);
  }
}

export function validateAgentOutputFormat(
  agent: AgentDefinition,
): AgentOutputFormatDefinition | null {
  const format = agent.outputFormat;
  if (format === undefined) return null;
  if (!format || typeof format !== "object" || Array.isArray(format)) {
    throw new Error(`Agent ${agent.id} outputFormat must be a single object when defined`);
  }
  if (format.kind === "markdown") {
    if (typeof format.title !== "string" || format.title.trim() === "") {
      throw new Error(`Agent ${agent.id} outputFormat.title must be a non-empty string`);
    }
    validateSingleLineText(`Agent ${agent.id}`, "outputFormat.title", format.title);
    if (!Array.isArray(format.sections) || format.sections.length === 0) {
      throw new Error(`Agent ${agent.id} outputFormat.sections must be a non-empty array`);
    }
    for (const [index, section] of format.sections.entries()) {
      validateAgentOutputSection(agent, section, index);
    }
    return format;
  }
  if (format.kind === "json") {
    if (
      format.introduction !== undefined &&
      (typeof format.introduction !== "string" || format.introduction.trim() === "")
    ) {
      throw new Error(`Agent ${agent.id} outputFormat.introduction must be non-empty when defined`);
    }
    if (!validateJsonValue(format.example, new WeakSet<object>())) {
      throw new Error(`Agent ${agent.id} outputFormat.example must be JSON-serializable`);
    }
    validateStringArray(agent.id, format.notes, "outputFormat.notes");
    return format;
  }
  if (format.kind === "file-set") {
    if (typeof format.introduction !== "string" || format.introduction.trim() === "") {
      throw new Error(`Agent ${agent.id} outputFormat.introduction must be a non-empty string`);
    }
    const files = validateStringArray(agent.id, format.files, "outputFormat.files", { required: true });
    for (const [index, file] of files.entries()) {
      validateSingleLineText(`Agent ${agent.id}`, `outputFormat.files[${index}]`, file);
    }
    if (format.templates !== undefined) {
      if (!Array.isArray(format.templates) || format.templates.length === 0) {
        throw new Error(`Agent ${agent.id} outputFormat.templates must be a non-empty array when defined`);
      }
      for (const [index, template] of format.templates.entries()) {
        validateAgentOutputTemplate(agent, template, index);
      }
    }
    validateStringArray(agent.id, format.notes, "outputFormat.notes");
    return format;
  }
  if (format.kind === "raw") {
    if (typeof format.body !== "string" || format.body.trim() === "") {
      throw new Error(`Agent ${agent.id} outputFormat.body must be a non-empty string`);
    }
    return format;
  }
  throw new Error(`Agent ${agent.id} outputFormat.kind must be "markdown", "json", "file-set", or "raw"`);
}

export function validateAgentWorkflow(agent: AgentDefinition): WorkflowDefinition | null {
  return validateWorkflow(`Agent ${agent.id}`, agent.workflow);
}

function renderAgentWorkflow(agent: AgentDefinition): string {
  const workflow = validateAgentWorkflow(agent);
  if (!workflow) return "";
  return renderWorkflowSection(workflow);
}

function renderAgentInputs(agent: AgentDefinition): string {
  const inputs = validateAgentInputs(agent);
  if (inputs.length === 0) return "";
  const lines = inputs.map((input) => {
    const marker = input.required === false ? "可选" : "必填";
    return `- \`${input.name.trim()}\`（${marker}）：${input.description.trim()}`;
  });
  return `## 输入\n\n${lines.join("\n")}\n`;
}

function renderAgentBashBoundary(agent: AgentDefinition): string {
  const boundary = validateAgentBashBoundary(agent);
  if (boundary.length === 0) return "";
  return `## Bash 使用边界\n\n${boundary.map((item) => item.trim()).join("\n\n")}\n`;
}

function renderAgentOutputFormat(agent: AgentDefinition): string {
  const format = validateAgentOutputFormat(agent);
  if (!format) return "";
  if (format.kind === "raw") {
    return `## 输出格式\n\n${format.body.trim()}\n`;
  }
  if (format.kind === "json") {
    const introduction = format.introduction?.trim() ?? "写一个 JSON 文件，结构如下：";
    const lines = [
      introduction,
      "",
      "```json",
      JSON.stringify(format.example, null, 2),
      "```",
    ];
    if (format.notes && format.notes.length > 0) {
      lines.push("", ...format.notes.map((note) => note.trim()));
    }
    return `## 输出格式\n\n${lines.join("\n")}\n`;
  }
  if (format.kind === "file-set") {
    const lines = [
      format.introduction.trim(),
      "",
      "```",
      ...format.files.map((file) => file.trimEnd()),
      "```",
    ];
    for (const template of format.templates ?? []) {
      lines.push("");
      if (template.heading) lines.push(`### ${template.heading.trim()}`, "");
      if (template.intro) lines.push(template.intro.trim(), "");
      lines.push("```markdown", `# ${template.title.trim()}`, "");
      for (const [index, section] of template.sections.entries()) {
        if (index > 0) lines.push("");
        lines.push(`## ${section.title.trim()}`);
        lines.push(section.body.trim());
      }
      lines.push("```");
    }
    if (format.notes && format.notes.length > 0) {
      lines.push("", ...format.notes.map((note) => note.trim()));
    }
    return `## 输出格式\n\n${lines.join("\n")}\n`;
  }
  const lines = [
    "```markdown",
    `# ${format.title.trim()}`,
    "",
  ];
  for (const [index, section] of format.sections.entries()) {
    if (index > 0) lines.push("");
    lines.push(`## ${section.title.trim()}`);
    lines.push(section.body.trim());
  }
  lines.push("```");
  return `## 输出格式\n\n${lines.join("\n")}\n`;
}

function renderAgentQualityStandards(agent: AgentDefinition): string {
  const standards = validateAgentQualityStandards(agent);
  if (standards.length === 0) return "";
  return `## 质量标准\n\n${renderMarkdownBulletList([...standards])}\n`;
}

function renderAgentBodyWithGeneratedSections(agent: AgentDefinition): string {
  const leadingSections = [
    renderAgentInputs(agent),
    renderAgentWorkflow(agent),
  ].filter((section) => section.trim() !== "");
  const trailingSections = [
    renderAgentBashBoundary(agent),
    renderAgentOutputFormat(agent),
    renderAgentQualityStandards(agent),
  ].filter((section) => section.trim() !== "");
  return [...leadingSections, ...trailingSections]
    .map((section) => section.trimEnd())
    .join("\n\n");
}

function platformAgentSkills(agent: AgentDefinition, platformSkillIds: ReadonlySet<string>): NonNullable<AgentDefinition["skills"]> {
  return (agent.skills ?? []).filter((skill) => platformSkillIds.has(skill.id));
}

function renderClaudeAgent(
  agent: AgentDefinition,
  platformSkillIds: ReadonlySet<string>,
  claudePreloadableSkillIds: ReadonlySet<string>,
): string {
  const frontmatter: Record<string, unknown> = {
    name: agent.id,
    description: agent.description,
  };
  const skills = platformAgentSkills(agent, platformSkillIds);
  const claudeSkills = skills
    .filter((skill) => skill.mode === SkillUseMode.Preload && claudePreloadableSkillIds.has(skill.id))
    .map((skill) => skill.id);
  const needsSkillTool = skills.some(
    (skill) => skill.mode !== SkillUseMode.Preload && claudePreloadableSkillIds.has(skill.id),
  );
  const tools = (agent.tools ?? []).map(renderToolMatcher);
  if (needsSkillTool && tools.length > 0 && !tools.includes("Skill")) tools.push("Skill");
  if (tools.length > 0) frontmatter.tools = tools.join(", ");
  if (claudeSkills.length > 0) frontmatter.skills = claudeSkills;
  const model = agent.claudeModel ?? agent.model;
  if (model) frontmatter.model = model;
  if (agent.reasoningEffort) frontmatter.effort = agent.reasoningEffort;

  const body = renderAgentBodyWithGeneratedSections(agent);
  const skillRoutes = skills
    .map((skill) => `- \`${skill.id}\` (${skill.mode}): ${skill.reason}`)
    .join("\n");
  const sections = [
    renderYamlFrontmatter(frontmatter),
    agent.role.trimEnd(),
    "",
    body,
  ];
  if (skillRoutes) {
    sections.push("", "## 技能编排", skillRoutes, "", AGENT_SKILL_ROUTING_GUIDANCE, "");
  }
  return sections.join("\n");
}

function renderCodexSkillConfig(agent: AgentDefinition, platformSkillIds: ReadonlySet<string>): string[] {
  const skills = platformAgentSkills(agent, platformSkillIds);
  if (skills.length === 0) return [];
  return skills.flatMap((skill) => [
    "",
    "[[skills.config]]",
    `path = ${tomlString(`~/.agents/skills/${skill.id}/SKILL.md`)}`,
    `enabled = ${tomlBoolean(true)}`,
  ]);
}

function renderCodexModel(agent: AgentDefinition): string | null {
  if (agent.codexModel) return agent.codexModel;
  const model = agent.model;
  if (!model) return null;
  const claudeOnlyAliases = new Set(["haiku", "sonnet", "opus"]);
  return claudeOnlyAliases.has(model) ? null : model;
}

function renderCodexAgent(agent: AgentDefinition, platformSkillIds: ReadonlySet<string>): string {
  const body = renderAgentBodyWithGeneratedSections(agent);
  const skills = platformAgentSkills(agent, platformSkillIds);
  const skillRoutes = skills
    .map((skill) => `- \`${skill.id}\` (${skill.mode}): ${skill.reason}`)
    .join("\n");
  const developerInstructionSections = [
    agent.role.trimEnd(),
    "",
    body,
  ];
  if (skillRoutes) {
    developerInstructionSections.push(
      "",
      "## 技能编排",
      skillRoutes,
      "",
      AGENT_SKILL_ROUTING_GUIDANCE,
    );
  }
  const developerInstructions = developerInstructionSections.join("\n");

  const lines = [
    `name = ${tomlString(agent.id)}`,
    `description = ${tomlString(agent.description)}`,
  ];
  const model = renderCodexModel(agent);
  if (model) lines.push(`model = ${tomlString(model)}`);
  if (agent.reasoningEffort) lines.push(`model_reasoning_effort = ${tomlString(agent.reasoningEffort)}`);
  if (agent.sandbox) lines.push(`sandbox_mode = ${tomlString(agent.sandbox)}`);
  lines.push(`developer_instructions = ${tomlMultiline(developerInstructions)}`);
  lines.push(...renderCodexSkillConfig(agent, platformSkillIds));
  return `${lines.join("\n")}\n`;
}

export async function emitAgent(
  agent: AgentDefinition,
  platformRoot: string,
  platform: Platform,
  platformSkillIds?: ReadonlySet<string>,
  claudePreloadableSkillIds?: ReadonlySet<string>,
): Promise<void> {
  const effectivePlatformSkillIds = platformSkillIds ?? new Set((agent.skills ?? []).map((skill) => skill.id));
  const effectiveClaudePreloadableSkillIds = claudePreloadableSkillIds ?? effectivePlatformSkillIds;
  const workflow = validateAgentWorkflow(agent);
  if (workflow) {
    await validateMermaidSyntax(`Agent ${agent.id}`, renderWorkflowMermaidSource(workflow));
  }
  if (platform === Platform.Claude) {
    writeText(
      join(platformRoot, "agents", `${agent.id}.md`),
      renderClaudeAgent(agent, effectivePlatformSkillIds, effectiveClaudePreloadableSkillIds),
    );
  } else {
    writeText(join(platformRoot, "agents", `${agent.id}.toml`), renderCodexAgent(agent, effectivePlatformSkillIds));
  }
}
