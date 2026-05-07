import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { estimateCalibratorSkill } from "../estimate-calibrator/index";

export const planningUnderUncertaintySkill = defineSkill({
  id: "planning-under-uncertainty",
  fullName: "不确定性下的规划",
  description: "当用户要在高度不确定条件下做产品或战略规划时使用；帮助识别未知类型、保留选项、设置决策点与滚动调整机制。",
  useCases: [
    "AI/新市场/复杂依赖项目的路线图规划、资源分配与阶段承诺。",
    "需要补充经验参考时可阅读 [references/guest-insights.md](references/guest-insights.md)。",
    "需要把不确定性转成估算或版本节奏时，可配合 `estimate-calibrator`。",
    "需要把关键未知项转成先验、证据更新、行动阈值和敏感性报告时，配合 `what-if-oracle`。",
  ],
  constraints: [
    "先判断不确定性来自技术、市场、组织还是外部环境，再选规划方式。",
    "规划输出必须包含检查点、触发条件和转向标准，而不是一次性拍死全年计划。",
    "“保持灵活”不是借口，仍然要写清当前最优下注与放弃条件。",
  ],
  checklist: [
    "已把未知项分类，并区分可验证与不可控部分。",
    "当前计划保留了足够的可选项和缓冲。",
    "决策点、观测指标和责任人明确。",
    "对外承诺与内部不确定性说明一致。",
  ],
  relatedSkills: [
    {
      get id() {
        return estimateCalibratorSkill.id;
      },
      reason: "需要把不确定性转成估算或版本节奏时，可配合 `estimate-calibrator`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "线性年度计划",
      pass: "阶段 + 检查点",
    }),
    defineAntiPattern({
      fail: "不确定就不决定",
      pass: "写下当前最优下注 + 放弃条件",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "识别不确定性来源：技术、市场、组织、外部环境或依赖链。",
      "区分可验证未知项、不可控外部变量和当前必须下注的假设。",
      "为每个阶段写当前最优下注、观察指标、触发条件、放弃条件和责任人。",
      "把近期计划做实，把远期计划写成选项和决策点；估算或节奏可联动 `estimate-calibrator`。",
      "输出对外承诺、内部不确定性说明和滚动调整机制。",
    ],
  }),
  outputs: defineSkillOutputs({
    title: "输出模板",
    items: [
      "决策表列：阶段、当前下注、关键未知项、触发条件、下一个决策点。",
    ],
  }),
  references: [
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "Guest 洞察与经验参考，提供不确定性下规划的实际案例和决策经验。",
      loadWhen: "需要补充不确定性规划的经验参考和实际案例时读取。",
    }),
  ],
});
