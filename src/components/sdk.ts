export enum Platform {
  Claude = "claude-code",
  Codex = "codex-cli",
}

export enum ComponentKind {
  Instruction = "instruction",
  Skill = "skill",
  Agent = "agent",
  Hook = "hook",
  Rule = "rule",
}

export enum InvocationPolicy {
  ImplicitAndExplicit = "implicit-and-explicit",
  ExplicitOnly = "explicit-only",
  ModelOnly = "model-only",
  Disabled = "disabled",
}

export enum KnownTool {
  Agent = "Agent",
  ApplyPatch = "apply_patch",
  Bash = "Bash",
  Edit = "Edit",
  Glob = "Glob",
  Grep = "Grep",
  MultiEdit = "MultiEdit",
  Read = "Read",
  WebFetch = "WebFetch",
  WebSearch = "WebSearch",
  Write = "Write",
}

export enum HookEvent {
  Notification = "Notification",
  PermissionRequest = "PermissionRequest",
  PostToolUse = "PostToolUse",
  PreCompact = "PreCompact",
  PreToolUse = "PreToolUse",
  SessionEnd = "SessionEnd",
  SessionStart = "SessionStart",
  Stop = "Stop",
  SubagentStop = "SubagentStop",
  UserPromptSubmit = "UserPromptSubmit",
}

export type PlatformList = readonly Platform[];
export type ComponentFile = URL | string;
export type RuleBodyDefinition = {
  lines: readonly string[];
};

export type ToolMatcher =
  | KnownTool
  | { kind: "mcp"; server: string; tool?: string }
  | { kind: "regex"; source: string };

export type HookMatcher = ToolMatcher | string;

export type ProcedureOwners = {
  skillIds?: readonly string[];
  agentIds?: readonly string[];
};

export type ProcedureFieldDefinition = {
  type: string;
  description: string;
  required?: boolean;
};

export type ProcedureParamDefinition = {
  flag: string;
  type: string;
  description: string;
  required?: boolean;
};

export type ProcedureFieldMap<TValue> = TValue extends object
  ? { readonly [Key in keyof TValue]-?: ProcedureFieldDefinition }
  : Record<string, ProcedureFieldDefinition>;

export type ProcedureArgsDefinition<TArgs> = {
  typeName: string;
  fields: ProcedureFieldMap<TArgs>;
};

export type ProcedureOutputDefinition<TResult> = {
  typeName: string;
  fields: ProcedureFieldMap<TResult>;
};

export type ProcedureDefinition<
  TArgs extends object = object,
  TResult extends object = object,
> = {
  id: string;
  entry: ComponentFile;
  description: string;
  owners: ProcedureOwners;
  platforms?: PlatformList;
  target?: string;
  runtime?: "node";
  bundle?: boolean;
  args?: ProcedureArgsDefinition<TArgs>;
  output?: ProcedureOutputDefinition<TResult>;
  params?: readonly ProcedureParamDefinition[];
  exampleArgs?: { args?: readonly string[] };
};

export type ProcedureArgs<TProcedure> =
  TProcedure extends ProcedureDefinition<infer TArgs, infer _TResult> ? TArgs : never;

export type ProcedureResult<TProcedure> =
  TProcedure extends ProcedureDefinition<infer _TArgs, infer TResult> ? TResult : never;

export type ProcedureExpectedOutput<TResult> = TResult extends object ? Partial<TResult> : TResult;

export type ProcedureUseDefinition<
  TArgs extends object = object,
  TResult extends object = object,
> = {
  id: string;
  platforms?: PlatformList;
  useId?: string;
  label?: string;
  when?: string;
  reason?: string;
  exampleArgs?: TArgs;
  expectedOutput?: ProcedureExpectedOutput<TResult>;
  showParams?: boolean;
};

export type ProcedureUseReference = ProcedureUseDefinition;

export type SkillReferenceDefinition = {
  id: string;
  source: ComponentFile;
  target?: string;
  title: string;
  summary: string;
  loadWhen: string;
};

export type SkillAssetDefinition = {
  id: string;
  source: ComponentFile;
  target?: string;
};

export type RelatedSkillDefinition = {
  skill: SkillDefinition;
  reason: string;
  platforms?: PlatformList;
};

export type AntiPatternDefinition = {
  fail: string;
  pass: string;
};

export type SkillParameter = {
  name: string;
  description: string;
  required?: boolean;
  type?: "string" | "file" | "url" | "slug";
};

export type SkillGoalDefinition = {
  title: string;
  body: string;
};

export type WorkflowDirection = "TD" | "TB" | "BT" | "RL" | "LR";

export type WorkflowStepDefinition = {
  id: string;
  label: string;
};

export type WorkflowGateDefinition = {
  id: string;
  skill: string;
  label: string;
  checks: string;
};

export type WorkflowRouteDefinition = {
  id: string;
  triggers: readonly string[];
  skill: string;
  checks: string;
  output: string;
};

export type WorkflowDefinition = {
  direction?: WorkflowDirection;
  steps?: readonly WorkflowStepDefinition[];
  gates?: readonly WorkflowGateDefinition[];
  routes?: readonly WorkflowRouteDefinition[];
  finalSteps?: readonly WorkflowStepDefinition[];
};

export type SkillOutputsDefinition = {
  title?: string;
  items?: readonly string[];
  body?: string;
};

export type SkillDefinition = {
  kind: ComponentKind.Skill;
  id: string;
  fullName: string;
  description: string;
  useCases: readonly string[];
  constraints: readonly string[];
  checklist?: readonly string[];
  antiPatterns?: readonly AntiPatternDefinition[];
  invocation: InvocationPolicy;
  platforms: PlatformList;
  sourceDir?: ComponentFile;
  goal?: SkillGoalDefinition;
  workflow: WorkflowDefinition;
  outputs?: SkillOutputsDefinition;
  tools?: readonly ToolMatcher[];
  procedures?: readonly ProcedureUseReference[];
  references?: readonly SkillReferenceDefinition[];
  relatedSkills?: readonly RelatedSkillDefinition[];
  assets?: readonly SkillAssetDefinition[];
  parameters?: readonly SkillParameter[];
  argumentHint?: string;
};

export enum AgentSandbox {
  ReadOnly = "read-only",
  WorkspaceWrite = "workspace-write",
  DangerFullAccess = "danger-full-access",
}

export enum SkillUseMode {
  Preload = "preload",
  Route = "route",
  Reference = "reference",
}

export type AgentSkillUse = {
  id: string;
  mode: SkillUseMode;
  reason: string;
};

export type AgentInputDefinition = {
  name: string;
  description: string;
  required?: boolean;
};

export type AgentBashBoundaryDefinition = readonly string[];

export type AgentQualityStandardsDefinition = readonly string[];

export type AgentOutputSectionDefinition = {
  title: string;
  body: string;
};

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type AgentOutputTemplateDefinition = {
  heading?: string;
  intro?: string;
  title: string;
  sections: readonly AgentOutputSectionDefinition[];
};

export type AgentOutputFormatDefinition =
  | {
      kind: "markdown";
      title: string;
      sections: readonly AgentOutputSectionDefinition[];
    }
  | {
      kind: "json";
      introduction?: string;
      example: JsonValue;
      notes?: readonly string[];
    }
  | {
      kind: "file-set";
      introduction: string;
      files: readonly string[];
      templates?: readonly AgentOutputTemplateDefinition[];
      notes?: readonly string[];
    }
  | {
      kind: "raw";
      body: string;
    };

export type AgentDefinition = {
  kind: ComponentKind.Agent;
  id: string;
  description: string;
  role: string;
  platforms: PlatformList;
  inputs?: readonly AgentInputDefinition[];
  bashBoundary?: AgentBashBoundaryDefinition;
  qualityStandards?: AgentQualityStandardsDefinition;
  outputFormat?: AgentOutputFormatDefinition;
  workflow: WorkflowDefinition;
  tools?: readonly ToolMatcher[];
  skills?: readonly AgentSkillUse[];
  procedures?: readonly ProcedureUseReference[];
  sandbox?: AgentSandbox;
  claudeModel?: string;
  codexModel?: string;
  model?: string;
  reasoningEffort?: string;
};

export type HookDefinition = {
  kind: ComponentKind.Hook;
  id: string;
  description: string;
  platforms: PlatformList;
  event: HookEvent;
  entry: ComponentFile;
  matcher?: readonly HookMatcher[];
  order?: number;
  timeoutSeconds?: number;
  statusMessage?: string;
};

export type NormalizedHookToolInput = {
  command?: string;
  content?: string;
  file_path?: string;
  filePath?: string;
  new_string?: string;
  old_string?: string;
  path?: string;
  [key: string]: unknown;
};

export type InstructionDefinition = {
  kind: ComponentKind.Instruction;
  id: string;
  title: string;
  platforms: PlatformList;
  body: ComponentFile;
  priority?: number;
};

export type RuleDefinition = {
  kind: ComponentKind.Rule;
  id: string;
  title: string;
  description: string;
  platforms: PlatformList;
  body: ComponentFile | RuleBodyDefinition;
  paths: readonly string[];
  priority?: number;
};

export type NormalizedHookPayload = {
  platform: Platform;
  event: HookEvent;
  cwd: string;
  sessionId?: string;
  transcriptPath?: string | null;
  permissionMode?: string;
  turnId?: string;
  stopHookActive?: boolean;
  prompt?: string;
  agent?: { id?: string; type?: string };
  tool?: {
    name?: KnownTool | string;
    input?: NormalizedHookToolInput;
    response?: unknown;
    fileTargets?: string[];
  };
  raw: unknown;
};

export type NormalizedHookResult =
  | { kind: "allow" }
  | { kind: "deny"; message: string }
  | { kind: "add-context"; message: string }
  | { kind: "report"; message: string }
  | { kind: "audit"; record: unknown };

export function defineSkill(definition: Omit<SkillDefinition, "kind">): SkillDefinition {
  return {
    kind: ComponentKind.Skill,
    ...definition,
  };
}

export function defineSkillGoal(
  definition: SkillGoalDefinition,
): SkillGoalDefinition {
  return definition;
}

export function defineWorkflow(
  definition: WorkflowDefinition,
): WorkflowDefinition {
  return definition;
}

export function defineWorkflowStep(
  definition: WorkflowStepDefinition,
): WorkflowStepDefinition {
  return definition;
}

export function defineWorkflowGate(
  definition: WorkflowGateDefinition,
): WorkflowGateDefinition {
  return definition;
}

export function defineWorkflowRoute(
  definition: WorkflowRouteDefinition,
): WorkflowRouteDefinition {
  return definition;
}

export function defineSkillOutputs(
  definition: SkillOutputsDefinition,
): SkillOutputsDefinition {
  return definition;
}

export function defineAgent(definition: Omit<AgentDefinition, "kind">): AgentDefinition {
  return {
    kind: ComponentKind.Agent,
    ...definition,
  };
}

export function defineAgentInput(
  definition: AgentInputDefinition,
): AgentInputDefinition {
  return definition;
}

export function defineAgentOutputFormat(
  definition: AgentOutputFormatDefinition,
): AgentOutputFormatDefinition {
  return definition;
}

export function defineAgentOutputSection(
  definition: AgentOutputSectionDefinition,
): AgentOutputSectionDefinition {
  return definition;
}

export function defineAgentOutputTemplate(
  definition: AgentOutputTemplateDefinition,
): AgentOutputTemplateDefinition {
  return definition;
}

export function defineHook(definition: Omit<HookDefinition, "kind">): HookDefinition {
  return {
    kind: ComponentKind.Hook,
    ...definition,
  };
}

export function defineInstruction(
  definition: Omit<InstructionDefinition, "kind">,
): InstructionDefinition {
  return {
    kind: ComponentKind.Instruction,
    ...definition,
  };
}

export function defineRule(definition: Omit<RuleDefinition, "kind">): RuleDefinition {
  return {
    kind: ComponentKind.Rule,
    ...definition,
  };
}

export function defineRuleBody(definition: RuleBodyDefinition): RuleBodyDefinition {
  return definition;
}

export function defineProcedure<
  TArgs extends object = object,
  TResult extends object = object,
>(
  definition: ProcedureDefinition<TArgs, TResult>,
): ProcedureDefinition<TArgs, TResult> {
  return definition;
}

export function defineProcedureUse<
  TArgs extends object = object,
  TResult extends object = object,
>(
  definition: ProcedureUseDefinition<TArgs, TResult>,
): ProcedureUseDefinition<TArgs, TResult> {
  return definition;
}

export function defineProcedureArgs<TArgs>(
  definition: ProcedureArgsDefinition<TArgs>,
): ProcedureArgsDefinition<TArgs> {
  return definition;
}

export function defineProcedureOutput<TResult>(
  definition: ProcedureOutputDefinition<TResult>,
): ProcedureOutputDefinition<TResult> {
  return definition;
}

export function defineProcedureParam(definition: ProcedureParamDefinition): ProcedureParamDefinition {
  return definition;
}

export function defineReference(definition: SkillReferenceDefinition): SkillReferenceDefinition {
  return definition;
}

export function defineAntiPattern(definition: AntiPatternDefinition): AntiPatternDefinition {
  return definition;
}

export function defineAsset(definition: SkillAssetDefinition): SkillAssetDefinition {
  return definition;
}

export function defineSkillParameter(definition: SkillParameter): SkillParameter {
  return definition;
}
