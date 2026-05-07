import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { planningUnderUncertaintySkill } from "../planning-under-uncertainty/index";

export const evaluatingNewTechnologySkill = defineSkill({
  id: "evaluating-new-technology",
  fullName: "评估新技术",
  description: "当用户要评估新技术、做 build vs buy、筛选 AI/软件供应商、判断技术成熟度，或评估产品 AI 功能就绪度时使用。",
  useCases: [
    "选型新框架、AI 服务、基础设施工具或第三方平台。",
    "需要参考 [references/guest-insights.md](references/guest-insights.md) 的常见判断维度。",
    "讨论长期不确定性时，可配合 `planning-under-uncertainty`。",
  ],
  constraints: [
    "先定义业务问题和约束，再讨论技术；技术本身不是目标。",
    "Build vs buy 不是二选一，必须同时看集成成本、迁移成本和团队学习成本。",
    "评估结论要考虑退出路径，避免把组织锁死在脆弱抽象上。",
  ],
  checklist: [
    "问题定义、成功标准和约束已经明确。",
    "已覆盖能力、成本、供应商风险和替代方案。",
    "有试点或验证路径，而不是直接全量切换。",
    "结论包含保留条件和退出策略。",
  ],
  relatedSkills: [
    {
      get id() {
        return planningUnderUncertaintySkill.id;
      },
      reason: "讨论长期不确定性时，可配合 `planning-under-uncertainty`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "跟风选型",
      pass: "问题驱动 + 试点",
    }),
    defineAntiPattern({
      fail: "只比价格",
      pass: "TCO 三层",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先定义要解决的业务问题、成功标准、约束和不可接受风险。",
      "列出候选技术/供应商、替代方案和不采用的基线方案。",
      "比较能力匹配、成熟度、集成成本、迁移成本、团队学习成本、供应商锁定和安全/合规风险。",
      "设计试点或验证路径，明确验证指标、时间盒和退出条件；长期不确定性可联动 `planning-under-uncertainty`。",
      "输出建议、保留条件、后续验证和退出策略。",
    ],
  }),
  outputs: defineSkillOutputs({
    title: "输出模板",
    items: [
      "选型表列：选项、解决的问题、成熟度、集成成本、风险、建议。",
    ],
  }),
  references: [
    defineReference({
      id: "ai-product-readiness",
      source: new URL("./references/ai-product-readiness.md", import.meta.url),
      target: "references/ai-product-readiness.md",
      title: "ai-product-readiness.md",
      summary: "产品 AI 功能就绪度的评估维度与检查框架。",
      loadWhen: "需要评估产品是否适合引入 AI 能力或判断 AI 功能的成熟度时读取。",
    }),
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "技术选型中的常见判断维度和决策启发。",
      loadWhen: "需要参考已知的判断框架来评估新技术或供应商时读取。",
    }),
    defineReference({
      id: "tech-maturity-curve",
      source: new URL("./references/tech-maturity-curve.md", import.meta.url),
      target: "references/tech-maturity-curve.md",
      title: "tech-maturity-curve.md",
      summary: "技术成熟度曲线（Hype Cycle）各阶段的特征与采用策略。",
      loadWhen: "需要判断新技术所处的成熟度阶段或制定采用时间策略时读取。",
    }),
  ],
});
