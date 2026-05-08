import type {
  AgentDefinition,
  HookDefinition,
  InstructionDefinition,
  ProcedureDefinition,
  SkillDefinition,
} from "../components/sdk";

export type ComponentRegistry = {
  version: number;
  instructions: readonly InstructionDefinition[];
  procedures: readonly ProcedureDefinition[];
  skills: readonly SkillDefinition[];
  agents: readonly AgentDefinition[];
  hooks: readonly HookDefinition[];
};

export type ComponentSurface = {
  instructions: InstructionDefinition[];
  procedures: ProcedureDefinition[];
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
  claudeProcedures: number;
  codexProcedures: number;
};
