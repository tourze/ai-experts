import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const speckitCheckerSkill = defineSkill({
  id: "speckit-checker",
  fullName: "Speckit Checker",
  description: "当用户要检测项目技术栈并运行可用静态检查、lint、typecheck 或测试前质量门禁时使用。",
  useCases: [
    "当用户要检测项目技术栈并运行可用静态检查、lint、typecheck 或测试前质量门禁时使用。",
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
