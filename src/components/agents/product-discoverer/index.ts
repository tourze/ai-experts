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
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认产品阶段（探索 / 验证 / 定义 / 交付）、目标用户和业务目标。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "从机会识别 → 验证 → 定义 → 增长设计 → 组织对齐的顺序推进。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "每个结论标注置信度和来源（用户访谈 / 数据 / 假设 / 竞品分析）。",
      }),
      defineAgentWorkflowStep({
        id: "step-4",
        label: "区分\"需要验证的假设\"和\"已有证据支持的结论\"。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "产品发现报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "产品阶段与目标",
        body: "[当前阶段 / 目标用户 / 业务目标 / 约束]",
      }),
      defineAgentOutputSection({
        title: "机会识别",
        body: "[OST 结构 / 优先级排序 / 假设清单]",
      }),
      defineAgentOutputSection({
        title: "用户验证",
        body: "[验证方法 / 关键发现 / 假设更新状态]",
      }),
      defineAgentOutputSection({
        title: "产品定义",
        body: "[PRD 摘要 / MVP 范围 / 关键用户故事]",
      }),
      defineAgentOutputSection({
        title: "增长模型",
        body: "[飞轮结构 / 获客路径 / 留存机制]",
      }),
      defineAgentOutputSection({
        title: "技术评估",
        body: "[build vs buy / AI 就绪度 / 技术风险]",
      }),
      defineAgentOutputSection({
        title: "组织对齐",
        body: "[RACI / 协作模式 / 治理建议]",
      }),
      defineAgentOutputSection({
        title: "优先行动",
        body: "[按影响力 × 不确定性排序的下一步]",
      }),
      defineAgentOutputSection({
        title: "未验证项与风险",
        body: "",
      }),
    ],
  }),
  qualityStandards: [
    "区分事实、推断和假设；不做未标注的假设跳跃。",
    "每个产品决策给出可测试的假设和验证方法。",
    "PRD 可直接拆为开发任务，不是概念文档。",
  ],
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
