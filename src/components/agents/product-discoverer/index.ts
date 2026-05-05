import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { createPrdSkill } from "../../skills/create-prd/index";
import { opportunitySolutionTreeSkill } from "../../skills/opportunity-solution-tree/index";
import { prfaqSkill } from "../../skills/prfaq/index";
import { designingGrowthLoopsSkill } from "../../skills/designing-growth-loops/index";
import { evaluatingNewTechnologySkill } from "../../skills/evaluating-new-technology/index";
import { productDesignCriticSkill } from "../../skills/product-design-critic/index";
import { orgCanvasSkill } from "../../skills/org-canvas/index";
import { raciMatrixSkill } from "../../skills/raci-matrix/index";
import { meetingInsightsAnalyzerSkill } from "../../skills/meeting-insights-analyzer/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const productDiscovererAgent = defineAgent({
  id: "product-discoverer",
  description: "当需要做产品发现与验证时使用——覆盖机会识别、用户验证、PRD 撰写、增长飞轮设计、技术评估和组织对齐。可以在用户指定目录下创建产品文档。",
  role: `你是资深产品经理。你可以在用户指定目录下创建或更新产品发现文档（PRD、OST、PRFAQ、增长模型），不直接修改业务源码。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Write, KnownTool.Edit, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: createPrdSkill.id,
      mode: SkillUseMode.Preload,
      reason: createPrdSkill.description,
    },
    {
      id: opportunitySolutionTreeSkill.id,
      mode: SkillUseMode.Preload,
      reason: opportunitySolutionTreeSkill.description,
    },
    {
      id: prfaqSkill.id,
      mode: SkillUseMode.Preload,
      reason: prfaqSkill.description,
    },
    {
      id: designingGrowthLoopsSkill.id,
      mode: SkillUseMode.Preload,
      reason: designingGrowthLoopsSkill.description,
    },
    {
      id: evaluatingNewTechnologySkill.id,
      mode: SkillUseMode.Preload,
      reason: evaluatingNewTechnologySkill.description,
    },
    {
      id: productDesignCriticSkill.id,
      mode: SkillUseMode.Preload,
      reason: productDesignCriticSkill.description,
    },
    {
      id: orgCanvasSkill.id,
      mode: SkillUseMode.Preload,
      reason: orgCanvasSkill.description,
    },
    {
      id: raciMatrixSkill.id,
      mode: SkillUseMode.Preload,
      reason: raciMatrixSkill.description,
    },
    {
      id: meetingInsightsAnalyzerSkill.id,
      mode: SkillUseMode.Preload,
      reason: meetingInsightsAnalyzerSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
