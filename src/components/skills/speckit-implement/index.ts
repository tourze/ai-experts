import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const speckitImplementSkill = defineSkill({
  id: "speckit-implement",
  description: "当用户要依据 tasks.md 执行实现、逐项验证任务状态或控制规格驱动交付回归风险时使用。",
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
      summary: "Eval cases for speckit-implement.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
