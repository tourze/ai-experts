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
  constraints: [
    "先读真实测试代码，不凭猜测。",
    "按六类衰退风险（T1-T6）逐项扫描，不遗漏维度。",
    "每条发现必须遵循 **Iron Law 四要素**：Symptom → Source → Consequence → Remedy，缺一不可。",
    "按严重度分级：🔴 关键 > 🟡 重要 > 🟢 建议。每个风险类型都有严重度指引和\"不应标记\"规则。",
    "审查结束输出 **Test Health Score**（100 分制）。",
    "无问题则明确说明——100 分合法。",
  ],
  checklist: [
    "[ ] 已读取实际测试代码",
    "[ ] 六类风险（T1-T6）都扫描过",
    "[ ] 每条发现含四要素（Symptom / Source / Consequence / Remedy）",
    "[ ] 检查了各风险的\"不应标记\"规则，未误报",
    "[ ] 计算并输出 Test Health Score",
    "[ ] 未把测试风格偏好当成衰退风险",
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
