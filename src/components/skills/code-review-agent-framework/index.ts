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
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
