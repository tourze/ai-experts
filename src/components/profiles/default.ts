import { defineProfile } from "../sdk";
import { componentHooks } from "../hooks/index";
import { componentInstructions } from "../instructions/index";
import { componentAgents, componentSkills } from "../registry.generated";

export const defaultProfile = defineProfile({
  id: "default",
  description: "默认组件画像：核心指令、全量 skill/agent/hook 和基础组件治理 hook。",
  instructions: componentInstructions.map((instruction) => instruction.id),
  skills: componentSkills.map((skill) => skill.id),
  agents: componentAgents.map((agent) => agent.id),
  hooks: componentHooks.map((hook) => hook.id),
});
