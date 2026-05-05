import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const planReviewSkill = defineSkill({
  id: "plan-review",
  description: "在编码前审查实现计划、方案文档或 RFC 时使用；重点核 scope、假设、风险、依赖、回归面和缺口。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "project-detection",
      source: new URL("./references/project-detection.md", import.meta.url),
      target: "references/project-detection.md",
      title: "project-detection.md",
      summary: "Reference material for plan-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for plan-review.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
