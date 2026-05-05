import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const priorityJudgeSkill = defineSkill({
  id: "priority-judge",
  fullName: "优先级判断助手",
  description: "当用户要给待办、项目、机会、风险或资源约束排优先级，决定先做什么、暂缓什么、放弃什么时使用。",
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
      summary: "Eval cases for priority-judge.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
