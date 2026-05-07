import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, codeReviewAssessCode, codeReviewAssessTests } from "../../procedures/index";

import { complexityReducerSkill } from "../complexity-reducer/index";
import { testQualityReviewSkill } from "../test-quality-review/index";

export const codeReviewSkill = defineSkill({
  id: "code-review",
  fullName: "代码审查",
  description:
    "当用户要求审查代码质量、发现命名或职责问题、检查错误处理和边界情况时使用。支持标准/高压两档强度——高压模式由 brutal-honesty-review 合并而来。",
  useCases: [
    "用户提交代码或文件，要求找出逻辑和设计层面的问题。",
    '关注"代码写得好不好"，不是"能不能上线"（那用 `pre-landing-review`）。',
    "需要识别命名、职责、错误处理、边界情况、复杂度或测试质量问题。",
  ],
  constraints: [
    '**违反字面规则 = 违反规则精神。不存在"灵活变通"。**',
    "先读真实代码或 diff，不凭猜测。",
    "不审查纯风格问题（缩进、括号、行长度）——那是 linter 的事。",
    "每条发现必须遵循 **Iron Law 四要素**：Symptom → Source → Consequence → Remedy，缺一不可。",
    '按严重度分级：🔴 关键 > 🟡 重要 > 🟢 建议。参考 [references/dimensions.md](./references/dimensions.md) 的严重度指引和"不应标记"规则。',
    "审查结束输出 **Health Score**（100 分制），格式见 [references/health-score.md](./references/health-score.md)。",
    "无问题则明确说明，不硬凑——100 分是合法的。",
  ],
  checklist: [
    "已确认审查强度（标准/高压）",
    "已读取实际代码或 diff",
    "每条发现含四要素",
    "按严重度分级，参考了各维度指引",
    '检查了"不应标记"规则，未误报',
    "计算并输出 Health Score",
    "未混入 linter 能抓的风格问题",
    "高压模式：每条批评有证据 + 修复方向，未攻击作者人格",
  ],
  relatedSkills: [
    {
      get id() {
        return complexityReducerSkill.id;
      },
      reason: "审查结论指向函数过长、嵌套过深、条件复杂或可维护性复杂度时联动。",
    },
    {
      get id() {
        return testQualityReviewSkill.id;
      },
      reason: "审查对象主要是测试代码、mock 滥用、脆弱测试或覆盖幻觉时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "凭猜测：\"getUser() 可能有 null 安全问题 / 建议加错误处理\" → 没有文件位置、没有代码证据。",
      pass: "四要素完整",
    }),
    defineAntiPattern({
      fail: "审查变重写：给出 30 行替代代码 → 审查者的职责是指出问题，不是替人写代码。",
      pass: "指出问题 + 给方向：高压模式反模式见 [references/brutal-mode.md](./references/brutal-mode.md)。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认审查强度；用户未指定时使用标准模式，高压模式只在明确授权时启用。",
      "必须先读取真实代码或 diff，再按命名语义、函数设计、错误处理、逻辑边界、抽象和可读性逐项审查。",
      "每条发现遵循 Symptom / Source / Consequence / Remedy 四要素，并按关键、重要、建议排序。",
      "审查强度、纪律守卫和 procedure 入口读取 `review-workflow`；严重度与 Health Score 读取对应 references。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "按严重度排序的代码审查发现，每条含症状、来源、后果和修复方向。",
      "需要跳转的文件 / 代码位置、误报排除说明和不应标记项。",
      "Health Score、无问题时的明确结论，以及是否需要测试质量或复杂度专项联动。",
    ],
  }),
  tools: [],
  procedures: [
    procedureUse(codeReviewAssessCode),
    procedureUse(codeReviewAssessTests),
  ],
  references: [
    defineReference({
      id: "review-workflow",
      source: new URL("./references/review-workflow.md", import.meta.url),
      target: "references/review-workflow.md",
      title: "代码审查工作流",
      summary: "标准/高压审查强度、审查维度、纪律守卫和自动化预扫描 procedure 用法。",
      loadWhen: "需要执行代码审查主流程或确认审查强度、纪律和预扫描入口时读取。",
    }),
    defineReference({
      id: "brutal-mode",
      source: new URL("./references/brutal-mode.md", import.meta.url),
      target: "references/brutal-mode.md",
      title: "brutal-mode.md",
      summary: "Code Review Brutal Mode 严格评审模式操作指南与检查清单。",
      loadWhen:
        "需要执行最高强度的代码评审或发现深层次设计问题时读取。",
    }),
    defineReference({
      id: "dimensions",
      source: new URL("./references/dimensions.md", import.meta.url),
      target: "references/dimensions.md",
      title: "dimensions.md",
      summary: "代码评审维度定义：正确性、安全性、性能、可维护性与可读性的评分标准。",
      loadWhen:
        "需要确定评审覆盖的维度或对各维度评分时读取。",
    }),
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "评审纪律守卫：常见偷懒行为、跳步借口与纠正方法。",
      loadWhen:
        "需要确保评审过程不偷工减料或发现评审人跳步时读取。",
    }),
    defineReference({
      id: "health-score",
      source: new URL("./references/health-score.md", import.meta.url),
      target: "references/health-score.md",
      title: "health-score.md",
      summary: "代码健康度评分算法：从多维度到综合分数的计算逻辑。",
      loadWhen:
        "需要计算或解释代码健康度综合分数时读取。",
    }),
    defineReference({
      id: "receiving-code-review",
      source: new URL("./references/receiving-code-review.md", import.meta.url),
      target: "references/receiving-code-review.md",
      title: "receiving-code-review.md",
      summary: "接收代码评审时的行为准则：如何面对批评、避免防御心态。",
      loadWhen:
        "用户表现出对评审结果的抗拒或防御心态时读取。",
    }),
  ],
});
