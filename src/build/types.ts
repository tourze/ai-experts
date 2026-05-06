import type {
  AgentDefinition,
  HookDefinition,
  InstructionDefinition,
  ProcedureDefinition,
  ProfileDefinition,
  SkillDefinition,
} from "../components/sdk";

export type ComponentRegistry = {
  version: number;
  defaultProfile: string;
  instructions: readonly InstructionDefinition[];
  procedures?: readonly ProcedureDefinition[];
  scripts?: readonly ProcedureDefinition[];
  skills: readonly SkillDefinition[];
  agents: readonly AgentDefinition[];
  hooks: readonly HookDefinition[];
  profiles: readonly ProfileDefinition[];
};

export type ProfileSurface = {
  profile: ProfileDefinition;
  instructions: InstructionDefinition[];
  procedures: ProcedureDefinition[];
  scripts: ProcedureDefinition[];
  skills: SkillDefinition[];
  agents: AgentDefinition[];
  hooks: HookDefinition[];
};

export type BuildStats = {
  claudeSkills: number;
  codexSkills: number;
  claudeAgents: number;
  codexAgents: number;
  claudeHooks: number;
  codexHooks: number;
};
