import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { firstPrinciplesDecomposerSkill } from "../first-principles-decomposer/index";
import { planningUnderUncertaintySkill } from "../planning-under-uncertainty/index";

export const runningDecisionProcessesSkill = defineSkill({
  id: "running-decision-processes",
  fullName: "决策流程",
  description: "当用户要推进高风险决策、解决分析瘫痪、对齐多方意见或建立 DACI/RAPID 等决策机制时使用；帮助把模糊争论变成可执行流程。",
  useCases: [
    "多方分歧、迟迟无法拍板、需要明确决策人和输入边界。",
    "需要补充经验参考时可阅读 [references/guest-insights.md](references/guest-insights.md)。",
    "做失败预演或事前验尸（pre-mortem）时，可配合 `first-principles-decomposer` 与 `planning-under-uncertainty`。",
    "需要把争议证据转成先验、后验、行动阈值和敏感性报告时，配合 `what-if-oracle`。",
  ],
  constraints: [
    "先定义决策问题、影响范围、不可逆程度和 deadline，再设计流程。",
    "明确谁提供输入、谁决策、谁执行，避免“所有人都参与所以没人负责”。",
    "决策需要记录理由与前提，方便日后复盘，不是只留一个结论。",
  ],
  checklist: [
    "决策问题、选项和标准已写清。",
    "角色分工、输入边界和最终责任人明确。",
    "已定义做出决定的时间点和所需证据。",
    "结论、理由和后续动作可被追踪。",
  ],
  relatedSkills: [
    {
      get id() {
        return firstPrinciplesDecomposerSkill.id;
      },
      reason: "需要反推失败路径、拆解关键假设或做事前验尸时联动。",
    },
    {
      get id() {
        return planningUnderUncertaintySkill.id;
      },
      reason: "高不确定性决策需要情景、触发条件和可逆性设计时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "无限讨论",
      pass: "DACI + deadline",
    }),
    defineAntiPattern({
      fail: "只比谁声音大",
      pass: "显式标准",
    }),
    defineAntiPattern({
      fail: "不记决策依据",
      pass: "Decision Log",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先写清决策问题、影响范围、不可逆程度、deadline 和不决策的代价。",
      "列出备选项、决策标准、最低所需证据和明确不讨论的范围。",
      "定义角色分工：谁输入、谁建议、谁决策、谁执行、谁被通知，避免多人参与但无人负责。",
      "需要突破僵局或参考常见陷阱时读取 `guest-insights` reference；高不确定性可联动 `planning-under-uncertainty`。",
      "设定决策时间点、升级条件、记录格式和复盘触发条件。",
      "形成 decision log，记录结论、理由、前提、反对意见和后续动作。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "决策问题、选项、标准和证据边界。",
      "DACI/RAPID 风格角色分工和最终责任人。",
      "决策时间点、升级条件和复盘条件。",
      "Decision log：结论、理由、前提、反对意见和行动项。",
    ],
  }),
  references: [
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "基于真实经验总结的常见决策陷阱与高效决策方法论参考。",
      loadWhen: "需要经验参考来突破决策僵局或避免常见决策偏差时读取。",
    }),
  ],
});
