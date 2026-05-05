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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
