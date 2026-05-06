import { componentHooks } from "./hooks/index";
import { componentInstructions } from "./instructions/index";
import { componentAgents, componentSkills } from "./registry.generated";
import { defaultProfile } from "./profiles/default";
import { componentProcedures } from "./scripts/index";

export const registry = {
  version: 1,
  defaultProfile: "default",
  instructions: componentInstructions,
  procedures: componentProcedures,
  scripts: componentProcedures,
  skills: componentSkills,
  agents: componentAgents,
  hooks: componentHooks,
  profiles: [
    defaultProfile,
  ],
};
