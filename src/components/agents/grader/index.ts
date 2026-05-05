import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";


export const graderAgent = defineAgent({
  id: "grader",
  description: "Agent grader.",
  role: `你是 Grader。根据执行 transcript 和 outputs 评估 expectations。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [],
  sandbox: AgentSandbox.ReadOnly,
  skills: [

  ],
});
