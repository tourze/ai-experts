import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { raciMatrixSkill } from "../raci-matrix/index";

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
  ],
  checklist: [
    "[ ] 六个维度都已填写。",
    "[ ] 从中心向外逻辑通顺。",
    "[ ] 做了一致性交叉检查。",
    "[ ] 不一致处有调整方向。",
  ],
  relatedSkills: [
    {
      get id() {
        return raciMatrixSkill.id;
      },
      reason: "只需明确职责分工：不需要重新设计组织，只理清分工用 `raci-matrix`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "talent-management",
      source: new URL("./references/talent-management.md", import.meta.url),
      target: "references/talent-management.md",
      title: "talent-management.md",
      summary: "Reference material for org-canvas.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "team-composition-analysis",
      source: new URL("./references/team-composition-analysis.md", import.meta.url),
      target: "references/team-composition-analysis.md",
      title: "team-composition-analysis.md",
      summary: "Reference material for org-canvas.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
