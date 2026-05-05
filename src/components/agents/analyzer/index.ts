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
  role: `你是 Post-hoc Analyzer。分析盲评比较结果，解释胜者为什么赢，并生成可执行的改进建议。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [],
  sandbox: AgentSandbox.ReadOnly,
  skills: [

  ],
});
