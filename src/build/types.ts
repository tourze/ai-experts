import type {
  AgentDefinition,
  HookDefinition,
  InstructionDefinition,
  ProfileDefinition,
  ScriptDefinition,
  SkillDefinition,
} from "../components/sdk";

export type ComponentRegistry = {
  version: number;
  defaultProfile: string;
  instructions: readonly InstructionDefinition[];
  scripts: readonly ScriptDefinition[];
  skills: readonly SkillDefinition[];
  agents: readonly AgentDefinition[];
  hooks: readonly HookDefinition[];
  profiles: readonly ProfileDefinition[];
};

export type ProfileSurface = {
  profile: ProfileDefinition;
  instructions: InstructionDefinition[];
  scripts: ScriptDefinition[];
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
