import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
    "[ ] 问题定义、成功标准和约束已经明确。",
    "[ ] 已覆盖能力、成本、供应商风险和替代方案。",
    "[ ] 有试点或验证路径，而不是直接全量切换。",
    "[ ] 结论包含保留条件和退出策略。",
  ],
  relatedSkills: [
    {
      get id() {
        return planningUnderUncertaintySkill.id;
      },
      reason: "讨论长期不确定性时，可配合 `planning-under-uncertainty`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "ai-product-readiness",
      source: new URL("./references/ai-product-readiness.md", import.meta.url),
      target: "references/ai-product-readiness.md",
      title: "ai-product-readiness.md",
      summary: "Reference material for evaluating-new-technology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "Reference material for evaluating-new-technology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "tech-maturity-curve",
      source: new URL("./references/tech-maturity-curve.md", import.meta.url),
      target: "references/tech-maturity-curve.md",
      title: "tech-maturity-curve.md",
      summary: "Reference material for evaluating-new-technology.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
