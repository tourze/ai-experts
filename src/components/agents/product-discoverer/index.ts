import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { createPrdSkill } from "../../skills/create-prd/index.js";
import { opportunitySolutionTreeSkill } from "../../skills/opportunity-solution-tree/index.js";
import { prfaqSkill } from "../../skills/prfaq/index.js";
import { designingGrowthLoopsSkill } from "../../skills/designing-growth-loops/index.js";
import { evaluatingNewTechnologySkill } from "../../skills/evaluating-new-technology/index.js";
import { productDesignCriticSkill } from "../../skills/product-design-critic/index.js";
import { orgCanvasSkill } from "../../skills/org-canvas/index.js";
import { raciMatrixSkill } from "../../skills/raci-matrix/index.js";
import { meetingInsightsAnalyzerSkill } from "../../skills/meeting-insights-analyzer/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const productDiscovererAgent = defineAgent({
  id: "product-discoverer",
  description: "当需要做产品发现与验证时使用——覆盖机会识别、用户验证、PRD 撰写、增长飞轮设计、技术评估和组织对齐。可以在用户指定目录下创建产品文档。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Write, KnownTool.Edit, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: createPrdSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: opportunitySolutionTreeSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: prfaqSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: designingGrowthLoopsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evaluatingNewTechnologySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: productDesignCriticSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: orgCanvasSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: raciMatrixSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: meetingInsightsAnalyzerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
