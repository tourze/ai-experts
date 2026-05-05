import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const brainstormingBeforeCodingSkill = defineSkill({
  id: "brainstorming-before-coding",
  fullName: "编码前头脑风暴",
  description: "当用户要在创建功能、构建组件、添加新行为或修改架构前做设计澄清和方案选择时使用。简单修 bug 或单行改动不需要。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for brainstorming-before-coding.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
