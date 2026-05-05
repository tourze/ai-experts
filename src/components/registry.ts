import { componentHooks } from "./hooks/index";
import { coreInstruction } from "./instructions/core/index";
import { componentAgents, componentSkills } from "./registry.generated";
import { defaultProfile } from "./profiles/default";

export const registry = {
  version: 1,
  defaultProfile: "default",
  instructions: [
    coreInstruction,
  ],
  skills: componentSkills,
  agents: componentAgents,
  hooks: componentHooks,
  profiles: [
    defaultProfile,
  ],
};
