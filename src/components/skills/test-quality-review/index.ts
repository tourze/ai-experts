import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const testQualityReviewSkill = defineSkill({
  id: "test-quality-review",
  fullName: "测试质量审查",
  description: "当用户要审查已有测试代码质量、诊断测试套件衰退风险、mock 滥用、脆弱测试、flaky test 或 coverage illusion 时使用。",
  useCases: [
    "用户提交测试代码或指向测试文件，要求诊断测试质量问题。",
    "关注\"测试写得好不好\"，不是\"该测什么\"（那用 `testing-strategy`）。",
    "关注已有测试的结构性问题，不是\"怎么补测\"（那用 `testing-strategy` 的缺陷后扩面）。",
    "交叉引用：高压审查使用 `code-review` 高压模式；合并门禁配合 `pre-landing-review`。",
  ],
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
  ],
});
