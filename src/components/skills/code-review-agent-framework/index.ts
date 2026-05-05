import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const codeReviewAgentFrameworkSkill = defineSkill({
  id: "code-review-agent-framework",
  fullName: "Code Review Agent 框架",
  description: "当编写或维护只读 reviewer agent 时使用，提供跨语言代码审查的共享触发门禁、只读边界和证据绑定规则。",
  useCases: [
    "当编写或维护只读 reviewer agent 时使用，提供跨语言代码审查的共享触发门禁、只读边界和证据绑定规则。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
