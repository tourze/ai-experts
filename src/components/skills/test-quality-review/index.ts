import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { preLandingReviewSkill } from "../pre-landing-review/index";

export const testQualityReviewSkill = defineSkill({
  id: "test-quality-review",
  fullName: "测试质量审查",
  description: "当用户要审查已有测试代码质量、诊断测试套件衰退风险、mock 滥用、脆弱测试、flaky test 或 coverage illusion 时使用。",
  useCases: [
    "用户提交测试代码或指向测试文件，要求诊断测试质量问题。",
    "关注\"测试写得好不好\"，不是\"该测什么\"（那用 `testing-strategy`）。",
    "关注已有测试的结构性问题，不是\"怎么补测\"（那用 `testing-strategy` 的缺陷后扩面）。",
    "需要把测试质量风险转成合并阻断项或发布前质量门。",
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
    "已读取实际测试代码",
    "六类风险（T1-T6）都扫描过",
    "每条发现含四要素（Symptom / Source / Consequence / Remedy）",
    "检查了各风险的\"不应标记\"规则，未误报",
    "计算并输出 Test Health Score",
    "未把测试风格偏好当成衰退风险",
  ],
  relatedSkills: [
    {
      get id() {
        return preLandingReviewSkill.id;
      },
      reason: "测试质量问题需要上升为合并阻断项、发布门禁或风险确认时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "泛泛评论：没有 T1-T6 分类、没有代码证据、没有四要素。",
      pass: "四要素 + 风险分类",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "必须先读取真实测试代码，再按 T1-T6 六类衰退风险逐项扫描。",
      "每条发现用 Symptom / Source / Consequence / Remedy 四要素表达，并区分关键、重要、建议。",
      "检查每类风险的不应标记规则，避免把风格偏好误报为测试衰退。",
      "审查维度和纪律读取 `review-workflow`；六类风险和 Test Health Score 读取对应 references。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "按 T1-T6 分类的测试质量发现、代码证据和修复方向。",
      "误报排除、严重度、套件概览和 Test Health Score。",
      "需要补测、降低 mock、重构测试结构或进入合并门禁的风险项。",
    ],
  }),
  references: [
    defineReference({
      id: "review-workflow",
      source: new URL("./references/review-workflow.md", import.meta.url),
      target: "references/review-workflow.md",
      title: "测试质量审查工作流",
      summary: "测试质量审查的六类风险入口、输出格式和纪律守卫。",
      loadWhen: "需要执行测试质量审查主流程或确认输出格式与纪律时读取。",
    }),
    defineReference({
      id: "health-score",
      source: new URL("./references/health-score.md", import.meta.url),
      target: "references/health-score.md",
      title: "health-score.md",
      summary: "Test Health Score 评分标准与计算方法，包括各维度扣分细则和等级判定。",
      loadWhen: "需要在测试质量审查结束时计算并输出 Test Health Score 时读取。",
    }),
    defineReference({
      id: "test-decay-risks",
      source: new URL("./references/test-decay-risks.md", import.meta.url),
      target: "references/test-decay-risks.md",
      title: "test-decay-risks.md",
      summary: "测试衰退六类风险（T1-T6）的详细定义、诊断方法和修复建议。",
      loadWhen: "需要按六类风险维度扫描测试套件或诊断具体衰退问题时读取。",
    }),
  ],
});
