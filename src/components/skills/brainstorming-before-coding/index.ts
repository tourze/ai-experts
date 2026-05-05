import { InvocationPolicy, KnownTool, Platform, defineSkill } from "../../sdk";

export const brainstormingBeforeCodingSkill = defineSkill({
  id: "brainstorming-before-coding",
  fullName: "编码前头脑风暴",
  description:
    "当用户要在创建功能、构建组件、添加新行为或修改架构前做设计澄清和方案选择时使用。简单修 bug 或单行改动不需要。",
  useCases: [
    "用户要做新功能、新组件、新模块。",
    "用户要做架构级改造或重构。",
    '用户说"帮我做一个 X"但 X 的边界和设计不明确。',
    "交叉引用：设计确认后用 `feature-dev` 或 `task-decomposer` 拆解实现。",
  ],
  constraints: [
    '**违反字面规则 = 违反规则精神。不存在"灵活变通"。**',
    "<HARD-GATE> 在展示设计方案并获得用户批准之前，不启动任何实现 skill、不写任何代码、不创建任何文件、不做任何脚手架操作。无论任务看起来多简单，都适用。 </HARD-GATE>",
  ],
  checklist: [
    "已探索项目上下文（文件、文档、提交）",
    "已通过提问理解用户意图和约束",
    "已提出 2-3 个方案并附权衡",
    "已分段展示设计并获得确认",
    "用户明确批准了设计方案",
    "才转向实现",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
