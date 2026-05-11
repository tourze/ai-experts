import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { businessHealthDiagnosticSkill } from "../business-health-diagnostic/index";
import { raciMatrixSkill } from "../raci-matrix/index";
import { swotAnalysisSkill } from "../swot-analysis/index";

export const orgCanvasSkill = defineSkill({
  id: "org-canvas",
  fullName: "组织模式画布",
  description: "当用户要用组织画布设计组织架构、检查战略匹配度或规划组织重组时使用。纯岗位 JD 或单点汇报关系调整不适用。",
  useCases: [
    "新业务需要从零设计组织结构。",
    "现有组织与战略不匹配，需要重组。",
    "与 `swot-analysis` 和 `raci-matrix` 配合做组织诊断与重设计。",
  ],
  constraints: [
    "六个维度：企业定位（中心）、挑战与问题、未来愿景、产品与服务、策略与机会、市场定位。",
    "从中心（企业定位）向外延伸，不是从左到右线性填写。",
    "核心是检查六个维度之间的**逻辑一致性**——不一致处就是组织需要调整的地方。",
    "组织画布关注\"为什么这样组织\"，不是\"谁向谁汇报\"——不要画成组织架构图。",
    "**组织设计第一原则：结构跟随战略**。先确定策略和产品方向，再设计支撑它们的组织形态。反过来做 = 为组织服务而不是为客户服务。",
    "**常见陷阱：照搬标杆公司的组织结构**。Spotify 模型在 30 人团队不 work，Google 的 OKR 在 5 人创业公司是过度设计。组织设计必须匹配自身阶段。",
    "不适用场景：诊断现有组织问题用 `swot-analysis` 和 `business-health-diagnostic`（画布是设计工具不是诊断工具）；需要深入人才管理与团队设计时参考对应 references。",
  ],
  checklist: [
    "六个维度都已填写。",
    "从中心向外逻辑通顺。",
    "做了一致性交叉检查。",
    "不一致处有调整方向。",
  ],
  relatedSkills: [
    {
      get skill() {
        return raciMatrixSkill;
      },
      reason: "只需明确职责分工：不需要重新设计组织，只理清分工用 `raci-matrix`。",
    },
    {
      get skill() {
        return swotAnalysisSkill;
      },
      reason: "组织问题需要先从优势、劣势、机会、威胁做诊断，再决定是否重设计时联动。",
    },
    {
      get skill() {
        return businessHealthDiagnosticSkill;
      },
      reason: "用户目标是诊断企业经营健康、增长、组织或财务症状，而不是设计组织画布时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "组织架构图当画布",
      pass: "战略驱动的组织设计",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先定义中心命题：企业定位、当前阶段、业务边界和这次组织设计要解决的问题。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "围绕中心填写六个维度：挑战与问题、未来愿景、产品与服务、策略与机会、市场定位，以及中心企业定位。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "逐项做一致性交叉检查：战略是否支撑愿景，产品是否服务定位，组织能力是否能承接策略。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "把不一致处翻译成组织设计问题：职责缺口、协作断点、能力缺口、决策瓶颈或汇报关系错配。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "需要深入人才管理或团队构成时读取对应 reference，不在画布里伪造人才结论。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "输出调整方向，并说明哪些问题只需用 `raci-matrix` 理清职责，不需要重组。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "六维组织画布和输入事实。",
      "维度之间的不一致点与证据。",
      "组织设计影响：结构、职责、能力和决策机制。",
      "后续动作：重组方向、RACI 澄清项、人才/团队分析需求。",
    ],
  }),
  references: [
    defineReference({
      id: "talent-management",
      source: new URL("./references/talent-management.md", import.meta.url),
      target: "references/talent-management.md",
      title: "talent-management.md",
      summary: "人才管理的框架与实践指南，包括招聘、发展、保留和继任计划的组织设计要点。",
      loadWhen: "需要设计或审查组织的人才管理体系，或与组织画布配合做人才维度的诊断时读取。",
    }),
    defineReference({
      id: "team-composition-analysis",
      source: new URL("./references/team-composition-analysis.md", import.meta.url),
      target: "references/team-composition-analysis.md",
      title: "team-composition-analysis.md",
      summary: "团队构成的分析方法，包括角色分布、技能组合和团队健康度评估。",
      loadWhen: "需要分析现有团队的组成结构、识别技能缺口或评估团队健康度时读取。",
    }),
  ],
});
