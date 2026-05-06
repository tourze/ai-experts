export enum Platform {
  Claude = "claude-code",
  Codex = "codex-cli",
}

export enum ComponentKind {
  Instruction = "instruction",
  Skill = "skill",
  Agent = "agent",
  Hook = "hook",
  Profile = "profile",
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

export type ToolMatcher =
  | KnownTool
  | { kind: "mcp"; server: string; tool?: string }
  | { kind: "regex"; source: string };

export type SkillScriptDefinition = {
  id: string;
  entry: ComponentFile;
  description: string;
  target?: string;
  runtime?: "node" | "python3";
  bundle?: boolean;
  argsSchema?: string;
  outputSchema?: string;
};

export type SkillScriptRootDefinition = {
  source: ComponentFile;
  target?: string;
};

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
  id: string;
  label?: string;
  reason: string;
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
  body: ComponentFile;
  tools?: readonly ToolMatcher[];
  scripts?: readonly SkillScriptDefinition[];
  scriptRoots?: readonly SkillScriptRootDefinition[];
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

export type AgentBashBoundaryDefinition = readonly string[];

export type AgentQualityStandardsDefinition = readonly string[];

export type AgentOutputSectionDefinition = {
  title: string;
  body: string;
};

export type AgentOutputFormatDefinition =
  | {
      kind: "markdown";
      title: string;
      sections: readonly AgentOutputSectionDefinition[];
    }
  | {
      kind: "raw";
      body: string;
    };

export type AgentWorkflowDirection = "TD" | "TB" | "BT" | "RL" | "LR";

export type AgentWorkflowStepDefinition = {
  id: string;
  label: string;
};

export type AgentWorkflowGateDefinition = {
  id: string;
  skill: string;
  label: string;
  checks: string;
};

export type AgentWorkflowRouteDefinition = {
  id: string;
  triggers: readonly string[];
  skill: string;
  checks: string;
  output: string;
};

export type AgentWorkflowDefinition = {
  direction?: AgentWorkflowDirection;
  steps?: readonly AgentWorkflowStepDefinition[];
  gates?: readonly AgentWorkflowGateDefinition[];
  routes?: readonly AgentWorkflowRouteDefinition[];
  finalSteps?: readonly AgentWorkflowStepDefinition[];
};

export type AgentDefinition = {
  kind: ComponentKind.Agent;
  id: string;
  description: string;
  role: string;
  platforms: PlatformList;
  body?: ComponentFile;
  bashBoundary?: AgentBashBoundaryDefinition;
  qualityStandards?: AgentQualityStandardsDefinition;
  outputFormat?: AgentOutputFormatDefinition;
  workflow?: AgentWorkflowDefinition;
  tools?: readonly ToolMatcher[];
  skills?: readonly AgentSkillUse[];
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
  matcher?: readonly ToolMatcher[];
  order?: number;
  timeoutSeconds?: number;
  statusMessage?: string;
  payloadMode?: "normalized" | "claude-raw";
};

export type InstructionDefinition = {
  kind: ComponentKind.Instruction;
  id: string;
  title: string;
  platforms: PlatformList;
  body: ComponentFile;
  priority?: number;
};

export type ProfileDefinition = {
  kind: ComponentKind.Profile;
  id: string;
  description: string;
  instructions: readonly string[];
  skills: readonly string[];
  agents: readonly string[];
  hooks: readonly string[];
};

export type NormalizedHookPayload = {
  platform: Platform;
  event: HookEvent;
  cwd: string;
  sessionId?: string;
  transcriptPath?: string | null;
  permissionMode?: string;
  turnId?: string;
  prompt?: string;
  agent?: { id?: string; type?: string };
  tool?: {
    name?: KnownTool | string;
    input?: unknown;
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

export type LegacyHookToolInput = {
  command?: string;
  file_path?: string;
  old_string?: string;
  new_string?: string;
  [key: string]: unknown;
};

export type LegacyHookPayload = {
  hook_event_name?: string;
  cwd?: string;
  session_id?: string;
  transcript_path?: string | null;
  permission_mode?: string;
  prompt?: string;
  tool_name?: KnownTool | string;
  tool_input?: LegacyHookToolInput;
  tool_response?: unknown;
  [key: string]: unknown;
};

export function defineSkill(definition: Omit<SkillDefinition, "kind">): SkillDefinition {
  return {
    kind: ComponentKind.Skill,
    ...definition,
  };
}

export function defineAgent(definition: Omit<AgentDefinition, "kind">): AgentDefinition {
  return {
    kind: ComponentKind.Agent,
    ...definition,
  };
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

export function defineAgentWorkflow(
  definition: AgentWorkflowDefinition,
): AgentWorkflowDefinition {
  return definition;
}

export function defineAgentWorkflowStep(
  definition: AgentWorkflowStepDefinition,
): AgentWorkflowStepDefinition {
  return definition;
}

export function defineAgentWorkflowGate(
  definition: AgentWorkflowGateDefinition,
): AgentWorkflowGateDefinition {
  return definition;
}

export function defineAgentWorkflowRoute(
  definition: AgentWorkflowRouteDefinition,
): AgentWorkflowRouteDefinition {
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

export function defineProfile(definition: Omit<ProfileDefinition, "kind">): ProfileDefinition {
  return {
    kind: ComponentKind.Profile,
    ...definition,
  };
}

export function defineSkillScript(definition: SkillScriptDefinition): SkillScriptDefinition {
  return definition;
}

export function defineSkillScriptRoot(
  definition: SkillScriptRootDefinition,
): SkillScriptRootDefinition {
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
