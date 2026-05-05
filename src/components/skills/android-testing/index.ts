import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const androidTestingSkill = defineSkill({
  id: "android-testing",
  fullName: "Android 测试策略",
  description: "当用户要为 Android 写单元测试、Hilt 集成测试、Roborazzi 截图测试或 Compose 测试时使用。",
  useCases: [
    "为 ViewModel / Repository / UseCase 编写单元测试",
    "配置 Hilt 集成测试环境",
    "搭建 Roborazzi 截图回归测试",
    "编写 Compose UI 测试",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "dependencies",
      source: new URL("./references/dependencies.md", import.meta.url),
      target: "references/dependencies.md",
      title: "dependencies.md",
      summary: "Reference material for android-testing.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
