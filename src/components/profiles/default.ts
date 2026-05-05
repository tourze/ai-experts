import { defineProfile } from "../sdk";
import { componentRoutingReminder, generatedDistGuard } from "../hooks/index";
import { componentAgents, componentHooks, componentSkills } from "../registry.generated";

export const defaultProfile = defineProfile({
  id: "default",
  description: "默认组件画像：核心指令、全量 skill/agent/hook 和基础组件治理 hook。",
  instructions: ["core-ai-experts"],
  skills: componentSkills.map((skill) => skill.id),
  agents: componentAgents.map((agent) => agent.id),
  hooks: [
    componentRoutingReminder.id,
    generatedDistGuard.id,
    ...componentHooks.map((hook) => hook.id),
  ],
});
