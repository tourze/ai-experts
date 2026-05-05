import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";


export const comparatorAgent = defineAgent({
  id: "comparator",
  description: "Agent comparator.",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [],
  sandbox: AgentSandbox.ReadOnly,
  skills: [

  ],
});
