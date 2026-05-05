import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const refactorPlanningMethodSkill = defineSkill({
  id: "refactor-planning-method",
  fullName: "重构计划方法论",
  description: "当需要为既有代码制定系统化重构计划时使用；提供基线建立、多视角问题验证、接缝识别和增量拆步的完整方法论。",
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
      summary: "Eval cases for refactor-planning-method.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
