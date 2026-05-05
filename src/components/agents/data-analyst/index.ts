import {
  AgentSandbox,
  defineAgent,
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
