import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { deepResearchSkill } from "../deep-research/index";

export const comparativeAnalysisSkill = defineSkill({
  id: "comparative-analysis",
  fullName: "对比分析",
  description: "当用户要对比两个或多个仓库、框架、方案、工具或系统，需要结构化差异矩阵、优劣判断和可落地建议时使用。",
  useCases: [
    "用户说\"A 和 B 哪个好\"\"帮我对比 X 和 Y\"\"选哪个方案\"。",
    "技术选型、架构决策、工具评估中需要有理有据的比较。",
    "对比对象可以是：仓库、框架、云服务、设计方案、架构模式。",
    "如果只需分析单个仓库，直接进入分析流程。",
    "如果对比的外部概念需要先收集信息，先用 `deep-research`。",
  ],
  constraints: [
    "先明确对比维度，再逐维度展开。维度从用户场景出发，不凑数。",
    "每个维度必须有具体证据（代码、文档、数据），不能只凭印象。",
    "避免假对称：A 和 B 解决不同问题时，先说清定位差异。",
    "必须下判断——用户要\"该选哪个\"，不是\"两个都行\"。",
    "判断附带适用条件：\"场景 X 选 A；场景 Y 选 B\"。",
    "按 [输出模板](references/output-template.md) 输出。",
  ],
  checklist: [
    "是否先明确了维度，而不是想到哪比到哪。",
    "是否每个维度都有证据支撑。",
    "是否给出了条件化建议，而不是无条件偏向某方。",
    "是否检查了定位不对称问题。",
    "是否区分了\"核心差异\"和\"不影响决策的细节\"。",
  ],
  relatedSkills: [
    {
      get id() {
        return deepResearchSkill.id;
      },
      reason: "如果对比的外部概念需要先收集信息，先用 `deep-research`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "打勾无判断",
      pass: "条件化建议",
    }),
    defineAntiPattern({
      fail: "维度不统一",
      pass: "维度矩阵",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先澄清对比目标、用户决策场景、约束和必须下判断的问题。",
      "确定统一维度：功能、架构、性能、生态、学习曲线、维护、许可证或用户指定维度。",
      "逐维度收集证据；代码仓看代码和 git 历史，外部产品查官方文档、定价、案例和限制。",
      "检查定位不对称和遗漏维度，避免把解决不同问题的对象硬凑成同类比较。",
      "需要标准报告格式时读取 `output-template` reference；外部概念资料不足时联动 `deep-research`。",
      "输出矩阵、详细分析和条件化建议：场景 X 选 A，场景 Y 选 B。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "对比目标、场景、约束和候选对象定位。",
      "统一维度矩阵和每项证据来源。",
      "核心差异、假对称风险和不影响决策的细节。",
      "条件化选择建议、适用边界和后续验证。",
    ],
  }),
  references: [
    defineReference({
      id: "output-template",
      source: new URL("./references/output-template.md", import.meta.url),
      target: "references/output-template.md",
      title: "output-template.md",
      summary: "对比分析报告标准输出模板：维度矩阵、证据列表与条件化建议格式。",
      loadWhen: "需要按标准格式组织对比分析结论或输出报告时读取。",
    }),
  ],
});
