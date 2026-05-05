import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { planningUnderUncertaintySkill } from "../planning-under-uncertainty/index";

export const runningDecisionProcessesSkill = defineSkill({
  id: "running-decision-processes",
  fullName: "决策流程",
  description: "当用户要推进高风险决策、解决分析瘫痪、对齐多方意见或建立 DACI/RAPID 等决策机制时使用；帮助把模糊争论变成可执行流程。",
  useCases: [
    "多方分歧、迟迟无法拍板、需要明确决策人和输入边界。",
    "需要补充经验参考时可阅读 [references/guest-insights.md](references/guest-insights.md)。",
    "做失败预演或事前验尸（pre-mortem）时，可配合 `inversion-strategist` 与 `planning-under-uncertainty`。",
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
        return planningUnderUncertaintySkill.id;
      },
      reason: "做失败预演或事前验尸（pre-mortem）时，可配合 `inversion-strategist` 与 `planning-under-uncertainty`。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "Reference material for running-decision-processes.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
