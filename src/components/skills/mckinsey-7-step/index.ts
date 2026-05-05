import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const mckinseyStepSkill = defineSkill({
  id: "mckinsey-7-step",
  description: "当用户要系统性解决复杂业务问题、做咨询式分析或结构化拆解方案时使用。简单选择题或已知答案的确认性提问不适用。",
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
      summary: "Eval cases for mckinsey-7-step.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
