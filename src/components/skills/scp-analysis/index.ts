import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { businessHealthDiagnosticSkill } from "../business-health-diagnostic/index";
import { pestelAnalysisSkill } from "../pestel-analysis/index";
import { portersFiveForcesSkill } from "../porters-five-forces/index";

export const scpAnalysisSkill = defineSkill({
  id: "scp-analysis",
  fullName: "SCP 分析模型",
  description: "当用户要分析外部冲击对行业和企业的传导影响或连锁效应时使用。常规竞争分析或内部经营诊断不适用。",
  useCases: [
    "分析外部冲击（政策/技术/经济/社会变化）对企业的传导影响。",
    "与 `pestel-analysis` 配合：PESTEL 扫描外部因素，SCP 分析传导路径。",
  ],
  constraints: [
    "传导链条：外部冲击 -> 行业结构(Structure) -> 企业行为(Conduct) -> 经营绩效(Performance)。",
    "**不能跳过中间环节**：冲击不是直接影响绩效，而是通过结构和行为间接影响。\"AI 出现了 -> 我们要转型 AI\"就是跳过了传导分析。",
    "同一冲击对不同行业、不同规模企业的传导路径可能完全不同——必须区分领先企业、中小企业和自身。",
    "行业结构变化往往是不可逆的，企业行为必须适应而非抵抗。",
    "不适用场景：没有明确外部冲击事件时用 `porters-five-forces` 做常规行业分析；需要内部诊断时用 `business-health-diagnostic`，SCP 只看外部传导。",
  ],
  checklist: [
    "传导链条完整：冲击 -> 结构 -> 行为 -> 绩效。",
    "没有跳过中间环节直接从冲击推绩效。",
    "区分了对不同类型企业的差异化影响。",
    "给出了基于传导分析的战略建议。",
  ],
  relatedSkills: [
    {
      get id() {
        return pestelAnalysisSkill.id;
      },
      reason: "需要先系统扫描政策、经济、社会、技术、环境和法律等外部因素时联动。",
    },
    {
      get id() {
        return portersFiveForcesSkill.id;
      },
      reason: "没有明确外部冲击、需要常规行业结构和竞争压力分析时联动。",
    },
    {
      get id() {
        return businessHealthDiagnosticSkill.id;
      },
      reason: "问题转向内部经营健康度、组织能力或专项业务诊断时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "冲击直推结论",
      pass: "完整传导分析",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "定义外部冲击：政策、技术、经济或社会变化是什么，发生时间、强度、确定性和影响范围如何。",
      "分析行业结构变化：供需、进入壁垒、替代品、渠道、成本结构、规模经济和议价权发生了什么变化。",
      "推导企业行为变化：领先企业、中小企业和自身可能如何定价、投资、扩张、收缩、合作或转型。",
      "推导经营绩效影响：收入、成本、利润率、现金流、增长、风险暴露和估值逻辑如何变化。",
      "检查传导链完整性：不能从冲击直接跳到绩效结论，必须说明结构和行为中间环节。",
      "给出战略选项：列出适应结构变化的动作、触发条件、风险和监测指标。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "外部冲击定义和关键不确定性。",
      "S-C-P 传导链表：结构变化、行为变化、绩效影响。",
      "不同类型企业的差异化影响。",
      "战略建议、风险、验证证据和监测指标。",
    ],
  }),
});
