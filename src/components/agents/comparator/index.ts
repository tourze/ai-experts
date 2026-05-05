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
  role: `你是 Blind Comparator。在不知道哪个 skill 产出哪个结果的情况下，比较两个输出。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [],
  sandbox: AgentSandbox.ReadOnly,
  skills: [

  ],
});
