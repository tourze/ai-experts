import type {
  WorkflowDefinition,
  WorkflowDirection,
  WorkflowGateDefinition,
  WorkflowRouteDefinition,
  WorkflowStepDefinition,
} from "../components/sdk";

type WorkflowStepGroup = "steps" | "gates" | "finalSteps";

export function validateWorkflow(owner: string, workflow: WorkflowDefinition | undefined): WorkflowDefinition | null {
  if (workflow === undefined) return null;
  if (!workflow || typeof workflow !== "object" || Array.isArray(workflow)) {
    throw new Error(`${owner} workflow must be a single object when defined`);
  }
  const direction = workflow.direction ?? "TD";
  if (!["TD", "TB", "BT", "RL", "LR"].includes(direction)) {
    throw new Error(`${owner} workflow.direction must be one of TD, TB, BT, RL, LR`);
  }
  const steps = workflow.steps ?? [];
  const gates = workflow.gates ?? [];
  const routes = workflow.routes ?? [];
  const finalSteps = workflow.finalSteps ?? [];
  if (![steps, gates, routes, finalSteps].every(Array.isArray)) {
    throw new Error(`${owner} workflow arrays must be arrays when defined`);
  }
  if (steps.length + gates.length + routes.length + finalSteps.length === 0) {
    throw new Error(`${owner} workflow must define at least one step, gate, route, or finalStep`);
  }
  const seenIds = new Set(["start", "route", "join"]);
  const checkId = (id: string, property: string, index: number): void => {
    if (!/^[a-z][a-z0-9-]*$/i.test(id)) {
      throw new Error(`${owner} workflow.${property}[${index}].id must use letters, numbers, or hyphens`);
    }
    if (seenIds.has(id)) throw new Error(`${owner} workflow contains duplicate node id: ${id}`);
    seenIds.add(id);
  };
  for (const [index, step] of steps.entries()) {
    validateWorkflowStep(owner, "steps", step, index);
    checkId(step.id, "steps", index);
  }
  for (const [index, gate] of gates.entries()) {
    validateWorkflowGate(owner, gate, index);
    checkId(gate.id, "gates", index);
  }
  for (const [index, route] of routes.entries()) {
    validateWorkflowRoute(owner, route, index);
    checkId(route.id, "routes", index);
  }
  for (const [index, step] of finalSteps.entries()) {
    validateWorkflowStep(owner, "finalSteps", step, index);
    checkId(step.id, "finalSteps", index);
  }
  return workflow;
}

function validateWorkflowGate(owner: string, gate: WorkflowGateDefinition, index: number): void {
  validateWorkflowStep(owner, "gates", gate, index);
  if (typeof gate.skill !== "string" || gate.skill.trim() === "") {
    throw new Error(`${owner} workflow.gates[${index}].skill must be a non-empty string`);
  }
  if (typeof gate.checks !== "string" || gate.checks.trim() === "") {
    throw new Error(`${owner} workflow.gates[${index}].checks must be a non-empty string`);
  }
}

function validateWorkflowRoute(owner: string, route: WorkflowRouteDefinition, index: number): void {
  if (!route || typeof route !== "object" || Array.isArray(route)) {
    throw new Error(`${owner} workflow.routes[${index}] must be an object`);
  }
  if (typeof route.id !== "string" || route.id.trim() === "") {
    throw new Error(`${owner} workflow.routes[${index}].id must be a non-empty string`);
  }
  if (typeof route.skill !== "string" || route.skill.trim() === "") {
    throw new Error(`${owner} workflow.routes[${index}].skill must be a non-empty string`);
  }
  if (typeof route.checks !== "string" || route.checks.trim() === "") {
    throw new Error(`${owner} workflow.routes[${index}].checks must be a non-empty string`);
  }
  if (!Array.isArray(route.triggers) || route.triggers.length === 0) {
    throw new Error(`${owner} workflow.routes[${index}].triggers must be a non-empty array`);
  }
  for (const [triggerIndex, trigger] of route.triggers.entries()) {
    if (typeof trigger !== "string" || trigger.trim() === "") {
      throw new Error(`${owner} workflow.routes[${index}].triggers[${triggerIndex}] must be a non-empty string`);
    }
  }
  if (typeof route.output !== "string" || route.output.trim() === "") {
    throw new Error(`${owner} workflow.routes[${index}].output must be a non-empty string`);
  }
}

function validateWorkflowStep(
  owner: string,
  property: WorkflowStepGroup | "routes",
  step: WorkflowStepDefinition,
  index: number,
): void {
  if (!step || typeof step !== "object" || Array.isArray(step)) {
    throw new Error(`${owner} workflow.${property}[${index}] must be an object`);
  }
  if (typeof step.id !== "string" || step.id.trim() === "") {
    throw new Error(`${owner} workflow.${property}[${index}].id must be a non-empty string`);
  }
  if (typeof step.label !== "string" || step.label.trim() === "") {
    throw new Error(`${owner} workflow.${property}[${index}].label must be a non-empty string`);
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

export function renderWorkflowMermaidSource(workflow: WorkflowDefinition): string {
  const direction: WorkflowDirection = workflow.direction ?? "TD";
  const steps = workflow.steps ?? [];
  const gates = workflow.gates ?? [];
  const routes = workflow.routes ?? [];
  const finalSteps = workflow.finalSteps ?? [];
  const lines: string[] = [`flowchart ${direction}`];
  const start = "start";
  lines.push(`  ${start}(["开始"])`);
  let previous = start;
  const addStep = (step: WorkflowStepDefinition): void => {
    const id = mermaidNodeId(step.id);
    lines.push(`  ${id}["${mermaidLabel(step.label)}"]`);
    lines.push(`  ${previous} --> ${id}`);
    previous = id;
  };

  for (const step of steps) addStep(step);
  for (const gate of gates as readonly WorkflowGateDefinition[]) {
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
    for (const route of routes as readonly WorkflowRouteDefinition[]) {
      const id = mermaidNodeId(route.id);
      const triggerLabel = route.triggers.join(" / ");
      lines.push(`  ${id}["${mermaidLabel(`${route.skill}\n${route.checks}\n输出：${route.output}`)}"]`);
      lines.push(`  ${decision} -->|"${mermaidEdgeLabel(triggerLabel)}"| ${id}`);
      lines.push(`  ${id} --> ${join}`);
    }
    previous = join;
  }
  for (const step of finalSteps) addStep(step);
  return lines.join("\n");
}

export function renderWorkflowMermaid(workflow: WorkflowDefinition): string {
  return ["```mermaid", renderWorkflowMermaidSource(workflow), "```"].join("\n");
}

export function renderWorkflowSection(workflow: WorkflowDefinition, title = "工作流"): string {
  return `## ${title.trim()}\n\n${renderWorkflowMermaid(workflow)}\n`;
}
