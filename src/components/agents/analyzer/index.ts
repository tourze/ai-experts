import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";


export const analyzerAgent = defineAgent({
  id: "analyzer",
  description: "Agent analyzer.",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [],
  sandbox: AgentSandbox.ReadOnly,
  skills: [

  ],
});
