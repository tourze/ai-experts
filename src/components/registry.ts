import { componentHooks } from "./hooks/index";
import { componentInstructions } from "./instructions/index";
import { componentRules } from "./rules/index";
import { componentAgents, componentSkills } from "./registry.generated";
import { componentProcedures } from "./procedures/index";

export const registry = {
  version: 1,
  instructions: componentInstructions,
  procedures: componentProcedures,
  skills: componentSkills,
  agents: componentAgents,
  hooks: componentHooks,
  rules: componentRules,
};
