import { componentRoutingReminder, generatedDistGuard } from "./hooks/index.js";
import { coreInstruction } from "./instructions/core/index.js";
import { componentAgents, componentHooks, componentSkills } from "./registry.generated.js";
import { defaultProfile } from "./profiles/default.js";

export const registry = {
  version: 1,
  defaultProfile: "default",
  instructions: [
    coreInstruction,
  ],
  skills: componentSkills,
  agents: componentAgents,
  hooks: [
    componentRoutingReminder,
    generatedDistGuard,
    ...componentHooks,
  ],
  profiles: [
    defaultProfile,
  ],
};
