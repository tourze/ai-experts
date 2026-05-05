import { join } from "node:path";
import {
  Platform,
  readOptionalComponentText,
  tomlBoolean,
  tomlMultiline,
  tomlString,
  writeText,
  yamlScalar,
} from "./core.ts";
import { renderMarkdownBulletList } from "./markdown.ts";

export function hasStringTool(component, toolName) {
  return (component.tools ?? []).some((tool) => tool === toolName);
}

export function validateAgentBashBoundary(agent) {
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

export function validateAgentQualityStandards(agent) {
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

function validateAgentOutputSection(agent, section, index) {
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

export function validateAgentOutputFormat(agent) {
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

export function validateAgentWorkflow(agent) {
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
  const checkId = (id, property, index) => {
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

function validateAgentWorkflowGate(agent, gate, index) {
  validateAgentWorkflowStep(agent, "gates", gate, index);
  if (typeof gate.skill !== "string" || gate.skill.trim() === "") {
    throw new Error(`Agent ${agent.id} workflow.gates[${index}].skill must be a non-empty string`);
  }
  if (typeof gate.checks !== "string" || gate.checks.trim() === "") {
    throw new Error(`Agent ${agent.id} workflow.gates[${index}].checks must be a non-empty string`);
  }
}

function validateAgentWorkflowRoute(agent, route, index) {
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

function validateAgentWorkflowStep(agent, property, step, index) {
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

function mermaidNodeId(id) {
  return id.replace(/-/g, "_");
}

function mermaidLabel(value) {
  return String(value)
    .trim()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("`", "&#96;")
    .replace(/\r?\n/g, "<br/>");
}

function mermaidEdgeLabel(value) {
  return mermaidLabel(value).replaceAll("|", "&#124;");
}

function renderAgentWorkflow(agent) {
  const workflow = validateAgentWorkflow(agent);
  if (!workflow) return "";
  const direction = workflow.direction ?? "TD";
  const steps = workflow.steps ?? [];
  const gates = workflow.gates ?? [];
  const routes = workflow.routes ?? [];
  const finalSteps = workflow.finalSteps ?? [];
  const lines = ["```mermaid", `flowchart ${direction}`];
  const start = "start";
  lines.push(`  ${start}(["开始"])`);
  let previous = start;
  const addStep = (step) => {
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

function renderAgentBashBoundary(agent) {
  const boundary = validateAgentBashBoundary(agent);
  if (boundary.length === 0) return "";
  return `## Bash 使用边界\n\n${boundary.map((item) => item.trim()).join("\n\n")}\n`;
}

function renderAgentOutputFormat(agent) {
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

function renderAgentQualityStandards(agent) {
  const standards = validateAgentQualityStandards(agent);
  if (standards.length === 0) return "";
  return `## 质量标准\n\n${renderMarkdownBulletList(standards)}\n`;
}

function renderAgentBodyWithGeneratedSections(agent, body) {
  const leadingSections = [
    renderAgentWorkflow(agent),
    body.trimEnd(),
  ].filter((section) => section.trim() !== "");
  const trailingSections = [
    renderAgentBashBoundary(agent),
    renderAgentOutputFormat(agent),
    renderAgentQualityStandards(agent),
  ].filter(Boolean);
  return [...leadingSections, ...trailingSections]
    .map((section) => section.trimEnd())
    .join("\n\n");
}

function renderClaudeAgent(agent) {
  const lines = ["---", `name: ${agent.id}`, `description: ${yamlScalar(agent.description)}`];
  const tools = (agent.tools ?? []).filter((tool) => typeof tool === "string").map(String);
  if (tools.length > 0) lines.push(`tools: ${tools.join(", ")}`);
  // Claude subagents do not inherit parent-session skills; every orchestrated
  // skill must be listed explicitly in frontmatter.
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

function renderCodexSkillConfig(agent) {
  const skills = agent.skills ?? [];
  if (skills.length === 0) return [];
  return skills.flatMap((skill) => [
    "",
    "[[skills.config]]",
    `path = ${tomlString(`~/.agents/skills/${skill.id}/SKILL.md`)}`,
    `enabled = ${tomlBoolean(true)}`,
  ]);
}

function renderCodexModel(agent) {
  if (agent.codexModel) return agent.codexModel;
  const model = agent.model;
  if (!model) return null;
  const claudeOnlyAliases = new Set(["haiku", "sonnet", "opus"]);
  return claudeOnlyAliases.has(model) ? null : model;
}

function renderCodexAgent(agent) {
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

export async function emitAgent(agent, platformRoot, platform) {
  if (platform === Platform.Claude) {
    writeText(join(platformRoot, "agents", `${agent.id}.md`), renderClaudeAgent(agent));
  } else {
    writeText(join(platformRoot, "agents", `${agent.id}.toml`), renderCodexAgent(agent));
  }
}
