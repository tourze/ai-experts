import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const detoxMobileTestSkill = defineSkill({
  id: "detox-mobile-test",
  fullName: "Detox 移动端测试",
  description: "当用户要编写或排查 Detox E2E 测试、移动端自动化、flaky 测试、CI 设备启动或 matcher 等待问题时使用。",
  useCases: [
    "React Native 项目需要覆盖登录、下单、支付、权限、深链等关键 E2E 流程。",
    "CI 上的 Detox 用例经常 flaky，需要收紧选择器和等待策略。",
    "需要把本地运行、模拟器/模拟机配置与 CI 执行命令统一起来。",
    "单元测试与组件测试任务更适合联动 `javascript-typescript-jest`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for detox-mobile-test.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
