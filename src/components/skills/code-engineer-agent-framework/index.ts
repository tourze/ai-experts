import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const codeEngineerAgentFrameworkSkill = defineSkill({
  id: "code-engineer-agent-framework",
  fullName: "Code Engineer Agent 框架",
  description: "当编写或维护可写代码实现类 engineer agent 时使用，提供跨语言实现门禁、写入边界、验证闭环和交付报告骨架。",
  useCases: [
    "当编写或维护可写代码实现类 engineer agent 时使用，提供跨语言实现门禁、写入边界、验证闭环和交付报告骨架。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
