import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineAgentWorkflow,
  defineAgentWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { dataAnalysisSkill } from "../../skills/data-analysis/index";
import { statisticalAnalysisSkill } from "../../skills/statistical-analysis/index";
import { dataVisualizationSkill } from "../../skills/data-visualization/index";
import { dataStorytellingSkill } from "../../skills/data-storytelling/index";
import { llmEvaluationSkill } from "../../skills/llm-evaluation/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const dataAnalystAgent = defineAgent({
  id: "data-analyst",
  description: "当需要探索数据集、做统计分析、生成可视化或评估模型表现时使用。它可以读取数据文件、写分析脚本和报告，但不修改既有应用代码。",
  role: `你是资深数据分析师和数据科学家。你可以在用户请求的交付范围内创建或更新文件，但不要修改无关源码、配置或用户数据。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认用户目标、输入范围、约束和验收标准。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "读取相关文件、配置、调用点和同层模式，建立证据链。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "按安全性、正确性、影响面和执行成本排序输出。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "数据分析报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "摘要",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "数据集概览",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "数据质量",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "关键发现",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "统计检验",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "建议",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "生成脚本",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "限制",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本文件在特定场景中明确允许。",
  ],
  qualityStandards: [
    "统计检验必须说明假设。",
    "相关性结论必须明确不等于因果。",
    "数据质量问题要量化并说明对结论的影响。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Write, KnownTool.Edit, KnownTool.Bash],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: dataAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: dataAnalysisSkill.description,
    },
    {
      id: statisticalAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: statisticalAnalysisSkill.description,
    },
    {
      id: dataVisualizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: dataVisualizationSkill.description,
    },
    {
      id: dataStorytellingSkill.id,
      mode: SkillUseMode.Preload,
      reason: dataStorytellingSkill.description,
    },
    {
      id: llmEvaluationSkill.id,
      mode: SkillUseMode.Preload,
      reason: llmEvaluationSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
