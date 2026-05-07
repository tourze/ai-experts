import { join } from "node:path";
import type {
  AgentDefinition,
  AgentInputDefinition,
  AgentModeDefinition,
  AgentOutputFormatDefinition,
  AgentOutputSectionDefinition,
  AgentWorkflowDefinition,
  AgentWorkflowDirection,
  AgentWorkflowGateDefinition,
  AgentWorkflowRouteDefinition,
  AgentWorkflowStepDefinition,
  ToolMatcher,
} from "../components/sdk";
import {
  Platform,
  readOptionalComponentText,
  tomlBoolean,
  tomlMultiline,
  tomlString,
  writeText,
  yamlScalar,
} from "./core.ts";
import { renderMarkdownBulletList, renderMarkdownTableCell } from "./markdown.ts";

type WorkflowStepGroup = "steps" | "gates" | "finalSteps";

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

export function validateAgentModes(agent: AgentDefinition): readonly AgentModeDefinition[] {
  const modes = agent.modes;
  if (modes === undefined) return [];
  if (!Array.isArray(modes) || modes.length === 0) {
    throw new Error(`Agent ${agent.id} modes must be a non-empty array when defined`);
  }
  const seen = new Set<string>();
  for (const [index, mode] of modes.entries()) {
    if (!mode || typeof mode !== "object" || Array.isArray(mode)) {
      throw new Error(`Agent ${agent.id} modes[${index}] must be an object`);
    }
    if (typeof mode.id !== "string" || mode.id.trim() === "") {
      throw new Error(`Agent ${agent.id} modes[${index}].id must be a non-empty string`);
    }
    const modeId = mode.id.trim();
    if (!/^[a-z][a-z0-9-]*$/.test(modeId)) {
      throw new Error(`Agent ${agent.id} modes[${index}].id must use letters, numbers, or hyphens`);
    }
    if (seen.has(modeId)) throw new Error(`Agent ${agent.id} contains duplicate mode: ${modeId}`);
    seen.add(modeId);
    if (typeof mode.label !== "string" || mode.label.trim() === "") {
      throw new Error(`Agent ${agent.id} modes[${index}].label must be a non-empty string`);
    }
    if (!Array.isArray(mode.triggers) || mode.triggers.length === 0) {
      throw new Error(`Agent ${agent.id} modes[${index}].triggers must be a non-empty array`);
    }
    for (const [triggerIndex, trigger] of mode.triggers.entries()) {
      if (typeof trigger !== "string" || trigger.trim() === "") {
        throw new Error(`Agent ${agent.id} modes[${index}].triggers[${triggerIndex}] must be a non-empty string`);
      }
    }
    if (mode.tools !== undefined) {
      if (!Array.isArray(mode.tools)) {
        throw new Error(`Agent ${agent.id} modes[${index}].tools must be an array when defined`);
      }
      for (const [toolIndex, tool] of mode.tools.entries()) {
        if (typeof tool !== "string" || tool.trim() === "") {
          throw new Error(`Agent ${agent.id} modes[${index}].tools[${toolIndex}] must be a non-empty string`);
        }
      }
    }
    if (typeof mode.output !== "string" || mode.output.trim() === "") {
      throw new Error(`Agent ${agent.id} modes[${index}].output must be a non-empty string`);
    }
    if (mode.description !== undefined && (typeof mode.description !== "string" || mode.description.trim() === "")) {
      throw new Error(`Agent ${agent.id} modes[${index}].description must be non-empty when defined`);
    }
    if (mode.steps !== undefined) {
      if (!Array.isArray(mode.steps) || mode.steps.length === 0) {
        throw new Error(`Agent ${agent.id} modes[${index}].steps must be a non-empty array when defined`);
      }
      for (const [stepIndex, step] of mode.steps.entries()) {
        if (typeof step !== "string" || step.trim() === "") {
          throw new Error(`Agent ${agent.id} modes[${index}].steps[${stepIndex}] must be a non-empty string`);
        }
      }
    }
  }
  return modes;
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
  if (typeof section.body !== "string") {
    throw new Error(`Agent ${agent.id} outputFormat.sections[${index}].body must be a string`);
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
    if (!Array.isArray(format.sections) || format.sections.length === 0) {
      throw new Error(`Agent ${agent.id} outputFormat.sections must be a non-empty array`);
    }
    for (const [index, section] of format.sections.entries()) {
      validateAgentOutputSection(agent, section, index);
    }
    return format;
  }
  if (format.kind === "raw") {
    if (typeof format.body !== "string" || format.body.trim() === "") {
      throw new Error(`Agent ${agent.id} outputFormat.body must be a non-empty string`);
    }
    return format;
  }
  throw new Error(`Agent ${agent.id} outputFormat.kind must be "markdown" or "raw"`);
}

export function validateAgentWorkflow(agent: AgentDefinition): AgentWorkflowDefinition | null {
  const workflow = agent.workflow;
  if (workflow === undefined) return null;
  if (!workflow || typeof workflow !== "object" || Array.isArray(workflow)) {
    throw new Error(`Agent ${agent.id} workflow must be a single object when defined`);
  }
  const direction = workflow.direction ?? "TD";
  if (!["TD", "TB", "BT", "RL", "LR"].includes(direction)) {
    throw new Error(`Agent ${agent.id} workflow.direction must be one of TD, TB, BT, RL, LR`);
  }
  const steps = workflow.steps ?? [];
  const gates = workflow.gates ?? [];
  const routes = workflow.routes ?? [];
  const finalSteps = workflow.finalSteps ?? [];
  if (![steps, gates, routes, finalSteps].every(Array.isArray)) {
    throw new Error(`Agent ${agent.id} workflow arrays must be arrays when defined`);
  }
  if (steps.length + gates.length + routes.length + finalSteps.length === 0) {
    throw new Error(`Agent ${agent.id} workflow must define at least one step, gate, route, or finalStep`);
  }
  const seenIds = new Set(["start", "route", "join"]);
  const checkId = (id: string, property: string, index: number): void => {
    if (!/^[a-z][a-z0-9-]*$/i.test(id)) {
      throw new Error(`Agent ${agent.id} workflow.${property}[${index}].id must use letters, numbers, or hyphens`);
    }
    if (seenIds.has(id)) throw new Error(`Agent ${agent.id} workflow contains duplicate node id: ${id}`);
    seenIds.add(id);
  };
  for (const [index, step] of steps.entries()) {
    validateAgentWorkflowStep(agent, "steps", step, index);
    checkId(step.id, "steps", index);
  }
  for (const [index, gate] of gates.entries()) {
    validateAgentWorkflowGate(agent, gate, index);
    checkId(gate.id, "gates", index);
  }
  for (const [index, route] of routes.entries()) {
    validateAgentWorkflowRoute(agent, route, index);
    if (!Array.isArray(route.triggers) || route.triggers.length === 0) {
      throw new Error(`Agent ${agent.id} workflow.routes[${index}].triggers must be a non-empty array`);
    }
    for (const [triggerIndex, trigger] of route.triggers.entries()) {
      if (typeof trigger !== "string" || trigger.trim() === "") {
        throw new Error(`Agent ${agent.id} workflow.routes[${index}].triggers[${triggerIndex}] must be a non-empty string`);
      }
    }
    if (typeof route.output !== "string" || route.output.trim() === "") {
      throw new Error(`Agent ${agent.id} workflow.routes[${index}].output must be a non-empty string`);
    }
    checkId(route.id, "routes", index);
  }
  for (const [index, step] of finalSteps.entries()) {
    validateAgentWorkflowStep(agent, "finalSteps", step, index);
    checkId(step.id, "finalSteps", index);
  }
  return workflow;
}

function validateAgentWorkflowGate(
  agent: AgentDefinition,
  gate: AgentWorkflowGateDefinition,
  index: number,
): void {
  validateAgentWorkflowStep(agent, "gates", gate, index);
  if (typeof gate.skill !== "string" || gate.skill.trim() === "") {
    throw new Error(`Agent ${agent.id} workflow.gates[${index}].skill must be a non-empty string`);
  }
  if (typeof gate.checks !== "string" || gate.checks.trim() === "") {
    throw new Error(`Agent ${agent.id} workflow.gates[${index}].checks must be a non-empty string`);
  }
}

function validateAgentWorkflowRoute(
  agent: AgentDefinition,
  route: AgentWorkflowRouteDefinition,
  index: number,
): void {
  if (!route || typeof route !== "object" || Array.isArray(route)) {
    throw new Error(`Agent ${agent.id} workflow.routes[${index}] must be an object`);
  }
  if (typeof route.id !== "string" || route.id.trim() === "") {
    throw new Error(`Agent ${agent.id} workflow.routes[${index}].id must be a non-empty string`);
  }
  if (typeof route.skill !== "string" || route.skill.trim() === "") {
    throw new Error(`Agent ${agent.id} workflow.routes[${index}].skill must be a non-empty string`);
  }
  if (typeof route.checks !== "string" || route.checks.trim() === "") {
    throw new Error(`Agent ${agent.id} workflow.routes[${index}].checks must be a non-empty string`);
  }
}

function validateAgentWorkflowStep(
  agent: AgentDefinition,
  property: WorkflowStepGroup | "routes",
  step: AgentWorkflowStepDefinition,
  index: number,
): void {
  if (!step || typeof step !== "object" || Array.isArray(step)) {
    throw new Error(`Agent ${agent.id} workflow.${property}[${index}] must be an object`);
  }
  if (typeof step.id !== "string" || step.id.trim() === "") {
    throw new Error(`Agent ${agent.id} workflow.${property}[${index}].id must be a non-empty string`);
  }
  if (typeof step.label !== "string" || step.label.trim() === "") {
    throw new Error(`Agent ${agent.id} workflow.${property}[${index}].label must be a non-empty string`);
  }
}

function mermaidNodeId(id: string): string {
  return id.replace(/-/g, "_");
}

function mermaidLabel(value: string): string {
  return String(value)
    .trim()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("`", "&#96;")
    .replace(/\r?\n/g, "<br/>");
}

function mermaidEdgeLabel(value: string): string {
  return mermaidLabel(value).replaceAll("|", "&#124;");
}

function renderAgentWorkflow(agent: AgentDefinition): string {
  const workflow = validateAgentWorkflow(agent);
  if (!workflow) return "";
  const direction: AgentWorkflowDirection = workflow.direction ?? "TD";
  const steps = workflow.steps ?? [];
  const gates = workflow.gates ?? [];
  const routes = workflow.routes ?? [];
  const finalSteps = workflow.finalSteps ?? [];
  const lines: string[] = ["```mermaid", `flowchart ${direction}`];
  const start = "start";
  lines.push(`  ${start}(["开始"])`);
  let previous = start;
  const addStep = (step: AgentWorkflowStepDefinition): void => {
    const id = mermaidNodeId(step.id);
    lines.push(`  ${id}["${mermaidLabel(step.label)}"]`);
    lines.push(`  ${previous} --> ${id}`);
    previous = id;
  };
  for (const step of steps) addStep(step);
  for (const gate of gates) {
    const id = mermaidNodeId(gate.id);
    lines.push(`  ${id}["${mermaidLabel(`${gate.skill}\n${gate.label}\n${gate.checks}`)}"]`);
    lines.push(`  ${previous} --> ${id}`);
    previous = id;
  }
  if (routes.length > 0) {
    const decision = "route";
    lines.push(`  ${decision}{"匹配场景路由"}`);
    lines.push(`  ${previous} --> ${decision}`);
    const join = "join";
    lines.push(`  ${join}(("收束"))`);
    for (const route of routes) {
      const id = mermaidNodeId(route.id);
      const triggerLabel = route.triggers.join(" / ");
      lines.push(`  ${id}["${mermaidLabel(`${route.skill}\n${route.checks}\n输出：${route.output}`)}"]`);
      lines.push(`  ${decision} -->|${mermaidEdgeLabel(triggerLabel)}| ${id}`);
      lines.push(`  ${id} --> ${join}`);
    }
    previous = join;
  }
  for (const step of finalSteps) addStep(step);
  lines.push("```");
  return `## 工作流\n\n${lines.join("\n")}\n`;
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

function renderAgentModes(agent: AgentDefinition): string {
  const modes = validateAgentModes(agent);
  if (modes.length === 0) return "";
  const table = [
    "| 模式 | 触发信号 | 工具 | 输出 |",
    "|------|----------|------|------|",
    ...modes.map((mode) =>
      `| ${renderMarkdownTableCell(mode.label)} | ${renderMarkdownTableCell(mode.triggers.map((item) => item.trim()).join(" / "))} | ${renderMarkdownTableCell((mode.tools ?? []).map((tool) => tool.trim()).join(", ") || "-")} | ${renderMarkdownTableCell(mode.output)} |`
    ),
  ];
  const sections = modes.map((mode) => {
    const lines = [`## ${mode.label.trim()}`];
    if (mode.description) lines.push("", mode.description.trim());
    if (mode.steps && mode.steps.length > 0) {
      lines.push("");
      lines.push(...mode.steps.map((step, index) => `${index + 1}. ${step.trim()}`));
    }
    return lines.join("\n");
  });
  return [`## 模式路由`, "", table.join("\n"), "", sections.join("\n\n")].join("\n");
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

function renderAgentBodyWithGeneratedSections(agent: AgentDefinition, body: string): string {
  const leadingSections = [
    renderAgentModes(agent),
    renderAgentInputs(agent),
    renderAgentWorkflow(agent),
    body.trimEnd(),
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

function renderClaudeAgent(agent: AgentDefinition): string {
  const lines = ["---", `name: ${agent.id}`, `description: ${yamlScalar(agent.description)}`];
  const tools = (agent.tools ?? []).filter((tool) => typeof tool === "string").map(String);
  if (tools.length > 0) lines.push(`tools: ${tools.join(", ")}`);
  const claudeSkills = (agent.skills ?? []).map((skill) => skill.id);
  if (claudeSkills.length > 0) {
    lines.push("skills:");
    for (const skill of claudeSkills) lines.push(`  - ${skill}`);
  }
  const model = agent.claudeModel ?? agent.model;
  if (model) lines.push(`model: ${model}`);
  if (agent.reasoningEffort) lines.push(`effort: ${agent.reasoningEffort}`);
  lines.push("---", "");

  const body = renderAgentBodyWithGeneratedSections(agent, readOptionalComponentText(agent.body).trimEnd());
  const skillRoutes = (agent.skills ?? [])
    .map((skill) => `- \`${skill.id}\` (${skill.mode}): ${skill.reason}`)
    .join("\n");
  return [
    lines.join("\n"),
    agent.role.trimEnd(),
    "",
    body,
    "",
    "## 技能编排",
    skillRoutes,
    "",
  ].join("\n");
}

function renderCodexSkillConfig(agent: AgentDefinition): string[] {
  const skills = agent.skills ?? [];
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

function renderCodexAgent(agent: AgentDefinition): string {
  const body = renderAgentBodyWithGeneratedSections(agent, readOptionalComponentText(agent.body).trimEnd());
  const skillRoutes = (agent.skills ?? [])
    .map((skill) => `- ${skill.id} (${skill.mode}): ${skill.reason}`)
    .join("\n");
  const developerInstructions = [
    agent.role.trimEnd(),
    "",
    body,
    "",
    "## 技能编排",
    skillRoutes,
    "",
    "When a listed skill is relevant, explicitly route the work through that skill's workflow.",
  ].join("\n");

  const lines = [
    `name = ${tomlString(agent.id)}`,
    `description = ${tomlString(agent.description)}`,
  ];
  const model = renderCodexModel(agent);
  if (model) lines.push(`model = ${tomlString(model)}`);
  if (agent.reasoningEffort) lines.push(`model_reasoning_effort = ${tomlString(agent.reasoningEffort)}`);
  if (agent.sandbox) lines.push(`sandbox_mode = ${tomlString(agent.sandbox)}`);
  lines.push(`developer_instructions = ${tomlMultiline(developerInstructions)}`);
  lines.push(...renderCodexSkillConfig(agent));
  return `${lines.join("\n")}\n`;
}

export async function emitAgent(agent: AgentDefinition, platformRoot: string, platform: Platform): Promise<void> {
  if (platform === Platform.Claude) {
    writeText(join(platformRoot, "agents", `${agent.id}.md`), renderClaudeAgent(agent));
  } else {
    writeText(join(platformRoot, "agents", `${agent.id}.toml`), renderCodexAgent(agent));
  }
}
