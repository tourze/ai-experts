import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const androidArchitectureSkill = defineSkill({
  id: "android-architecture",
  fullName: "Android 现代架构",
  description: "当用户要设计或重构 Android 架构、Clean Architecture、Hilt 注入或多模块时使用。",
  useCases: [
    "设计或重构 Android 应用架构",
    "搭建新项目的模块结构",
    "配置 Hilt 依赖注入",
    "评审代码的分层合理性",
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
