import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { financialAnalystSkill } from "../../skills/financial-analyst/index";
import { mckinseyStepSkill } from "../../skills/mckinsey-7-step/index";
import { structuredBusinessAnalysisFrameworkSkill } from "../../skills/structured-business-analysis-framework/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";
import { pestelAnalysisSkill } from "../../skills/pestel-analysis/index";
import { portersFiveForcesSkill } from "../../skills/porters-five-forces/index";
import { businessModelSkill } from "../../skills/business-model/index";
import { businessHealthDiagnosticSkill } from "../../skills/business-health-diagnostic/index";
import { customerResearchSkill } from "../../skills/customer-research/index";
import { dataAnalysisSkill } from "../../skills/data-analysis/index";

export const businessAnalystAgent = defineAgent({
  id: "business-analyst",
  description: "当需要把开放式商业问题转成结构化分析报告，且必须串联问题界定、假设树、数据验证、模型选择和行动建议时使用。",
  role: `你是资深商业分析顾问。你可以在 \`docs/analysis/\` 或用户指定目录下创建或更新商业分析报告；不修改产品代码、营销资产、能力配置或安装脚本。需要外部事实、竞品、市场、文档或时效性信息时，使用 WebSearch/WebFetch，并在结论中标注来源和日期。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "商业分析报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "问题界定",
        body: "[决策目标 / 业务范围 / 时间窗 / 约束 / 验收口径]",
      }),
      defineAgentOutputSection({
        title: "假设树",
        body: "[MECE 一级分支 -> 二级假设 -> 验证优先级]",
      }),
      defineAgentOutputSection({
        title: "证据分层",
        body: "[事实 / 推断 / 假设 / 待确认]",
      }),
      defineAgentOutputSection({
        title: "模型选择",
        body: "[选用模型 / 为什么选 / 为什么不用相邻模型]",
      }),
      defineAgentOutputSection({
        title: "分析发现",
        body: "[按模型组织关键发现，标注来源和置信度]",
      }),
      defineAgentOutputSection({
        title: "验证计划",
        body: "[假设 / 数据来源 / 方法 / 通过标准 / 反证信号]",
      }),
      defineAgentOutputSection({
        title: "行动建议",
        body: "[推荐动作 / 预期影响 / 成本 / 风险 / 触发条件]",
      }),
      defineAgentOutputSection({
        title: "已写入文件",
        body: "[路径 + 摘要；未写盘则写\"无\"]",
      }),
      defineAgentOutputSection({
        title: "范围限制",
        body: "[缺失数据 / 未验证假设 / 不适用结论]",
      }),
    ],
  }),
  qualityStandards: [
    "每个结论都必须落到事实、推断或假设之一。",
    "假设树必须 MECE；发现重叠时先合并结构再分析。",
    "模型选择必须说明理由，不允许把 PESTEL、五力、3C、BMC、4P 全部机械套一遍。",
    "外部数据必须标注来源和日期；时效性不明时降低置信度。",
    "行动建议最多 3 条优先项，每条都要有验证指标和停止条件。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Write, KnownTool.Edit, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: financialAnalystSkill.id,
      mode: SkillUseMode.Preload,
      reason: financialAnalystSkill.description,
    },
    {
      id: mckinseyStepSkill.id,
      mode: SkillUseMode.Preload,
      reason: mckinseyStepSkill.description,
    },
    {
      id: structuredBusinessAnalysisFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: structuredBusinessAnalysisFrameworkSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    },
    {
      id: pestelAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: pestelAnalysisSkill.description,
    },
    {
      id: portersFiveForcesSkill.id,
      mode: SkillUseMode.Preload,
      reason: portersFiveForcesSkill.description,
    },
    {
      id: businessModelSkill.id,
      mode: SkillUseMode.Preload,
      reason: businessModelSkill.description,
    },
    {
      id: businessHealthDiagnosticSkill.id,
      mode: SkillUseMode.Preload,
      reason: businessHealthDiagnosticSkill.description,
    },
    {
      id: customerResearchSkill.id,
      mode: SkillUseMode.Preload,
      reason: customerResearchSkill.description,
    },
    {
      id: dataAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: dataAnalysisSkill.description,
    }
  ],
});
