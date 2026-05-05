import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const brainstormingBeforeCodingSkill = defineSkill({
  id: "brainstorming-before-coding",
  fullName: "编码前头脑风暴",
  description: "当用户要在创建功能、构建组件、添加新行为或修改架构前做设计澄清和方案选择时使用。简单修 bug 或单行改动不需要。",
  useCases: [
    "用户要做新功能、新组件、新模块。",
    "用户要做架构级改造或重构。",
    "用户说\"帮我做一个 X\"但 X 的边界和设计不明确。",
    "交叉引用：设计确认后用 `feature-dev` 或 `task-decomposer` 拆解实现。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
