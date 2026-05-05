import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const testQualityReviewSkill = defineSkill({
  id: "test-quality-review",
  description: "当用户要审查已有测试代码质量、诊断测试套件衰退风险、mock 滥用、脆弱测试、flaky test 或 coverage illusion 时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "health-score",
      source: new URL("./references/health-score.md", import.meta.url),
      target: "references/health-score.md",
      title: "health-score.md",
      summary: "Reference material for test-quality-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "test-decay-risks",
      source: new URL("./references/test-decay-risks.md", import.meta.url),
      target: "references/test-decay-risks.md",
      title: "test-decay-risks.md",
      summary: "Reference material for test-quality-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for test-quality-review.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
